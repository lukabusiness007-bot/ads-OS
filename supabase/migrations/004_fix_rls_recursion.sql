-- Fix "stack depth limit exceeded" (infinite recursion) in row-level security.
--
-- Root cause:
--   The SELECT policy on organization_members called user_org_ids(), and
--   user_org_ids() itself queries organization_members. When the function's
--   SECURITY DEFINER RLS-bypass is not in effect on the deployed database, the
--   policy re-triggers itself, recursing until the statement hits the stack
--   depth limit / statement timeout. This takes down every read that touches
--   org-scoped tables: the dashboard (products, analytics_events), the current
--   organization lookup, and ensure_user_organization.
--
-- Fix:
--   Make the membership SELECT policy self-contained (user_id = auth.uid()) so
--   it never re-queries the same table, and re-assert user_org_ids() as a proper
--   SECURITY DEFINER helper used by the other org-scoped table policies.

-- 1. Recursion-proof the membership read policy.
drop policy if exists "members read memberships" on public.organization_members;
create policy "members read own memberships"
  on public.organization_members
  for select
  using (user_id = auth.uid());

-- 2. Re-assert the helper as SECURITY DEFINER (bypasses RLS for org-scoped policies).
create or replace function public.user_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.organization_members where user_id = auth.uid()
$$;

notify pgrst, 'reload schema';
