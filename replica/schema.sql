-- Schema for the education CRM (multi-tenant). Postgres 15+.
-- Read replica/architecture.md first. Conventions:
--   * every tenant table has org_id; row level security (RLS) keeps tenants apart
--   * ids are uuid (the app generates time-ordered UUIDv7 for the big append-only tables); times are
--     timestamptz (UTC); money is integer paise + currency
--   * statuses are text + check constraints (easy to extend in a migration)
--   * references between tenant tables are composite: (org_id, x_id) -> other (org_id, id). Foreign-key
--     checks bypass RLS, so a single-column key would let one tenant point at another tenant's rows.
--     uuid[] columns (stage_rules.member_ids, ...) cannot carry keys; the app checks them against the org.
--   * history is never destroyed by deleting configuration: app roles cannot delete stages, members, forms,
--     templates, channels, gateways or automations (they are disabled instead), and those keys are RESTRICT.
--   * operators used against RLS-protected tables must be LEAKPROOF for an index to be used: text equality is,
--     citext, ILIKE, jsonb @> and array @> are not. Emails are stored lower-cased as text for that reason, and
--     fuzzy name search runs in app.search_lead_ids (security definer, explicit org filter).
--   * the app connects as role app_user (no BYPASSRLS) and, per transaction, sets
--       app.org_id, app.member_id, app.scope ('own' | 'team' | 'all'), app.visible_members ('{uuid,...}')
--     with set_config(..., true). Background jobs run as app_worker with the same settings
--     for the tenant they are working on. Only migrations run as the owner.

create extension if not exists citext;
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;
create extension if not exists btree_gin;

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

-- rejects a cycle in a parent pointer (members.reports_to_member_id, teams.parent_team_id, campuses.parent_campus_id);
-- TG_ARGV[0] is the parent column. The team-scope walk that builds app.visible_members relies on this.
create or replace function app.no_cycle() returns trigger
language plpgsql as $$
declare found boolean;
begin
  if (to_jsonb(new) ->> tg_argv[0]) is null then return new; end if;
  execute format(
    'with recursive up(id) as (select $1 union select t.%1$I from %2$I t join up on t.id = up.id where t.%1$I is not null)
     select exists (select 1 from up where id = $2)', tg_argv[0], tg_table_name)
    into found using (to_jsonb(new) ->> tg_argv[0])::uuid, new.id;
  if found then
    raise exception '% would create a cycle in %.%', new.id, tg_table_name, tg_argv[0] using errcode = '23514';
  end if;
  return new;
end $$;

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

-- per-org counters: lead reference numbers, receipt numbers (no platform-wide sequence leaks volume)
create table org_counters (
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null,                          -- 'lead', 'receipt'
  value bigint not null default 0,
  primary key (org_id, name)
);

create table campuses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  parent_campus_id uuid,
  name text not null,
  city text,
  is_head_office boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, name),
  -- same-org keys (see the note at the top)
  unique (org_id, id),
  foreign key (org_id, parent_campus_id) references campuses (org_id, id) on delete set null (parent_campus_id)
);
create trigger campuses_no_cycle before insert or update of parent_campus_id on campuses
  for each row execute function app.no_cycle('parent_campus_id');

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
  unique (org_id, name),
  -- same-org keys (see the note at the top)
  unique (org_id, id)
);

create table members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  user_id uuid not null references users(id) on delete restrict,
  role_id uuid not null,
  status text not null default 'invited' check (status in ('invited','active','inactive')),
  reports_to_member_id uuid,
  attributes jsonb not null default '{}',    -- programmes, region, languages: used for routing
  daily_lead_quota int check (daily_lead_quota >= 0),
  weekly_lead_quota int check (weekly_lead_quota >= 0),
  checked_in_at timestamptz,                 -- current state; history in member_attendance
  checked_out_at timestamptz,
  auto_checkout_time time,                   -- local time in org timezone; null = midnight
  prefs jsonb not null default '{}',         -- quick filters, list columns, notification choices
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, user_id),
  -- same-org keys (see the note at the top)
  unique (org_id, id),
  foreign key (org_id, role_id) references roles (org_id, id) on delete restrict,
  foreign key (org_id, reports_to_member_id) references members (org_id, id) on delete set null (reports_to_member_id),
  check (reports_to_member_id <> id)
);
create index on members (org_id, status);
create index on members (user_id);
create index on members (role_id);
create index on members (reports_to_member_id);
create trigger members_no_cycle before insert or update of reports_to_member_id on members
  for each row execute function app.no_cycle('reports_to_member_id');

create table teams (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  parent_team_id uuid,
  name text not null,
  manager_member_id uuid,
  campus_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (org_id, campus_id, name),
  -- same-org keys (see the note at the top)
  unique (org_id, id),
  foreign key (org_id, parent_team_id) references teams (org_id, id) on delete set null (parent_team_id),
  foreign key (org_id, manager_member_id) references members (org_id, id) on delete set null (manager_member_id),
  foreign key (org_id, campus_id) references campuses (org_id, id) on delete set null (campus_id)
);
create index on teams (parent_team_id);
create trigger teams_no_cycle before insert or update of parent_team_id on teams
  for each row execute function app.no_cycle('parent_team_id');

create table team_members (
  team_id uuid not null,
  member_id uuid not null,
  org_id uuid not null references orgs(id) on delete cascade,
  primary key (team_id, member_id),
  -- same-org keys (see the note at the top)
  foreign key (org_id, team_id) references teams (org_id, id) on delete cascade,
  foreign key (org_id, member_id) references members (org_id, id) on delete cascade
);
create index on team_members (member_id);
create index on team_members (org_id);

create table member_attendance (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  member_id uuid not null,
  checked_in_at timestamptz not null,
  checked_out_at timestamptz,
  checkout_method text check (checkout_method in ('manual','auto')),
  check (checked_out_at is null or checked_out_at >= checked_in_at),
  foreign key (org_id, member_id) references members (org_id, id) on delete restrict
);
create unique index member_attendance_open on member_attendance (member_id) where checked_out_at is null;
create index on member_attendance (org_id, checked_in_at);
create index on member_attendance (member_id, checked_in_at desc);

-- ---------------------------------------------------------------- configuration: fields, picklists, stages

create table picklists (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  title text not null,
  machine_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, machine_key),
  -- same-org keys (see the note at the top)
  unique (org_id, id)
);

create table picklist_values (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  picklist_id uuid not null,
  parent_value_id uuid,  -- course > programme > specialisation
  title text not null check (length(title) <= 250),
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- same-org keys (see the note at the top)
  unique (org_id, id),
  foreign key (org_id, picklist_id) references picklists (org_id, id) on delete cascade,
  foreign key (org_id, parent_value_id) references picklist_values (org_id, id) on delete restrict
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
  picklist_id uuid,
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
  check (type not in ('dropdown','multiselect') or picklist_id is not null),
  -- same-org keys (see the note at the top)
  foreign key (org_id, picklist_id) references picklists (org_id, id) on delete restrict
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
  unique (org_id, entity, name),
  -- same-org keys (see the note at the top)
  unique (org_id, id)
);
create unique index stages_one_untouched on stages (org_id, entity) where is_untouched;

create table sub_stages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  stage_id uuid not null,
  name text not null,
  sort_order int not null default 0,
  enabled boolean not null default true,
  unique (stage_id, name),
  unique (stage_id, id),                       -- lets leads check the sub-stage belongs to the stage
  -- same-org keys (see the note at the top)
  unique (org_id, id),
  foreign key (org_id, stage_id) references stages (org_id, id) on delete restrict
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
  tracking_code text not null unique default encode(gen_random_bytes(12), 'hex'),  -- random; /t/:trackingCode
  daily_cap int check (daily_cap >= 0),
  min_verification_rate numeric(5,2) check (min_verification_rate between 0 and 100),
  portal_enabled boolean not null default false,   -- publisher API keys live in api_keys (publisher_id)
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, name),
  -- same-org keys (see the note at the top)
  unique (org_id, id)
);

create table publisher_costs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  publisher_id uuid not null,
  period_start date not null,
  period_end date not null,
  amount_paise bigint not null check (amount_paise >= 0),
  currency char(3) not null default 'INR',
  check (period_end >= period_start),
  -- same-org keys (see the note at the top)
  foreign key (org_id, publisher_id) references publishers (org_id, id) on delete cascade
);
create index on publisher_costs (publisher_id, period_start);
create index on publisher_costs (org_id);

create table forms (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null,
  public_key text not null unique default encode(gen_random_bytes(16), 'hex') check (length(public_key) >= 22),  -- embed URL
  fields jsonb not null default '[]',         -- ordered [{key, required, label_override}]
  capture_tracking boolean not null default true,
  success_message text,
  redirect_url text,
  default_source jsonb not null default '{}', -- e.g. {"source":"website","medium":"form"}
  publisher_id uuid,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- same-org keys (see the note at the top)
  unique (org_id, id),
  foreign key (org_id, publisher_id) references publishers (org_id, id) on delete set null (publisher_id)
);
create index on forms (org_id);

-- ---------------------------------------------------------------- leads

create table leads (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  ref_no bigint not null,                        -- short number shown to users, per org (trigger below)
  name text,
  email text collate "C" check (email = lower(email)),   -- lower-cased text: equality is leakproof (see top)
  mobile_e164 text collate "C" check (mobile_e164 ~ '^\+[1-9][0-9]{6,14}$'),  -- other numbers: lead_phones
  date_of_birth date,
  is_minor boolean,                              -- under 18: DPDP s.9(1) needs verified parental consent before any
                                                 -- processing beyond the age check; s.9(3) bars profiling even after it
  guardian jsonb,                                -- {name, relation, email, mobile}
  parental_consent_status text not null default 'not_required'   -- a minor is always pending, verified or refused
    check (parental_consent_status in ('not_required','pending','verified','refused')),
  state text,
  city text,
  campus_id uuid,
  course_value_id uuid,
  stage_id uuid not null,
  sub_stage_id uuid,
  first_stage_id uuid,
  previous_stage_id uuid,
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
  last_engaged_at timestamptz,                   -- inbound message, open, click, payment start, re-enquiry
  registration_attempts int not null default 1,
  last_attempt_at timestamptz not null default now(),
  application_status text not null default 'none' check (application_status in ('none','started','submitted')),
  application_started_at timestamptz,
  application_submitted_at timestamptz,
  payment_approved_at timestamptz,
  token_fee_paid_at timestamptz,
  merged_into_id uuid,
  first_owner_member_id uuid,
  previous_owner_member_id uuid,
  reassigned_by_member_id uuid,
  reassigned_at timestamptz,
  created_by_member_id uuid default app.current_member(),   -- null for forms, API, imports; lets a walk-in creator see the lead
  custom jsonb not null default '{}',
  deleted_at timestamptz,                        -- hidden from users (soft delete)
  restricted_at timestamptz,                     -- DPDP Rule 8(3) hold: kept, but blocked from all business use
  erase_not_before timestamptz,                  -- earliest erasure: greatest(last processing + 1 year, legal holds)
  erased_at timestamptz,                         -- anonymised in place by app.erase_lead (the row stays for payments and counts)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (erased_at is not null or email is not null or mobile_e164 is not null),
  check (merged_into_id is null or merged_into_id <> id),
  -- s.9(3): no tracking or behavioural scoring of children, with or without parental consent
  constraint minors_need_guardian check (is_minor is not true or parental_consent_status <> 'not_required'),
  constraint minors_not_profiled check (coalesce(is_minor, false) = false or (score = 0 and score_percentile is null)),
  -- Rule 8(3): personal data and logs are kept at least one year from processing
  constraint erasure_after_one_year check (erase_not_before is null or erase_not_before >= created_at + interval '1 year'),
  -- same-org keys (see the note at the top)
  unique (org_id, id),
  unique (org_id, ref_no),
  foreign key (org_id, campus_id) references campuses (org_id, id) on delete set null (campus_id),
  foreign key (org_id, course_value_id) references picklist_values (org_id, id) on delete set null (course_value_id),
  foreign key (org_id, stage_id) references stages (org_id, id) on delete restrict,
  foreign key (stage_id, sub_stage_id) references sub_stages (stage_id, id) on delete set null (sub_stage_id),  -- sub-stage of this stage
  foreign key (org_id, first_stage_id) references stages (org_id, id) on delete restrict,
  foreign key (org_id, previous_stage_id) references stages (org_id, id) on delete restrict,
  foreign key (org_id, merged_into_id) references leads (org_id, id) on delete restrict,
  foreign key (org_id, first_owner_member_id) references members (org_id, id) on delete restrict,
  foreign key (org_id, previous_owner_member_id) references members (org_id, id) on delete restrict,
  foreign key (org_id, reassigned_by_member_id) references members (org_id, id) on delete restrict,
  foreign key (org_id, created_by_member_id) references members (org_id, id) on delete restrict
);
-- email is the duplicate key (one live lead per email per org)
-- ON CONFLICT must repeat this predicate: on conflict (org_id, email) where email is not null and merged_into_id is null
-- and deleted_at is null
create unique index leads_email_live on leads (org_id, email)
  where email is not null and merged_into_id is null and deleted_at is null;
create index leads_email_prefix on leads (org_id, email) where email is not null;            -- equality and email ^@ 'abc'
create index leads_mobile on leads (org_id, mobile_e164) where mobile_e164 is not null;     -- equality and prefix
create index on leads (org_id, created_at desc);
create index on leads (org_id, updated_at, id);                                              -- /api/v1/leads?updated_since=
create index on leads (org_id, last_engaged_at desc) where last_engaged_at is not null;
create index on leads (org_id, stage_id);
create index on leads (stage_id);
create index on leads (first_stage_id) where first_stage_id is not null;
create index on leads (previous_stage_id) where previous_stage_id is not null;
create index on leads (sub_stage_id) where sub_stage_id is not null;
create index on leads (org_id, next_follow_up_at) where next_follow_up_at is not null;
create index on leads (org_id) where untouched and deleted_at is null;
create index on leads (campus_id);
create index on leads (course_value_id);
create index on leads (merged_into_id) where merged_into_id is not null;
create index on leads (created_by_member_id) where created_by_member_id is not null;
-- name search goes through app.search_lead_ids (ILIKE is not leakproof, so RLS queries cannot use this index)
create index leads_org_name_trgm on leads using gin (org_id, name gin_trgm_ops);
-- custom-field filters scan the tenant; fields that need fast filters move to a typed side table when needed

create or replace function app.assign_ref_no() returns trigger
language plpgsql as $$
begin
  insert into org_counters as c (org_id, name, value) values (new.org_id, 'lead', 1)
    on conflict (org_id, name) do update set value = c.value + 1
    returning c.value into new.ref_no;
  return new;
end $$;
create trigger leads_ref_no before insert on leads for each row execute function app.assign_ref_no();

-- Leads are never deleted by app roles: erasure anonymises in place (app.erase_lead, after the retention hold).
-- This trigger is the last line of defence for platform scripts, such as purging a closed institution.
create or replace function app.guard_lead_erasure() returns trigger
language plpgsql as $$
begin
  if old.erase_not_before is null or old.erase_not_before > now() then
    raise exception 'lead % is inside its retention hold (erase_not_before %)', old.id, old.erase_not_before
      using errcode = '42501';
  end if;
  return old;
end $$;
create trigger leads_guard_erasure before delete on leads
  for each row execute function app.guard_lead_erasure();

create table lead_owners (
  lead_id uuid not null,
  member_id uuid not null,
  org_id uuid not null references orgs(id) on delete cascade,
  is_primary boolean not null default false,
  method text not null check (method in ('manual','automation','import','api','telephony','round_robin','bulk')),
  assigned_by_member_id uuid,
  assigned_at timestamptz not null default now(),
  primary key (lead_id, member_id),
  -- same-org keys (see the note at the top)
  foreign key (org_id, lead_id) references leads (org_id, id) on delete cascade,
  foreign key (org_id, member_id) references members (org_id, id) on delete restrict,
  foreign key (org_id, assigned_by_member_id) references members (org_id, id) on delete set null (assigned_by_member_id)
);
create unique index lead_owners_one_primary on lead_owners (lead_id) where is_primary;
create index on lead_owners (member_id, lead_id);       -- the scope policies look leads up by owner
create index on lead_owners (org_id);
create index on lead_owners (assigned_by_member_id) where assigned_by_member_id is not null;

-- an owner or consent change counts as a change to the lead, so /api/v1/leads?updated_since= picks it up
create or replace function app.touch_lead() returns trigger
language plpgsql as $$
begin
  update leads set updated_at = now() where id = coalesce(new.lead_id, old.lead_id);
  return null;
end $$;
create trigger lead_owners_touch_lead after insert or update or delete on lead_owners
  for each row execute function app.touch_lead();

-- every assignment change, kept for productivity reports (lead_owners holds only the current owners)
create table lead_assignments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  lead_id uuid not null,
  member_id uuid,
  action text not null check (action in ('assigned','added','replaced','unassigned')),
  method text not null check (method in ('manual','automation','import','api','telephony','round_robin','bulk')),
  automation_run_id uuid,                      -- key added after automation_runs exists
  by_member_id uuid,
  at timestamptz not null default now(),
  foreign key (org_id, lead_id) references leads (org_id, id) on delete cascade,
  foreign key (org_id, member_id) references members (org_id, id) on delete restrict,
  foreign key (org_id, by_member_id) references members (org_id, id) on delete restrict
);
create index on lead_assignments (member_id, at);
create index on lead_assignments (lead_id, at desc);
create index on lead_assignments (org_id, at);

-- quota counter: insert ... on conflict (member_id, day) do update set assigned = assigned + 1
--   where member_assignment_counts.assigned < $quota returning assigned   (0 rows = quota full)
create table member_assignment_counts (
  org_id uuid not null references orgs(id) on delete cascade,
  member_id uuid not null,
  day date not null,                           -- org-local date
  assigned int not null default 0 check (assigned >= 0),
  primary key (member_id, day),
  foreign key (org_id, member_id) references members (org_id, id) on delete restrict
);
create index on member_assignment_counts (org_id, day);

-- round-robin pools: one row per eligible member. Take the least recently used free member with
--   select ... order by last_assigned_at nulls first limit 1 for update of p skip locked
-- (each member is its own row, so concurrent captures get different members instead of nothing)
create table assignment_pools (
  org_id uuid not null references orgs(id) on delete cascade,
  pool_key text not null,                      -- 'automation:<id>:<node>' or 'bulk:<job id>'
  member_id uuid not null,
  weight smallint not null default 1 check (weight between 1 and 100),
  last_assigned_at timestamptz,
  primary key (org_id, pool_key, member_id),
  foreign key (org_id, member_id) references members (org_id, id) on delete restrict
);
create index on assignment_pools (member_id);

-- every number a lead has used (repeat enquiries with a new mobile); leads.mobile_e164 stays the primary
create table lead_phones (
  org_id uuid not null references orgs(id) on delete cascade,
  lead_id uuid not null,
  mobile_e164 text collate "C" not null check (mobile_e164 ~ '^\+[1-9][0-9]{6,14}$'),
  added_at timestamptz not null default now(),
  primary key (lead_id, mobile_e164),
  foreign key (org_id, lead_id) references leads (org_id, id) on delete cascade
);
create index on lead_phones (org_id, mobile_e164);

-- WhatsApp sender ids (wa_id, exactly as Meta sends it) seen for a lead; first stop when matching inbound messages
create table lead_wa_contacts (
  org_id uuid not null references orgs(id) on delete cascade,
  lead_id uuid not null,
  wa_id text not null,
  first_seen_at timestamptz not null default now(),
  primary key (org_id, wa_id, lead_id),
  foreign key (org_id, lead_id) references leads (org_id, id) on delete cascade
);
create index on lead_wa_contacts (lead_id);

-- first / second / third source are written once and never changed; latest is overwritten
create table source_touches (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  lead_id uuid not null,
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
  form_id uuid,
  publisher_id uuid,
  registered_at timestamptz not null default now(),
  unique (lead_id, position),
  -- same-org keys (see the note at the top)
  foreign key (org_id, lead_id) references leads (org_id, id) on delete cascade,
  foreign key (org_id, form_id) references forms (org_id, id) on delete restrict,
  foreign key (org_id, publisher_id) references publishers (org_id, id) on delete restrict
);
create index on source_touches (org_id, channel, source, registered_at);
create index on source_touches (publisher_id, registered_at) where publisher_id is not null;  -- publisher daily caps
create index on source_touches (form_id) where form_id is not null;

create or replace function app.lock_early_touches() returns trigger
language plpgsql as $$
begin
  if old.position in ('first','second','third') and current_user <> 'app_eraser' then
    raise exception 'source touch % of lead % is locked', old.position, old.lead_id using errcode = '42501';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end $$;
-- (app.erase_lead, owned by app_eraser, may scrub click ids from a locked touch; see below)
create trigger source_touches_locked before update on source_touches
  for each row execute function app.lock_early_touches();
-- deletes are allowed only through the lead cascade (erasure), not row by row:
create trigger source_touches_no_delete before delete on source_touches
  for each row when (pg_trigger_depth() = 0) execute function app.lock_early_touches();

-- every capture attempt, kept for audit, replay and idempotency
create table capture_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  lead_id uuid,
  origin text not null,
  idempotency_key text,
  payload jsonb not null,
  outcome text not null default 'pending' check (outcome in ('pending','created','updated','rejected','failed')),
  error text,
  received_at timestamptz not null default now(),
  unique (org_id, idempotency_key),
  -- same-org keys (see the note at the top)
  foreign key (org_id, lead_id) references leads (org_id, id) on delete set null (lead_id)
);
create index on capture_events (org_id, received_at desc);
create index on capture_events (lead_id, received_at desc);   -- TCCCPR 7-day enquiry window

-- OTPs and links: lead email/mobile verification, guardian consent (Rule 10), data-request identity checks
create table verification_challenges (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  lead_id uuid,
  purpose text not null check (purpose in ('lead_email','lead_mobile','guardian_consent','data_request')),
  channel text not null check (channel in ('email','sms','whatsapp')),
  address text not null,                       -- where the code or link was sent (guardian's contact for consent)
  token_hash bytea unique,                     -- sha256 of the link token; found through app.resolve_challenge
  otp_hash bytea,                              -- sha256(otp || id)
  attempts smallint not null default 0 check (attempts between 0 and 5),
  expires_at timestamptz not null,
  verified_at timestamptz,
  decision text check (decision in ('granted','refused')),   -- guardian consent only
  evidence jsonb not null default '{}',        -- Rule 10: how the guardian was shown to be an identifiable adult
  created_at timestamptz not null default now(),
  check (token_hash is not null or otp_hash is not null),
  foreign key (org_id, lead_id) references leads (org_id, id) on delete cascade
);
create index on verification_challenges (lead_id, purpose);
create index on verification_challenges (org_id, expires_at) where verified_at is null;

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
  unique (org_id, name),
  -- same-org keys (see the note at the top)
  unique (org_id, id)
);

create table opportunities (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  lead_id uuid not null,
  list_id uuid not null,
  stage_id uuid,
  owner_member_id uuid,
  status text not null default 'open' check (status in ('open','won','lost')),
  key_hash text not null,                      -- hash of key_fields values, computed by the app
  custom jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (list_id, lead_id, key_hash),
  -- same-org keys (see the note at the top)
  unique (org_id, id),
  foreign key (org_id, lead_id) references leads (org_id, id) on delete cascade,
  foreign key (org_id, list_id) references opportunity_lists (org_id, id) on delete restrict,
  foreign key (org_id, stage_id) references stages (org_id, id) on delete restrict,
  foreign key (org_id, owner_member_id) references members (org_id, id) on delete set null (owner_member_id)
);
create index on opportunities (org_id, list_id, stage_id);
create index on opportunities (lead_id);
create index on opportunities (owner_member_id);
create index on opportunities (stage_id) where stage_id is not null;

-- ---------------------------------------------------------------- timeline: activities, notes, follow-ups, calls

create table activity_types (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references orgs(id) on delete cascade, -- null = built-in type
  code int not null,
  name text not null,
  category text not null,
  custom_fields jsonb not null default '[]',
  counts_for_score smallint not null default 0,
  unique nulls not distinct (org_id, code),
  check ((org_id is null and code < 1000) or (org_id is not null and code >= 1000))  -- tenants never shadow built-ins
);

create table activities (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  lead_id uuid not null,                         -- opportunities always belong to a lead
  opportunity_id uuid,
  type_code int not null,
  actor_member_id uuid,
  summary text not null,
  payload jsonb not null default '{}',
  occurred_at timestamptz not null default now(),
  -- same-org keys (see the note at the top)
  foreign key (org_id, lead_id) references leads (org_id, id) on delete cascade,
  foreign key (org_id, opportunity_id) references opportunities (org_id, id) on delete set null (opportunity_id),
  foreign key (org_id, actor_member_id) references members (org_id, id) on delete set null (actor_member_id)
);
create index on activities (lead_id, occurred_at desc);
create index on activities (opportunity_id, occurred_at desc) where opportunity_id is not null;
create index on activities (org_id, occurred_at desc);
create index on activities (org_id, type_code, occurred_at desc);
create index on activities (actor_member_id);

-- why a lead's score moved (stage score_delta, activity counts_for_score); never written for minors
create table lead_score_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  lead_id uuid not null,
  delta int not null,
  reason text not null,                        -- 'stage:<id>', 'activity:<code>', ...
  at timestamptz not null default now(),
  foreign key (org_id, lead_id) references leads (org_id, id) on delete cascade
);
create index on lead_score_events (lead_id, at desc);
create index on lead_score_events (org_id);

create table notes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  lead_id uuid not null,
  opportunity_id uuid,
  author_member_id uuid,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- same-org keys (see the note at the top)
  foreign key (org_id, lead_id) references leads (org_id, id) on delete cascade,
  foreign key (org_id, opportunity_id) references opportunities (org_id, id) on delete set null (opportunity_id),
  foreign key (org_id, author_member_id) references members (org_id, id) on delete set null (author_member_id)
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
  unique (org_id, name),
  -- same-org keys (see the note at the top)
  unique (org_id, id)
);

create table follow_ups (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  lead_id uuid not null,
  opportunity_id uuid,
  event_type_id uuid,
  owner_member_id uuid not null,
  organiser_member_id uuid,
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
  -- same-org keys (see the note at the top)
  foreign key (org_id, lead_id) references leads (org_id, id) on delete cascade,
  foreign key (org_id, opportunity_id) references opportunities (org_id, id) on delete set null (opportunity_id),
  foreign key (org_id, event_type_id) references event_types (org_id, id) on delete set null (event_type_id),
  foreign key (org_id, owner_member_id) references members (org_id, id) on delete restrict,
  foreign key (org_id, organiser_member_id) references members (org_id, id) on delete set null (organiser_member_id),
  unique (org_id, id)
);
-- "overdue" is derived: status = 'upcoming' and starts_at < now()
create index on follow_ups (owner_member_id, status, starts_at);
create index on follow_ups (lead_id, starts_at desc);
create index on follow_ups (opportunity_id) where opportunity_id is not null;
create index on follow_ups (org_id, starts_at);
create index on follow_ups (event_type_id);
create index on follow_ups (organiser_member_id) where organiser_member_id is not null;

-- one row per reminder to send; rescheduling deletes unsent rows and inserts new ones.
-- The job claims due rows with: update ... set sent_at = now() where sent_at is null and due_at <= now() returning *
create table follow_up_reminders (
  follow_up_id uuid not null,
  org_id uuid not null references orgs(id) on delete cascade,
  minutes_before int not null check (minutes_before >= 0),
  channel text not null check (channel in ('in_app','email','push')),
  due_at timestamptz not null,
  sent_at timestamptz,
  primary key (follow_up_id, minutes_before, channel),
  foreign key (org_id, follow_up_id) references follow_ups (org_id, id) on delete cascade
);
create index on follow_up_reminders (due_at) where sent_at is null;
create index on follow_up_reminders (org_id);


-- ---------------------------------------------------------------- messaging: channels, templates, messages, consent

-- secrets are envelope-encrypted by the app (KMS data key); the database never sees plaintext
create table secrets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  purpose text not null,                       -- 'whatsapp_token', 'gateway_key_secret', ...
  ciphertext bytea not null,
  key_version int not null,
  created_at timestamptz not null default now(),
  rotated_at timestamptz,
  -- same-org keys (see the note at the top)
  unique (org_id, id)
);
create index on secrets (org_id);

-- one row per WhatsApp Business account (WABA) an institution connects through Embedded Signup.
-- WABA-level state lives here; each phone number is a channel_accounts row pointing at it.
create table wa_business_accounts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  waba_id text not null unique,                -- a WABA belongs to exactly one institution
  business_id text,                            -- the customer's business portfolio
  token_secret_id uuid,                        -- business integration system user token
  -- code_received > token_exchanged > waba_subscribed > payment_method_pending > live > offboarded
  onboarding_state text not null default 'code_received' check (onboarding_state in (
    'code_received','token_exchanged','waba_subscribed','payment_method_pending','live','offboarded')),
  currency char(3),                            -- billing currency; India Sold-To customers must be INR by 31 Dec 2026
  payment_method_status text,
  messaging_limit text,                        -- whatsapp_business_manager_messaging_limit (shared by the portfolio)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- from 1 Jan 2027 Meta stops delivering from non-INR WABAs of customers billed in India
  constraint waba_live_needs_inr check (onboarding_state <> 'live' or currency is not distinct from 'INR'),
  unique (org_id, id),
  foreign key (org_id, token_secret_id) references secrets (org_id, id) on delete restrict
);

create table channel_accounts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  type text not null check (type in ('whatsapp','sms','email','telephony')),
  provider text not null,                     -- 'meta_cloud', 'msg91', 'ses', 'exotel', ...
  display_name text not null,
  status text not null default 'pending' check (status in ('pending','connected','restricted','disconnected','reconnect_required')),
  -- WhatsApp number, in this order: linked > region_set > phone_registered > display_name_pending > live (> deregistered)
  onboarding_state text check (onboarding_state in ('linked','region_set','phone_registered','display_name_pending',
    'live','deregistered')),
  webhook_token text unique default encode(gen_random_bytes(18), 'hex'),  -- unguessable path segment for provider callbacks
  config jsonb not null default '{}',         -- non-secret settings
  secret_id uuid,
  -- WhatsApp
  wa_account_id uuid,                         -- the WABA this number belongs to
  wa_phone_number_id text,                    -- unique while connected (index below)
  wa_display_phone text,
  wa_quality text,                            -- as reported by Meta
  wa_data_region text,                        -- storage_configuration; must be 'IN' before the number is registered
  wa_pin_secret_id uuid,                      -- the 6-digit two-step PIN set at /register, needed to re-register
  -- SMS (India DLT); the institution is the Principal Entity, the provider its Telemarketer
  dlt_entity_id text,
  sms_header text,
  dlt_tm_ids text[] not null default '{}',    -- telemarketer IDs in the registered PE-TM chain
  dlt_chain_status text,                      -- as last checked with the provider; a broken chain fails sends silently
  dlt_self_certified_at date,                 -- headers and templates must be self-certified every year
  dlt_consent_template_ids text[] not null default '{}',
  -- email
  sending_domain text check (sending_domain = lower(sending_domain)),
  domain_verified_at timestamptz,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wa_number_has_account check (type <> 'whatsapp' or wa_account_id is not null),
  constraint wa_region_before_register check (type <> 'whatsapp' or onboarding_state is null
    or onboarding_state = 'linked' or wa_data_region is not distinct from 'IN'),
  -- same-org keys (see the note at the top)
  unique (org_id, id),
  foreign key (org_id, secret_id) references secrets (org_id, id) on delete set null (secret_id),
  foreign key (org_id, wa_account_id) references wa_business_accounts (org_id, id) on delete restrict,
  foreign key (org_id, wa_pin_secret_id) references secrets (org_id, id) on delete restrict
);
create index on channel_accounts (org_id, type);
create index on channel_accounts (wa_account_id) where wa_account_id is not null;
-- provider identities that route webhooks belong to one institution at a time
create unique index channel_accounts_wa_phone_live on channel_accounts (wa_phone_number_id)
  where wa_phone_number_id is not null and status <> 'disconnected';
create unique index channel_accounts_sending_domain on channel_accounts (sending_domain) where sending_domain is not null;
create unique index channel_accounts_one_default on channel_accounts (org_id, type) where is_default;

create table calls (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  lead_id uuid,
  opportunity_id uuid,
  member_id uuid,
  direction text not null check (direction in ('outbound','inbound')),
  via text not null check (via in ('native_dialer','provider','manual_log')),
  purpose text not null check (purpose in ('promotional','service','transactional')),  -- chosen per call; no default
  channel_account_id uuid,
  -- 140-series for promotional; service/transactional series per operator (1600 = BFSI/government only;
  -- 1601 is being phased in by sector and does not name education yet)
  caller_id text,
  status text not null check (status in ('initiated','ringing','connected','completed','missed','no_answer','busy','failed')),
  outcome text,
  provider text,
  provider_call_id text,
  virtual_number text,
  started_at timestamptz not null default now(),
  duration_s int check (duration_s >= 0),
  recording_path text,                          -- {org_id}/recordings/{id} in India storage; never the provider's URL
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (org_id, channel_account_id, provider_call_id),
  constraint promo_calls_via_provider check (purpose <> 'promotional' or via = 'provider'),
  constraint promo_calls_140 check (purpose <> 'promotional' or caller_id ~ '^(\+91)?140'),
  -- same-org keys (see the note at the top)
  foreign key (org_id, lead_id) references leads (org_id, id) on delete set null (lead_id),
  foreign key (org_id, opportunity_id) references opportunities (org_id, id) on delete set null (opportunity_id),
  foreign key (org_id, member_id) references members (org_id, id) on delete set null (member_id),
  foreign key (org_id, channel_account_id) references channel_accounts (org_id, id) on delete set null (channel_account_id)
);
create index on calls (lead_id, started_at desc);
create index on calls (member_id, started_at desc);
create index on calls (org_id, started_at desc);
create index on calls (channel_account_id);
create index on calls (opportunity_id) where opportunity_id is not null;
alter table calls set (fillfactor = 85);   -- status updates arrive in several webhooks

-- which provider identity (agent number, agent id) each counsellor uses
create table telephony_agents (
  member_id uuid not null,
  channel_account_id uuid not null,
  org_id uuid not null references orgs(id) on delete cascade,
  agent_ref text not null,
  primary key (member_id, channel_account_id),
  -- same-org keys (see the note at the top)
  foreign key (org_id, member_id) references members (org_id, id) on delete cascade,
  foreign key (org_id, channel_account_id) references channel_accounts (org_id, id) on delete cascade
);
create index on telephony_agents (org_id);
create index on telephony_agents (channel_account_id);

create table sms_headers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  channel_account_id uuid not null,
  header text not null,                        -- registered sender ID (DLT)
  category text not null check (category in ('promotional','service','transactional','government')),
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  unique (channel_account_id, header),
  -- same-org keys (see the note at the top)
  unique (org_id, id),
  foreign key (org_id, channel_account_id) references channel_accounts (org_id, id) on delete cascade
);
create index on sms_headers (org_id);

create table templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  channel text not null check (channel in ('email','sms','whatsapp')),
  channel_account_id uuid,
  name text not null,
  nature text not null check (nature in ('transactional','promotional')),   -- chosen at creation; no default
  applies_to text not null default 'lead' check (applies_to in ('lead','opportunity','payment')),
  subject text,
  body text not null,
  variables jsonb not null default '[]',      -- token -> field mapping
  attachments jsonb not null default '[]',    -- storage paths; size limit is our product choice (checked in the app)
  allowed_member_ids uuid[] not null default '{}',
  -- WhatsApp (mirrors Meta's template record)
  wa_account_id uuid,
  wa_template_id text,                        -- Meta's message_template_id
  wa_name text,
  wa_language text,
  wa_category text check (wa_category in ('marketing','utility','authentication')),
  wa_status text,                             -- Meta's value, synced from webhooks
  wa_quality text,
  wa_rejection_reason text,
  wa_components jsonb,
  -- SMS (India DLT): one template is bound to one header; text must match the registered text
  dlt_template_id text,
  sms_header_id uuid,
  dlt_category text check (dlt_category in ('promotional','service_implicit','service_explicit','transactional')),
  whitelisted_url_prefixes text[] not null default '{}',
  dlt_variable_count smallint check (dlt_variable_count >= 0),   -- more than 3 only on a justified request
  dlt_last_used_at timestamptz,                -- operators deactivate templates unused for 90 days
  provider_template_ref text,                  -- e.g. MSG91 flow_id
  sms_encoding text check (sms_encoding in ('gsm7','unicode')),
  design jsonb,                               -- email builder document, so a template can be reopened
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (channel <> 'whatsapp' or (wa_account_id is not null and wa_name is not null and wa_language is not null and wa_category is not null)),
  check (channel <> 'sms' or (dlt_template_id is not null and sms_header_id is not null and dlt_category is not null)),
  -- same-org keys (see the note at the top)
  unique (org_id, id),
  foreign key (org_id, channel_account_id) references channel_accounts (org_id, id) on delete restrict,
  foreign key (org_id, sms_header_id) references sms_headers (org_id, id) on delete restrict,
  foreign key (org_id, wa_account_id) references wa_business_accounts (org_id, id) on delete restrict
);
create unique index templates_name on templates (org_id, channel, name) where channel <> 'whatsapp';
create unique index templates_wa_identity on templates (wa_account_id, wa_name, wa_language) where channel = 'whatsapp';
create unique index templates_wa_id on templates (wa_account_id, wa_template_id) where wa_template_id is not null;
create index on templates (channel_account_id);
create index on templates (sms_header_id);

-- a DLT template's category must fit its header's category (misfiled templates get blacklisted)
create or replace function app.dlt_category_matches() returns trigger
language plpgsql as $$
declare h text;
begin
  if new.channel = 'sms' then
    select category into h from sms_headers where id = new.sms_header_id;
    if not ((new.dlt_category = 'promotional' and h = 'promotional')
         or (new.dlt_category in ('service_implicit','service_explicit') and h = 'service')
         or (new.dlt_category = 'transactional' and h in ('transactional','government'))) then
      raise exception 'DLT category % does not fit header category %', new.dlt_category, h using errcode = '23514';
    end if;
  end if;
  return new;
end $$;
create trigger templates_dlt_match before insert or update of sms_header_id, dlt_category on templates
  for each row execute function app.dlt_category_matches();

create table quick_replies (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  owner_member_id uuid,                        -- null = shared with the institution
  shortcut text not null,
  body text not null,
  unique nulls not distinct (org_id, owner_member_id, shortcut),
  foreign key (org_id, owner_member_id) references members (org_id, id) on delete restrict
);

-- versioned privacy notices per tenant (DPDP s.5 / Rule 3); a consent points at the notice it was given under.
-- A published notice is frozen (trigger below): changes mean a new version.
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
  unique (org_id, version, language),
  -- same-org keys (see the note at the top)
  unique (org_id, id)
);

create or replace function app.freeze_published_notice() returns trigger
language plpgsql as $$
begin
  if old.published_at is not null and (new.version, new.language, new.body, new.data_items, new.purposes, new.published_at)
       is distinct from (old.version, old.language, old.body, old.data_items, old.purposes, old.published_at) then
    raise exception 'notice % is published; publish a new version instead', old.id using errcode = '42501';
  end if;
  return new;
end $$;
create trigger notices_frozen before update on notices for each row execute function app.freeze_published_notice();

create table consents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  -- the proof of notice and consent outlives the lead (s.6(10)): erasure unlinks it, subject_hash still matches
  lead_id uuid,
  subject_hash text not null,                  -- HMAC of the normalised email or mobile, keyed per org
  channel text not null check (channel in ('whatsapp','sms','email','call','all')),
  purpose text not null check (purpose in ('marketing','service','data_processing')),
  status text not null check (status in ('granted','withdrawn')),
  given_by text not null default 'self' check (given_by in ('self','guardian')),
  method text not null,                        -- 'form_checkbox', 'whatsapp_reply_stop', 'guardian_otp', ...
  notice_id uuid,
  evidence jsonb not null default '{}',        -- ip, device, message id, how the guardian was verified, ...
  imported boolean not null default false,     -- legacy or bulk-imported consent
  tsp_registered_at timestamptz,               -- registered on the telcos' consent platform (TCCCPR 2026)
  recorded_by_member_id uuid,
  recorded_at timestamptz not null default now(),
  -- same-org keys (see the note at the top)
  foreign key (org_id, lead_id) references leads (org_id, id) on delete set null (lead_id),
  foreign key (org_id, notice_id) references notices (org_id, id) on delete restrict,
  foreign key (org_id, recorded_by_member_id) references members (org_id, id) on delete set null (recorded_by_member_id)
);
-- current consent = latest row per (lead, channel, purpose)
create index on consents (lead_id, channel, purpose, recorded_at desc);
create index on consents (org_id);
create index on consents (notice_id);
create index on consents (org_id, subject_hash);
create trigger consents_touch_lead after insert on consents for each row execute function app.touch_lead();

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
  lead_id uuid,                                -- null until matched or created (F09)
  contact_wa_id text,                          -- the sender, exactly as Meta sends it
  channel_account_id uuid not null,
  status text not null default 'queued' check (status in ('queued','picked','resolved')),
  assignee_member_id uuid,
  reopened_count int not null default 0,
  last_inbound_at timestamptz,
  service_window_ends_at timestamptz,          -- last_inbound_at + 24 h (WhatsApp)
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- same-org keys (see the note at the top)
  unique (org_id, id),
  foreign key (org_id, lead_id) references leads (org_id, id) on delete cascade,
  foreign key (org_id, channel_account_id) references channel_accounts (org_id, id) on delete restrict,
  foreign key (org_id, assignee_member_id) references members (org_id, id) on delete set null (assignee_member_id)
);
create unique index conversations_one_open on conversations (channel_account_id, contact_wa_id) where status <> 'resolved';
create index on conversations (channel_account_id);
create index on conversations (org_id, status, last_inbound_at desc);
create index on conversations (assignee_member_id, status);
create index on conversations (lead_id);

create table saved_filters (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  owner_member_id uuid,
  entity text not null check (entity in ('lead','opportunity','activity','payment')),
  name text not null,
  conditions jsonb not null,                   -- {"op":"and","rules":[...]} validated by the app
  shared boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- same-org keys (see the note at the top)
  unique (org_id, id),
  foreign key (org_id, owner_member_id) references members (org_id, id) on delete restrict
);
create index on saved_filters (org_id, entity);
create index on saved_filters (owner_member_id);

create table saved_reports (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  owner_member_id uuid,
  name text not null,
  definition jsonb not null,                   -- entity, metrics, groupings, filters; validated by the app
  shared boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (org_id, owner_member_id) references members (org_id, id) on delete restrict
);
create index on saved_reports (org_id);
create index on saved_reports (owner_member_id);

create table dashboards (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  owner_member_id uuid,
  name text not null,
  is_preset boolean not null default false,
  team_ids uuid[] not null default '{}',
  widgets jsonb not null default '[]',         -- each widget points at a saved report
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (org_id, owner_member_id) references members (org_id, id) on delete restrict
);
create index on dashboards (org_id);
create index on dashboards (owner_member_id);

create table broadcasts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  channel text not null check (channel in ('email','sms','whatsapp')),
  channel_account_id uuid not null,
  template_id uuid not null,
  saved_filter_id uuid,
  audience_size int,
  scheduled_at timestamptz,
  status text not null default 'draft' check (status in ('draft','scheduled','sending','paused','done','failed','cancelled')),
  paused_reason text,
  retry_max smallint not null default 0 check (retry_max between 0 and 5),
  retry_interval_h smallint not null default 24 check (retry_interval_h between 8 and 48),
  counts jsonb not null default '{}',
  created_by_member_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wa_retry_min_24h check (channel <> 'whatsapp' or retry_max = 0 or retry_interval_h >= 24),
  -- same-org keys (see the note at the top)
  unique (org_id, id),
  foreign key (org_id, channel_account_id) references channel_accounts (org_id, id) on delete restrict,
  foreign key (org_id, template_id) references templates (org_id, id) on delete restrict,
  foreign key (org_id, saved_filter_id) references saved_filters (org_id, id) on delete set null (saved_filter_id),
  foreign key (org_id, created_by_member_id) references members (org_id, id) on delete set null (created_by_member_id)
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
    'payment_succeeded','activity_recorded','opportunity_created','date_field','interval','message_received')),
  trigger_config jsonb not null default '{}',
  graph jsonb not null,                          -- current draft: nodes + edges, validated by the app
  version int not null default 1,                -- last published version (automation_versions)
  reentry text not null default 'once_active' check (reentry in ('once_ever','once_active','always')),
  active boolean not null default false,
  created_by_member_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- same-org keys (see the note at the top)
  unique (org_id, id),
  foreign key (org_id, created_by_member_id) references members (org_id, id) on delete set null (created_by_member_id)
);
create index on automations (org_id, trigger_type) where active;
create index on automations (org_id);

-- every published version; activating or editing an automation inserts one
create table automation_versions (
  automation_id uuid not null,
  version int not null,
  org_id uuid not null references orgs(id) on delete cascade,
  trigger_type text not null,
  trigger_config jsonb not null,
  graph jsonb not null,
  reentry text not null,
  created_by_member_id uuid,
  created_at timestamptz not null default now(),
  primary key (automation_id, version),
  foreign key (org_id, automation_id) references automations (org_id, id) on delete restrict,
  foreign key (org_id, created_by_member_id) references members (org_id, id) on delete restrict
);
create index on automation_versions (org_id);

create table automation_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  automation_id uuid not null,
  automation_version int not null,
  lead_id uuid,
  opportunity_id uuid,
  status text not null default 'running' check (status in ('running','waiting','done','failed','cancelled')),
  current_node text,
  next_run_at timestamptz,
  trigger_event_id text not null,               -- idempotency: one run per trigger event
  -- copied from the version's reentry: 'once_active' and 'once_ever' are exclusive; 'once_ever' also never repeats
  exclusive boolean not null default true,
  once_ever boolean not null default false,
  error text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (automation_id, trigger_event_id),
  -- same-org keys (see the note at the top)
  unique (org_id, id),
  foreign key (org_id, automation_id) references automations (org_id, id) on delete restrict,
  foreign key (org_id, lead_id) references leads (org_id, id) on delete cascade,
  foreign key (org_id, opportunity_id) references opportunities (org_id, id) on delete cascade,
  check (lead_id is not null or opportunity_id is not null),
  foreign key (automation_id, automation_version) references automation_versions (automation_id, version) on delete restrict
);
-- re-entry: at most one live run per subject ('once_active', 'once_ever'); 'once_ever' at most one run at all
create unique index automation_runs_one_live on automation_runs (automation_id, coalesce(lead_id, opportunity_id))
  where status in ('running','waiting') and exclusive;
create unique index automation_runs_once_ever on automation_runs (automation_id, coalesce(lead_id, opportunity_id)) where once_ever;
create index on automation_runs (opportunity_id) where opportunity_id is not null;
alter table automation_runs set (fillfactor = 85);
alter table lead_assignments add foreign key (org_id, automation_run_id)
  references automation_runs (org_id, id) on delete set null (automation_run_id);
create index on lead_assignments (automation_run_id) where automation_run_id is not null;
create index on automation_runs (org_id, status, next_run_at);
create index on automation_runs (lead_id);

create table automation_steps (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  run_id uuid not null,
  automation_id uuid not null,
  node_id text not null,
  status text not null check (status in ('done','skipped','failed')),
  output jsonb not null default '{}',
  at timestamptz not null default now(),
  -- same-org keys (see the note at the top)
  foreign key (org_id, run_id) references automation_runs (org_id, id) on delete cascade,
  foreign key (org_id, automation_id) references automations (org_id, id) on delete restrict
);
create index on automation_steps (run_id);
create index on automation_steps (automation_id, node_id, status);   -- per-step reporting
create index on automation_steps (org_id);

create table messages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  lead_id uuid,
  channel text not null check (channel in ('email','sms','whatsapp')),
  direction text not null check (direction in ('out','in')),
  channel_account_id uuid,
  template_id uuid,
  conversation_id uuid,
  broadcast_id uuid,
  automation_run_id uuid,
  sent_by_member_id uuid,
  to_address text,
  from_address text,                            -- inbound sender (wa_id / E.164 / email)
  body text,
  media jsonb not null default '[]',
  -- outbox: queued > sending (claimed, committed before the provider call) > sent; a stale 'sending' row is
  -- reconciled or marked 'unknown', never re-sent blindly (Meta has no idempotency key)
  status text not null default 'queued' check (status in ('queued','sending','sent','delivered','read','failed','bounced',
    'received','skipped_opt_out','skipped_suppressed','skipped_window_closed','skipped_minor','skipped_no_consent','unknown')),
  send_after timestamptz,                       -- quiet hours, scheduled sends
  attempts smallint not null default 0,
  claimed_at timestamptz,
  automation_node_id text,
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
  unique (org_id, idempotency_key),
  -- same-org keys (see the note at the top)
  unique (org_id, id),
  foreign key (org_id, lead_id) references leads (org_id, id) on delete set null (lead_id),
  foreign key (org_id, channel_account_id) references channel_accounts (org_id, id) on delete restrict,
  foreign key (org_id, template_id) references templates (org_id, id) on delete set null (template_id),
  foreign key (org_id, conversation_id) references conversations (org_id, id) on delete set null (conversation_id),
  foreign key (org_id, broadcast_id) references broadcasts (org_id, id) on delete set null (broadcast_id),
  foreign key (org_id, automation_run_id) references automation_runs (org_id, id) on delete set null (automation_run_id),
  foreign key (org_id, sent_by_member_id) references members (org_id, id) on delete set null (sent_by_member_id)
);
create index on messages (lead_id, created_at desc);
create index on messages (org_id, created_at desc);
create index on messages (conversation_id, created_at) where conversation_id is not null;
create index on messages (broadcast_id) where broadcast_id is not null;
create index on messages (automation_run_id) where automation_run_id is not null;
create index on messages (template_id);
create index messages_outbox on messages (org_id, send_after) where status in ('queued','sending');
create index messages_email_provider_id on messages (provider_message_id)
  where channel = 'email' and provider_message_id is not null;      -- SES events carry only the message id
create index on messages (sent_by_member_id) where sent_by_member_id is not null;
alter table messages set (fillfactor = 85);   -- 3-4 status updates per row

create table broadcast_recipients (
  broadcast_id uuid not null,
  lead_id uuid not null,
  org_id uuid not null references orgs(id) on delete cascade,
  message_id uuid,
  status text not null default 'pending' check (status in ('pending','sent','failed','skipped')),
  attempts smallint not null default 0,
  next_retry_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (broadcast_id, lead_id),
  -- same-org keys (see the note at the top)
  foreign key (org_id, broadcast_id) references broadcasts (org_id, id) on delete cascade,
  foreign key (org_id, lead_id) references leads (org_id, id) on delete cascade,
  foreign key (org_id, message_id) references messages (org_id, id) on delete set null (message_id)
);
create index on broadcast_recipients (org_id, status, next_retry_at);
create index on broadcast_recipients (lead_id);
create index on broadcast_recipients (message_id) where message_id is not null;
alter table broadcast_recipients set (fillfactor = 85);

-- ---------------------------------------------------------------- payments (each org's own gateway account)

create table payment_gateways (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  provider text not null,                       -- 'razorpay', 'payu', 'ccavenue', 'easebuzz', ...
  mode text not null default 'test' check (mode in ('test','live')),
  display_name text not null,
  merchant_id text,
  auth_type text not null default 'keys' check (auth_type in ('keys','oauth','external_link')),
  secret_id uuid,          -- keys, or OAuth access+refresh tokens
  webhook_secret_id uuid,
  webhook_token text not null unique default encode(gen_random_bytes(18), 'hex'),  -- /webhooks/pay/{provider}/{token}
  token_expires_at timestamptz,                 -- OAuth access token (Razorpay: 90 days)
  refresh_expires_at timestamptz,               -- OAuth refresh token (Razorpay: 180 days)
  external_url text,                            -- bank portal link (SBI Collect, ICICI Eazypay)
  capabilities jsonb not null default '{}',
  status text not null default 'pending' check (status in ('pending','connected','disabled','reconnect_required')),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- same-org keys (see the note at the top)
  unique (org_id, id),
  foreign key (org_id, secret_id) references secrets (org_id, id) on delete set null (secret_id),
  foreign key (org_id, webhook_secret_id) references secrets (org_id, id) on delete set null (webhook_secret_id)
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
  programme_value_id uuid,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (org_id, programme_value_id, name),
  -- same-org keys (see the note at the top)
  unique (org_id, id),
  foreign key (org_id, programme_value_id) references picklist_values (org_id, id) on delete set null (programme_value_id)
);
create index on payment_products (programme_value_id);

create table payment_links (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  lead_id uuid not null,
  product_id uuid not null,
  gateway_id uuid not null,
  amount_paise bigint not null check (amount_paise > 0),
  currency char(3) not null default 'INR',
  short_code text not null unique default encode(gen_random_bytes(16), 'hex') check (length(short_code) >= 22),
  status text not null default 'active' check (status in ('active','paid','expired','cancelled')),
  expires_at timestamptz,
  sent_via text[] not null default '{}',
  provider_link_id text,
  created_by_member_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- same-org keys (see the note at the top)
  unique (org_id, id),
  foreign key (org_id, lead_id) references leads (org_id, id) on delete cascade,
  foreign key (org_id, product_id) references payment_products (org_id, id) on delete restrict,
  foreign key (org_id, gateway_id) references payment_gateways (org_id, id) on delete restrict,
  foreign key (org_id, created_by_member_id) references members (org_id, id) on delete set null (created_by_member_id)
);
create index on payment_links (lead_id);
create index on payment_links (org_id, status);
create index on payment_links (product_id);
create index on payment_links (gateway_id);
create index on payment_links (expires_at) where status = 'active';

create table payments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  lead_id uuid not null,
  product_id uuid,
  link_id uuid,
  gateway_id uuid,
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
  approved_by_member_id uuid,
  approved_at timestamptz,
  paid_at timestamptz,
  receipt_no bigint,                            -- per org (org_counters 'receipt')
  receipt_path text,
  raw jsonb not null default '{}',              -- last provider payload (no card data ever)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gateway_id, provider_payment_id),
  check (refunded_paise <= amount_paise),
  check ((gateway_id is null) = (offline_mode is not null)),   -- online xor offline
  -- same-org keys (see the note at the top)
  unique (org_id, id),
  foreign key (org_id, lead_id) references leads (org_id, id) on delete restrict,
  foreign key (org_id, product_id) references payment_products (org_id, id) on delete set null (product_id),
  foreign key (org_id, link_id) references payment_links (org_id, id) on delete set null (link_id),
  foreign key (org_id, gateway_id) references payment_gateways (org_id, id) on delete restrict,
  foreign key (org_id, approved_by_member_id) references members (org_id, id) on delete set null (approved_by_member_id),
  unique (org_id, receipt_no)
);
create index on payments (lead_id);
create index on payments (org_id, status, created_at desc);
create index on payments (link_id);
create index on payments (product_id);

create table refunds (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  payment_id uuid not null,
  refund_ref text not null unique default encode(gen_random_bytes(12), 'hex'),  -- sent to the gateway (idempotency)
  amount_paise bigint not null check (amount_paise > 0),
  reason text,
  status text not null default 'requested' check (status in ('requested','approved','pending','refunded','failed','rejected')),
  requested_by_member_id uuid not null,
  approved_by_member_id uuid,   -- maker-checker
  provider_refund_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (approved_by_member_id is null or approved_by_member_id <> requested_by_member_id),
  check (status in ('requested','rejected') or approved_by_member_id is not null),   -- no approval without an approver
  -- same-org keys (see the note at the top)
  foreign key (org_id, payment_id) references payments (org_id, id) on delete restrict,
  foreign key (org_id, requested_by_member_id) references members (org_id, id) on delete restrict,
  foreign key (org_id, approved_by_member_id) references members (org_id, id) on delete restrict
);
create index on refunds (payment_id);
create index on refunds (org_id, status);

-- refunds on a payment never add up to more than it (locks the payment row while checking)
create or replace function app.refund_cap() returns trigger
language plpgsql as $$
declare paid bigint; taken bigint;
begin
  select amount_paise into paid from payments where id = new.payment_id for update;
  select coalesce(sum(amount_paise), 0) into taken from refunds
    where payment_id = new.payment_id and status not in ('failed','rejected') and id <> new.id;
  if new.status not in ('failed','rejected') and taken + new.amount_paise > paid then
    raise exception 'refunds would exceed payment %', new.payment_id using errcode = '23514';
  end if;
  return new;
end $$;
create trigger refunds_cap before insert or update of amount_paise, status on refunds
  for each row execute function app.refund_cap();

-- ---------------------------------------------------------------- inbound webhooks (all providers), outbound webhooks, API keys

-- only verified callbacks are stored; a bad signature gets 401 and a metric, never a row
create table webhook_events (
  id uuid primary key default gen_random_uuid(),
  source text not null,                          -- 'meta', 'razorpay', 'msg91', 'ses', 'exotel', ...
  -- one row per change: provider event id; for Meta wamid (inbound), wamid:status (statuses) or
  -- sha256(waba_id|field|value) (others). Keep keys at least 8 days (Meta retries for 7)
  external_event_id text not null,
  org_id uuid references orgs(id) on delete cascade,   -- resolved after routing
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error text,
  unique (source, external_event_id)
);
create index webhook_events_backlog on webhook_events (received_at) where processed_at is null;
create index on webhook_events (org_id, received_at desc);

create table api_keys (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null,
  key_prefix text not null unique,
  key_hash text not null,
  scopes text[] not null default '{leads:write}',
  publisher_id uuid,                            -- set for a publisher's key (scope publisher:leads:write)
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_by_member_id uuid,
  created_at timestamptz not null default now(),
  -- same-org keys (see the note at the top)
  foreign key (org_id, created_by_member_id) references members (org_id, id) on delete set null (created_by_member_id),
  foreign key (org_id, publisher_id) references publishers (org_id, id) on delete restrict
);
create index on api_keys (org_id);

create table webhook_endpoints (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  url text not null check (url ~ '^https://'),
  events text[] not null,
  secret_id uuid,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- same-org keys (see the note at the top)
  unique (org_id, id),
  foreign key (org_id, secret_id) references secrets (org_id, id) on delete set null (secret_id)
);
create index on webhook_endpoints (org_id) where active;

create table webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  endpoint_id uuid not null,
  event text not null,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending','delivered','failed','dead')),
  attempts smallint not null default 0,
  next_attempt_at timestamptz not null default now(),
  last_response_code int,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  -- same-org keys (see the note at the top)
  foreign key (org_id, endpoint_id) references webhook_endpoints (org_id, id) on delete cascade
);
create index on webhook_deliveries (status, next_attempt_at) where status in ('pending','failed');
create index on webhook_deliveries (endpoint_id);
create index on webhook_deliveries (org_id);

-- ---------------------------------------------------------------- jobs, notifications, tickets, audit, data requests

create table jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  kind text not null check (kind in ('lead_import','opportunity_import','bulk_update','bulk_stage_change','bulk_message',
    'bulk_reassign','bulk_unassign','bulk_delete','bulk_webhook','export','report_export','erasure')),
  status text not null default 'queued' check (status in ('queued','running','done','failed','cancelled')),
  input jsonb not null default '{}',             -- file path, column mapping, filter, ...
  totals jsonb not null default '{}',            -- requested, created, updated, failed
  errors_path text,                              -- storage path of the error report
  created_by_member_id uuid,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  heartbeat_at timestamptz,
  updated_at timestamptz not null default now(),
  finished_at timestamptz,
  -- same-org keys (see the note at the top)
  foreign key (org_id, created_by_member_id) references members (org_id, id) on delete set null (created_by_member_id)
);
create index on jobs (org_id, created_at desc);
create index on jobs (status, heartbeat_at) where status = 'running';

-- every uploaded object, so erasure and exports can find a lead's documents
create table files (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  lead_id uuid,
  purpose text not null check (purpose in ('import','lead_field','email_attachment','document','media','recording','receipt','export')),
  storage_path text not null unique,           -- {org_id}/{purpose}/{uuid}
  mime text,
  size_bytes bigint check (size_bytes >= 0),
  created_by_member_id uuid,
  created_at timestamptz not null default now(),
  foreign key (org_id, lead_id) references leads (org_id, id) on delete cascade,
  foreign key (org_id, created_by_member_id) references members (org_id, id) on delete restrict
);
create index on files (lead_id) where lead_id is not null;
create index on files (org_id, created_at desc);

-- Google Ads lead forms and Meta lead ads
create table lead_ad_connections (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  provider text not null check (provider in ('google_ads','meta_lead_ads')),
  form_id uuid,                                -- capture settings and default source
  webhook_token text not null unique default encode(gen_random_bytes(18), 'hex'),
  key_secret_id uuid,                          -- Google's google_key, or the Meta page token
  external_ref text,                           -- Google form id or Meta page id
  field_mapping jsonb not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (org_id, form_id) references forms (org_id, id) on delete restrict,
  foreign key (org_id, key_secret_id) references secrets (org_id, id) on delete restrict
);
create index on lead_ad_connections (org_id);
create unique index lead_ad_connections_meta_page on lead_ad_connections (external_ref)
  where provider = 'meta_lead_ads' and active;

create table notifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  member_id uuid not null,
  event text not null,                           -- 'lead_assigned', 'whatsapp_received', 'payment_started', ...
  lead_id uuid,
  title text not null,
  body text,
  read_at timestamptz,
  acted_at timestamptz,
  created_at timestamptz not null default now(),
  -- same-org keys (see the note at the top)
  foreign key (org_id, member_id) references members (org_id, id) on delete cascade,
  foreign key (org_id, lead_id) references leads (org_id, id) on delete cascade
);
create index on notifications (member_id, created_at desc);
create index on notifications (member_id) where read_at is null;
create index on notifications (org_id);
create index on notifications (lead_id);

create table ticket_categories (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  parent_id uuid,
  name text not null,
  default_assignee_member_id uuid,
  unique (org_id, parent_id, name),
  -- same-org keys (see the note at the top)
  unique (org_id, id),
  foreign key (org_id, parent_id) references ticket_categories (org_id, id) on delete cascade,
  foreign key (org_id, default_assignee_member_id) references members (org_id, id) on delete set null (default_assignee_member_id)
);

create table tickets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  lead_id uuid not null,
  category_id uuid,
  assignee_member_id uuid,
  subject text not null,
  status text not null default 'open' check (status in ('open','in_progress','closed')),
  feedback text check (feedback in ('positive','negative')),
  first_closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- same-org keys (see the note at the top)
  unique (org_id, id),
  foreign key (org_id, lead_id) references leads (org_id, id) on delete cascade,
  foreign key (org_id, category_id) references ticket_categories (org_id, id) on delete set null (category_id),
  foreign key (org_id, assignee_member_id) references members (org_id, id) on delete set null (assignee_member_id)
);
create index on tickets (org_id, status);
create index on tickets (lead_id);
create index on tickets (assignee_member_id, status);
create index on tickets (category_id) where category_id is not null;

create table ticket_messages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  ticket_id uuid not null,
  author_member_id uuid,  -- null = the student
  body text not null,
  created_at timestamptz not null default now(),
  -- same-org keys (see the note at the top)
  foreign key (org_id, ticket_id) references tickets (org_id, id) on delete cascade,
  foreign key (org_id, author_member_id) references members (org_id, id) on delete set null (author_member_id)
);
create index on ticket_messages (ticket_id, created_at);
create index on ticket_messages (org_id);

-- append-only: app roles may insert and select, never update or delete
create table audit_log (
  id bigint generated always as identity primary key,
  org_id uuid not null references orgs(id) on delete cascade,
  member_id uuid,
  action text not null,                          -- 'login', 'export', 'lead.update', 'message.send', ...
  entity text,
  entity_id uuid,
  before jsonb,
  after jsonb,
  ip inet,
  user_agent text,
  at timestamptz not null default now(),
  -- same-org keys (see the note at the top)
  foreign key (org_id, member_id) references members (org_id, id) on delete set null (member_id)
);
create index on audit_log (org_id, at desc);
create index on audit_log (org_id, entity, entity_id);
create index on audit_log (member_id, at desc);

-- DPDP: requests from students/guardians to see, correct or erase their data
create table data_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  lead_id uuid,
  kind text not null check (kind in ('access','correction','erasure','consent_withdrawal','grievance')),
  status text not null default 'open' check (status in ('open','in_progress','done','rejected')),
  requested_by text not null check (requested_by in ('self','guardian','nominee')),
  details jsonb not null default '{}',
  contact text,                                 -- how to reach the requester
  channel text check (channel in ('portal','email','phone','in_person')),
  verified_at timestamptz,                      -- identity checked (verification_challenges)
  due_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  -- same-org keys (see the note at the top)
  foreign key (org_id, lead_id) references leads (org_id, id) on delete set null (lead_id)
);
create index on data_requests (org_id, status, due_at);
create index on data_requests (lead_id);

-- personal data breach register: CERT-In within 6 h of noticing; DPDP Rule 7 (from 13 May 2027): Board and
-- affected people told without delay, detailed report to the Board within 72 h of becoming aware
create table incidents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references orgs(id) on delete cascade,   -- null = platform-wide, copied to each affected org
  detected_at timestamptz not null,
  aware_at timestamptz,                         -- starts the 72 h clock
  description text not null,
  affected_count int,
  affected_categories text[] not null default '{}',
  cert_in_reported_at timestamptz,
  org_notified_at timestamptz,                  -- when we told the institution (target: under 6 h)
  board_intimated_at timestamptz,
  board_detailed_report_at timestamptz,
  principals_notified_at timestamptz,
  updated_at timestamptz not null default now(),
  status text not null default 'open' check (status in ('open','contained','closed')),
  created_at timestamptz not null default now()
);
create index on incidents (org_id, detected_at desc);

-- vendors that process tenant data, with locations; shown in access responses (DPDP s.11(1)(b)) and the DPA
create table subprocessors (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  purpose text not null,
  data_categories text[] not null,
  storage_region text not null,
  processing_region text not null,
  notes text,                                    -- e.g. Meta: up to 60 min of in-use processing abroad
  added_at timestamptz not null default now()
);

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

-- ---------------------------------------------------------------- roles

-- app_user is the web app (staff screens, public forms, webhooks, REST API); app_worker runs background jobs.
-- Three more roles never log in; each only owns SECURITY DEFINER functions:
--   app_resolver  finds the tenant behind a public token before any tenant is set (reads routing columns only)
--   app_platform  creates institutions and user identities
--   app_eraser    anonymises a lead once its retention hold has passed, and purges old audit rows
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'app_user') then create role app_user nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'app_worker') then create role app_worker nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'app_resolver') then create role app_resolver nologin bypassrls; end if;
  if not exists (select 1 from pg_roles where rolname = 'app_platform') then create role app_platform nologin bypassrls; end if;
  if not exists (select 1 from pg_roles where rolname = 'app_eraser') then create role app_eraser nologin bypassrls; end if;
end $$;

grant usage on schema public, app to app_user, app_worker, app_resolver, app_platform, app_eraser;
grant select, insert, update, delete on all tables in schema public to app_user, app_worker;
grant usage on all sequences in schema public to app_user, app_worker;
-- on Supabase, nothing is exposed through the anon/authenticated API roles; the app connects as app_user
do $$ declare r text; begin
  foreach r in array array['anon','authenticated'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke all on all tables in schema public from %I', r);
    end if;
  end loop;
end $$;

-- platform tables: changed only through app_platform functions or migrations
revoke insert, update, delete on orgs, users, subprocessors from app_user, app_worker;
-- append-only records
revoke update, delete on audit_log, lead_assignments, automation_versions from app_user, app_worker;
-- history is disabled or anonymised, never deleted: leads (app.erase_lead), members (status 'inactive'),
-- configuration (enabled/active flags), channels and gateways (status), consent proof, payments
revoke delete on leads, members, stages, sub_stages, picklist_values, automations, templates, forms, publishers,
  payment_gateways, channel_accounts, wa_business_accounts, notices, consents, payments, refunds from app_user, app_worker;
-- secrets are written once; rotation inserts a new row
revoke update, delete on secrets from app_user;
-- the web app only adds verified webhook events; the worker reads and processes them
revoke select, update, delete on webhook_events from app_user;

-- ---------------------------------------------------------------- tenant resolution (app_resolver)
-- Public routes, webhooks and API keys must find their institution before app.org_id can be set, and FORCE RLS
-- hides every row until then. These functions are the only way in: each returns the org for one token.

grant select (id, slug, status) on orgs to app_resolver;
grant select (id, org_id, user_id, role_id, status) on members to app_resolver;
grant select (id, org_id, data_scope) on roles to app_resolver;
grant select (id, org_id, public_key, active) on forms to app_resolver;
grant select (id, org_id, short_code) on payment_links to app_resolver;
grant select (id, org_id, attempt_ref) on payments to app_resolver;
grant select (id, org_id, key_prefix, key_hash, scopes, revoked_at, publisher_id) on api_keys to app_resolver;
grant select (id, org_id, provider, webhook_token, merchant_id, auth_type, status) on payment_gateways to app_resolver;
grant select (id, org_id, type, provider, webhook_token, wa_phone_number_id, status) on channel_accounts to app_resolver;
grant select (id, org_id, waba_id) on wa_business_accounts to app_resolver;
grant select (id, org_id, token_hash, expires_at, verified_at) on verification_challenges to app_resolver;
grant select (id, org_id, provider, webhook_token, external_ref, active) on lead_ad_connections to app_resolver;
grant select (id, org_id, tracking_code, active) on publishers to app_resolver;
grant select (id, org_id, channel, provider_message_id) on messages to app_resolver;
grant select (id, org_id, name, deleted_at) on leads to app_resolver;
grant select (lead_id, member_id) on lead_owners to app_resolver;

create function app.resolve_org_slug(p_slug citext) returns uuid
language sql stable security definer set search_path = '' as $$
  select o.id from public.orgs o where o.slug = p_slug and o.status = 'active' $$;
create function app.memberships_for_user(p_user uuid)
returns table (org_id uuid, member_id uuid, role_id uuid, status text, data_scope text)
language sql stable security definer set search_path = '' as $$
  select m.org_id, m.id, m.role_id, m.status, r.data_scope
  from public.members m join public.roles r on r.id = m.role_id and r.org_id = m.org_id
  where m.user_id = p_user and m.status <> 'inactive' $$;
create function app.resolve_form(p_key text) returns table (org_id uuid, form_id uuid)
language sql stable security definer set search_path = '' as $$
  select f.org_id, f.id from public.forms f where f.public_key = p_key and f.active $$;
create function app.resolve_pay_link(p_code text) returns table (org_id uuid, link_id uuid)
language sql stable security definer set search_path = '' as $$
  select l.org_id, l.id from public.payment_links l where l.short_code = p_code $$;
create function app.resolve_payment_attempt(p_ref text) returns table (org_id uuid, payment_id uuid)
language sql stable security definer set search_path = '' as $$
  select p.org_id, p.id from public.payments p where p.attempt_ref = p_ref $$;
create function app.resolve_api_key(p_prefix text)
returns table (org_id uuid, key_id uuid, key_hash text, scopes text[], revoked_at timestamptz, publisher_id uuid)
language sql stable security definer set search_path = '' as $$
  select k.org_id, k.id, k.key_hash, k.scopes, k.revoked_at, k.publisher_id from public.api_keys k where k.key_prefix = p_prefix $$;
create function app.resolve_gateway_webhook(p_token text) returns table (org_id uuid, gateway_id uuid, provider text)
language sql stable security definer set search_path = '' as $$
  select g.org_id, g.id, g.provider from public.payment_gateways g where g.webhook_token = p_token $$;
create function app.resolve_partner_account(p_provider text, p_merchant text) returns table (org_id uuid, gateway_id uuid)
language sql stable security definer set search_path = '' as $$
  select g.org_id, g.id from public.payment_gateways g
  where g.provider = p_provider and g.merchant_id = p_merchant and g.auth_type = 'oauth' and g.status <> 'disabled' $$;
create function app.resolve_channel_webhook(p_token text) returns table (org_id uuid, channel_account_id uuid, type text, provider text)
language sql stable security definer set search_path = '' as $$
  select c.org_id, c.id, c.type, c.provider from public.channel_accounts c where c.webhook_token = p_token $$;
create function app.resolve_wa_phone(p_phone_number_id text) returns table (org_id uuid, channel_account_id uuid)
language sql stable security definer set search_path = '' as $$
  select c.org_id, c.id from public.channel_accounts c
  where c.wa_phone_number_id = p_phone_number_id and c.status <> 'disconnected' $$;
create function app.resolve_waba(p_waba_id text) returns table (org_id uuid, wa_account_id uuid)
language sql stable security definer set search_path = '' as $$
  select w.org_id, w.id from public.wa_business_accounts w where w.waba_id = p_waba_id $$;
create function app.resolve_challenge(p_token_hash bytea) returns table (org_id uuid, challenge_id uuid)
language sql stable security definer set search_path = '' as $$
  select v.org_id, v.id from public.verification_challenges v
  where v.token_hash = p_token_hash and v.verified_at is null and v.expires_at > now() $$;
create function app.resolve_lead_ad(p_token text) returns table (org_id uuid, connection_id uuid, provider text)
language sql stable security definer set search_path = '' as $$
  select a.org_id, a.id, a.provider from public.lead_ad_connections a where a.webhook_token = p_token and a.active $$;
create function app.resolve_meta_page(p_page_id text) returns table (org_id uuid, connection_id uuid)
language sql stable security definer set search_path = '' as $$
  select a.org_id, a.id from public.lead_ad_connections a
  where a.provider = 'meta_lead_ads' and a.external_ref = p_page_id and a.active $$;
create function app.resolve_publisher_link(p_code text) returns table (org_id uuid, publisher_id uuid)
language sql stable security definer set search_path = '' as $$
  select p.org_id, p.id from public.publishers p where p.tracking_code = p_code and p.active $$;
create function app.resolve_ses_message(p_message_id text) returns table (org_id uuid, message_id uuid)
language sql stable security definer set search_path = '' as $$
  select m.org_id, m.id from public.messages m where m.channel = 'email' and m.provider_message_id = p_message_id $$;

-- fuzzy name search for the current org (ILIKE is not leakproof, so RLS queries cannot use the trigram index).
-- Returns candidate ids; the caller reads them back through RLS (where id = any(...)), so data scope still applies.
create function app.search_lead_ids(p_query text, p_limit int default 100) returns setof uuid
language sql stable security definer set search_path = '' as $$
  select l.id from public.leads l
  where l.org_id = app.current_org() and l.deleted_at is null
    and l.name ilike '%' || replace(replace(replace(p_query, '\', '\\'), '%', '\%'), '_', '\_') || '%'
  order by l.id limit least(p_limit, 500) $$;

-- may the current member see this lead? used by lead_owners write policies, which cannot query leads directly
-- (the leads policy reads lead_owners, so a lead_owners policy reading leads would recurse)
create function app.lead_visible(p_lead uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select app.current_scope() = 'all'
      or exists (select 1 from public.leads l where l.id = p_lead and l.org_id = app.current_org()
                 and l.created_by_member_id = app.current_member())
      or exists (select 1 from public.lead_owners lo where lo.lead_id = p_lead
                 and lo.member_id = any (app.visible_members())) $$;
grant select (id, org_id, created_by_member_id) on leads to app_resolver;

-- ---------------------------------------------------------------- provisioning (app_platform)

grant select, insert on orgs, users, roles, stages, notices, members to app_platform;

-- a user identity, created when Supabase Auth invites or signs someone up; never changes an existing identity
create function app.ensure_user(p_id uuid, p_email citext, p_name text) returns uuid
language sql volatile security definer set search_path = '' as $$
  insert into public.users (id, email, name) values (p_id, p_email, p_name) on conflict (id) do nothing;
  select p_id $$;

-- a new institution with its system roles, the Untouched stage, a draft privacy notice and its first admin
create function app.provision_org(p_name text, p_slug citext, p_admin_user uuid, p_admin_email citext, p_admin_name text)
returns uuid
language plpgsql volatile security definer set search_path = '' as $$
declare v_org uuid; v_admin_role uuid;
begin
  perform app.ensure_user(p_admin_user, p_admin_email, p_admin_name);
  insert into public.orgs (name, slug) values (p_name, p_slug) returning id into v_org;
  insert into public.roles (org_id, name, is_system, data_scope, permissions) values
    (v_org, 'Admin', true, 'all', '{"*": ["*"]}'),
    (v_org, 'Manager', true, 'team', '{"leads": ["view","edit","assign","download"], "reports": ["view"]}'),
    (v_org, 'Counsellor', true, 'own', '{"leads": ["view","edit"], "messages": ["send"], "calls": ["make"]}'),
    (v_org, 'Support', true, 'own', '{"leads": ["view"], "tickets": ["manage"]}');
  select id into v_admin_role from public.roles where org_id = v_org and name = 'Admin';
  insert into public.stages (org_id, name, is_untouched) values (v_org, 'Untouched', true);
  insert into public.notices (org_id, version, body) values (v_org, 1, 'Draft privacy notice: replace before publishing.');
  insert into public.members (org_id, user_id, role_id, status) values (v_org, p_admin_user, v_admin_role, 'active');
  return v_org;
end $$;

-- ---------------------------------------------------------------- erasure (app_eraser)

grant select, update on leads, messages, conversations, calls, capture_events, source_touches, payments to app_eraser;
grant select, delete on notes, activities, follow_ups, lead_phones, lead_wa_contacts, verification_challenges,
  lead_score_events, notifications, tickets to app_eraser;
grant select, insert, delete on audit_log to app_eraser;
grant update (before, after) on audit_log to app_eraser;

-- DPDP erasure, run by the retention job once erase_not_before has passed (Rule 8(3) hold). The lead row and its
-- payments stay, anonymised, so counts, fee records and the consent proof (consents.subject_hash) survive.
-- Records merged into the lead are the same person and are erased with it.
create function app.erase_lead(p_lead uuid) returns int
language plpgsql volatile security definer set search_path = '' as $$
declare l record; ids uuid[];
begin
  select id, org_id, erase_not_before, erased_at into l from public.leads where id = p_lead for update;
  if l.id is null or l.org_id is distinct from app.current_org() then
    raise exception 'lead % not found in the current org', p_lead using errcode = '42501';
  end if;
  if l.erased_at is not null then return 0; end if;
  if l.erase_not_before is null or l.erase_not_before > now() then
    raise exception 'lead % is inside its retention hold (erase_not_before %)', p_lead, l.erase_not_before
      using errcode = '42501';
  end if;
  with recursive m(id) as (
    select p_lead union select x.id from public.leads x join m on x.merged_into_id = m.id)
  select array_agg(id) into ids from m;

  delete from public.notes where lead_id = any (ids);
  delete from public.activities where lead_id = any (ids);
  delete from public.follow_ups where lead_id = any (ids);
  delete from public.lead_phones where lead_id = any (ids);
  delete from public.lead_wa_contacts where lead_id = any (ids);
  delete from public.verification_challenges where lead_id = any (ids);
  delete from public.lead_score_events where lead_id = any (ids);
  delete from public.notifications where lead_id = any (ids);
  delete from public.tickets where lead_id = any (ids);
  update public.messages set body = null, to_address = null, from_address = null, media = '[]' where lead_id = any (ids);
  update public.conversations set contact_wa_id = null where lead_id = any (ids);
  update public.calls set recording_path = null where lead_id = any (ids);       -- the storage job deletes the objects
  update public.capture_events set payload = '{}' where lead_id = any (ids);
  update public.source_touches set gclid = null, fbclid = null, fb_lead_id = null, referrer = null, landing_url = null,
    utm = '{}' where lead_id = any (ids);                                         -- channel/source/campaign stay for reports
  update public.payments set raw = '{}' where lead_id = any (ids);
  update public.audit_log set before = null, after = null
    where org_id = l.org_id and entity = 'lead' and entity_id = any (ids);
  update public.leads set name = null, email = null, mobile_e164 = null, date_of_birth = null, guardian = null,
    state = null, city = null, remark = null, custom = '{}', deleted_at = coalesce(deleted_at, now()), erased_at = now()
    where id = any (ids);
  -- the erasure certificate
  insert into public.audit_log (org_id, action, entity, entity_id, after)
    select l.org_id, 'lead.erased', 'lead', i, jsonb_build_object('records', cardinality(ids)) from unnest(ids) i;
  return cardinality(ids);
end $$;

-- audit rows older than the retention period; never younger than one year (Rule 8(3))
create function app.purge_audit(p_before timestamptz) returns bigint
language plpgsql volatile security definer set search_path = '' as $$
declare n bigint;
begin
  if p_before > now() - interval '1 year' then
    raise exception 'audit rows are kept at least one year' using errcode = '42501';
  end if;
  delete from public.audit_log where org_id = app.current_org() and at < p_before and action <> 'lead.erased';
  get diagnostics n = row_count;
  return n;
end $$;

-- ---------------------------------------------------------------- function ownership and execute rights

do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig, p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'app' and p.prosecdef
  loop
    execute format('alter function %s owner to %I', f.sig,
      case when f.proname in ('ensure_user','provision_org') then 'app_platform'
           when f.proname in ('erase_lead','purge_audit') then 'app_eraser'
           else 'app_resolver' end);
    execute format('revoke all on function %s from public', f.sig);
    execute format('grant execute on function %s to %s', f.sig,
      case when f.proname in ('erase_lead','purge_audit') then 'app_worker' else 'app_user, app_worker' end);
  end loop;
end $$;
grant execute on function app.current_org(), app.current_member(), app.current_scope(), app.visible_members()
  to app_user, app_worker, app_resolver, app_platform, app_eraser;

-- ---------------------------------------------------------------- row level security

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
      -- built-in types (org_id null) are readable by everyone and writable by no tenant
      execute 'create policy tenant_read on activity_types for select using (org_id is null or org_id = app.current_org())';
      execute 'create policy tenant_write on activity_types using (org_id = app.current_org()) with check (org_id = app.current_org())';
    elsif t = 'webhook_events' then
      -- callbacks arrive before the tenant is known: the web app may only add rows, the worker processes them
      execute 'create policy ingest on webhook_events for insert to app_user with check (processed_at is null)';
      execute 'create policy worker on webhook_events to app_worker using (true) with check (true)';
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

-- ---------------------------------------------------------------- data scope ('own' / 'team' / 'all')
-- Restrictive policies, so tenant isolation and scope must both pass. The app sets app.visible_members to the
-- member alone ('own') or the member plus everyone below them ('team'). System contexts (public forms, REST API,
-- imports, the worker) run with app.scope = 'all' and no member. Function calls are wrapped in (select ...) so
-- they run once per query, not once per row.

-- leads: scope 'all', leads the member created (a walk-in before it has an owner), or leads owned by visible members
create policy scope on leads as restrictive using (
  (select app.current_scope()) = 'all'
  or created_by_member_id = (select app.current_member())
  or id in (select lo.lead_id from lead_owners lo where lo.member_id = any ((select app.visible_members())::uuid[]))
) with check (true);

-- owners can be added, changed or removed only on leads the member can see (no self-assignment to hidden leads)
create policy scope_insert on lead_owners as restrictive for insert with check (app.lead_visible(lead_id));
create policy scope_update on lead_owners as restrictive for update using (app.lead_visible(lead_id)) with check (app.lead_visible(lead_id));
create policy scope_delete on lead_owners as restrictive for delete using (app.lead_visible(lead_id));

create policy scope on opportunities as restrictive using (
  (select app.current_scope()) = 'all'
  or owner_member_id = any ((select app.visible_members())::uuid[])
  or lead_id in (select l.id from leads l)
) with check ((select app.current_scope()) = 'all' or lead_id in (select l.id from leads l));

-- every record that belongs to a lead follows the lead's visibility (reads and writes)
do $$
declare t text;
begin
  foreach t in array array['notes','activities','calls','messages','consents','payments','payment_links','tickets',
    'source_touches','capture_events','automation_runs','broadcast_recipients','lead_assignments','lead_phones',
    'lead_wa_contacts','verification_challenges','lead_score_events','files','data_requests'] loop
    execute format('create policy scope on %I as restrictive
      using ((select app.current_scope()) = ''all'' or lead_id is null or lead_id in (select l.id from leads l))
      with check ((select app.current_scope()) = ''all'' or lead_id is null or lead_id in (select l.id from leads l))', t);
  end loop;
end $$;
create policy scope on follow_ups as restrictive using (
  (select app.current_scope()) = 'all' or owner_member_id = any ((select app.visible_members())::uuid[])
  or lead_id in (select l.id from leads l)
) with check ((select app.current_scope()) = 'all' or lead_id in (select l.id from leads l));
create policy scope on conversations as restrictive using (
  (select app.current_scope()) = 'all' or lead_id is null or assignee_member_id = (select app.current_member())
  or lead_id in (select l.id from leads l)
) with check (true);
create policy scope on refunds as restrictive using (
  (select app.current_scope()) = 'all' or payment_id in (select p.id from payments p)
) with check ((select app.current_scope()) = 'all' or payment_id in (select p.id from payments p));

-- personal items: a member's own notifications, filters, reports, dashboards and quick replies (plus shared ones)
create policy own on notifications as restrictive
  using (member_id = (select app.current_member()) or (select app.current_member()) is null) with check (true);
create policy own on saved_filters as restrictive
  using (shared or owner_member_id = (select app.current_member()) or (select app.current_member()) is null)
  with check (owner_member_id is not distinct from (select app.current_member()) or (select app.current_member()) is null);
create policy own on saved_reports as restrictive
  using (shared or owner_member_id = (select app.current_member()) or (select app.current_member()) is null)
  with check (owner_member_id is not distinct from (select app.current_member()) or (select app.current_member()) is null);
create policy own on dashboards as restrictive
  using (is_preset or owner_member_id = (select app.current_member()) or (select app.current_member()) is null)
  with check (owner_member_id is not distinct from (select app.current_member()) or (select app.current_member()) is null);
create policy own on quick_replies as restrictive
  using (owner_member_id is null or owner_member_id = (select app.current_member()) or (select app.current_member()) is null)
  with check (owner_member_id is null or owner_member_id = (select app.current_member()) or (select app.current_member()) is null);
