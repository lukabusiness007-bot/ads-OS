// Generation usage + quota metering, backed entirely by the existing
// `usage_events`, `subscriptions`, and `organizations` tables (no new schema).
//
// Credit model (see lib/billing/plans.ts):
//   - Each billing period grants `includedGenerations` (resets every period).
//   - Top-up packs add carry-over credits that never expire.
//   - Every generation writes a `generation_started` usage_event (quantity 1)
//     tagged metadata.source = 'included' | 'topup', decided at start time:
//     included credits are spent first, then top-up credits.
//
// Therefore:
//   includedUsed   = generation_started since periodStart           (period-scoped)
//   includedLeft   = max(0, included - includedUsed)
//   topupPurchased = Σ generation_topup.quantity                    (all time)
//   topupUsed      = generation_started where source='topup'        (all time)
//   topupLeft      = max(0, topupPurchased - topupUsed)
//   totalRemaining = includedLeft + topupLeft

import type { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { getPlanLimits, isUnlimitedGenerationPlan } from "./plans";

type AnySupabaseClient =
  | Awaited<ReturnType<typeof createServerSupabaseClient>>
  | ReturnType<typeof createServiceRoleSupabaseClient>;

export const GENERATION_STARTED_EVENT = "generation_started";
export const GENERATION_TOPUP_EVENT = "generation_topup";
export type GenerationSource = "included" | "topup";

export type GenerationUsageSummary = {
  planKey: string;
  planName: string;
  unlimited: boolean;
  included: number;
  includedUsed: number;
  includedRemaining: number;
  topupPurchased: number;
  topupUsed: number;
  topupRemaining: number;
  /** included + top-up credits still available this period. */
  totalRemaining: number;
  canGenerate: boolean;
  /** Where the next generation's credit would be drawn from (null if blocked). */
  nextSource: GenerationSource | null;
  periodStart: string;
};

/** Start of the current billing period: the subscription period, else 1st of the UTC month. */
function resolvePeriodStart(currentPeriodStart: string | null | undefined): Date {
  if (currentPeriodStart) {
    const parsed = new Date(currentPeriodStart);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

async function getSubscriptionPeriodStart(client: AnySupabaseClient, organizationId: string): Promise<Date> {
  const { data } = await client
    .from("subscriptions")
    .select("current_period_start")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return resolvePeriodStart((data as { current_period_start?: string | null } | null)?.current_period_start);
}

/**
 * Compute the organization's generation allowance for the current period.
 * Pass the org's plan_key (from organizations.plan_key / subscriptions.plan_key).
 */
export async function getGenerationUsageSummary(
  client: AnySupabaseClient,
  organizationId: string,
  planKey: string
): Promise<GenerationUsageSummary> {
  const plan = getPlanLimits(planKey);
  const unlimited = isUnlimitedGenerationPlan(planKey);
  const included = plan.includedGenerations ?? 0;
  const periodStart = await getSubscriptionPeriodStart(client, organizationId);
  const periodStartIso = periodStart.toISOString();

  // Top-up credits purchased (all time) — sum quantities client-side.
  const { data: topupRows } = await client
    .from("usage_events")
    .select("quantity")
    .eq("organization_id", organizationId)
    .eq("event_type", GENERATION_TOPUP_EVENT);

  const topupPurchased = (topupRows ?? []).reduce(
    (total, row) => total + Number((row as { quantity?: number }).quantity ?? 0),
    0
  );

  // Generations consumed against top-up credits (all time).
  const { count: topupUsedCount } = await client
    .from("usage_events")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("event_type", GENERATION_STARTED_EVENT)
    .filter("metadata->>source", "eq", "topup");

  // All generations this period, and how many of those drew on top-up credits.
  const { count: totalThisPeriodCount } = await client
    .from("usage_events")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("event_type", GENERATION_STARTED_EVENT)
    .gte("created_at", periodStartIso);

  const { count: topupUsedThisPeriodCount } = await client
    .from("usage_events")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("event_type", GENERATION_STARTED_EVENT)
    .gte("created_at", periodStartIso)
    .filter("metadata->>source", "eq", "topup");

  // Included usage this period = period generations that were NOT charged to top-ups.
  const includedUsed = Math.max(0, (totalThisPeriodCount ?? 0) - (topupUsedThisPeriodCount ?? 0));
  const topupUsed = topupUsedCount ?? 0;
  const includedRemaining = unlimited ? Number.POSITIVE_INFINITY : Math.max(0, included - includedUsed);
  const topupRemaining = Math.max(0, topupPurchased - topupUsed);
  const totalRemaining = unlimited ? Number.POSITIVE_INFINITY : includedRemaining + topupRemaining;
  const canGenerate = unlimited || totalRemaining > 0;
  const nextSource: GenerationSource | null = !canGenerate
    ? null
    : unlimited || includedRemaining > 0
      ? "included"
      : "topup";

  return {
    planKey: plan.key,
    planName: plan.name,
    unlimited,
    included,
    includedUsed,
    includedRemaining: unlimited ? Number.POSITIVE_INFINITY : includedRemaining,
    topupPurchased,
    topupUsed,
    topupRemaining,
    totalRemaining,
    canGenerate,
    nextSource,
    periodStart: periodStartIso
  };
}

/** Record purchased top-up credits (called from the Stripe webhook on payment). */
export async function recordTopupPurchase(
  client: AnySupabaseClient,
  organizationId: string,
  generations: number,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  if (!Number.isFinite(generations) || generations <= 0) {
    return;
  }

  // Idempotency guard: Stripe retries webhook deliveries, so skip if this
  // checkout session's top-up was already recorded — otherwise the same purchase
  // double-credits generation credits.
  const sessionId =
    typeof (metadata as { sessionId?: unknown }).sessionId === "string"
      ? (metadata as { sessionId: string }).sessionId
      : null;

  if (sessionId) {
    const { data: existing } = await client
      .from("usage_events")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("event_type", GENERATION_TOPUP_EVENT)
      .filter("metadata->>sessionId", "eq", sessionId)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return;
    }
  }

  await client.from("usage_events").insert({
    organization_id: organizationId,
    event_type: GENERATION_TOPUP_EVENT,
    quantity: generations,
    metadata
  });
}
