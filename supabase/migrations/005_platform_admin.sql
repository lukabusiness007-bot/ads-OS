-- Platform admin flag, username login, suspend, audit log, notifications, automation seams.

-- 1. Admin identity columns on profiles
alter table profiles
  add column if not exists is_platform_admin boolean not null default false,
  add column if not exists username          text unique,
  add column if not exists suspended_at      timestamptz;

-- 2. Suspend column on organizations
alter table organizations
  add column if not exists suspended_at timestamptz;

-- 3. reviewer_kind + reviewer_kind enum on reviews (automation seam)
alter table reviews
  add column if not exists reviewer_kind text not null default 'human';
-- Valid values: 'human', 'auto'

-- 4. Audit log
create table if not exists admin_audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references profiles(id) on delete set null,
  action      text not null,          -- approve, reject, regenerate, suspend, unsuspend, impersonate_start, impersonate_stop, edit_product, edit_plan
  target_type text not null,          -- product, user, organization, review
  target_id   uuid,
  metadata    jsonb default '{}'::jsonb,
  created_at  timestamptz default now()
);

-- 5. Admin notifications
create table if not exists admin_notifications (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid references products(id) on delete cascade,
  action      text not null,          -- awaiting_review, generation_failed
  read        boolean not null default false,
  created_at  timestamptz default now()
);

-- 6. Auto-review config flag (automation seam, disabled by default)
create table if not exists admin_config (
  key   text primary key,
  value jsonb not null default 'null'::jsonb,
  updated_at timestamptz default now()
);
insert into admin_config (key, value)
  values ('auto_review_enabled', 'false'::jsonb)
  on conflict (key) do nothing;

-- 7. Security-definer helper: is_platform_admin()
create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_platform_admin from profiles where id = auth.uid()),
    false
  )
$$;

-- 8. Admin RLS policies on every tenant table
--    These are additive — normal org-scoped policies remain in place.

-- organizations
create policy "admin all orgs" on organizations
  for all using (is_platform_admin()) with check (is_platform_admin());

-- profiles
create policy "admin all profiles" on profiles
  for all using (is_platform_admin()) with check (is_platform_admin());

-- organization_members
create policy "admin all members" on organization_members
  for all using (is_platform_admin()) with check (is_platform_admin());

-- products
create policy "admin all products" on products
  for all using (is_platform_admin()) with check (is_platform_admin());

-- product_photos
create policy "admin all photos" on product_photos
  for all using (is_platform_admin()) with check (is_platform_admin());

-- generation_jobs
create policy "admin all jobs" on generation_jobs
  for all using (is_platform_admin()) with check (is_platform_admin());

-- job_events
create policy "admin all job events" on job_events
  for all using (is_platform_admin()) with check (is_platform_admin());

-- model_assets
create policy "admin all assets" on model_assets
  for all using (is_platform_admin()) with check (is_platform_admin());

-- reviews
create policy "admin all reviews" on reviews
  for all using (is_platform_admin()) with check (is_platform_admin());

-- hosted_pages
create policy "admin all hosted pages" on hosted_pages
  for all using (is_platform_admin()) with check (is_platform_admin());

-- analytics_events
create policy "admin all analytics" on analytics_events
  for all using (is_platform_admin()) with check (is_platform_admin());

-- billing_customers
create policy "admin all billing" on billing_customers
  for all using (is_platform_admin()) with check (is_platform_admin());

-- subscriptions
create policy "admin all subscriptions" on subscriptions
  for all using (is_platform_admin()) with check (is_platform_admin());

-- usage_events
create policy "admin all usage" on usage_events
  for all using (is_platform_admin()) with check (is_platform_admin());

-- 9. RLS on admin-only tables (only admins + service role)
alter table admin_audit_log enable row level security;
create policy "admin audit log access" on admin_audit_log
  for all using (is_platform_admin()) with check (is_platform_admin());

alter table admin_notifications enable row level security;
create policy "admin notifications access" on admin_notifications
  for all using (is_platform_admin()) with check (is_platform_admin());

alter table admin_config enable row level security;
create policy "admin config access" on admin_config
  for all using (is_platform_admin()) with check (is_platform_admin());

-- 10. Trigger: when product status becomes 'awaiting_review' or 'generation_failed',
--     insert an admin_notifications row (best-effort, never blocks the update).
create or replace function public.notify_admin_on_product_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status in ('awaiting_review', 'generation_failed')
     and (old.status is null or old.status <> new.status) then
    insert into admin_notifications (product_id, action)
    values (new.id, new.status::text)
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_admin_notify_product_status on products;
create trigger trg_admin_notify_product_status
  after insert or update of status on products
  for each row execute procedure public.notify_admin_on_product_status();

-- 11. Index helpers
create index if not exists admin_audit_log_actor_idx     on admin_audit_log (actor_id, created_at desc);
create index if not exists admin_audit_log_target_idx    on admin_audit_log (target_type, target_id, created_at desc);
create index if not exists admin_notifications_unread_idx on admin_notifications (read, created_at desc);
create index if not exists profiles_username_idx          on profiles (username);

notify pgrst, 'reload schema';
