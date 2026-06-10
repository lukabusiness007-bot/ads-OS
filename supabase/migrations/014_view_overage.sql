-- Plan 2, step 4 (metered view overage). On overage-enabled plans, going past
-- monthlyViewLimit no longer darks the viewer — the extra views keep serving and
-- are billed through a Stripe metered subscription item instead.
--
-- The signing path (/api/model-access) observes the org's cached monthly view
-- count (012_view_quota.sql) and must report exactly the NEW overage since the
-- last report to Stripe — never the same views twice, even with many concurrent
-- requests on serverless. That dedupe is this table + RPC: a high-water mark of
-- views already reported per org per month, advanced atomically so exactly one
-- request wins each delta and reports it.

create table if not exists org_view_overage (
  organization_id uuid not null references organizations(id) on delete cascade,
  period_start    timestamptz not null,   -- first instant of the UTC calendar month
  reported_count  bigint not null default 0,  -- overage views already sent to Stripe
  updated_at      timestamptz not null default now(),
  primary key (organization_id, period_start)
);

-- Atomically claim the unreported slice of overage. `p_observed_overage` is the
-- caller's view of total overage so far this month (count - limit). Returns how
-- many views the CALLER now owns reporting for: 0 when another request already
-- claimed up to (or past) this total. The row update locks, so two concurrent
-- callers can't both claim the same slice; the high-water mark only advances.
--
-- If the caller's Stripe report then fails, that slice goes unbilled (we don't
-- roll back the claim). Deliberate: fail in the merchant's favor, never double-bill.
create or replace function public.claim_view_overage(
  p_org uuid,
  p_period_start timestamptz,
  p_observed_overage bigint
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  old_count bigint;
begin
  if p_observed_overage is null or p_observed_overage <= 0 then
    return 0;
  end if;

  insert into org_view_overage (organization_id, period_start, reported_count)
  values (p_org, p_period_start, 0)
  on conflict (organization_id, period_start) do nothing;

  -- FOR UPDATE serializes concurrent claimers on the org-month row, so each
  -- slice of overage is claimed by exactly one caller.
  select reported_count
    into old_count
  from org_view_overage
  where organization_id = p_org
    and period_start = p_period_start
  for update;

  if old_count >= p_observed_overage then
    return 0;  -- someone already reported up to (or past) this total
  end if;

  update org_view_overage
     set reported_count = p_observed_overage,
         updated_at = now()
   where organization_id = p_org
     and period_start = p_period_start;

  return p_observed_overage - old_count;
end;
$$;

-- RLS on with no policies: only the service role (bypasses RLS) and the
-- SECURITY DEFINER function reach the table. Keep the function off anon/
-- authenticated so it can't be used to probe or corrupt billing counters.
alter table org_view_overage enable row level security;

revoke all on function public.claim_view_overage(uuid, timestamptz, bigint) from public;
grant execute on function public.claim_view_overage(uuid, timestamptz, bigint) to service_role;

notify pgrst, 'reload schema';
