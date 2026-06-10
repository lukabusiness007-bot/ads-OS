-- Plan 1 (public embeddable AR viewer): embed support.
--
-- 1) Per-page allowlist of domains permitted to frame the public /embed/* route.
--    Empty array = free-tier behavior (frame-ancestors *); a populated list is an
--    explicit allowlist enforced server-side in middleware (never from request
--    input). Shared with Plan 2's origin-binding. Merchant-managed via UI later.
alter table public.hosted_pages
  add column if not exists allowed_embed_domains text[] not null default '{}';

-- 2) Allow the new embed_view analytics event from public (embedded) viewers.
--    Mirrors the existing hardened policy from 007 — anonymous inserts must still
--    reference a real published hosted page with matching org + product.
drop policy if exists "public can insert analytics for published pages" on public.analytics_events;
create policy "public can insert analytics for published pages"
  on public.analytics_events
  for insert
  with check (
    event_type in ('page_view','viewer_interaction','ar_button_click','cta_click','embed_view')
    and exists (
      select 1 from public.hosted_pages hp
      where hp.id = hosted_page_id
        and hp.status = 'published'
        and hp.organization_id = analytics_events.organization_id
        and hp.product_id = analytics_events.product_id
    )
  );

notify pgrst, 'reload schema';
