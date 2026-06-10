-- Plan 2, step 4 (failed-payment unpublish). Ties the Stripe dunning lifecycle to
-- the model-access kill switch (Part A) so nonpayment darks a merchant's models —
-- and restores them instantly when payment recovers.
--
-- Lifecycle:
--   invoice.payment_failed  -> grace_period_ends_at = now + GRACE_PERIOD_DAYS
--                              (set ONCE; Stripe retries must not push the clock out)
--   ...during grace          -> models keep serving; the owner is emailed to pay
--   grace elapsed / unpaid   -> /api/model-access stops minting; page + embeds dark
--   invoice.paid / active    -> grace_period_ends_at cleared -> serving resumes
--
-- Suspension is computed at read time from (status, grace_period_ends_at) — see
-- lib/billing/suspension.ts — so no cron is needed to flip a flag when the grace
-- window simply expires. We store only the deadline, not a derived boolean, to
-- avoid a second source of truth that could drift out of sync.

alter table public.subscriptions
  add column if not exists grace_period_ends_at timestamptz;

-- The webhook updates, and the signing path embeds, subscriptions by organization.
-- 001 only indexed stripe_subscription_id (unique); add the org lookup index.
create index if not exists subscriptions_org_idx
  on public.subscriptions (organization_id);

-- RLS already enabled on subscriptions (001). The new column is covered by the
-- existing "org access subscriptions" policy; the service-role webhook + signing
-- path bypass RLS. No policy change needed.

notify pgrst, 'reload schema';
