-- Schema for the education CRM (multi-tenant). Postgres 15+.
-- Read replica/architecture.md first. Conventions:
--   * every tenant table has org_id; row level security (RLS) keeps tenants apart
--   * ids are uuid; times are timestamptz (UTC); money is integer paise + currency
--   * statuses are text + check constraints (easy to extend in a migration)
--   * the app connects as role app_user (no BYPASSRLS) and, per transaction, sets
--       app.org_id, app.member_id, app.scope ('own' | 'team' | 'all'), app.visible_members ('{uuid,...}')
--     with set_config(..., true). Background jobs run as app_worker with the same settings
--     for the tenant they are working on. Only migrations run as the owner.

create extension if not exists citext;
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create schema if not exists app;

-- ---------------------------------------------------------------- helpers

create or replace function app.current_org() returns uuid
language sql stable as $$ select nullif(current_setting('app.org_id', true), '')::uuid $$;

create or replace function app.current_member() returns uuid
language sql stable as $$ select nullif(current_setting('app.member_id', true), '')::uuid $$;

create or replace function app.current_scope() returns text
language sql stable as $$ select coalesce(nullif(current_setting('app.scope', true), ''), 'own') $$;

create or replace function app.visible_members() returns uuid[]
language sql stable as $$ select coalesce(nullif(current_setting('app.visible_members', true), ''), '{}')::uuid[] $$;

create or replace function app.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at := now(); return new; end $$;

-- ---------------------------------------------------------------- tenancy, people, access

create table orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug citext not null unique,
  plan text not null default 'trial' check (plan in ('trial','starter','growth','enterprise')),
  status text not null default 'active' check (status in ('active','suspended','closed')),
  timezone text not null default 'Asia/Kolkata',
  -- unique_mobile, lead_verification, retention_days, business_hours, ... (validated in the app)
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- global identities (one person can belong to several orgs, e.g. our support staff)
create table users (
  id uuid primary key,                       -- = auth provider user id
  email citext not null unique,
  name text not null,
  mobile_e164 text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table campuses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  parent_campus_id uuid references campuses(id) on delete set null,
  name text not null,
  city text,
  is_head_office boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, name)
);
create index on campuses (org_id);

create table roles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null,
  is_system boolean not null default false,  -- admin, manager, counsellor, support (seeded per org)
  -- {"leads": ["view","edit","download","manage"], "settings.fields": ["view","add"], ...}
  permissions jsonb not null default '{}',
  data_scope text not null default 'own' check (data_scope in ('own','team','all')),
  mask_contacts boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, name)
);
create index on roles (org_id);

create table members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  user_id uuid not null references users(id) on delete restrict,
  role_id uuid not null references roles(id) on delete restrict,
  status text not null default 'invited' check (status in ('invited','active','inactive')),
  reports_to_member_id uuid references members(id) on delete set null,
  attributes jsonb not null default '{}',    -- programmes, region, languages: used for routing
  daily_lead_quota int check (daily_lead_quota >= 0),
  weekly_lead_quota int check (weekly_lead_quota >= 0),
  checked_in_at timestamptz,
  checked_out_at timestamptz,
  auto_checkout_time time,                   -- local time in org timezone; null = midnight
  prefs jsonb not null default '{}',         -- quick filters, list columns, notification choices
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, user_id)
);
create index on members (org_id, status);
create index on members (user_id);
create index on members (role_id);
create index on members (reports_to_member_id);

create table teams (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  parent_team_id uuid references teams(id) on delete set null,
  name text not null,
  manager_member_id uuid references members(id) on delete set null,
  campus_id uuid references campuses(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, name)
);
create index on teams (org_id);
create index on teams (parent_team_id);

create table team_members (
  team_id uuid not null references teams(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  org_id uuid not null references orgs(id) on delete cascade,
  primary key (team_id, member_id)
);
create index on team_members (member_id);
create index on team_members (org_id);

-- ---------------------------------------------------------------- configuration: fields, picklists, stages

create table picklists (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  title text not null,
  machine_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, machine_key)
);

create table picklist_values (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  picklist_id uuid not null references picklists(id) on delete cascade,
  parent_value_id uuid references picklist_values(id) on delete cascade,  -- course > programme > specialisation
  title text not null check (length(title) <= 250),
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on picklist_values (picklist_id, parent_value_id, sort_order);
create index on picklist_values (org_id);

create table field_defs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  entity text not null check (entity in ('lead','opportunity')),
  key text not null check (key ~ '^[a-z][a-z0-9_]{0,62}$'),
  label text not null,
  type text not null check (type in ('text','paragraph','number','email','mobile','date','dropdown','multiselect','upload')),
  section text not null default 'details',
  picklist_id uuid references picklists(id) on delete restrict,
  required boolean not null default false,
  hidden boolean not null default false,
  quick_add text not null default 'show' check (quick_add in ('show','hide','mandatory')),
  sensitivity text not null default 'none' check (sensitivity in ('none','personal','health')),
  validation jsonb not null default '{}',     -- min/max length, pattern, error message
  position int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, entity, key),
  check (type not in ('dropdown','multiselect') or picklist_id is not null)
);

create table stages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  entity text not null default 'lead' check (entity in ('lead','opportunity')),
  name text not null,
  sort_order int not null default 0,
  enabled boolean not null default true,
  is_untouched boolean not null default false, -- the default stage of a new lead
  follow_up_required boolean not null default false,
  sub_stage_required boolean not null default false,
  score_delta smallint not null default 0 check (score_delta between -10 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, entity, name)
);
create unique index stages_one_untouched on stages (org_id, entity) where is_untouched;

create table sub_stages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  stage_id uuid not null references stages(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  enabled boolean not null default true,
  unique (stage_id, name)
);
create index on sub_stages (org_id);

create table stage_rules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  stage_ids uuid[] not null,
  effect text not null check (effect in ('lock','only_users','no_move_down','lock_follow_up','no_remarks','remark_required','no_messages')),
  member_ids uuid[] not null default '{}',   -- "performed by": empty = everyone
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on stage_rules (org_id);

-- ---------------------------------------------------------------- capture sources: forms, publishers

create table publishers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null,
  tracking_code text not null unique,
  api_key_hash text,                          -- sha256 of the key; key shown once
  daily_cap int check (daily_cap >= 0),
  min_verification_rate numeric(5,2) check (min_verification_rate between 0 and 100),
  portal_enabled boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, name)
);

create table publisher_costs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  publisher_id uuid not null references publishers(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  amount_paise bigint not null check (amount_paise >= 0),
  currency char(3) not null default 'INR',
  check (period_end >= period_start)
);
create index on publisher_costs (publisher_id, period_start);
create index on publisher_costs (org_id);

create table forms (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null,
  public_key text not null unique,            -- used in the embed URL
  fields jsonb not null default '[]',         -- ordered [{key, required, label_override}]
  capture_tracking boolean not null default true,
  success_message text,
  redirect_url text,
  default_source jsonb not null default '{}', -- e.g. {"source":"website","medium":"form"}
  publisher_id uuid references publishers(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on forms (org_id);

-- ---------------------------------------------------------------- leads

create table leads (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  ref_no bigint generated always as identity unique,   -- short number shown to users
  name text,
  email citext,
  mobile_e164 text check (mobile_e164 ~ '^\+[1-9][0-9]{6,14}$'),
  alt_mobiles text[] not null default '{}',
  date_of_birth date,
  is_minor boolean,                              -- under 18: DPDP s.9 needs verified parental consent
  guardian jsonb,                                -- {name, relation, email, mobile}
  parental_consent_status text not null default 'not_required'
    check (parental_consent_status in ('not_required','pending','verified','refused')),
  state text,
  city text,
  campus_id uuid references campuses(id) on delete set null,
  course_value_id uuid references picklist_values(id) on delete set null,
  stage_id uuid not null references stages(id) on delete restrict,
  sub_stage_id uuid references sub_stages(id) on delete set null,
  first_stage_id uuid references stages(id) on delete set null,
  previous_stage_id uuid references stages(id) on delete set null,
  stage_changed_at timestamptz,
  stage_change_count int not null default 0,
  remark text,
  next_follow_up_at timestamptz,
  email_verified_at timestamptz,
  mobile_verified_at timestamptz,
  score int not null default 0,
  score_percentile numeric(5,2),
  untouched boolean not null default true,
  first_touched_at timestamptz,
  registration_attempts int not null default 1,
  last_attempt_at timestamptz not null default now(),
  application_status text not null default 'none' check (application_status in ('none','started','submitted')),
  application_started_at timestamptz,
  application_submitted_at timestamptz,
  payment_approved_at timestamptz,
  token_fee_paid_at timestamptz,
  merged_into_id uuid references leads(id) on delete set null,
  custom jsonb not null default '{}',
  deleted_at timestamptz,                        -- soft delete; erasure job hard-deletes later
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (email is not null or mobile_e164 is not null),
  check (merged_into_id is null or merged_into_id <> id)
);
-- email is the duplicate key (one live lead per email per org)
create unique index leads_email_live on leads (org_id, email)
  where email is not null and merged_into_id is null and deleted_at is null;
create index on leads (org_id, mobile_e164) where mobile_e164 is not null;
create index on leads (org_id, created_at desc);
create index on leads (org_id, stage_id);
create index on leads (org_id, next_follow_up_at) where next_follow_up_at is not null;
create index on leads (org_id) where untouched and deleted_at is null;
create index on leads (campus_id);
create index on leads (course_value_id);
create index on leads (merged_into_id) where merged_into_id is not null;
create index leads_name_trgm on leads using gin (name gin_trgm_ops);
create index leads_custom_gin on leads using gin (custom jsonb_path_ops);

create table lead_owners (
  lead_id uuid not null references leads(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  org_id uuid not null references orgs(id) on delete cascade,
  is_primary boolean not null default true,
  method text not null check (method in ('manual','automation','import','api','telephony','round_robin')),
  assigned_by_member_id uuid references members(id) on delete set null,
  assigned_at timestamptz not null default now(),
  primary key (lead_id, member_id)
);
create index on lead_owners (member_id, assigned_at desc);
create index on lead_owners (org_id);

-- first / second / third source are written once and never changed; latest is overwritten
create table source_touches (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  position text not null check (position in ('first','second','third','latest')),
  origin text not null check (origin in ('offline','online','api','telephony','form','chat')),
  channel text not null check (channel in ('direct','publisher','social','organic','referral','other','telephony','offline','paid_ads','chat')),
  source text,
  medium text,
  campaign text,
  utm jsonb not null default '{}',            -- campaignid, adgroupid, creativeid, keyword, matchtype, network, device, placement
  gclid text,
  fbclid text,
  fb_lead_id text,
  referrer text,
  landing_url text,
  form_id uuid references forms(id) on delete set null,
  publisher_id uuid references publishers(id) on delete set null,
  registered_at timestamptz not null default now(),
  unique (lead_id, position)
);
create index on source_touches (org_id, channel, source, registered_at);
create index on source_touches (publisher_id) where publisher_id is not null;
create index on source_touches (form_id) where form_id is not null;

create or replace function app.lock_early_touches() returns trigger
language plpgsql as $$
begin
  if old.position in ('first','second','third') then
    raise exception 'source touch % of lead % is locked', old.position, old.lead_id using errcode = '42501';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end $$;
create trigger source_touches_locked before update on source_touches
  for each row execute function app.lock_early_touches();
-- deletes are allowed only through the lead cascade (erasure), not row by row:
create trigger source_touches_no_delete before delete on source_touches
  for each row when (pg_trigger_depth() = 0) execute function app.lock_early_touches();

-- every capture attempt, kept for audit, replay and idempotency
create table capture_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  lead_id uuid references leads(id) on delete set null,
  origin text not null,
  idempotency_key text,
  payload jsonb not null,
  outcome text not null default 'pending' check (outcome in ('pending','created','updated','rejected','failed')),
  error text,
  received_at timestamptz not null default now(),
  unique (org_id, idempotency_key)
);
create index on capture_events (org_id, received_at desc);
create index on capture_events (lead_id);

-- ---------------------------------------------------------------- opportunities

create table opportunity_lists (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null,
  key_fields text[] not null default '{}',    -- duplicate check on these opportunity fields
  team_ids uuid[] not null default '{}',      -- empty = visible to all teams
  routing_rules jsonb not null default '[]',  -- which enquiries create an opportunity here
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, name)
);

create table opportunities (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  list_id uuid not null references opportunity_lists(id) on delete restrict,
  stage_id uuid references stages(id) on delete restrict,
  owner_member_id uuid references members(id) on delete set null,
  status text not null default 'open' check (status in ('open','won','lost')),
  key_hash text not null,                      -- hash of key_fields values, computed by the app
  custom jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (list_id, lead_id, key_hash)
);
create index on opportunities (org_id, list_id, stage_id);
create index on opportunities (lead_id);
create index on opportunities (owner_member_id);

-- ---------------------------------------------------------------- timeline: activities, notes, follow-ups, calls

create table activity_types (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references orgs(id) on delete cascade, -- null = built-in type
  code int not null,
  name text not null,
  category text not null,
  custom_fields jsonb not null default '[]',
  counts_for_score smallint not null default 0,
  unique nulls not distinct (org_id, code)
);

create table activities (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  lead_id uuid references leads(id) on delete cascade,
  opportunity_id uuid references opportunities(id) on delete cascade,
  type_code int not null,
  actor_member_id uuid references members(id) on delete set null,
  summary text not null,
  payload jsonb not null default '{}',
  occurred_at timestamptz not null default now(),
  check (lead_id is not null or opportunity_id is not null)
);
create index on activities (lead_id, occurred_at desc);
create index on activities (opportunity_id, occurred_at desc) where opportunity_id is not null;
create index on activities (org_id, occurred_at desc);
create index on activities (org_id, type_code, occurred_at desc);
create index on activities (actor_member_id);

create table notes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  opportunity_id uuid references opportunities(id) on delete cascade,
  author_member_id uuid references members(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on notes (lead_id, created_at desc);
create index on notes (org_id);
create index on notes (opportunity_id) where opportunity_id is not null;
create index on notes (author_member_id);

create table event_types (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null,
  form_fields jsonb not null default '[]',
  allowed_role_ids uuid[] not null default '{}',
  unique (org_id, name)
);

create table follow_ups (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  lead_id uuid references leads(id) on delete cascade,
  opportunity_id uuid references opportunities(id) on delete cascade,
  event_type_id uuid references event_types(id) on delete set null,
  owner_member_id uuid not null references members(id) on delete cascade,
  organiser_member_id uuid references members(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  timezone text not null default 'Asia/Kolkata',
  status text not null default 'upcoming' check (status in ('upcoming','done','cancelled')),
  outcome text,
  reminder_minutes int[] not null default '{15}',
  remind_by_email boolean not null default false,
  completed_at timestamptz,
  custom jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at),
  check (lead_id is not null or opportunity_id is not null)
);
-- "overdue" is derived: status = 'upcoming' and starts_at < now()
create index on follow_ups (owner_member_id, status, starts_at);
create index on follow_ups (lead_id, starts_at desc);
create index on follow_ups (opportunity_id) where opportunity_id is not null;
create index on follow_ups (org_id, starts_at);
create index on follow_ups (event_type_id);


-- ---------------------------------------------------------------- messaging: channels, templates, messages, consent

-- secrets are envelope-encrypted by the app (KMS data key); the database never sees plaintext
create table secrets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  purpose text not null,                       -- 'whatsapp_token', 'gateway_key_secret', ...
  ciphertext bytea not null,
  key_version int not null,
  created_at timestamptz not null default now(),
  rotated_at timestamptz
);
create index on secrets (org_id);

create table channel_accounts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  type text not null check (type in ('whatsapp','sms','email','telephony')),
  provider text not null,                     -- 'meta_cloud', 'msg91', 'ses', 'exotel', ...
  display_name text not null,
  status text not null default 'pending' check (status in ('pending','connected','restricted','disconnected','reconnect_required')),
  onboarding_state text,                      -- WhatsApp: code_received > token_exchanged > waba_subscribed > phone_registered > payment_method_pending > live
  webhook_token text unique default encode(gen_random_bytes(18), 'hex'),  -- unguessable path segment for provider callbacks
  config jsonb not null default '{}',         -- non-secret settings
  secret_id uuid references secrets(id) on delete set null,
  -- WhatsApp
  wa_business_account_id text,
  wa_phone_number_id text unique,
  wa_display_phone text,
  wa_quality text,                            -- as reported by Meta
  wa_messaging_limit text,                    -- as reported by Meta, e.g. TIER_250
  wa_data_region text,                        -- must be 'IN' before the number is registered
  wa_currency char(3),                        -- WABA billing currency; India customers must be INR from 2027
  -- SMS (India DLT)
  dlt_entity_id text,
  sms_header text,
  -- email
  sending_domain citext,
  domain_verified_at timestamptz,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on channel_accounts (org_id, type);
create unique index channel_accounts_one_default on channel_accounts (org_id, type) where is_default;

create table calls (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  lead_id uuid references leads(id) on delete set null,
  opportunity_id uuid references opportunities(id) on delete set null,
  member_id uuid references members(id) on delete set null,
  direction text not null check (direction in ('outbound','inbound')),
  via text not null check (via in ('native_dialer','provider','manual_log')),
  purpose text not null default 'service' check (purpose in ('promotional','service','transactional')),
  channel_account_id uuid references channel_accounts(id) on delete set null,
  caller_id text,                               -- 140-series for promotional, 160-series for service
  status text not null check (status in ('initiated','ringing','connected','completed','missed','no_answer','busy','failed')),
  outcome text,
  provider text,
  provider_call_id text,
  virtual_number text,
  started_at timestamptz not null default now(),
  duration_s int check (duration_s >= 0),
  recording_url text,
  created_at timestamptz not null default now(),
  unique (provider, provider_call_id)
);
create index on calls (lead_id, started_at desc);
create index on calls (member_id, started_at desc);
create index on calls (org_id, started_at desc);
create index on calls (channel_account_id);

-- which provider identity (agent number, agent id) each counsellor uses
create table telephony_agents (
  member_id uuid not null references members(id) on delete cascade,
  channel_account_id uuid not null references channel_accounts(id) on delete cascade,
  org_id uuid not null references orgs(id) on delete cascade,
  agent_ref text not null,
  primary key (member_id, channel_account_id)
);
create index on telephony_agents (org_id);
create index on telephony_agents (channel_account_id);

create table sms_headers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  channel_account_id uuid not null references channel_accounts(id) on delete cascade,
  header text not null,                        -- registered sender ID (DLT)
  category text not null check (category in ('promotional','service','transactional','government')),
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  unique (channel_account_id, header)
);
create index on sms_headers (org_id);

create table templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  channel text not null check (channel in ('email','sms','whatsapp')),
  channel_account_id uuid references channel_accounts(id) on delete set null,
  name text not null,
  nature text not null default 'transactional' check (nature in ('transactional','promotional')),
  applies_to text not null default 'lead' check (applies_to in ('lead','opportunity','payment')),
  subject text,
  body text not null,
  variables jsonb not null default '[]',      -- token -> field mapping
  attachments jsonb not null default '[]',    -- storage paths, max 5 MB each (checked in the app)
  allowed_member_ids uuid[] not null default '{}',
  -- WhatsApp (mirrors Meta's template record)
  wa_name text,
  wa_language text,
  wa_category text check (wa_category in ('marketing','utility','authentication')),
  wa_status text,                             -- Meta's value, synced from webhooks
  wa_quality text,
  wa_rejection_reason text,
  wa_components jsonb,
  -- SMS (India DLT): one template is bound to one header; text must match the registered text
  dlt_template_id text,
  sms_header_id uuid references sms_headers(id) on delete restrict,
  dlt_category text check (dlt_category in ('promotional','service_implicit','service_explicit','transactional')),
  whitelisted_url_prefixes text[] not null default '{}',
  provider_template_ref text,                  -- e.g. MSG91 flow_id
  sms_encoding text check (sms_encoding in ('gsm7','unicode')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, channel, name),
  check (channel <> 'whatsapp' or (wa_name is not null and wa_language is not null and wa_category is not null)),
  check (channel <> 'sms' or (dlt_template_id is not null and sms_header_id is not null and dlt_category is not null))
);
create index on templates (channel_account_id);
create index on templates (sms_header_id);

-- versioned privacy notices per tenant (DPDP s.5 / Rule 3); a consent points at the notice it was given under
create table notices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  version int not null,
  language text not null default 'en',
  body text not null,
  data_items jsonb not null default '[]',
  purposes jsonb not null default '[]',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (org_id, version, language)
);

create table consents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  channel text not null check (channel in ('whatsapp','sms','email','call','all')),
  purpose text not null check (purpose in ('marketing','service','data_processing')),
  status text not null check (status in ('granted','withdrawn')),
  given_by text not null default 'self' check (given_by in ('self','guardian')),
  method text not null,                        -- 'form_checkbox', 'whatsapp_reply_stop', 'guardian_otp', ...
  notice_id uuid references notices(id) on delete restrict,
  evidence jsonb not null default '{}',        -- ip, device, message id, how the guardian was verified, ...
  recorded_by_member_id uuid references members(id) on delete set null,
  recorded_at timestamptz not null default now()
);
-- current consent = latest row per (lead, channel, purpose)
create index on consents (lead_id, channel, purpose, recorded_at desc);
create index on consents (org_id);
create index on consents (notice_id);

-- addresses that must never be messaged on a channel (hard bounce, complaint, STOP, erasure)
create table suppressions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  channel text not null check (channel in ('email','sms','whatsapp','call')),
  address text not null,                       -- normalised email or E.164 number
  reason text not null check (reason in ('hard_bounce','complaint','unsubscribe','stop_keyword','manual','erasure')),
  created_at timestamptz not null default now(),
  unique (org_id, channel, address)
);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  channel_account_id uuid not null references channel_accounts(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued','picked','resolved')),
  assignee_member_id uuid references members(id) on delete set null,
  reopened_count int not null default 0,
  last_inbound_at timestamptz,
  service_window_ends_at timestamptz,          -- last_inbound_at + 24 h (WhatsApp)
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index conversations_one_open on conversations (channel_account_id, lead_id) where status <> 'resolved';
create index on conversations (org_id, status, last_inbound_at desc);
create index on conversations (assignee_member_id, status);
create index on conversations (lead_id);

create table saved_filters (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  owner_member_id uuid references members(id) on delete cascade,
  entity text not null check (entity in ('lead','opportunity','activity','payment')),
  name text not null,
  conditions jsonb not null,                   -- {"op":"and","rules":[...]} validated by the app
  shared boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on saved_filters (org_id, entity);
create index on saved_filters (owner_member_id);

create table broadcasts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  channel text not null check (channel in ('email','sms','whatsapp')),
  channel_account_id uuid not null references channel_accounts(id) on delete restrict,
  template_id uuid not null references templates(id) on delete restrict,
  saved_filter_id uuid references saved_filters(id) on delete set null,
  audience_size int,
  scheduled_at timestamptz,
  status text not null default 'draft' check (status in ('draft','scheduled','sending','done','failed','cancelled')),
  retry_max smallint not null default 0 check (retry_max between 0 and 5),
  retry_interval_h smallint not null default 24 check (retry_interval_h between 8 and 48),
  counts jsonb not null default '{}',
  created_by_member_id uuid references members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on broadcasts (org_id, status, scheduled_at);
create index on broadcasts (template_id);
create index on broadcasts (channel_account_id);
create index on broadcasts (saved_filter_id);

create table automations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null,
  trigger_type text not null check (trigger_type in (
    'lead_created','lead_updated','stage_changed','field_changed','application_status_changed',
    'payment_succeeded','activity_recorded','opportunity_created','date_field','interval')),
  trigger_config jsonb not null default '{}',
  graph jsonb not null,                          -- nodes + edges, validated by the app
  version int not null default 1,
  reentry text not null default 'once_active' check (reentry in ('once_ever','once_active','always')),
  active boolean not null default false,
  created_by_member_id uuid references members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on automations (org_id, trigger_type) where active;

create table automation_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  automation_id uuid not null references automations(id) on delete cascade,
  automation_version int not null,
  lead_id uuid references leads(id) on delete cascade,
  opportunity_id uuid references opportunities(id) on delete cascade,
  status text not null default 'running' check (status in ('running','waiting','done','failed','cancelled')),
  current_node text,
  next_run_at timestamptz,
  trigger_event_id text not null,               -- idempotency: one run per trigger event
  error text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  unique (automation_id, trigger_event_id)
);
-- re-entry 'once_active': at most one live run per lead per automation
create unique index automation_runs_one_live on automation_runs (automation_id, lead_id) where status in ('running','waiting');
create index on automation_runs (org_id, status, next_run_at);
create index on automation_runs (lead_id);

create table automation_steps (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  run_id uuid not null references automation_runs(id) on delete cascade,
  node_id text not null,
  status text not null check (status in ('done','skipped','failed')),
  output jsonb not null default '{}',
  at timestamptz not null default now()
);
create index on automation_steps (run_id);
create index on automation_steps (org_id, node_id, status);

create table messages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  lead_id uuid references leads(id) on delete set null,
  channel text not null check (channel in ('email','sms','whatsapp')),
  direction text not null check (direction in ('out','in')),
  channel_account_id uuid references channel_accounts(id) on delete set null,
  template_id uuid references templates(id) on delete set null,
  conversation_id uuid references conversations(id) on delete set null,
  broadcast_id uuid references broadcasts(id) on delete set null,
  automation_run_id uuid references automation_runs(id) on delete set null,
  sent_by_member_id uuid references members(id) on delete set null,
  to_address text,
  body text,
  media jsonb not null default '[]',
  status text not null default 'queued' check (status in ('queued','sent','delivered','read','failed','bounced','received','skipped_opt_out')),
  error_code text,
  provider_message_id text,
  idempotency_key text,                         -- written before the provider call (outbox)
  pricing jsonb,                                -- WhatsApp pricing object from status webhooks
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (channel_account_id, provider_message_id),
  unique (org_id, idempotency_key)
);
create index on messages (lead_id, created_at desc);
create index on messages (org_id, created_at desc);
create index on messages (conversation_id, created_at) where conversation_id is not null;
create index on messages (broadcast_id) where broadcast_id is not null;
create index on messages (automation_run_id) where automation_run_id is not null;
create index on messages (template_id);

create table broadcast_recipients (
  broadcast_id uuid not null references broadcasts(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  org_id uuid not null references orgs(id) on delete cascade,
  message_id uuid references messages(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','sent','failed','skipped')),
  attempts smallint not null default 0,
  next_retry_at timestamptz,
  primary key (broadcast_id, lead_id)
);
create index on broadcast_recipients (org_id, status, next_retry_at);

-- ---------------------------------------------------------------- payments (each org's own gateway account)

create table payment_gateways (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  provider text not null,                       -- 'razorpay', 'payu', 'ccavenue', 'easebuzz', ...
  mode text not null default 'test' check (mode in ('test','live')),
  display_name text not null,
  merchant_id text,
  auth_type text not null default 'keys' check (auth_type in ('keys','oauth','external_link')),
  secret_id uuid references secrets(id) on delete set null,          -- keys, or OAuth access+refresh tokens
  webhook_secret_id uuid references secrets(id) on delete set null,
  webhook_token text not null unique default encode(gen_random_bytes(18), 'hex'),  -- /webhooks/pay/{provider}/{token}
  token_expires_at timestamptz,                 -- OAuth access token (Razorpay: 90 days)
  refresh_expires_at timestamptz,               -- OAuth refresh token (Razorpay: 180 days)
  external_url text,                            -- bank portal link (SBI Collect, ICICI Eazypay)
  capabilities jsonb not null default '{}',
  status text not null default 'pending' check (status in ('pending','connected','disabled','reconnect_required')),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on payment_gateways (org_id);
create unique index payment_gateways_one_default on payment_gateways (org_id) where is_default;

create table payment_products (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('application_fee','token_fee','other')),
  amount_paise bigint not null check (amount_paise > 0),
  currency char(3) not null default 'INR',
  programme_value_id uuid references picklist_values(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, name)
);
create index on payment_products (programme_value_id);

create table payment_links (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  product_id uuid not null references payment_products(id) on delete restrict,
  gateway_id uuid not null references payment_gateways(id) on delete restrict,
  amount_paise bigint not null check (amount_paise > 0),
  currency char(3) not null default 'INR',
  short_code text not null unique,
  status text not null default 'active' check (status in ('active','paid','expired','cancelled')),
  expires_at timestamptz,
  sent_via text[] not null default '{}',
  provider_link_id text,
  created_by_member_id uuid references members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on payment_links (lead_id);
create index on payment_links (org_id, status);
create index on payment_links (product_id);
create index on payment_links (gateway_id);

create table payments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete restrict,
  product_id uuid references payment_products(id) on delete set null,
  link_id uuid references payment_links(id) on delete set null,
  gateway_id uuid references payment_gateways(id) on delete set null,
  attempt_ref text unique,                      -- our txnid, new for every attempt (null for offline)
  provider_order_id text,
  provider_payment_id text,
  method text,                                  -- upi, card, netbanking, wallet, cash, cheque, dd, ...
  status text not null default 'created' check (status in (
    'created','pending','success','failed','expired','cancelled','unknown','refunded','partially_refunded')),
  gateway_status text,                          -- the gateway's own word, kept for audit
  amount_sent text,                             -- exact amount string sent (PayU/Easebuzz hashes include it)
  amount_paise bigint not null check (amount_paise >= 0),
  refunded_paise bigint not null default 0 check (refunded_paise >= 0),
  currency char(3) not null default 'INR',
  offline_mode text check (offline_mode in ('cash','cheque','dd','neft','other')),
  offline_reference text,
  approved_by_member_id uuid references members(id) on delete set null,
  approved_at timestamptz,
  paid_at timestamptz,
  raw jsonb not null default '{}',              -- last provider payload (no card data ever)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gateway_id, provider_payment_id),
  check (refunded_paise <= amount_paise),
  check ((gateway_id is null) = (offline_mode is not null))   -- online xor offline
);
create index on payments (lead_id);
create index on payments (org_id, status, created_at desc);
create index on payments (link_id);
create index on payments (product_id);

create table refunds (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  payment_id uuid not null references payments(id) on delete restrict,
  refund_ref text not null unique,              -- our id, sent to the gateway for idempotency
  amount_paise bigint not null check (amount_paise > 0),
  reason text,
  status text not null default 'requested' check (status in ('requested','approved','pending','refunded','failed','rejected')),
  requested_by_member_id uuid references members(id) on delete set null,
  approved_by_member_id uuid references members(id) on delete set null,   -- maker-checker
  provider_refund_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (approved_by_member_id is null or approved_by_member_id <> requested_by_member_id)
);
create index on refunds (payment_id);
create index on refunds (org_id, status);

-- ---------------------------------------------------------------- inbound webhooks (all providers), outbound webhooks, API keys

create table webhook_events (
  id uuid primary key default gen_random_uuid(),
  source text not null,                          -- 'meta', 'razorpay', 'msg91', 'ses', 'exotel', ...
  external_event_id text not null,               -- provider event id, or a hash of the body
  org_id uuid references orgs(id) on delete cascade,   -- resolved after routing
  signature_valid boolean not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error text,
  unique (source, external_event_id)
);
create index on webhook_events (processed_at) where processed_at is null;
create index on webhook_events (org_id, received_at desc);

create table api_keys (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null,
  key_prefix text not null unique,
  key_hash text not null,
  scopes text[] not null default '{leads:write}',
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_by_member_id uuid references members(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on api_keys (org_id);

create table webhook_endpoints (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  url text not null check (url ~ '^https://'),
  events text[] not null,
  secret_id uuid references secrets(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on webhook_endpoints (org_id) where active;

create table webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  endpoint_id uuid not null references webhook_endpoints(id) on delete cascade,
  event text not null,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending','delivered','failed','dead')),
  attempts smallint not null default 0,
  next_attempt_at timestamptz not null default now(),
  last_response_code int,
  created_at timestamptz not null default now()
);
create index on webhook_deliveries (status, next_attempt_at) where status in ('pending','failed');
create index on webhook_deliveries (endpoint_id);
create index on webhook_deliveries (org_id);

-- ---------------------------------------------------------------- jobs, notifications, tickets, audit, data requests

create table jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  kind text not null check (kind in ('lead_import','opportunity_import','bulk_update','bulk_delete','bulk_reassign','export','erasure')),
  status text not null default 'queued' check (status in ('queued','running','done','failed','cancelled')),
  input jsonb not null default '{}',             -- file path, column mapping, filter, ...
  totals jsonb not null default '{}',            -- requested, created, updated, failed
  errors_path text,                              -- storage path of the error report
  created_by_member_id uuid references members(id) on delete set null,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create index on jobs (org_id, created_at desc);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  event text not null,                           -- 'lead_assigned', 'whatsapp_received', 'payment_started', ...
  lead_id uuid references leads(id) on delete cascade,
  title text not null,
  body text,
  read_at timestamptz,
  acted_at timestamptz,
  created_at timestamptz not null default now()
);
create index on notifications (member_id, created_at desc);
create index on notifications (member_id) where read_at is null;
create index on notifications (org_id);
create index on notifications (lead_id);

create table ticket_categories (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  parent_id uuid references ticket_categories(id) on delete cascade,
  name text not null,
  default_assignee_member_id uuid references members(id) on delete set null,
  unique (org_id, parent_id, name)
);

create table tickets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  category_id uuid references ticket_categories(id) on delete set null,
  assignee_member_id uuid references members(id) on delete set null,
  subject text not null,
  status text not null default 'open' check (status in ('open','in_progress','closed')),
  feedback text check (feedback in ('positive','negative')),
  first_closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on tickets (org_id, status);
create index on tickets (lead_id);
create index on tickets (assignee_member_id, status);

create table ticket_messages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  ticket_id uuid not null references tickets(id) on delete cascade,
  author_member_id uuid references members(id) on delete set null,  -- null = the student
  body text not null,
  created_at timestamptz not null default now()
);
create index on ticket_messages (ticket_id, created_at);
create index on ticket_messages (org_id);

-- append-only: app roles may insert and select, never update or delete
create table audit_log (
  id bigint generated always as identity primary key,
  org_id uuid not null references orgs(id) on delete cascade,
  member_id uuid references members(id) on delete set null,
  action text not null,                          -- 'login', 'export', 'lead.update', 'message.send', ...
  entity text,
  entity_id uuid,
  before jsonb,
  after jsonb,
  ip inet,
  user_agent text,
  at timestamptz not null default now()
);
create index on audit_log (org_id, at desc);
create index on audit_log (org_id, entity, entity_id);
create index on audit_log (member_id, at desc);

-- DPDP: requests from students/guardians to see, correct or erase their data
create table data_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  lead_id uuid references leads(id) on delete set null,
  kind text not null check (kind in ('access','correction','erasure','consent_withdrawal','grievance')),
  status text not null default 'open' check (status in ('open','in_progress','done','rejected')),
  requested_by text not null check (requested_by in ('self','guardian','nominee')),
  details jsonb not null default '{}',
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index on data_requests (org_id, status, due_at);
create index on data_requests (lead_id);

-- personal data breach register: CERT-In within 6 h, Board within 72 h, people without delay
create table incidents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references orgs(id) on delete cascade,   -- null = platform-wide, copied to each affected org
  detected_at timestamptz not null,
  description text not null,
  affected_count int,
  affected_categories text[] not null default '{}',
  cert_in_reported_at timestamptz,
  org_notified_at timestamptz,                  -- when we told the institution (target: under 6 h)
  board_reported_at timestamptz,
  principals_notified_at timestamptz,
  status text not null default 'open' check (status in ('open','contained','closed')),
  created_at timestamptz not null default now()
);
create index on incidents (org_id, detected_at desc);

-- ---------------------------------------------------------------- updated_at triggers

do $$
declare t text;
begin
  for t in select table_name from information_schema.columns
           where table_schema = 'public' and column_name = 'updated_at'
  loop
    execute format('create trigger %I before update on %I for each row execute function app.touch_updated_at()',
                   t || '_touch', t);
  end loop;
end $$;

-- ---------------------------------------------------------------- roles and row level security

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'app_user') then create role app_user nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'app_worker') then create role app_worker nologin; end if;
end $$;

grant usage on schema public, app to app_user, app_worker;
grant select, insert, update, delete on all tables in schema public to app_user, app_worker;
grant usage on all sequences in schema public to app_user, app_worker;
grant execute on all functions in schema app to app_user, app_worker;
revoke update, delete on audit_log from app_user, app_worker;
-- on Supabase, nothing is exposed through the anon/authenticated API roles; the app connects as app_user
do $$ declare r text; begin
  foreach r in array array['anon','authenticated'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke all on all tables in schema public from %I', r);
    end if;
  end loop;
end $$;
-- orgs and users are managed by the platform (signup, invites) through security-definer functions
revoke insert, update, delete on orgs, users from app_user;

-- tenant isolation on every table with org_id
do $$
declare t text;
begin
  for t in select c.table_name from information_schema.columns c
           join information_schema.tables tb on tb.table_name = c.table_name and tb.table_schema = c.table_schema
           where c.table_schema = 'public' and c.column_name = 'org_id' and tb.table_type = 'BASE TABLE'
  loop
    execute format('alter table %I enable row level security', t);
    execute format('alter table %I force row level security', t);
    if t = 'activity_types' then
      execute 'create policy tenant on activity_types using (org_id is null or org_id = app.current_org())
               with check (org_id = app.current_org())';
    elsif t = 'incidents' then
      execute 'create policy tenant on incidents using (org_id = app.current_org()) with check (org_id = app.current_org())';
    elsif t = 'webhook_events' then
      -- inbound webhooks arrive before the tenant is known; only the worker reads them
      execute 'create policy tenant on webhook_events to app_worker using (true) with check (true)';
    else
      execute format('create policy tenant on %I using (org_id = app.current_org()) with check (org_id = app.current_org())', t);
    end if;
  end loop;
end $$;

-- orgs: a member sees only the current org
alter table orgs enable row level security;
alter table orgs force row level security;
create policy tenant on orgs using (id = app.current_org());

-- users: visible if they belong to the current org
alter table users enable row level security;
alter table users force row level security;
create policy same_org on users using (exists (
  select 1 from members m where m.user_id = users.id and m.org_id = app.current_org()));

-- leads: data scope on top of tenant isolation (restrictive = both must pass).
-- 'all' sees every lead; 'own' and 'team' see leads owned by app.visible_members
-- (the app puts the member, plus everyone below them for 'team', into that list).
create policy scope on leads as restrictive using (
  app.current_scope() = 'all'
  or exists (select 1 from lead_owners lo
             where lo.lead_id = leads.id and lo.member_id = any (app.visible_members()))
) with check (true);   -- writes are checked by the data layer (a new lead has no owner yet)

create policy scope on opportunities as restrictive using (
  app.current_scope() = 'all'
  or owner_member_id = any (app.visible_members())
  or exists (select 1 from lead_owners lo
             where lo.lead_id = opportunities.lead_id and lo.member_id = any (app.visible_members()))
) with check (true);
