import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ensureCurrentOrganization } from "@/lib/supabase/data";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSiteUrl, getStripe, isStripeConfigured } from "@/lib/billing/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Open the Stripe Billing Portal so a merchant can manage their subscription. */
export async function POST() {
  if (!isStripeConfigured()) {
    return NextResponse.json({ errorMessage: "Billing is not configured yet." }, { status: 503 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ errorMessage: "Sign in is required." }, { status: 401 });
  }

  const supabase = await createServerSupabaseClient();
  const organizationResult = await ensureCurrentOrganization(supabase);

  if (organizationResult.status !== "ready") {
    return NextResponse.json({ errorMessage: "Sign in to manage billing." }, { status: 401 });
  }

  const organization = organizationResult.organization;

  const { data } = await supabase
    .from("billing_customers")
    .select("stripe_customer_id")
    .eq("organization_id", organization.id)
    .maybeSingle();

  const customerId = (data as { stripe_customer_id?: string | null } | null)?.stripe_customer_id;

  if (!customerId) {
    return NextResponse.json(
      { errorMessage: "No billing account yet. Start a plan checkout first." },
      { status: 400 }
    );
  }

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${getSiteUrl()}/billing`
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe billing portal failed", { message: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ errorMessage: "Could not open the billing portal." }, { status: 502 });
  }
}
