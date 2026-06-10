// Metered view-overage reporting (Plan 2, step 4 — the "or Stripe metered
// overage on higher tiers" branch).
//
// On plans with `meteredViewOverage` (lib/billing/plans.ts), blowing through
// monthlyViewLimit doesn't dark the viewer: /api/model-access keeps minting and
// calls reportViewOverage() with the org's observed total overage for the month
// (count - limit, from the cached view counter). The unreported slice of that
// total is claimed atomically in Postgres (claim_view_overage, 014) so exactly
// one serverless request owns each slice, then pushed to Stripe as a Billing
// Meter event against the org's customer. The metered Price attached at checkout
// turns those events into invoice line items.
//
// Reporting cadence rides the view-counter cache (lib/billing/view-quota.ts):
// the observed count only moves when the cache refreshes (~every 60s), so claims
// are zero in between and Stripe sees at most ~one meter event per org per
// minute — no per-view API calls.
//
// Failure posture: always in the merchant's favor. A claimed slice whose Stripe
// call fails goes unbilled (never re-sent, never double-billed); any config or
// store error is swallowed. Views are never blocked from here.

import { getStripe, getViewOverageMeterEvent, isViewOverageConfigured } from "./stripe";
import { getPlanLimits } from "./plans";
import { currentMonthStart } from "./view-quota";
import {
  createServiceRoleSupabaseClient,
  isSupabaseServiceRoleConfigured
} from "@/lib/supabase/server";

/**
 * Whether over-quota views for `planKey` should keep serving (and be metered)
 * instead of degrading to the poster. Requires both the plan flag and the
 * Stripe metered price to be configured.
 */
export function planServesOverage(planKey: string | null | undefined): boolean {
  return isViewOverageConfigured() && getPlanLimits(planKey).meteredViewOverage;
}

/**
 * Report the org's month-to-date view overage to Stripe. `observedOverage` is
 * the caller's total (views counted this month minus the plan limit); only the
 * delta above the stored high-water mark is sent. Safe to call concurrently and
 * repeatedly with the same total — duplicates claim 0 and send nothing.
 */
export async function reportViewOverage(organizationId: string, observedOverage: number): Promise<void> {
  if (!Number.isFinite(observedOverage) || observedOverage <= 0) return;
  if (!isViewOverageConfigured() || !isSupabaseServiceRoleConfigured()) return;

  try {
    const admin = createServiceRoleSupabaseClient();

    // Resolve the Stripe customer BEFORE claiming: an org without one (shouldn't
    // happen for a paying plan) keeps its overage unclaimed for a later attempt.
    const { data: customerRow } = await admin
      .from("billing_customers")
      .select("stripe_customer_id")
      .eq("organization_id", organizationId)
      .maybeSingle();

    const customerId = (customerRow as { stripe_customer_id?: string | null } | null)?.stripe_customer_id;
    if (!customerId) return;

    const periodStart = currentMonthStart().toISOString();
    const { data, error } = await admin.rpc("claim_view_overage", {
      p_org: organizationId,
      p_period_start: periodStart,
      p_observed_overage: Math.floor(observedOverage)
    });

    if (error) return;

    const delta = typeof data === "number" ? data : Number(data ?? 0);
    if (!Number.isFinite(delta) || delta <= 0) return;

    // The identifier dedupes on Stripe's side too (retries/races): one event per
    // org-month high-water mark.
    await getStripe().billing.meterEvents.create({
      event_name: getViewOverageMeterEvent(),
      identifier: `vo:${organizationId}:${periodStart}:${Math.floor(observedOverage)}`,
      payload: {
        stripe_customer_id: customerId,
        value: String(delta)
      }
    });
  } catch (error) {
    // Claimed-but-unsent slices stay unbilled by design; just leave a trace.
    console.error("view-overage report failed", {
      message: error instanceof Error ? error.message : String(error)
    });
  }
}
