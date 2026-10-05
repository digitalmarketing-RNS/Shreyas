-- Behaviour tests for replica/schema.sql. Run against an empty database after loading the schema:
--   psql -v ON_ERROR_STOP=1 -f replica/schema.sql -f replica/tests/schema_test.sql
-- Every check raises an exception on failure, so a clean run means all checks passed.

\set QUIET on
begin;

-- ---------------------------------------------------------------- seed (as the owner, RLS bypassed by ownership... except FORCE)
-- FORCE RLS applies to the owner too, so seed with row_security off as superuser.
set local row_security = off;

insert into orgs (id, name, slug) values
  ('00000000-0000-0000-0000-00000000000a', 'Alpha College', 'alpha'),
  ('00000000-0000-0000-0000-00000000000b', 'Beta School',   'beta');

insert into users (id, email, name) values
  ('00000000-0000-0000-0000-0000000000a1', 'asha@alpha.test', 'Asha'),
  ('00000000-0000-0000-0000-0000000000a2', 'ravi@alpha.test', 'Ravi'),
  ('00000000-0000-0000-0000-0000000000b1', 'meera@beta.test', 'Meera');

insert into roles (id, org_id, name, data_scope) values
  ('00000000-0000-0000-0000-00000000aa01', '00000000-0000-0000-0000-00000000000a', 'Counsellor', 'own'),
  ('00000000-0000-0000-0000-00000000bb01', '00000000-0000-0000-0000-00000000000b', 'Counsellor', 'own');

insert into members (id, org_id, user_id, role_id, status) values
  ('00000000-0000-0000-0000-0000000a0001', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000aa01', 'active'),
  ('00000000-0000-0000-0000-0000000a0002', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-00000000aa01', 'active'),
  ('00000000-0000-0000-0000-0000000b0001', '00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000bb01', 'active');

insert into stages (id, org_id, name, is_untouched) values
  ('00000000-0000-0000-0000-0000000005a0', '00000000-0000-0000-0000-00000000000a', 'Untouched', true),
  ('00000000-0000-0000-0000-0000000005b0', '00000000-0000-0000-0000-00000000000b', 'Untouched', true);

insert into leads (id, org_id, name, email, mobile_e164, stage_id) values
  ('00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-00000000000a', 'Lead A1', 'a1@x.test', '+919800000001', '00000000-0000-0000-0000-0000000005a0'),
  ('00000000-0000-0000-0000-00000000a002', '00000000-0000-0000-0000-00000000000a', 'Lead A2', 'a2@x.test', '+919800000002', '00000000-0000-0000-0000-0000000005a0'),
  ('00000000-0000-0000-0000-00000000b001', '00000000-0000-0000-0000-00000000000b', 'Lead B1', 'a1@x.test', '+919800000001', '00000000-0000-0000-0000-0000000005b0');

insert into lead_owners (lead_id, member_id, org_id, method) values
  ('00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-0000000a0001', '00000000-0000-0000-0000-00000000000a', 'manual'),
  ('00000000-0000-0000-0000-00000000a002', '00000000-0000-0000-0000-0000000a0002', '00000000-0000-0000-0000-00000000000a', 'manual'),
  ('00000000-0000-0000-0000-00000000b001', '00000000-0000-0000-0000-0000000b0001', '00000000-0000-0000-0000-00000000000b', 'manual');

insert into source_touches (org_id, lead_id, position, origin, channel, source) values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000a001', 'first',  'form', 'organic', 'google'),
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000a001', 'latest', 'form', 'organic', 'google');

insert into webhook_events (source, external_event_id, signature_valid, payload)
  values ('meta', 'evt-1', true, '{}');

reset row_security;

-- ---------------------------------------------------------------- as the app, tenant Alpha, scope = all
set local role app_user;
select set_config('app.org_id', '00000000-0000-0000-0000-00000000000a', true),
       set_config('app.member_id', '00000000-0000-0000-0000-0000000a0001', true),
       set_config('app.scope', 'all', true),
       set_config('app.visible_members', '{}', true);

do $$ begin
  if (select count(*) from leads) <> 2 then raise exception 'T1 tenant isolation: expected 2 Alpha leads, got %', (select count(*) from leads); end if;
  if exists (select 1 from leads where id = '00000000-0000-0000-0000-00000000b001') then raise exception 'T2 Beta lead visible to Alpha'; end if;
  if (select count(*) from orgs) <> 1 then raise exception 'T3 org visibility'; end if;
  if (select count(*) from users) <> 2 then raise exception 'T4 users of other orgs visible: %', (select count(*) from users); end if;
  if (select count(*) from webhook_events) <> 0 then raise exception 'T5 app_user can read raw webhooks'; end if;
  if (select count(*) from source_touches) <> 2 then raise exception 'T6 touches'; end if;
end $$;

-- T7 cannot write into another tenant
do $$ begin
  begin
    insert into leads (org_id, name, email, stage_id)
      values ('00000000-0000-0000-0000-00000000000b', 'sneaky', 'sneaky@x.test', '00000000-0000-0000-0000-0000000005b0');
    raise exception 'T7 cross-tenant insert was allowed';
  exception when insufficient_privilege then null;  -- RLS with-check violation
  end;
end $$;

-- T8 duplicate email (case-insensitive) in the same org is rejected; T9 same email in another org was fine (seed)
do $$ begin
  begin
    insert into leads (org_id, name, email, stage_id)
      values ('00000000-0000-0000-0000-00000000000a', 'dup', 'A1@X.TEST', '00000000-0000-0000-0000-0000000005a0');
    raise exception 'T8 duplicate email accepted';
  exception when unique_violation then null;
  end;
end $$;

-- T10 a merged lead frees its email for the surviving record
update leads set merged_into_id = '00000000-0000-0000-0000-00000000a002' where id = '00000000-0000-0000-0000-00000000a001';
insert into leads (org_id, name, email, stage_id)
  values ('00000000-0000-0000-0000-00000000000a', 're-registered', 'a1@x.test', '00000000-0000-0000-0000-0000000005a0');
update leads set merged_into_id = null where id = '00000000-0000-0000-0000-00000000a001' and false;  -- no-op, keep data

-- T11 first source is locked, latest can change
do $$ begin
  begin
    update source_touches set source = 'facebook' where position = 'first';
    raise exception 'T11 first source was edited';
  exception when insufficient_privilege then null;
  end;
  update source_touches set source = 'facebook' where position = 'latest';
  if (select source from source_touches where position = 'latest') <> 'facebook' then raise exception 'T12 latest not updated'; end if;
  begin
    delete from source_touches where position = 'first';
    raise exception 'T13 first source was deleted directly';
  exception when insufficient_privilege then null;
  end;
end $$;

-- T14 audit log is append-only for the app
insert into audit_log (org_id, action) values ('00000000-0000-0000-0000-00000000000a', 'test');
do $$ begin
  begin
    update audit_log set action = 'tampered';
    raise exception 'T14 audit log editable';
  exception when insufficient_privilege then null;
  end;
end $$;

-- T15 only one live automation run per lead per automation; T16 one run per trigger event
insert into automations (id, org_id, name, trigger_type, graph)
  values ('00000000-0000-0000-0000-0000000a0a01', '00000000-0000-0000-0000-00000000000a', 'welcome', 'lead_created', '{}');
insert into automation_runs (org_id, automation_id, automation_version, lead_id, trigger_event_id)
  values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000a0a01', 1, '00000000-0000-0000-0000-00000000a002', 'e1');
do $$ begin
  begin
    insert into automation_runs (org_id, automation_id, automation_version, lead_id, trigger_event_id)
      values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000a0a01', 1, '00000000-0000-0000-0000-00000000a002', 'e2');
    raise exception 'T15 second live run allowed';
  exception when unique_violation then null;
  end;
  begin
    update automation_runs set status = 'done';
    insert into automation_runs (org_id, automation_id, automation_version, lead_id, trigger_event_id)
      values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000a0a01', 1, '00000000-0000-0000-0000-00000000a002', 'e1');
    raise exception 'T16 same trigger event ran twice';
  exception when unique_violation then null;
  end;
end $$;

-- T17 a payment is either online (gateway) or offline (mode), never both or neither
do $$ begin
  begin
    insert into payments (org_id, lead_id, amount_paise) values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000a002', 100000);
    raise exception 'T17 payment with neither gateway nor offline mode';
  exception when check_violation then null;
  end;
  insert into payments (org_id, lead_id, amount_paise, offline_mode, status)
    values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000a002', 100000, 'cash', 'pending');
end $$;

-- ---------------------------------------------------------------- scope = own: Asha sees only her leads
select set_config('app.scope', 'own', true),
       set_config('app.visible_members', '{00000000-0000-0000-0000-0000000a0001}', true);
do $$ begin
  if (select count(*) from leads) <> 1 then raise exception 'T18 own scope: expected 1 lead, got %', (select count(*) from leads); end if;
  if exists (select 1 from leads where id = '00000000-0000-0000-0000-00000000a002') then raise exception 'T19 own scope leaks Ravi''s lead'; end if;
end $$;

-- scope = team: Asha manages Ravi
select set_config('app.scope', 'team', true),
       set_config('app.visible_members', '{00000000-0000-0000-0000-0000000a0001,00000000-0000-0000-0000-0000000a0002}', true);
do $$ begin
  if (select count(*) from leads) <> 2 then raise exception 'T20 team scope: expected 2, got %', (select count(*) from leads); end if;
end $$;

-- no tenant set at all: nothing is visible
select set_config('app.org_id', '', true);
do $$ begin
  if (select count(*) from leads) <> 0 or (select count(*) from members) <> 0 then raise exception 'T21 data visible without a tenant'; end if;
end $$;

reset role;

-- ---------------------------------------------------------------- worker: reads raw webhooks; erasure cascades
set local role app_worker;
select set_config('app.org_id', '00000000-0000-0000-0000-00000000000a', true), set_config('app.scope', 'all', true);
do $$ begin
  if (select count(*) from webhook_events) <> 1 then raise exception 'T22 worker cannot read webhooks'; end if;
end $$;
-- T23 erasing a lead removes its locked source touches through the cascade
delete from payments where lead_id = '00000000-0000-0000-0000-00000000a001';
delete from leads where id = '00000000-0000-0000-0000-00000000a001';
do $$ begin
  if exists (select 1 from source_touches where lead_id = '00000000-0000-0000-0000-00000000a001') then raise exception 'T23 touches survived erasure'; end if;
end $$;
reset role;

rollback;
\echo 'schema tests: all passed'
