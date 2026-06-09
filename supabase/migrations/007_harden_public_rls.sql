-- Tighten two over-permissive public RLS policies flagged in the security review.
-- Both are additive public policies; the org-scoped (user_org_ids) and admin
-- (is_platform_admin) policies remain in place and are unaffected.

-- #4 organizations: the previous "public can read organization slugs" policy used
-- `using (true)`, exposing every column of every organization (name, website,
-- plan_key, suspended_at, timestamps) to anonymous callers. Restrict anonymous
-- SELECT to organizations that actually have a published hosted page — the only
-- orgs whose identity is meant to be public.
drop policy if exists "public can read organization slugs" on public.organizations;
create policy "public can read published orgs"
  on public.organizations
  for select
  using (
    id in (select organization_id from public.hosted_pages where status = 'published')
  );

-- #5 analytics_events: the previous "public can insert analytics" policy only
-- validated event_type in its WITH CHECK, letting anyone with the anon key insert
-- events for ANY organization/product (billable/owned data pollution). Require the
-- inserted row to reference a real published hosted page with matching org+product.
drop policy if exists "public can insert analytics" on public.analytics_events;
create policy "public can insert analytics for published pages"
  on public.analytics_events
  for insert
  with check (
    event_type in ('page_view','viewer_interaction','ar_button_click','cta_click')
    and exists (
      select 1 from public.hosted_pages hp
      where hp.id = hosted_page_id
        and hp.status = 'published'
        and hp.organization_id = analytics_events.organization_id
        and hp.product_id = analytics_events.product_id
    )
  );

notify pgrst, 'reload schema';
