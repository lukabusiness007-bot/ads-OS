// View-quota metering for the model-access signing path (Plan 2, step 3).
//
// A merchant's plan grants `monthlyViewLimit` 3D/AR views per calendar month
// (lib/billing/plans.ts). The denominator is the org's page_view + embed_view
// analytics_events for the current UTC month. Recomputing that COUNT(*) on every
// signed-URL mint would be far too expensive, so it's cached per org per month in
// `org_view_usage` and only recomputed when stale (see 012_view_quota.sql).
//
// Fails OPEN, like the rate limiter (lib/rate-limit.ts): a misconfigured or
// erroring quota store must never block a paying merchant's legitimate views.
// Enforcement is a billing lever, not the security boundary.

import {
  createServiceRoleSupabaseClient,
  isSupabaseServiceRoleConfigured
} from "@/lib/supabase/server";
import { getPlanLimits } from "./plans";

// Max staleness of the cached counter. Keeps enforcement within ~a minute of
// real usage while bounding the recompute aggregate to once per org per minute.
const CACHE_TTL_SECONDS = 60;

export type ViewQuotaResult = {
  /** False only when the org is provably at/over its monthly view limit. */
  allowed: boolean;
  /** Views counted this month (0 when unknown or unlimited). */
  count: number;
  /** The plan's monthly view ceiling (null = unlimited). */
  limit: number | null;
};

/** First instant of the current UTC calendar month — the quota window start. */
export function currentMonthStart(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/**
 * Whether `organizationId` may be served another 3D/AR view this month under
 * `planKey`'s `monthlyViewLimit`. Unlimited plans always pass; any store/RPC
 * failure passes too (fail-open). Callers degrade to poster + upgrade prompt
 * when `allowed` is false.
 */
export async function checkViewQuota(
  organizationId: string,
  planKey: string | null | undefined
): Promise<ViewQuotaResult> {
  const limit = getPlanLimits(planKey).monthlyViewLimit;

  // Unlimited plans (Business) never gate.
  if (limit === null) {
    return { allowed: true, count: 0, limit: null };
  }

  if (!isSupabaseServiceRoleConfigured()) {
    return { allowed: true, count: 0, limit };
  }

  try {
    const admin = createServiceRoleSupabaseClient();
    const { data, error } = await admin.rpc("get_org_view_usage", {
      p_org: organizationId,
      p_period_start: currentMonthStart().toISOString(),
      p_max_age_seconds: CACHE_TTL_SECONDS
    });

    if (error) {
      return { allowed: true, count: 0, limit };
    }

    const count = typeof data === "number" ? data : Number(data ?? 0);
    if (!Number.isFinite(count)) {
      return { allowed: true, count: 0, limit };
    }

    return { allowed: count < limit, count, limit };
  } catch {
    return { allowed: true, count: 0, limit };
  }
}
