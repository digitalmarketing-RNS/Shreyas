-- Supabase-only setup, run on the hosted project after schema.sql. The auth and realtime schemas do not exist on
-- plain Postgres, so tests/schema_test.sql does not cover this file; check it on a Supabase branch before launch.

-- 1. Login roles. The web app's role inherits app_user and the worker's inherits app_worker; neither has BYPASSRLS.
--    Passwords are set outside git, for example:
--      create role crm_web login password '...' in role app_user;
--      create role crm_worker login password '...' in role app_worker;
--    Creating the BYPASSRLS function-owner roles in schema.sql needs a role that itself has BYPASSRLS (Supabase's
--    postgres role); if that is refused, give those roles explicit "for select to app_resolver using (true)" policies.

-- 2. Custom access-token hook: adds org_id and member_id claims, used only to authorise Realtime channels.
--    Data access never trusts these claims; the server reloads membership through app.memberships_for_user.
create or replace function app.access_token_hook(event jsonb) returns jsonb
language plpgsql stable as $$
declare
  claims jsonb := event -> 'claims';
  wanted uuid := nullif(event -> 'claims' -> 'app_metadata' ->> 'active_org_id', '')::uuid;
  m record;
begin
  select x.org_id, x.member_id into m
  from app.memberships_for_user((event ->> 'user_id')::uuid) x
  where x.status = 'active' and (wanted is null or x.org_id = wanted)
  order by x.org_id limit 1;
  if m.org_id is not null then
    claims := jsonb_set(claims, '{org_id}', to_jsonb(m.org_id::text));
    claims := jsonb_set(claims, '{member_id}', to_jsonb(m.member_id::text));
  end if;
  return jsonb_set(event, '{claims}', claims);
end $$;
grant usage on schema app to supabase_auth_admin;
grant execute on function app.access_token_hook(jsonb), app.memberships_for_user(uuid) to supabase_auth_admin;
revoke execute on function app.access_token_hook(jsonb) from public, anon, authenticated;

-- 3. Realtime: a signed-in member may join only their own private channel org:{org_id}:member:{member_id}.
--    Messages on it carry ids only; the browser fetches the data through our API.
create policy member_channel on realtime.messages for select to authenticated
  using (realtime.topic() = 'org:' || (auth.jwt() ->> 'org_id') || ':member:' || (auth.jwt() ->> 'member_id'));
