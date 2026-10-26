-- Behaviour tests for replica/schema.sql. Run against an empty database after loading the schema:
--   psql -v ON_ERROR_STOP=1 -f replica/schema.sql -f replica/tests/schema_test.sql
-- Every check raises an exception on failure, so a clean run means all checks passed.
-- Ids: orgs ...0a / ...0b; members a0001 (Asha), a0002 (Ravi), b0001 (Meera); leads a001, a002, b001.

\set QUIET on
begin;

-- ---------------------------------------------------------------- seed
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
  ('00000000-0000-0000-0000-0000000005a1', '00000000-0000-0000-0000-00000000000a', 'Interested', false),
  ('00000000-0000-0000-0000-0000000005b0', '00000000-0000-0000-0000-00000000000b', 'Untouched', true);
insert into sub_stages (id, org_id, stage_id, name) values
  ('00000000-0000-0000-0000-000000005a11', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000005a1', 'Hot');

-- a001 is two years old, so its retention hold can have passed by the erasure test
insert into leads (id, org_id, name, email, mobile_e164, stage_id, created_at) values
  ('00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-00000000000a', 'Lead A1', 'a1@x.test', '+919800000001', '00000000-0000-0000-0000-0000000005a0', now() - interval '2 years');
insert into leads (id, org_id, name, email, mobile_e164, stage_id) values
  ('00000000-0000-0000-0000-00000000a002', '00000000-0000-0000-0000-00000000000a', 'Lead A2', 'a2@x.test', '+919800000002', '00000000-0000-0000-0000-0000000005a0'),
  ('00000000-0000-0000-0000-00000000b001', '00000000-0000-0000-0000-00000000000b', 'Lead B1', 'a1@x.test', '+919800000001', '00000000-0000-0000-0000-0000000005b0');

insert into lead_owners (lead_id, member_id, org_id, method, is_primary) values
  ('00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-0000000a0001', '00000000-0000-0000-0000-00000000000a', 'manual', true),
  ('00000000-0000-0000-0000-00000000a002', '00000000-0000-0000-0000-0000000a0002', '00000000-0000-0000-0000-00000000000a', 'manual', true),
  ('00000000-0000-0000-0000-00000000b001', '00000000-0000-0000-0000-0000000b0001', '00000000-0000-0000-0000-00000000000b', 'manual', true);

insert into source_touches (org_id, lead_id, position, origin, channel, source, gclid) values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000a001', 'first',  'form', 'organic', 'google', 'gclid-123'),
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000a001', 'latest', 'form', 'organic', 'google', null);

insert into consents (org_id, lead_id, subject_hash, channel, purpose, status, method) values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000a001', 'hmac-a1', 'whatsapp', 'marketing', 'granted', 'form_checkbox');

insert into forms (org_id, name, public_key) values
  ('00000000-0000-0000-0000-00000000000a', 'Website', 'pk_alpha_website_0000000001');

insert into activity_types (org_id, code, name, category) values (null, 1, 'Email opened', 'email');

insert into webhook_events (source, external_event_id, payload) values ('meta', 'evt-1', '{}');

reset row_security;

-- ---------------------------------------------------------------- the web app before a tenant is known
set local role app_user;
do $$ begin
  if (select count(*) from forms) <> 0 then raise exception 'T40a forms visible with no tenant'; end if;
  -- T40 a public form finds its institution through the resolver, and only by its exact key
  if (select org_id from app.resolve_form('pk_alpha_website_0000000001')) is distinct from '00000000-0000-0000-0000-00000000000a'
    then raise exception 'T40 resolver did not find the form''s org'; end if;
  if exists (select 1 from app.resolve_form('pk_alpha')) then raise exception 'T40b resolver matched a partial key'; end if;
  -- T41 webhooks: the web app adds verified events (a retry is a no-op) but cannot read them back
  insert into webhook_events (source, external_event_id, payload) values ('meta', 'wamid.1', '{}') on conflict do nothing;
  insert into webhook_events (source, external_event_id, payload) values ('meta', 'wamid.1', '{}') on conflict do nothing;
  begin
    perform count(*) from webhook_events;
    raise exception 'T5 app_user can read raw webhooks';
  exception when insufficient_privilege then null;
  end;
  -- T56 sign-up creates an institution with system roles, the Untouched stage, a draft notice and its admin
  perform app.provision_org('Gamma Institute', 'gamma', '00000000-0000-0000-0000-0000000000c1', 'chitra@gamma.test', 'Chitra');
  if (select count(*) from app.memberships_for_user('00000000-0000-0000-0000-0000000000c1') where data_scope = 'all' and status = 'active') <> 1
    then raise exception 'T56 provisioned admin membership missing'; end if;
  -- T57 only the worker may erase leads or purge audit rows
  if has_function_privilege('app_user', 'app.erase_lead(uuid)', 'execute')
     or has_function_privilege('app_user', 'app.purge_audit(timestamptz)', 'execute')
     or not has_function_privilege('app_worker', 'app.erase_lead(uuid)', 'execute')
    then raise exception 'T57 erase rights are wrong'; end if;
end $$;

-- ---------------------------------------------------------------- tenant Alpha, Asha, scope = all
select set_config('app.org_id', '00000000-0000-0000-0000-00000000000a', true),
       set_config('app.member_id', '00000000-0000-0000-0000-0000000a0001', true),
       set_config('app.scope', 'all', true),
       set_config('app.visible_members', '{}', true);

do $$ begin
  if (select count(*) from leads) <> 2 then raise exception 'T1 tenant isolation: expected 2 Alpha leads, got %', (select count(*) from leads); end if;
  if exists (select 1 from leads where id = '00000000-0000-0000-0000-00000000b001') then raise exception 'T2 Beta lead visible to Alpha'; end if;
  if (select count(*) from orgs) <> 1 then raise exception 'T3 org visibility'; end if;
  if (select count(*) from users) <> 2 then raise exception 'T4 users of other orgs visible: %', (select count(*) from users); end if;
  if (select count(*) from source_touches) <> 2 then raise exception 'T6 touches'; end if;
  -- T51 reference numbers are per institution
  if (select max(ref_no) from leads) <> 2 then raise exception 'T51 Alpha ref numbers are not 1..2'; end if;
  -- T59 fuzzy name search stays inside the tenant
  if (select count(*) from app.search_lead_ids('lead')) <> 2 then raise exception 'T59 search crossed tenants or missed'; end if;
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

-- T38 a row cannot point at another tenant's record (foreign-key checks bypass RLS; composite keys stop it)
do $$ begin
  begin
    insert into lead_owners (lead_id, member_id, org_id, method)
      values ('00000000-0000-0000-0000-00000000a002', '00000000-0000-0000-0000-0000000b0001', '00000000-0000-0000-0000-00000000000a', 'manual');
    raise exception 'T38 Alpha lead assigned to a Beta counsellor';
  exception when foreign_key_violation then null;
  end;
  begin
    update leads set stage_id = '00000000-0000-0000-0000-0000000005b0' where id = '00000000-0000-0000-0000-00000000a002';
    raise exception 'T38b Alpha lead moved to a Beta stage';
  exception when foreign_key_violation then null;
  end;
  -- T53 a sub-stage must belong to the lead's stage
  begin
    update leads set sub_stage_id = '00000000-0000-0000-0000-000000005a11' where id = '00000000-0000-0000-0000-00000000a002';
    raise exception 'T53 sub-stage of another stage accepted';
  exception when foreign_key_violation then null;
  end;
  update leads set stage_id = '00000000-0000-0000-0000-0000000005a1', sub_stage_id = '00000000-0000-0000-0000-000000005a11'
    where id = '00000000-0000-0000-0000-00000000a002';
end $$;

-- T8 emails are stored lower-case; a duplicate email in the same org is rejected (T9: other orgs are fine, see seed)
do $$ begin
  begin
    insert into leads (org_id, name, email, stage_id)
      values ('00000000-0000-0000-0000-00000000000a', 'dup', 'A1@X.TEST', '00000000-0000-0000-0000-0000000005a0');
    raise exception 'T8a mixed-case email stored';
  exception when check_violation then null;
  end;
  begin
    insert into leads (org_id, name, email, stage_id)
      values ('00000000-0000-0000-0000-00000000000a', 'dup', 'a1@x.test', '00000000-0000-0000-0000-0000000005a0');
    raise exception 'T8 duplicate email accepted';
  exception when unique_violation then null;
  end;
end $$;

-- T10 a merged lead frees its email for the surviving record
update leads set merged_into_id = '00000000-0000-0000-0000-00000000a002' where id = '00000000-0000-0000-0000-00000000a001';
insert into leads (org_id, name, email, stage_id)
  values ('00000000-0000-0000-0000-00000000000a', 're-registered', 'a1@x.test', '00000000-0000-0000-0000-0000000005a0');

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
insert into audit_log (org_id, action, entity, entity_id, after)
  values ('00000000-0000-0000-0000-00000000000a', 'lead.update', 'lead', '00000000-0000-0000-0000-00000000a001', '{"email":"a1@x.test"}');
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
insert into automation_versions (automation_id, version, org_id, trigger_type, trigger_config, graph, reentry)
  values ('00000000-0000-0000-0000-0000000a0a01', 1, '00000000-0000-0000-0000-00000000000a', 'lead_created', '{}', '{}', 'once_active');
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
  begin
    insert into automation_runs (org_id, automation_id, automation_version, lead_id, trigger_event_id)
      values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000a0a01', 2, '00000000-0000-0000-0000-00000000a001', 'e3');
    raise exception 'T60 run started on an unpublished version';
  exception when foreign_key_violation then null;
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

-- T24 an SMS template must name its DLT template ID, header and category; T52 the category must fit the header
insert into channel_accounts (id, org_id, type, provider, display_name, dlt_entity_id)
  values ('00000000-0000-0000-0000-0000000ac501', '00000000-0000-0000-0000-00000000000a', 'sms', 'msg91', 'Alpha SMS', '1201160000000000001');
insert into sms_headers (id, org_id, channel_account_id, header, category)
  values ('00000000-0000-0000-0000-0000000a4e01', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000ac501', 'ALPHAC', 'service');
do $$ begin
  begin
    insert into templates (org_id, channel, name, nature, body, dlt_template_id)
      values ('00000000-0000-0000-0000-00000000000a', 'sms', 'no header', 'transactional', 'Hi {#var#}', '1207160000000000001');
    raise exception 'T24 SMS template without header/category accepted';
  exception when check_violation then null;
  end;
  begin
    insert into templates (org_id, channel, name, nature, body, dlt_template_id, sms_header_id, dlt_category)
      values ('00000000-0000-0000-0000-00000000000a', 'sms', 'open day', 'promotional', 'Open day {#var#}', '1207160000000000003',
              '00000000-0000-0000-0000-0000000a4e01', 'promotional');
    raise exception 'T52 promotional template on a service header accepted';
  exception when check_violation then null;
  end;
  insert into templates (org_id, channel, name, nature, body, dlt_template_id, sms_header_id, dlt_category)
    values ('00000000-0000-0000-0000-00000000000a', 'sms', 'fee due', 'transactional', 'Fee due {#var#}', '1207160000000000002',
            '00000000-0000-0000-0000-0000000a4e01', 'service_implicit');
end $$;

-- T25 the same outbound send cannot be queued twice (outbox idempotency)
insert into messages (org_id, lead_id, channel, direction, idempotency_key, body)
  values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000a002', 'sms', 'out', 'bcast-1:lead-a002', 'Fee due');
do $$ begin
  begin
    insert into messages (org_id, lead_id, channel, direction, idempotency_key)
      values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000a002', 'sms', 'out', 'bcast-1:lead-a002');
    raise exception 'T25 duplicate send queued';
  exception when unique_violation then null;
  end;
end $$;

-- T26 refunds need a second person to approve (maker-checker); T27 gateways get an unguessable webhook token;
-- T47 refunds never exceed the payment; T48 no approved refund without an approver
insert into payment_gateways (id, org_id, provider, display_name)
  values ('00000000-0000-0000-0000-0000000a6a01', '00000000-0000-0000-0000-00000000000a', 'razorpay', 'Alpha Razorpay');
insert into payments (id, org_id, lead_id, gateway_id, attempt_ref, amount_paise, status)
  values ('00000000-0000-0000-0000-0000000a9a01', '00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000a002',
          '00000000-0000-0000-0000-0000000a6a01', 'ATT0001', 50000, 'success');
do $$ begin
  begin
    insert into refunds (org_id, payment_id, amount_paise, requested_by_member_id, approved_by_member_id)
      values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000a9a01', 50000,
              '00000000-0000-0000-0000-0000000a0001', '00000000-0000-0000-0000-0000000a0001');
    raise exception 'T26 self-approved refund accepted';
  exception when check_violation then null;
  end;
  if (select length(webhook_token) from payment_gateways where id = '00000000-0000-0000-0000-0000000a6a01') < 32 then
    raise exception 'T27 webhook token missing or short';
  end if;
  insert into refunds (org_id, payment_id, amount_paise, requested_by_member_id)
    values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000a9a01', 30000, '00000000-0000-0000-0000-0000000a0001');
  begin
    insert into refunds (org_id, payment_id, amount_paise, requested_by_member_id)
      values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000a9a01', 30000, '00000000-0000-0000-0000-0000000a0002');
    raise exception 'T47 refunds above the payment accepted';
  exception when check_violation then null;
  end;
  begin
    insert into refunds (org_id, payment_id, amount_paise, requested_by_member_id, status)
      values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-0000000a9a01', 1000, '00000000-0000-0000-0000-0000000a0001', 'approved');
    raise exception 'T48 approved refund without an approver';
  exception when check_violation then null;
  end;
end $$;

-- T28 a suppressed address is unique per org and channel
insert into suppressions (org_id, channel, address, reason) values ('00000000-0000-0000-0000-00000000000a', 'whatsapp', '+919800000002', 'stop_keyword');
do $$ begin
  begin
    insert into suppressions (org_id, channel, address, reason) values ('00000000-0000-0000-0000-00000000000a', 'whatsapp', '+919800000002', 'manual');
    raise exception 'T28 duplicate suppression';
  exception when unique_violation then null;
  end;
end $$;

-- T29 a minor cannot be scored or profiled, even with parental consent (DPDP s.9(3)); T55 a minor always has a consent state
insert into leads (id, org_id, name, mobile_e164, stage_id, is_minor, parental_consent_status)
  values ('00000000-0000-0000-0000-00000000a003', '00000000-0000-0000-0000-00000000000a', 'Minor', '+919800000003',
          '00000000-0000-0000-0000-0000000005a0', true, 'verified');
do $$ begin
  begin
    update leads set score = 50 where id = '00000000-0000-0000-0000-00000000a003';
    raise exception 'T29 minor was scored';
  exception when check_violation then null;
  end;
  begin
    update leads set parental_consent_status = 'not_required' where id = '00000000-0000-0000-0000-00000000a003';
    raise exception 'T55 minor marked as not needing a guardian';
  exception when check_violation then null;
  end;
end $$;

-- T30 users cannot hard-delete leads; T31 nor set the erasure date inside the first year (Rule 8(3))
do $$ begin
  begin
    -- a001 is two years old, so its hold could have passed; the user still has no delete right
    update leads set erase_not_before = now() - interval '1 day' where id = '00000000-0000-0000-0000-00000000a001';
    delete from leads where id = '00000000-0000-0000-0000-00000000a001';
    raise exception 'T30 app_user hard-deleted a lead';
  exception when insufficient_privilege then null;
  end;
  begin
    update leads set restricted_at = now(), erase_not_before = now() where id = '00000000-0000-0000-0000-00000000a002';
    raise exception 'T31 erasure date inside the first year accepted';
  exception when check_violation then null;
  end;
end $$;

-- T32 a WhatsApp number cannot be registered before India storage is set, nor its WABA go live outside INR billing
insert into wa_business_accounts (id, org_id, waba_id, onboarding_state, currency)
  values ('00000000-0000-0000-0000-0000000aab01', '00000000-0000-0000-0000-00000000000a', 'waba-alpha', 'live', 'INR');
do $$ begin
  begin
    insert into channel_accounts (org_id, type, provider, display_name, wa_account_id, onboarding_state, wa_data_region)
      values ('00000000-0000-0000-0000-00000000000a', 'whatsapp', 'meta_cloud', 'WA', '00000000-0000-0000-0000-0000000aab01', 'phone_registered', null);
    raise exception 'T32a number registered without India storage';
  exception when check_violation then null;
  end;
  begin
    insert into wa_business_accounts (org_id, waba_id, onboarding_state, currency)
      values ('00000000-0000-0000-0000-00000000000a', 'waba-usd', 'live', 'USD');
    raise exception 'T32b USD WABA went live';
  exception when check_violation then null;
  end;
end $$;

-- T33 WhatsApp broadcasts retry no sooner than 24 h (error 131049); T34 templates must be classified
insert into channel_accounts (id, org_id, type, provider, display_name, wa_account_id, onboarding_state, wa_data_region)
  values ('00000000-0000-0000-0000-0000000aca01', '00000000-0000-0000-0000-00000000000a', 'whatsapp', 'meta_cloud', 'Alpha WA',
          '00000000-0000-0000-0000-0000000aab01', 'live', 'IN');
insert into templates (id, org_id, channel, name, nature, body, wa_account_id, wa_name, wa_language, wa_category)
  values ('00000000-0000-0000-0000-0000000a7e01', '00000000-0000-0000-0000-00000000000a', 'whatsapp', 'open day', 'promotional',
          'Open day on {{1}}', '00000000-0000-0000-0000-0000000aab01', 'open_day', 'en', 'marketing');
-- T61 the same WhatsApp template name may exist in another language
insert into templates (org_id, channel, name, nature, body, wa_account_id, wa_name, wa_language, wa_category)
  values ('00000000-0000-0000-0000-00000000000a', 'whatsapp', 'open day (hi)', 'promotional',
          'Open day {{1}}', '00000000-0000-0000-0000-0000000aab01', 'open_day', 'hi', 'marketing');
do $$ begin
  begin
    insert into broadcasts (org_id, channel, channel_account_id, template_id, retry_max, retry_interval_h)
      values ('00000000-0000-0000-0000-00000000000a', 'whatsapp', '00000000-0000-0000-0000-0000000aca01',
              '00000000-0000-0000-0000-0000000a7e01', 5, 8);
    raise exception 'T33 WhatsApp retry every 8 h accepted';
  exception when check_violation then null;
  end;
  begin
    insert into templates (org_id, channel, name, subject, body)
      values ('00000000-0000-0000-0000-00000000000a', 'email', 'admissions open', 'Admissions open', 'Apply now');
    raise exception 'T34 unclassified template accepted';
  exception when not_null_violation then null;
  end;
end $$;

-- T35 a call must state its purpose; promotional calls only through the provider, from a 140-series number
do $$ begin
  begin
    insert into calls (org_id, lead_id, direction, via, status)
      values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000a002', 'outbound', 'native_dialer', 'completed');
    raise exception 'T35a call without a purpose accepted';
  exception when not_null_violation then null;
  end;
  begin
    insert into calls (org_id, lead_id, direction, via, purpose, status)
      values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000a002', 'outbound', 'native_dialer', 'promotional', 'completed');
    raise exception 'T35b promotional call from a personal mobile accepted';
  exception when check_violation then null;
  end;
  begin
    insert into calls (org_id, lead_id, direction, via, purpose, caller_id, status)
      values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000a002', 'outbound', 'provider', 'promotional', '+918040001234', 'completed');
    raise exception 'T35c promotional call from a non-140 number accepted';
  exception when check_violation then null;
  end;
end $$;

-- T45 built-in activity types are read-only for tenants
do $$ declare n int; begin
  if not exists (select 1 from activity_types where code = 1) then raise exception 'T45a built-in type not visible'; end if;
  update activity_types set name = 'mine' where code = 1;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'T45 tenant changed a built-in activity type'; end if;
  delete from activity_types where code = 1;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'T45b tenant deleted a built-in activity type'; end if;
end $$;

-- T46 members are deactivated, never deleted; T50 a lead has at most one primary owner; T54 no reporting cycles
do $$ begin
  begin
    delete from members where id = '00000000-0000-0000-0000-0000000a0002';
    raise exception 'T46 member deleted';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into lead_owners (lead_id, member_id, org_id, method, is_primary)
      values ('00000000-0000-0000-0000-00000000a002', '00000000-0000-0000-0000-0000000a0001', '00000000-0000-0000-0000-00000000000a', 'manual', true);
    raise exception 'T50 second primary owner accepted';
  exception when unique_violation then null;
  end;
  update members set reports_to_member_id = '00000000-0000-0000-0000-0000000a0001' where id = '00000000-0000-0000-0000-0000000a0002';
  begin
    update members set reports_to_member_id = '00000000-0000-0000-0000-0000000a0002' where id = '00000000-0000-0000-0000-0000000a0001';
    raise exception 'T54 reporting cycle accepted';
  exception when check_violation then null;
  end;
end $$;

-- T49 a published privacy notice cannot change
insert into notices (id, org_id, version, body, published_at)
  values ('00000000-0000-0000-0000-0000000a0e01', '00000000-0000-0000-0000-00000000000a', 1, 'We use your data to ...', now());
do $$ begin
  begin
    update notices set body = 'We now also ...' where id = '00000000-0000-0000-0000-0000000a0e01';
    raise exception 'T49 published notice edited';
  exception when insufficient_privilege then null;
  end;
end $$;

-- ---------------------------------------------------------------- scope = own: Asha sees only her leads
select set_config('app.scope', 'own', true),
       set_config('app.visible_members', '{00000000-0000-0000-0000-0000000a0001}', true);
do $$ begin
  -- Asha owns a001; a003 and 're-registered' are hers because she created them; a002 is Ravi's
  if (select count(*) from leads where created_by_member_id is null) <> 1 then raise exception 'T18 own scope: expected only a001 of the seeded leads'; end if;
  if exists (select 1 from leads where id = '00000000-0000-0000-0000-00000000a002') then raise exception 'T19 own scope leaks Ravi''s lead'; end if;
  -- T43 records on a hidden lead are hidden too
  if exists (select 1 from messages where lead_id = '00000000-0000-0000-0000-00000000a002') then raise exception 'T43 own scope reads Ravi''s messages'; end if;
  if exists (select 1 from payments where lead_id = '00000000-0000-0000-0000-00000000a002') then raise exception 'T43b own scope reads Ravi''s payments'; end if;
  -- T44 no self-assignment to a hidden lead
  begin
    insert into lead_owners (lead_id, member_id, org_id, method)
      values ('00000000-0000-0000-0000-00000000a002', '00000000-0000-0000-0000-0000000a0001', '00000000-0000-0000-0000-00000000000a', 'manual');
    raise exception 'T44 counsellor assigned herself to a hidden lead';
  exception when insufficient_privilege then null;
  end;
  -- nor writing a note onto it
  begin
    insert into notes (org_id, lead_id, body) values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000a002', 'x');
    raise exception 'T43c note written on a hidden lead';
  exception when insufficient_privilege then null;
  end;
end $$;

-- T42 a counsellor with scope 'own' can add a walk-in lead, see it, and make herself its owner
do $$ declare v uuid; begin
  insert into leads (org_id, name, mobile_e164, stage_id)
    values ('00000000-0000-0000-0000-00000000000a', 'Walk-in', '+919800000009', '00000000-0000-0000-0000-0000000005a0')
    returning id into v;
  insert into lead_owners (lead_id, member_id, org_id, method, is_primary)
    values (v, '00000000-0000-0000-0000-0000000a0001', '00000000-0000-0000-0000-00000000000a', 'manual', true);
end $$;

-- scope = team: Asha manages Ravi
select set_config('app.scope', 'team', true),
       set_config('app.visible_members', '{00000000-0000-0000-0000-0000000a0001,00000000-0000-0000-0000-0000000a0002}', true);
do $$ begin
  if (select count(*) from leads where created_by_member_id is null) <> 2 then raise exception 'T20 team scope: expected a001 and a002'; end if;
end $$;

-- no tenant set at all: nothing is visible
select set_config('app.org_id', '', true);
do $$ begin
  if (select count(*) from leads) <> 0 or (select count(*) from members) <> 0 then raise exception 'T21 data visible without a tenant'; end if;
end $$;

reset role;

-- ---------------------------------------------------------------- worker: reads raw webhooks; erasure
set local role app_worker;
select set_config('app.org_id', '00000000-0000-0000-0000-00000000000a', true), set_config('app.scope', 'all', true),
       set_config('app.member_id', '', true);
do $$ begin
  if (select count(*) from webhook_events) <> 2 then raise exception 'T22 worker cannot read webhooks'; end if;
  -- T36 even the worker cannot delete a lead
  begin
    delete from leads where id = '00000000-0000-0000-0000-00000000a001';
    raise exception 'T36 worker deleted a lead';
  exception when insufficient_privilege then null;
  end;
  -- T39 erasure waits for the retention hold
  begin
    perform app.erase_lead('00000000-0000-0000-0000-00000000a001');
    raise exception 'T39 lead erased inside its retention hold';
  exception when insufficient_privilege then null;
  end;
end $$;
-- T23 after the hold, erasure anonymises the lead and scrubs click ids from its locked touches;
-- T37 the consent proof and the audit certificate stay
update leads set restricted_at = now() - interval '1 year', erase_not_before = now() - interval '1 day'
  where id = '00000000-0000-0000-0000-00000000a001';
select app.erase_lead('00000000-0000-0000-0000-00000000a001');
do $$ begin
  if exists (select 1 from leads where id = '00000000-0000-0000-0000-00000000a001' and (email is not null or name is not null or erased_at is null))
    then raise exception 'T23 lead not anonymised'; end if;
  if exists (select 1 from source_touches where lead_id = '00000000-0000-0000-0000-00000000a001' and gclid is not null)
    then raise exception 'T23b click id survived erasure'; end if;
  if not exists (select 1 from source_touches where lead_id = '00000000-0000-0000-0000-00000000a001' and position = 'first' and channel = 'organic')
    then raise exception 'T23c attribution lost on erasure'; end if;
  if not exists (select 1 from consents where subject_hash = 'hmac-a1') then raise exception 'T37 consent proof lost on erasure'; end if;
  if exists (select 1 from audit_log where entity_id = '00000000-0000-0000-0000-00000000a001' and after ? 'email')
    then raise exception 'T37b old values left in the audit log'; end if;
  if not exists (select 1 from audit_log where action = 'lead.erased') then raise exception 'T37c no erasure certificate'; end if;
end $$;
reset role;

-- ---------------------------------------------------------------- Beta has its own reference numbers
set local role app_user;
select set_config('app.org_id', '00000000-0000-0000-0000-00000000000b', true), set_config('app.scope', 'all', true),
       set_config('app.member_id', '00000000-0000-0000-0000-0000000b0001', true);
do $$ begin
  if (select ref_no from leads where id = '00000000-0000-0000-0000-00000000b001') <> 1 then raise exception 'T51b Beta ref numbers are not per org'; end if;
end $$;
reset role;

rollback;
\echo 'schema tests: all passed'
