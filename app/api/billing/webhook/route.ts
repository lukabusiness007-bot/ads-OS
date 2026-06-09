import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createServiceRoleSupabaseClient, isSupabaseServiceRoleConfigured } from "@/lib/supabase/server";
import { getPlanPriceId, getStripe, isStripeConfigured } from "@/lib/billing/stripe";
import { isPlanKey, type PlanKey } from "@/lib/billing/plans";
import { recordTopupPurchase } from "@/lib/billing/usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AdminClient = ReturnType<typeof createServiceRoleSupabaseClient>;

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ errorMessage: "Stripe is not configured." }, { status: 503 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("Stripe webhook secret is not configured.");
    return NextResponse.json({ errorMessage: "Webhook is not configured." }, { status: 503 });
  }

  if (!isSupabaseServiceRoleConfigured()) {
    console.error("Webhook needs SUPABASE_SERVICE_ROLE_KEY to write billing state.");
    return NextResponse.json({ errorMessage: "Server billing storage is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ errorMessage: "Missing Stripe signature." }, { status: 400 });
  }

  const stripe = getStripe();
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed", {
      message: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json({ errorMessage: "Invalid signature." }, { status: 400 });
  }

  const admin = createServiceRoleSupabaseClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutCompleted(admin, stripe, event.data.object as Stripe.Checkout.Session);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncSubscription(admin, event.data.object as Stripe.Subscription);
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("Stripe webhook handler failed", {
      type: event.type,
      message: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json({ errorMessage: "Webhook handler error." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(admin: AdminClient, stripe: Stripe, session: Stripe.Checkout.Session) {
  const kind = session.metadata?.kind;
  const organizationId = session.metadata?.organization_id ?? (await orgIdForCustomer(admin, session.customer));

  if (!organizationId) {
    console.warn("checkout.session.completed without an organization_id", { sessionId: session.id });
    return;
  }

  if (kind === "topup") {
    const generations = Number(session.metadata?.generations ?? 0);
    await recordTopupPurchase(admin, organizationId, generations, {
      source: "stripe_checkout",
      sessionId: session.id,
      topupId: session.metadata?.topup_id ?? null
    });
    return;
  }

  // Subscription checkout: fetch the created subscription and sync it now so the
  // plan is active immediately (the subscription.created event also arrives).
  if (kind === "subscription" && typeof session.subscription === "string") {
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    await syncSubscription(admin, subscription);
  }
}

async function syncSubscription(admin: AdminClient, subscription: Stripe.Subscription) {
  const organizationId =
    subscription.metadata?.organization_id ?? (await orgIdForCustomer(admin, subscription.customer));

  if (!organizationId) {
    console.warn("subscription event without an organization_id", { subscriptionId: subscription.id });
    return;
  }

  const planKey = resolvePlanKey(subscription);
  const period = resolvePeriod(subscription);

  await admin
    .from("subscriptions")
    .upsert(
      {
        organization_id: organizationId,
        stripe_subscription_id: subscription.id,
        plan_key: planKey,
        status: subscription.status,
        current_period_start: period.start,
        current_period_end: period.end,
        updated_at: new Date().toISOString()
      },
      { onConflict: "stripe_subscription_id" }
    );

  // Remove the placeholder trialing row created at signup (no Stripe id) so the
  // org has a single canonical subscription.
  await admin
    .from("subscriptions")
    .delete()
    .eq("organization_id", organizationId)
    .is("stripe_subscription_id", null);

  // Keep organizations.plan_key (used widely for gating) in sync. Downgrade to
  // starter when the subscription is no longer active.
  const activeStatuses = new Set(["active", "trialing", "past_due"]);
  const effectivePlanKey = activeStatuses.has(subscription.status) ? planKey : "starter";

  await admin
    .from("organizations")
    .update({ plan_key: effectivePlanKey, updated_at: new Date().toISOString() })
    .eq("id", organizationId);
}

async function orgIdForCustomer(admin: AdminClient, customer: string | Stripe.Customer | Stripe.DeletedCustomer | null) {
  const customerId = typeof customer === "string" ? customer : customer?.id;
  if (!customerId) {
    return null;
  }

  const { data } = await admin
    .from("billing_customers")
    .select("organization_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  return (data as { organization_id?: string } | null)?.organization_id ?? null;
}

function resolvePlanKey(subscription: Stripe.Subscription): PlanKey {
  const fromMetadata = subscription.metadata?.plan_key;
  if (isPlanKey(fromMetadata)) {
    return fromMetadata;
  }

  // Fall back to matching the recurring price id against the configured plans.
  const priceId = subscription.items.data.find((item) => item.price?.recurring)?.price?.id;
  for (const key of ["starter", "growth", "studio"] as const) {
    if (priceId && getPlanPriceId(key) === priceId) {
      return key;
    }
  }

  return "starter";
}

function resolvePeriod(subscription: Stripe.Subscription): { start: string | null; end: string | null } {
  // Period moved onto subscription items in recent API versions; read item first,
  // then fall back to the subscription-level fields for older shapes.
  const item = subscription.items.data[0] as
    | (Stripe.SubscriptionItem & { current_period_start?: number; current_period_end?: number })
    | undefined;
  const sub = subscription as Stripe.Subscription & { current_period_start?: number; current_period_end?: number };

  const startUnix = item?.current_period_start ?? sub.current_period_start;
  const endUnix = item?.current_period_end ?? sub.current_period_end;

  return {
    start: typeof startUnix === "number" ? new Date(startUnix * 1000).toISOString() : null,
    end: typeof endUnix === "number" ? new Date(endUnix * 1000).toISOString() : null
  };
}
