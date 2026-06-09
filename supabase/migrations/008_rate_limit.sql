-- Fixed-window rate limiter backing the exposed/unauthenticated endpoints
-- (security review #7). Serverless-safe: state lives in Postgres, not memory.

create table if not exists rate_limit_hits (
  bucket       text not null,          -- e.g. 'login-username:1.2.3.4'
  window_start timestamptz not null,   -- start of the fixed window this count covers
  count        integer not null default 0,
  primary key (bucket, window_start)
);

create index if not exists rate_limit_hits_window_idx on rate_limit_hits (window_start);

-- Atomic increment-and-return for one fixed window. SECURITY DEFINER so the anon
-- role can call it without any direct table privileges. Returns the post-increment
-- count so the caller can compare against its own limit.
create or replace function public.bump_rate_limit(
  p_bucket text,
  p_window_start timestamptz
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  insert into rate_limit_hits (bucket, window_start, count)
  values (p_bucket, p_window_start, 1)
  on conflict (bucket, window_start)
  do update set count = rate_limit_hits.count + 1
  returning count into new_count;
  return new_count;
end;
$$;

-- RLS on with no policies: only the service role (which bypasses RLS) and the
-- SECURITY DEFINER function above may touch this table. Anon/authenticated callers
-- can only reach it through bump_rate_limit().
alter table rate_limit_hits enable row level security;

revoke all on function public.bump_rate_limit(text, timestamptz) from public;
grant execute on function public.bump_rate_limit(text, timestamptz) to anon, authenticated;

notify pgrst, 'reload schema';
