import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createServiceRoleSupabaseClient, isSupabaseServiceRoleConfigured } from "@/lib/supabase/server";
import { getPlanPriceId, getStripe, isStripeConfigured } from "@/lib/billing/stripe";
import { isPlanKey, PLAN_LIMITS, type PlanKey } from "@/lib/billing/plans";
import { recordTopupPurchase } from "@/lib/billing/usage";
import { recordModelBuyout } from "@/lib/billing/buyout";
import { beginGracePeriod, clearGracePeriod } from "@/lib/billing/suspension";
import { getOrganizationOwnerEmail } from "@/lib/supabase/data";
import { getSiteUrl } from "@/lib/email/client";
import { sendReceiptEmail, sendSubscriptionEmail } from "@/lib/email/send";
import type { SubscriptionChange } from "@/emails/SubscriptionEmail";

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
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscription(admin, subscription);
        // Notify the owner on lifecycle changes (skip "created" — the receipt
        // email already confirms the new subscription).
        if (event.type !== "customer.subscription.created") {
          await notifySubscriptionChange(admin, subscription, changeForEvent(event.type, subscription)).catch(
            () => undefined
          );
        }
        break;
      }
      case "invoice.payment_failed": {
        await handleInvoicePaymentFailed(admin, event.data.object as Stripe.Invoice);
        break;
      }
      case "invoice.paid":
      case "invoice.payment_succeeded": {
        await handleInvoicePaid(admin, event.data.object as Stripe.Invoice);
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
  } else if (kind === "buyout") {
    const productId = session.metadata?.product_id;
    if (productId) {
      await recordModelBuyout(admin, organizationId, productId, {
        source: "stripe_checkout",
        sessionId: session.id,
        amount: session.amount_total ?? null,
        currency: session.currency ?? null
      });
    } else {
      console.warn("buyout checkout completed without a product_id", { sessionId: session.id });
    }
  } else if (kind === "subscription" && typeof session.subscription === "string") {
    // Subscription checkout: fetch the created subscription and sync it now so the
    // plan is active immediately (the subscription.created event also arrives).
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    await syncSubscription(admin, subscription);
  }

  // Best-effort receipt for any paid checkout (subscription first invoice or top-up).
  if (session.amount_total && session.amount_total > 0) {
    const owner = await getOrganizationOwnerEmail(admin, organizationId);
    if (owner?.email) {
      const planName =
        kind === "topup"
          ? `Generation top-up (${session.metadata?.generations ?? "?"} models)`
          : kind === "buyout"
            ? `Model file buyout${session.metadata?.product_name ? ` — ${session.metadata.product_name}` : ""}`
            : planDisplayName(session.metadata?.plan_key);
      await sendReceiptEmail(owner.email, {
        planName,
        amount: formatAmount(session.amount_total, session.currency),
        date: formatDate(new Date())
      }).catch(() => undefined);
    }
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

  // Payment recovered (Stripe moved the subscription back to active/trialing):
  // clear any grace clock so the model-access kill switch resumes minting at once.
  if (subscription.status === "active" || subscription.status === "trialing") {
    await clearGracePeriod(admin, organizationId);
  }
}

/**
 * A subscription invoice failed to charge (Plan 2, step 4). Start the grace clock
 * — models keep serving during the window — and email the owner once. When the
 * window elapses with the subscription still unpaid, /api/model-access stops
 * minting and the merchant's hosted page + embeds go dark until payment succeeds.
 */
async function handleInvoicePaymentFailed(admin: AdminClient, invoice: Stripe.Invoice) {
  if (!invoiceSubscriptionId(invoice)) return; // ignore one-off (e.g. top-up) invoices

  const organizationId = await orgIdForCustomer(admin, invoice.customer);
  if (!organizationId) {
    console.warn("invoice.payment_failed without an organization_id", { invoiceId: invoice.id });
    return;
  }

  const { deadline, started } = await beginGracePeriod(admin, organizationId);

  // Email the owner only when grace first starts — not on every Stripe retry.
  if (!started) return;

  const owner = await getOrganizationOwnerEmail(admin, organizationId);
  if (!owner?.email) return;

  const { data: sub } = await admin
    .from("subscriptions")
    .select("plan_key")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  await sendSubscriptionEmail(owner.email, {
    change: "payment_failed",
    planName: planDisplayName((sub as { plan_key?: string | null } | null)?.plan_key),
    billingUrl: `${getSiteUrl()}/billing`,
    periodEnd: formatDate(new Date(deadline))
  }).catch(() => undefined);
}

/** A subscription invoice was paid (incl. a successful dunning retry): clear grace. */
async function handleInvoicePaid(admin: AdminClient, invoice: Stripe.Invoice) {
  if (!invoiceSubscriptionId(invoice)) return; // top-up / one-off invoices don't gate serving

  const organizationId = await orgIdForCustomer(admin, invoice.customer);
  if (!organizationId) return;

  await clearGracePeriod(admin, organizationId);
}

/** Read the related subscription id off an invoice across Stripe API shapes. */
function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const ref = (invoice as Stripe.Invoice & { subscription?: string | { id?: string } | null }).subscription;
  if (typeof ref === "string") return ref;
  return ref?.id ?? null;
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

async function notifySubscriptionChange(
  admin: AdminClient,
  subscription: Stripe.Subscription,
  change: SubscriptionChange
) {
  const organizationId =
    subscription.metadata?.organization_id ?? (await orgIdForCustomer(admin, subscription.customer));
  if (!organizationId) return;

  const owner = await getOrganizationOwnerEmail(admin, organizationId);
  if (!owner?.email) return;

  const period = resolvePeriod(subscription);
  await sendSubscriptionEmail(owner.email, {
    change,
    planName: planDisplayName(resolvePlanKey(subscription)),
    billingUrl: `${getSiteUrl()}/billing`,
    periodEnd: period.end ? formatDate(new Date(period.end)) : undefined
  });
}

function changeForEvent(
  eventType: "customer.subscription.updated" | "customer.subscription.deleted",
  subscription: Stripe.Subscription
): SubscriptionChange {
  if (eventType === "customer.subscription.deleted") return "canceled";
  if (subscription.cancel_at_period_end || subscription.status === "canceled") return "canceled";
  if (subscription.status === "trialing") return "trial_ending";
  return "updated";
}

function planDisplayName(planKey: string | null | undefined): string {
  return isPlanKey(planKey) ? PLAN_LIMITS[planKey].name : "Augmenta";
}

function formatAmount(amount: number, currency: string | null): string {
  const value = amount / 100;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: (currency ?? "eur").toUpperCase()
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${(currency ?? "EUR").toUpperCase()}`;
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}
