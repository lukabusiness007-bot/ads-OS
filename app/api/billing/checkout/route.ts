import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/email/client";
import { getStripe, priceIdForPlan } from "@/lib/stripe";
import { getCurrentOrganization } from "@/lib/supabase/data";
import { createServerSupabaseClient, createServiceRoleSupabaseClient, isSupabaseServiceRoleConfigured } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ errorMessage: "Billing is not configured." }, { status: 500 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ errorMessage: "Supabase is not configured." }, { status: 500 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ errorMessage: "Sign in to manage billing." }, { status: 401 });
  }

  const organization = await getCurrentOrganization(supabase);
  if (!organization) {
    return NextResponse.json({ errorMessage: "No organization found." }, { status: 400 });
  }

  const { planKey } = (await request.json().catch(() => ({}))) as { planKey?: string };
  if (!planKey) {
    return NextResponse.json({ errorMessage: "Missing planKey." }, { status: 400 });
  }

  const priceId = priceIdForPlan(planKey);
  if (!priceId) {
    return NextResponse.json({ errorMessage: `No Stripe price configured for plan "${planKey}".` }, { status: 400 });
  }

  const customerId = await getOrCreateCustomer(stripe, organization.id, user.email ?? undefined);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${getSiteUrl()}/billing?checkout=success`,
    cancel_url: `${getSiteUrl()}/billing?checkout=canceled`,
    metadata: { organizationId: organization.id, planKey },
    subscription_data: { metadata: { organizationId: organization.id } }
  });

  return NextResponse.json({ url: session.url });
}

async function getOrCreateCustomer(
  stripe: NonNullable<ReturnType<typeof getStripe>>,
  organizationId: string,
  email: string | undefined
): Promise<string> {
  const admin = isSupabaseServiceRoleConfigured() ? createServiceRoleSupabaseClient() : null;

  if (admin) {
    const { data } = await admin
      .from("billing_customers")
      .select("stripe_customer_id")
      .eq("organization_id", organizationId)
      .maybeSingle();
    const existing = (data as { stripe_customer_id?: string | null } | null)?.stripe_customer_id;
    if (existing) return existing;
  }

  const customer = await stripe.customers.create({ email, metadata: { organizationId } });

  if (admin) {
    await admin
      .from("billing_customers")
      .upsert({ organization_id: organizationId, stripe_customer_id: customer.id }, { onConflict: "organization_id" });
  }

  return customer.id;
}
