import { NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ensureCurrentOrganization } from "@/lib/supabase/data";
import {
  createServerSupabaseClient,
  createServiceRoleSupabaseClient,
  isSupabaseServiceRoleConfigured
} from "@/lib/supabase/server";
import { getPlanLimits, isPlanKey, type PlanKey } from "@/lib/billing/plans";
import {
  getBuyoutPriceId,
  getPlanPriceId,
  getSetupFeePriceId,
  getSiteUrl,
  getStripe,
  getTopupPack,
  getViewOveragePriceId,
  isStripeConfigured
} from "@/lib/billing/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Only the selection keys are accepted from the client; the actual prices/amounts
// are resolved server-side from these keys (never trusted from the body).
const checkoutSchema = z.object({
  /** Plan to subscribe to (subscription checkout). */
  plan: z.string().trim().max(64).optional(),
  /** Top-up pack id, e.g. "topup-25" (one-time payment checkout). */
  topup: z.string().trim().max(64).optional(),
  /** Product id to buy out the watermark-free file for (one-time payment). */
  buyout: z.uuid().optional(),
  /** Include the one-time setup fee on the first invoice (subscription only). */
  withSetupFee: z.boolean().optional()
});

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { errorMessage: "Billing is not configured yet. Add the Stripe environment variables to enable checkout." },
      { status: 503 }
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ errorMessage: "Sign in is required before checkout." }, { status: 401 });
  }

  const supabase = await createServerSupabaseClient();
  const organizationResult = await ensureCurrentOrganization(supabase);

  if (organizationResult.status === "unauthenticated") {
    return NextResponse.json({ errorMessage: "Sign in before starting checkout." }, { status: 401 });
  }

  if (organizationResult.status === "setup_failed") {
    return NextResponse.json({ errorMessage: organizationResult.errorMessage }, { status: 500 });
  }

  const organization = organizationResult.organization;
  const writeClient = isSupabaseServiceRoleConfigured() ? createServiceRoleSupabaseClient() : supabase;

  const parsedBody = checkoutSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsedBody.success) {
    return NextResponse.json({ errorMessage: "Invalid checkout request." }, { status: 400 });
  }
  const body = parsedBody.data;

  try {
    const stripe = getStripe();
    const customerId = await ensureStripeCustomer(writeClient, stripe, organization.id, organization.name);
    const siteUrl = getSiteUrl();
    const successUrl = `${siteUrl}/billing?checkout=success`;
    const cancelUrl = `${siteUrl}/billing?checkout=cancelled`;

    // ── Top-up pack (one-time payment) ──────────────────────────────────────
    if (body.topup) {
      const pack = getTopupPack(body.topup);

      if (!pack?.priceId) {
        return NextResponse.json(
          { errorMessage: "That top-up pack is not available for purchase yet." },
          { status: 400 }
        );
      }

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer: customerId,
        line_items: [{ price: pack.priceId, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          kind: "topup",
          organization_id: organization.id,
          topup_id: body.topup,
          generations: String(pack.generations)
        }
      });

      return NextResponse.json({ url: session.url });
    }

    // ── Model buyout (one-time payment) ─────────────────────────────────────
    if (body.buyout) {
      const priceId = getBuyoutPriceId();
      if (!priceId) {
        return NextResponse.json(
          { errorMessage: "File buyout isn't available yet. Contact us to purchase the model file." },
          { status: 400 }
        );
      }

      // Ownership: you can only buy out a model your own org owns, and only if a
      // model asset actually exists. RLS also scopes these reads to the org.
      const { data: product } = await supabase
        .from("products")
        .select("id, name")
        .eq("id", body.buyout)
        .eq("organization_id", organization.id)
        .maybeSingle();

      if (!product) {
        return NextResponse.json({ errorMessage: "Product not found." }, { status: 404 });
      }

      const { data: asset } = await supabase
        .from("model_assets")
        .select("id")
        .eq("organization_id", organization.id)
        .eq("product_id", body.buyout)
        .limit(1)
        .maybeSingle();

      if (!asset) {
        return NextResponse.json(
          { errorMessage: "This product has no generated model to buy out yet." },
          { status: 400 }
        );
      }

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          kind: "buyout",
          organization_id: organization.id,
          product_id: body.buyout,
          product_name: (product as { name?: string }).name ?? ""
        }
      });

      return NextResponse.json({ url: session.url });
    }

    // ── Plan subscription ───────────────────────────────────────────────────
    if (body.plan && isPlanKey(body.plan)) {
      const planKey = body.plan as PlanKey;
      const priceId = getPlanPriceId(planKey);

      if (!priceId) {
        return NextResponse.json(
          { errorMessage: "That plan is not available for self-serve checkout. Contact us to get set up." },
          { status: 400 }
        );
      }

      const lineItems: { price: string; quantity?: number }[] = [{ price: priceId, quantity: 1 }];
      const setupFeePriceId = getSetupFeePriceId();

      if (body.withSetupFee && setupFeePriceId) {
        // One-time price added to the first subscription invoice.
        lineItems.push({ price: setupFeePriceId, quantity: 1 });
      }

      // Overage-enabled plans (Plan 2, step 4) also carry the metered view-overage
      // price, so over-quota views can bill through Billing Meter events instead of
      // degrading to poster. Metered line items must not set a quantity.
      const viewOveragePriceId = getViewOveragePriceId();
      if (viewOveragePriceId && getPlanLimits(planKey).meteredViewOverage) {
        lineItems.push({ price: viewOveragePriceId });
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: lineItems,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          kind: "subscription",
          organization_id: organization.id,
          plan_key: planKey
        },
        subscription_data: {
          metadata: { organization_id: organization.id, plan_key: planKey }
        }
      });

      return NextResponse.json({ url: session.url });
    }

    return NextResponse.json({ errorMessage: "Specify a plan or a top-up pack to check out." }, { status: 400 });
  } catch (error) {
    console.error("Stripe checkout failed", { message: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ errorMessage: "Could not start checkout. Please try again." }, { status: 502 });
  }
}

type AnyWriteClient =
  | Awaited<ReturnType<typeof createServerSupabaseClient>>
  | ReturnType<typeof createServiceRoleSupabaseClient>;

/** Get the org's Stripe customer id, creating + persisting it on first checkout. */
async function ensureStripeCustomer(
  client: AnyWriteClient,
  stripe: ReturnType<typeof getStripe>,
  organizationId: string,
  organizationName: string
): Promise<string> {
  const { data: existing } = await client
    .from("billing_customers")
    .select("stripe_customer_id")
    .eq("organization_id", organizationId)
    .maybeSingle();

  const existingId = (existing as { stripe_customer_id?: string | null } | null)?.stripe_customer_id;
  if (existingId) {
    return existingId;
  }

  const customer = await stripe.customers.create({
    name: organizationName,
    metadata: { organization_id: organizationId }
  });

  await client
    .from("billing_customers")
    .upsert(
      { organization_id: organizationId, stripe_customer_id: customer.id },
      { onConflict: "organization_id" }
    );

  return customer.id;
}
