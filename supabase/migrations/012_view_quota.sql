-- Plan 2, step 3 (view-limit enforcement). Makes `monthlyViewLimit` real.
--
-- A plan grants N 3D/AR views per calendar month (lib/billing/plans.ts). The
-- denominator is the org's page_view + embed_view analytics_events for the
-- current UTC month. The /api/model-access signing path checks this on every
-- minted URL, so a raw COUNT(*) per request would be far too expensive — the
-- count is cached per org per month here and only recomputed when stale.
--
-- Mirrors the serverless-safe, DB-backed approach of 008_rate_limit.sql: state
-- lives in Postgres (not memory) and is reached only through a SECURITY DEFINER
-- function so the table needs no direct privileges for callers.

create table if not exists org_view_usage (
  organization_id uuid not null references organizations(id) on delete cascade,
  period_start    timestamptz not null,   -- first instant of the UTC calendar month
  view_count      bigint not null default 0,
  refreshed_at    timestamptz not null default now(),
  primary key (organization_id, period_start)
);

-- Supports the refresh aggregate below (org + event_type + month window). The
-- existing analytics index is keyed on product_id, which this query doesn't use.
create index if not exists analytics_org_event_created_idx
  on analytics_events (organization_id, event_type, created_at);

-- Read-or-refresh the cached monthly view count for one org. Returns the cached
-- value when it's younger than p_max_age_seconds; otherwise recomputes it from
-- analytics_events and upserts the cache. SECURITY DEFINER so the service role
-- (which the signing path uses) reaches analytics_events + the cache table
-- without granting either to other roles.
create or replace function public.get_org_view_usage(
  p_org uuid,
  p_period_start timestamptz,
  p_max_age_seconds integer default 60
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  cached_count bigint;
  cached_at    timestamptz;
  fresh_count  bigint;
begin
  select view_count, refreshed_at
    into cached_count, cached_at
  from org_view_usage
  where organization_id = p_org
    and period_start = p_period_start;

  if found and cached_at > now() - make_interval(secs => p_max_age_seconds) then
    return cached_count;
  end if;

  select count(*)
    into fresh_count
  from analytics_events
  where organization_id = p_org
    and event_type in ('page_view', 'embed_view')
    and created_at >= p_period_start;

  insert into org_view_usage (organization_id, period_start, view_count, refreshed_at)
  values (p_org, p_period_start, fresh_count, now())
  on conflict (organization_id, period_start)
  do update set view_count = excluded.view_count, refreshed_at = excluded.refreshed_at;

  return fresh_count;
end;
$$;

-- RLS on with no policies: only the service role (bypasses RLS) and the
-- SECURITY DEFINER function above may touch the cache table.
alter table org_view_usage enable row level security;

-- Only the signing path (service role) needs to read usage. Keep the function
-- off anon/authenticated so it can't be used to probe other orgs' view counts.
revoke all on function public.get_org_view_usage(uuid, timestamptz, integer) from public;
grant execute on function public.get_org_view_usage(uuid, timestamptz, integer) to service_role;

notify pgrst, 'reload schema';
