import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getSiteUrl } from "@/lib/email/client";
import { sendReceiptEmail, sendSubscriptionEmail } from "@/lib/email/send";
import { getStripe, planDisplayName, planForPriceId } from "@/lib/stripe";
import { createServiceRoleSupabaseClient, isSupabaseServiceRoleConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AdminClient = ReturnType<typeof createServiceRoleSupabaseClient>;

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return NextResponse.json({ errorMessage: "Stripe is not configured." }, { status: 500 });
  }
  if (!isSupabaseServiceRoleConfigured()) {
    return NextResponse.json({ errorMessage: "Webhook requires the Supabase service role key." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ errorMessage: "Missing signature." }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.warn("Stripe signature verification failed", error);
    return NextResponse.json({ errorMessage: "Invalid signature." }, { status: 400 });
  }

  const admin = createServiceRoleSupabaseClient();

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(stripe, admin, event.data.object);
        break;
      case "invoice.paid":
        await handleInvoicePaid(admin, event.data.object);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionChange(admin, event.data.object, "updated");
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionChange(admin, event.data.object, "canceled");
        break;
      default:
        break;
    }
  } catch (error) {
    console.error("Stripe webhook handler error", { type: event.type, error });
    // Return 200 so Stripe doesn't retry on our internal/email failures.
  }

  return NextResponse.json({ received: true });
}

async function orgEmailForCustomer(admin: AdminClient, customerId: string): Promise<{ organizationId: string; email: string | null } | null> {
  const { data: billing } = await admin
    .from("billing_customers")
    .select("organization_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  const organizationId = (billing as { organization_id?: string } | null)?.organization_id;
  if (!organizationId) return null;

  const { data: member } = await admin
    .from("organization_members")
    .select("profiles(email)")
    .eq("organization_id", organizationId)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();

  const profile = member && Array.isArray(member.profiles) ? member.profiles[0] : member?.profiles;
  return { organizationId, email: (profile as { email?: string | null } | null)?.email ?? null };
}

async function handleCheckoutCompleted(stripe: Stripe, admin: AdminClient, session: Stripe.Checkout.Session) {
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  const organizationId = session.metadata?.organizationId;
  if (!customerId || !organizationId) return;

  // Link the Stripe customer to the organization.
  await admin
    .from("billing_customers")
    .upsert({ organization_id: organizationId, stripe_customer_id: customerId }, { onConflict: "organization_id" });

  if (session.subscription) {
    const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
    const subscription = await stripe.subscriptions.retrieve(subId);
    await upsertSubscription(admin, organizationId, subscription);
  }

  if (session.amount_total && session.amount_total > 0) {
    const owner = await orgEmailForCustomer(admin, customerId);
    if (owner?.email) {
      const planKey = session.metadata?.planKey ?? "starter";
      await sendReceiptEmail(owner.email, {
        planName: planDisplayName(planKey),
        amount: formatAmount(session.amount_total, session.currency),
        date: formatDate(new Date())
      });
    }
  }
}

async function handleInvoicePaid(admin: AdminClient, invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customerId || !invoice.amount_paid) return;

  const owner = await orgEmailForCustomer(admin, customerId);
  if (!owner?.email) return;

  const firstLine = invoice.lines?.data?.[0] as { pricing?: { price_details?: { price?: string } } } | undefined;
  const linePrice = firstLine?.pricing?.price_details?.price ?? null;

  await sendReceiptEmail(owner.email, {
    planName: planDisplayName(planForPriceId(linePrice)),
    amount: formatAmount(invoice.amount_paid, invoice.currency),
    date: formatDate(new Date(invoice.created * 1000)),
    invoiceNumber: invoice.number ?? undefined,
    invoiceUrl: invoice.hosted_invoice_url ?? undefined
  });
}

async function handleSubscriptionChange(
  admin: AdminClient,
  subscription: Stripe.Subscription,
  kind: "updated" | "canceled"
) {
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;
  if (!customerId) return;

  const owner = await orgEmailForCustomer(admin, customerId);
  if (!owner) return;

  await upsertSubscription(admin, owner.organizationId, subscription);

  if (!owner.email) return;

  const planKey = planForPriceId(subscription.items.data[0]?.price?.id);
  const periodEnd = subscription.items.data[0]?.current_period_end;
  const change =
    kind === "canceled"
      ? "canceled"
      : subscription.status === "trialing"
        ? "trial_ending"
        : subscription.cancel_at_period_end
          ? "canceled"
          : "updated";

  await sendSubscriptionEmail(owner.email, {
    change,
    planName: planDisplayName(planKey),
    billingUrl: `${getSiteUrl()}/billing`,
    periodEnd: periodEnd ? formatDate(new Date(periodEnd * 1000)) : undefined
  });
}

async function upsertSubscription(admin: AdminClient, organizationId: string, subscription: Stripe.Subscription) {
  const item = subscription.items.data[0];
  await admin
    .from("subscriptions")
    .upsert(
      {
        organization_id: organizationId,
        stripe_subscription_id: subscription.id,
        plan_key: planForPriceId(item?.price?.id),
        status: subscription.status,
        current_period_start: item?.current_period_start ? new Date(item.current_period_start * 1000).toISOString() : null,
        current_period_end: item?.current_period_end ? new Date(item.current_period_end * 1000).toISOString() : null,
        updated_at: new Date().toISOString()
      },
      { onConflict: "stripe_subscription_id" }
    );

  await admin
    .from("organizations")
    .update({ plan_key: planForPriceId(item?.price?.id), updated_at: new Date().toISOString() })
    .eq("id", organizationId);
}

function formatAmount(amount: number, currency: string | null): string {
  const value = amount / 100;
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: (currency ?? "eur").toUpperCase() }).format(value);
  } catch {
    return `${value.toFixed(2)} ${(currency ?? "EUR").toUpperCase()}`;
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}
