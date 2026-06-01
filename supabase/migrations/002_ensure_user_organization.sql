create or replace function ensure_user_organization()
returns table (
  id uuid,
  name text,
  slug text,
  plan_key text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  current_email text;
  org_id uuid;
  base_name text;
  base_slug text;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select organizations.id, organizations.name, organizations.slug, organizations.plan_key
    into id, name, slug, plan_key
  from organization_members
  join organizations on organizations.id = organization_members.organization_id
  where organization_members.user_id = current_user_id
  order by organization_members.created_at asc
  limit 1;

  if id is not null then
    return next;
    return;
  end if;

  select email into current_email
  from auth.users
  where auth.users.id = current_user_id;

  base_name := coalesce(split_part(current_email, '@', 1), 'Merchant');
  base_slug := coalesce(nullif(slugify_sql(base_name), ''), 'merchant') || '-' || substr(current_user_id::text, 1, 8);

  insert into profiles (id, full_name, email)
  values (current_user_id, base_name, current_email)
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(profiles.full_name, excluded.full_name),
    updated_at = now();

  insert into organizations (name, slug)
  values (base_name || ' Store', base_slug)
  on conflict (slug) do update set
    updated_at = now()
  returning organizations.id into org_id;

  insert into organization_members (organization_id, user_id, role)
  values (org_id, current_user_id, 'owner')
  on conflict do nothing;

  insert into billing_customers (organization_id)
  values (org_id)
  on conflict do nothing;

  insert into subscriptions (organization_id, plan_key, status)
  select org_id, 'starter', 'trialing'
  where not exists (
    select 1
    from subscriptions
    where subscriptions.organization_id = org_id
  );

  select organizations.id, organizations.name, organizations.slug, organizations.plan_key
    into id, name, slug, plan_key
  from organizations
  where organizations.id = org_id;

  return next;
end;
$$;

revoke all on function ensure_user_organization() from public;
grant execute on function ensure_user_organization() to authenticated;
