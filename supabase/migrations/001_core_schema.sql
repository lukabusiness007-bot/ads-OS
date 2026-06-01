create extension if not exists pgcrypto;

create type product_status as enum ('draft','photos_uploaded','generating','generation_failed','awaiting_review','approved','rejected','published','unpublished');
create type member_role as enum ('owner','admin','member');
create type generation_status as enum ('queued','running','succeeded','failed');
create type hosted_page_status as enum ('locked','ready','published','unpublished');
create type review_status as enum ('pending','approved','rejected','changes_requested');

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  website text,
  plan_key text default 'starter',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  default_language text default 'en',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table organization_members (
  organization_id uuid references organizations(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role member_role not null default 'member',
  created_at timestamptz default now(),
  primary key (organization_id, user_id)
);

create table products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade not null,
  name text not null,
  slug text not null,
  category text not null,
  status product_status not null default 'draft',
  description text,
  customer_url text,
  price text,
  width_m numeric,
  height_m numeric,
  depth_m numeric,
  photo_count int default 0,
  required_angles_complete boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (organization_id, slug)
);

create table product_photos (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade not null,
  product_id uuid references products(id) on delete cascade not null,
  r2_key text not null,
  file_name text not null,
  file_type text not null,
  angle text,
  width int,
  height int,
  size_bytes bigint,
  blur_score numeric,
  created_at timestamptz default now()
);

create table generation_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade not null,
  product_id uuid references products(id) on delete cascade not null,
  provider text not null default 'meshy',
  provider_job_id text,
  status generation_status not null default 'queued',
  provider_status text,
  progress int default 0,
  error_message text,
  raw_provider_payload jsonb,
  started_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table job_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade not null,
  job_id uuid references generation_jobs(id) on delete cascade not null,
  event_type text not null,
  message text,
  payload jsonb,
  created_at timestamptz default now()
);

create table model_assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade not null,
  product_id uuid references products(id) on delete cascade not null,
  generation_job_id uuid references generation_jobs(id) on delete set null,
  glb_r2_key text not null,
  usdz_r2_key text,
  poster_r2_key text,
  public_glb_url text,
  public_usdz_url text,
  public_poster_url text,
  file_size_mb numeric,
  triangle_count int default 0,
  texture_max int default 4096,
  dimensions_present boolean default true,
  created_at timestamptz default now()
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade not null,
  product_id uuid references products(id) on delete cascade not null,
  status review_status not null default 'pending',
  reviewer_id uuid references profiles(id),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table hosted_pages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade not null,
  product_id uuid references products(id) on delete cascade not null,
  slug text not null,
  public_url text,
  status hosted_page_status not null default 'locked',
  cta_label text default 'View on store',
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (organization_id, slug)
);

create table analytics_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade not null,
  product_id uuid references products(id) on delete cascade,
  hosted_page_id uuid references hosted_pages(id) on delete cascade,
  event_type text not null,
  device_type text,
  referrer text,
  metadata jsonb,
  created_at timestamptz default now()
);

create table billing_customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade unique not null,
  stripe_customer_id text unique,
  created_at timestamptz default now()
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade not null,
  stripe_subscription_id text unique,
  plan_key text not null,
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table usage_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade not null,
  product_id uuid references products(id) on delete set null,
  event_type text not null,
  quantity numeric not null default 1,
  metadata jsonb,
  created_at timestamptz default now()
);

create or replace function user_org_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select organization_id from organization_members where user_id = auth.uid()
$$;

create or replace function slugify_sql(value text)
returns text language sql immutable as $$
  select trim(both '-' from regexp_replace(lower(coalesce(value, 'organization')), '[^a-z0-9]+', '-', 'g'))
$$;

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  org_id uuid;
  base_name text;
  base_slug text;
begin
  base_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'Merchant');
  base_slug := coalesce(nullif(slugify_sql(base_name), ''), 'merchant') || '-' || substr(new.id::text, 1, 8);

  insert into profiles (id, full_name, email, avatar_url)
  values (new.id, base_name, new.email, new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(profiles.full_name, excluded.full_name),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
    updated_at = now();

  insert into organizations (name, slug)
  values (base_name || ' Store', base_slug)
  returning id into org_id;

  insert into organization_members (organization_id, user_id, role)
  values (org_id, new.id, 'owner')
  on conflict do nothing;

  insert into billing_customers (organization_id)
  values (org_id)
  on conflict do nothing;

  insert into subscriptions (organization_id, plan_key, status)
  values (org_id, 'starter', 'trialing');

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure handle_new_user();

alter table organizations enable row level security;
alter table profiles enable row level security;
alter table organization_members enable row level security;
alter table products enable row level security;
alter table product_photos enable row level security;
alter table generation_jobs enable row level security;
alter table job_events enable row level security;
alter table model_assets enable row level security;
alter table reviews enable row level security;
alter table hosted_pages enable row level security;
alter table analytics_events enable row level security;
alter table billing_customers enable row level security;
alter table subscriptions enable row level security;
alter table usage_events enable row level security;

create policy "members read orgs" on organizations for select using (id in (select user_org_ids()));
create policy "public can read organization slugs" on organizations for select using (true);
create policy "users read own profile" on profiles for select using (id = auth.uid());
create policy "users update own profile" on profiles for update using (id = auth.uid());
create policy "members read memberships" on organization_members for select using (organization_id in (select user_org_ids()));

create policy "org access products" on products for all using (organization_id in (select user_org_ids())) with check (organization_id in (select user_org_ids()));
create policy "org access photos" on product_photos for all using (organization_id in (select user_org_ids())) with check (organization_id in (select user_org_ids()));
create policy "org access jobs" on generation_jobs for all using (organization_id in (select user_org_ids())) with check (organization_id in (select user_org_ids()));
create policy "org access job events" on job_events for all using (organization_id in (select user_org_ids())) with check (organization_id in (select user_org_ids()));
create policy "org access assets" on model_assets for all using (organization_id in (select user_org_ids())) with check (organization_id in (select user_org_ids()));
create policy "org access reviews" on reviews for all using (organization_id in (select user_org_ids())) with check (organization_id in (select user_org_ids()));
create policy "org access hosted pages" on hosted_pages for all using (organization_id in (select user_org_ids())) with check (organization_id in (select user_org_ids()));
create policy "org access billing customers" on billing_customers for all using (organization_id in (select user_org_ids())) with check (organization_id in (select user_org_ids()));
create policy "org access subscriptions" on subscriptions for all using (organization_id in (select user_org_ids())) with check (organization_id in (select user_org_ids()));
create policy "org access usage" on usage_events for all using (organization_id in (select user_org_ids())) with check (organization_id in (select user_org_ids()));

create policy "public can read published pages" on hosted_pages for select using (status = 'published');
create policy "public can insert analytics" on analytics_events for insert with check (event_type in ('page_view','viewer_interaction','ar_button_click','cta_click'));

create index products_org_status_idx on products (organization_id, status);
create index photos_product_idx on product_photos (product_id);
create index jobs_product_status_idx on generation_jobs (product_id, status);
create index jobs_provider_job_id_idx on generation_jobs (provider_job_id);
create index hosted_pages_slug_idx on hosted_pages (slug);
create index analytics_product_created_idx on analytics_events (product_id, created_at desc);
