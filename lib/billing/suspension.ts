// Billing-suspension logic for the failed-payment kill switch (Plan 2, step 4).
//
// A subscription's serving state is derived from Stripe's dunning status plus a
// grace deadline we set on the first failed invoice. Computing it at read time
// (rather than persisting a boolean) means the grace window can simply expire
// without a cron flipping a flag — the signing path re-evaluates on every mint.
//
// Like the rate limiter and view-quota, the SERVICE-ROLE reader fails OPEN: a
// misconfigured or erroring billing store must never dark a paying merchant.
// Enforcement here is a retention lever, not the security boundary.

import {
  createServiceRoleSupabaseClient,
  isSupabaseServiceRoleConfigured
} from "@/lib/supabase/server";

type AdminClient = ReturnType<typeof createServiceRoleSupabaseClient>;

// Days a merchant keeps serving after the first failed payment, before models go
// dark. Roughly mirrors Stripe's default retry (Smart Retries) window so a card
// that recovers on its own never causes an outage.
export const GRACE_PERIOD_DAYS = 7;

// Stripe subscription statuses in which models keep serving regardless of grace.
const SERVING_STATUSES = new Set(["active", "trialing"]);

// Statuses that suspend immediately (dunning exhausted / never paid). `past_due`
// is deliberately NOT here — during past_due we honor the grace deadline.
const HARD_SUSPENDED_STATUSES = new Set(["unpaid", "canceled", "incomplete_expired"]);

export type SubscriptionBillingRow = {
  status: string | null;
  grace_period_ends_at: string | null;
};

/**
 * Whether one subscription is currently suspended for nonpayment.
 *   active / trialing            -> serving
 *   unpaid / canceled / expired  -> suspended
 *   past_due                     -> suspended only once the grace deadline passes
 *   anything else / unknown      -> serving (fail open)
 */
export function isSubscriptionSuspended(row: SubscriptionBillingRow, now: Date = new Date()): boolean {
  const status = row.status ?? "";

  if (SERVING_STATUSES.has(status)) return false;
  if (HARD_SUSPENDED_STATUSES.has(status)) return true;

  if (status === "past_due") {
    if (!row.grace_period_ends_at) return false; // grace not started yet
    const deadline = new Date(row.grace_period_ends_at);
    if (Number.isNaN(deadline.getTime())) return false;
    return now.getTime() > deadline.getTime();
  }

  // incomplete, paused, or unrecognized — don't dark on our guess.
  return false;
}

/**
 * Whether an organization is suspended, given all its subscription rows. An org
 * is suspended only when it HAS subscriptions and every one of them is suspended
 * (so a fresh active subscription alongside an old canceled one keeps serving).
 * No rows -> not suspended (fail open; the signup trigger always creates one).
 */
export function isOrgSuspended(rows: SubscriptionBillingRow[], now: Date = new Date()): boolean {
  if (rows.length === 0) return false;
  return rows.every((row) => isSubscriptionSuspended(row, now));
}

/**
 * Service-role read of an org's suspension state, for callers that only have the
 * RLS-scoped anon client (e.g. the public hosted-page fetch, where anonymous
 * viewers can't read the subscriptions table). Fails OPEN on any error or when
 * the service role isn't configured.
 */
export async function getOrgBillingSuspension(organizationId: string): Promise<boolean> {
  if (!isSupabaseServiceRoleConfigured()) return false;

  try {
    const admin = createServiceRoleSupabaseClient();
    const { data, error } = await admin
      .from("subscriptions")
      .select("status, grace_period_ends_at")
      .eq("organization_id", organizationId);

    if (error || !data) return false;
    return isOrgSuspended(data as SubscriptionBillingRow[]);
  } catch {
    return false;
  }
}

/**
 * Start the grace clock on a merchant's failed invoice. Idempotent: only sets the
 * deadline where it's currently null, so Stripe's retries (each firing
 * invoice.payment_failed) never push the deadline further out. Returns the
 * effective deadline and whether grace was newly started this call — the webhook
 * uses `started` to send the dunning email once, not on every retry.
 */
export async function beginGracePeriod(
  admin: AdminClient,
  organizationId: string
): Promise<{ deadline: string; started: boolean }> {
  const { data } = await admin
    .from("subscriptions")
    .select("grace_period_ends_at")
    .eq("organization_id", organizationId);

  const existing = (data ?? [])
    .map((row) => (row as { grace_period_ends_at: string | null }).grace_period_ends_at)
    .filter((value): value is string => Boolean(value))
    .sort()[0];

  if (existing) {
    return { deadline: existing, started: false };
  }

  const deadline = new Date(Date.now() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await admin
    .from("subscriptions")
    .update({ grace_period_ends_at: deadline, updated_at: new Date().toISOString() })
    .eq("organization_id", organizationId)
    .is("grace_period_ends_at", null);

  return { deadline, started: true };
}

/** Clear the grace clock when payment recovers — models resume serving instantly. */
export async function clearGracePeriod(admin: AdminClient, organizationId: string): Promise<void> {
  await admin
    .from("subscriptions")
    .update({ grace_period_ends_at: null, updated_at: new Date().toISOString() })
    .eq("organization_id", organizationId)
    .not("grace_period_ends_at", "is", null);
}
