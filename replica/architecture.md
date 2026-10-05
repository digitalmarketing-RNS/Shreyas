# Architecture: education CRM (a rebuild of Meritto Education CRM's core features)

Product name: not chosen yet (`/replica-brand` picks it). This file calls it "the CRM".
Owner decisions (2026-10-05): multi-tenant SaaS sold to Indian colleges, universities, coaching institutes and schools; each institution keeps the payment gateway it already uses; official Meta WhatsApp, with each institution connecting its own WhatsApp Business account through our app.
Inputs: `replica/recon.md`, `replica/features.csv`. Research on current vendor and regulator documentation, 2026-10-05, with sources at the end of this file.

## Stack

| layer | choice | why |
| --- | --- | --- |
| web app | Next.js (App Router) + TypeScript | One codebase for the staff app, public forms, checkout pages and the REST API. Server actions keep tenant logic on the server. |
| styling | Tailwind with tokens from `/replica-design` | The usual default. Tokens let `/replica-brand` reskin later. |
| database | Postgres 17 on Supabase Pro, **Mumbai (ap-south-1)** region, one shared project | Managed Postgres in India, with row level security, Auth, Storage, Realtime and pooling in one place. Pick the Mumbai region explicitly: Supabase's "APAC" region is Singapore, and Neon has no India region. |
| tenancy | Shared schema: `org_id` on every tenant table, plus RLS with `FORCE` | The pooled model AWS and Supabase recommend. A paid "dedicated" tier can later get its own project or an RDS instance in ap-south-1 running the same SQL. |
| ORM / SQL | Drizzle with postgres.js through the Supavisor **transaction** pooler (port 6543, `prepare: false`) | Typed queries. Every request runs in a transaction that sets the role and tenant context with `set_config(..., true)`, so pooled connections never leak a tenant. |
| auth | Supabase Auth: email + password, magic link, TOTP MFA, SAML SSO for universities (Pro plan) | Already part of the database project. A custom access-token hook adds `org_id` and `member_id` claims for Realtime channel authorisation. |
| background jobs | **Graphile Worker** on one always-on container in Mumbai (AWS ECS Fargate in ap-south-1), using the same Postgres | Jobs and long automation waits live as rows in our Mumbai database, so personal data never leaves India. Trigger.dev and Inngest have no confirmed India region. Our `automation_runs` table holds the waits, so the executor stays swappable. |
| hosting | Vercel Pro with every function pinned to **bom1** (Mumbai) | Vercel's default region is iad1 (US). Pro allows functions up to 800 s and per-minute cron. |
| files | Supabase Storage, paths prefixed `{org_id}/`, with storage RLS | Lead documents, WhatsApp media copies, import files, exports. |
| secrets | Envelope encryption with AWS KMS (ap-south-1). Ciphertext in the `secrets` table; only the worker and payment code decrypt | Gateway keys, WhatsApp business tokens and SMS/telephony keys can move money or send in an institution's name. |
| email | Amazon SES in ap-south-1, one verified sending domain per institution (SES tenant management if confirmed in Mumbai); Postmark as fallback | Gmail counts reputation per domain, so a shared sending domain would let one institution damage every other. Resend has no India region. |
| WhatsApp | Meta Cloud API with us as a **Tech Provider**; Embedded Signup **v4** | Each institution owns its WhatsApp Business account, and Meta bills it directly. v2 stops on 15 Oct 2026, and v3 and the previews end in Oct 2026. |
| payments | Our own adapter layer over each institution's own gateway account. Phase 1: Razorpay (OAuth partner), Easebuzz, PayU, Cashfree. Phase 2: CCAvenue, BillDesk, HDFC SmartGateway, Paytm. Bank portals (SBI Collect, ICICI Eazypay) as an external link | We never hold or settle funds, which keeps us out of RBI's Payment Aggregator definition. |
| SMS | Adapter over each institution's own DLT-registered SMS provider account. Phase 1: MSG91, Exotel, Kaleyra | Under TRAI's DLT rules the institution is the Principal Entity (registered sender) and its SMS provider is the Telemarketer. We stay outside that chain. |
| telephony | Click-to-call adapter over the institution's own provider. Phase 1: Exotel, Tata Smartflo, MyOperator. Plus `tel:` links and manual call logging | Public APIs with click-to-call, call webhooks and recordings. Syncing native-dialer calls automatically is not possible without restricted Android permissions. |
| monitoring | Sentry (or equivalent) with data scrubbing, plus structured logs shipped to storage in India and kept 1 year | CERT-In requires logs in India for 180 days; DPDP Rule 6 requires 1 year. |

One database, one web app, one worker. No microservices.

## Schema

Tables: **61** (`replica/schema.sql`). Access rules: **Postgres row level security on every tenant table**, plus data-layer checks for permissions.

How tenant isolation works:
- The app connects as a login role that inherits `app_user`, which has no BYPASSRLS. For each request the server verifies the Supabase session, loads the member's membership, role and team (cached for at most 60 s; sensitive actions re-check live), then opens a transaction and sets `app.org_id`, `app.member_id`, `app.scope` and `app.visible_members` with `set_config(..., true)`.
- Every table with `org_id` has `ENABLE` and `FORCE ROW LEVEL SECURITY` with policy `org_id = app.current_org()`. With no tenant set, nothing is visible.
- `leads` and `opportunities` also have a **restrictive** data-scope policy. Scope `all` sees everything. Scopes `own` and `team` see only leads owned by someone in `app.visible_members`: the member alone, or the member plus everyone below them in the team tree.
- The worker connects as `app_worker` and sets the same context for the tenant it is processing. Raw inbound webhooks (`webhook_events`) are visible only to the worker, because the tenant is not known until they are routed.
- Supabase's `anon` and `authenticated` roles get no grants on our tables. We expose no PostgREST surface; all data goes through our server.
- Global unique constraints exist only on random tokens and on provider IDs (Meta phone number ID, gateway order and payment IDs), so they reveal nothing about another tenant's data.

Rules the database enforces:
- One live lead per email per org: a partial unique index on `(org_id, email)` that ignores merged and deleted leads.
- First, second and third source touches cannot be changed or deleted. A trigger blocks it; the lead-erasure cascade is the only exception.
- `audit_log` is append-only for app roles.
- At most one live automation run per (automation, lead), and one run per trigger event (idempotency).
- An outbound message can be queued only once per idempotency key (outbox).
- A payment is either online (has a gateway) or offline (has a mode), never both or neither. Refunds need a different approver from the requester.
- An SMS template must carry its DLT template ID, its single header and its DLT category.

Tested: `replica/tests/schema_test.sql` runs 28 checks on Postgres 16 covering cross-tenant reads and writes, scope own/team/all, duplicates, locked sources, audit tampering, automation idempotency, payment shape, refund maker-checker, outbox idempotency and DLT template rules. Run:

```
psql -v ON_ERROR_STOP=1 -f replica/schema.sql -f replica/tests/schema_test.sql
```

Table groups: tenancy and access (orgs, users, campuses, roles, members, teams, team_members); configuration (picklists, picklist_values, field_defs, stages, sub_stages, stage_rules); capture (publishers, publisher_costs, forms, leads, lead_owners, source_touches, capture_events); opportunities (opportunity_lists, opportunities); timeline (activity_types, activities, notes, event_types, follow_ups, calls, telephony_agents); messaging (secrets, channel_accounts, sms_headers, templates, notices, consents, suppressions, conversations, saved_filters, broadcasts, broadcast_recipients, messages); automation (automations, automation_runs, automation_steps); payments (payment_gateways, payment_products, payment_links, payments, refunds); integration (webhook_events, api_keys, webhook_endpoints, webhook_deliveries); operations and compliance (jobs, notifications, ticket_categories, tickets, ticket_messages, audit_log, data_requests, incidents).

## API

Staff UI calls go through server actions or `/api/app/*` route handlers; both run the same tenant-context middleware. "Who" names the permission checked in the data layer, on top of RLS.

### Public (no login)

| method path | does | who | input | output | flow |
| --- | --- | --- | --- | --- | --- |
| GET /f/:publicKey | Render the enquiry form (embeddable) | anyone | UTM and click-id query params | HTML | F01 |
| POST /api/public/forms/:publicKey | Capture an enquiry: upsert the lead, record a source touch and consent, start triggers | anyone (rate-limited per IP and form) | fields, hidden tracking, consent checkbox, Idempotency-Key | 200 + success message or redirect | F01, F02 |
| GET /pay/:shortCode | Start a payment: create an attempt, redirect or post to the gateway | anyone with the link | none | redirect | F08 |
| GET\|POST /pay/return/:attemptRef | Browser return from the gateway; always confirm with the gateway's status API | anyone | gateway params | result page | F08 |
| GET\|POST /consent/:token | Guardian consent page for a minor: verify the guardian, record consent | guardian | OTP, decision | confirmation | DPDP |
| GET /unsubscribe/:token, POST same (RFC 8058 one-click) | Opt out of email | recipient | none | 200 | compliance |

### Staff app (`/api/app`, signed-in members)

| method path | does | who | input | output | flow |
| --- | --- | --- | --- | --- | --- |
| GET /me/day | Overdue and upcoming follow-ups, untouched leads, alerts | member | none | lists | F04 |
| POST /me/check-in, /me/check-out | Attendance that gates auto-assignment | member | none | state | F01 |
| GET /leads | List with search, quick and advanced filters, columns, cursor pagination | leads.view | filter JSON, cursor, page size 10-100 | rows | F05 |
| POST /leads | Add one lead (walk-in) | leads.edit | fields, source, consent | lead | F13 |
| GET /leads/:id | Profile: header, journey, tabs | leads.view | none | lead | F03 |
| PATCH /leads/:id | Edit details (not email or mobile) | leads.edit | changed fields | lead | F03 |
| POST /leads/:id/stage | Change stage, sub-stage, owner, follow-up and remark; enforce stage rules | leads.edit | stage form | lead | F03 |
| POST /leads/:id/notes | Add a note | leads.edit | text | note | F03 |
| POST /leads/:id/follow-ups; PATCH /follow-ups/:id | Schedule; mark done, reopen or cancel | leads.edit | event form | follow-up | F04 |
| POST /leads/:id/owners | Assign, add, replace or unassign owners | leads.assign | members, mode | owners | F05 |
| POST /leads/:id/merge | Merge a duplicate into the primary record | leads.manage | other lead id | lead | F02 |
| POST /leads/:id/messages | Send email, SMS or WhatsApp (template or in-window text); checks consent, suppression and stage rules | messages.send | channel, template, variables | message | F03 |
| POST /leads/:id/calls | Click-to-call through the provider, or log a call | calls.make | purpose, outcome | call | F03 |
| POST /leads/:id/payment-links | Create and send a payment link | payments.link | product, gateway, channel | link | F08 |
| POST /leads/:id/application-status | Set application started or submitted | leads.edit | status | lead | F08 |
| POST /leads/:id/consents; POST /leads/:id/guardian-consent | Record consent or withdrawal; send a guardian consent request | leads.edit | channel, purpose, evidence | consent | DPDP |
| POST /leads/bulk | Bulk export, message, reassign, change stage, update, delete or push to webhook; runs as a job | per action | action, filter or ids | job | F05 |
| POST /imports; GET /jobs/:id | Upload a file, map columns, run; poll progress and download the error report | leads.import | file path, mapping | job | F13 |
| GET\|POST\|DELETE /saved-filters | Personal and shared filters | member | conditions | filter | F05 |
| GET /calendar | Follow-ups and events for a range | member | from, to, owner | events | F04 |
| GET /notifications; POST /notifications/:id/read | Alert feed | member | none | list | F01 |
| GET /conversations; POST /conversations/:id/(pick\|reply\|resolve) | WhatsApp inbox | inbox.use | status, text or template | conversation | F09 |
| POST /broadcasts; POST /broadcasts/:id/(schedule\|cancel); GET /broadcasts/:id | One template to a saved audience, with retries and a report | broadcasts.manage | channel, template, filter, time | broadcast | F10 |
| CRUD /automations; POST /automations/:id/(activate\|pause); GET /automations/:id/report | Workflow builder and per-step reporting | automations.manage | graph | automation | F06, F07 |
| CRUD /templates; POST /templates/whatsapp/sync | Templates per channel; pull WhatsApp templates from Meta | templates.manage | template | template | F12 |
| GET /reports/funnel, /reports/attribution, /reports/counsellors; POST /reports/query; CRUD /dashboards | Funnel, attribution, productivity, pivot builder | reports.view | filters, metrics, groupings | data | F11, F14 |
| GET /payments; POST /payments/offline; POST /payments/:id/approve; POST /refunds; POST /refunds/:id/approve | Payments list, offline entry and approval, refunds (maker-checker) | payments.manage | payment data | payment | F08 |
| CRUD /opportunity-lists; GET\|PATCH /opportunities | Opportunities | opportunities.* | list rules, fields | opportunity | F02 |
| CRUD /settings/fields, /settings/picklists, /settings/stages, /settings/stage-rules, /settings/lead-rules, /settings/forms, /settings/publishers, /settings/notices | Configuration | settings.* | config | config | F12 |
| CRUD /settings/users (invite), /settings/roles, /settings/teams | Access control | users.manage | user, role, team | records | F12 |
| POST /settings/channels/whatsapp/embedded-signup | Finish Embedded Signup: exchange the code, subscribe the WABA, set India storage, register the number | channels.manage | code, waba_id, phone_number_id | channel state | F12 |
| CRUD /settings/channels/(sms\|email\|telephony) | Credentials, DLT headers, sending domain (returns DNS records), telephony agents | channels.manage | settings | channel | F12 |
| CRUD /settings/payments; GET /oauth/razorpay/start | Gateway connect (keys or OAuth), payment products | payments.settings (finance admin) | credentials | gateway | F12 |
| CRUD /settings/api-keys, /settings/webhooks | API keys (shown once) and outbound webhooks | integrations.manage | scopes, url, events | records | F12 |
| GET /settings/audit; CRUD /data-requests; CRUD /incidents | Audit log, DPDP requests desk, breach register | compliance.* | filters | records | DPDP |

### REST API v1 (institution integrations and publishers; API key in `Authorization: Bearer`)

| method path | does | who | input | output | flow |
| --- | --- | --- | --- | --- | --- |
| POST /api/v1/leads | Create or update, matched on email or mobile (`match: email\|mobile`), with an `Idempotency-Key` header | key with leads:write | fields, source | lead id, created or updated | F01 |
| POST /api/v1/leads/bulk | Up to 100 upserts with per-record results | leads:write | records | results | F13 |
| GET /api/v1/leads/:id; PATCH /api/v1/leads/:id; GET /api/v1/leads?updated_since= | Read, partial update, sync | leads:read/write | fields | lead(s) | sync |
| POST /api/v1/leads/:id/activities | Record a custom activity (webinar attended, course progress) | activities:write | type code, fields | activity | F07 |
| POST /api/v1/leads/:id/application-status | Application started or submitted, from an external form system | leads:write | status, time | lead | F08 |
| GET /api/v1/activities?from=&to= | Activity export (window at most 30 days) | activities:read | range | page | sync |
| GET /api/v1/fields; GET /api/v1/picklists | Field keys and picklists | key | none | metadata | sync |
| POST /api/v1/publisher/leads | A publisher pushes leads; tagged channel=publisher | publisher key | fields | id | F01 |

Route count: about 90 handlers (about 55 rows above, several of which cover CRUD sets).

### Webhooks in

All provider callbacks are verified against the raw request bytes, written to `webhook_events` (deduplicated by `(source, external_event_id)`), acknowledged with 200, and processed by the worker.

| endpoint | verification | routing to tenant |
| --- | --- | --- |
| GET\|POST /webhooks/meta | Verify handshake; `X-Hub-Signature-256` = HMAC-SHA256(raw body, app secret), constant-time compare | WABA ID / phone number ID → `channel_accounts`. Unknown IDs go to a dead-letter list. Overrides per WABA are not used, because template and account events always go to the app URL |
| POST /webhooks/pay/:provider/:webhookToken | Per gateway: Razorpay hex HMAC-SHA256 with the webhook secret; Cashfree base64 HMAC-SHA256(timestamp+body); PayU and Easebuzz reverse SHA-512 hash; HDFC Basic auth. Always confirmed by a status API call before a payment is marked successful | unguessable token → `payment_gateways` |
| GET /oauth/razorpay/callback; POST /webhooks/razorpay-partner | OAuth code exchange; partner webhook (for example `account.app.authorization_revoked`) | `state` / account id |
| POST /webhooks/sms/:provider/:webhookToken | Shared secret or provider signature where offered | token → `channel_accounts` |
| POST /webhooks/email/ses | SNS message signature | SES message id → `messages` |
| POST /webhooks/tel/:provider/:webhookToken | Token in path plus a custom header secret where the provider allows it (no signing found for Exotel or Smartflo) | token → `channel_accounts`; call matched by our call id, else by provider call id |
| POST /webhooks/leadads/google/:token | Google Ads lead-form webhook key | token → `forms` |

### Webhooks out

`lead.created`, `lead.updated`, `lead.stage_changed`, `lead.assigned`, `application.status_changed`, `payment.succeeded`, `activity.recorded`. Each is signed with `X-CRM-Signature: sha256=<HMAC of body>` using the endpoint secret and carries an event id. Retries back off over 24 h (`webhook_deliveries`), then the delivery is marked dead.

### Jobs (Graphile Worker in Mumbai; per-tenant concurrency through per-org queues)

| job | schedule | what it does |
| --- | --- | --- |
| process_webhook_event | on insert | Route to the tenant, apply idempotently: message status by rank (sent < delivered < read; failed is terminal; never downgrade), inbound messages, template status and quality, payments, calls, bounces |
| copy_inbound_media | immediately on an inbound media message | Download from Meta (URLs expire in 5 minutes) into `{org_id}/media/` |
| run_triggers | after every capture or update | Match active automations, create runs (unique per trigger event) |
| automation_tick | every minute | Advance due runs (`next_run_at <= now()`) one node at a time; record steps |
| send_message | outbox rows | Check consent, suppression, quiet hours and the WhatsApp window; call the provider; store the provider id |
| broadcast_fanout, broadcast_retry | on schedule; retry every 8-48 h, up to 5 times | Expand the audience, enqueue sends at the channel's rate (WhatsApp 80 msg/s per number by default, 20 for coexistence numbers) |
| whatsapp_template_sync | on webhook, plus nightly | Reconcile templates with Meta, because institutions can edit them in WhatsApp Manager |
| whatsapp_health | daily, plus on account webhooks | Messaging limit, quality, display name, payment method, currency; alert admins |
| payment_reconcile | every 5 minutes for attempts pending or unknown; daily for the whole day | Status API polling with back-off; reconcile against the gateway |
| oauth_refresh | daily | Refresh Razorpay tokens older than 60 days (access expires at 90 days, refresh at 180) |
| follow_up_reminders | every minute | In-app, email and push reminders |
| auto_checkout | every 5 minutes | Check members out at their set time (org time zone) |
| score_percentiles | nightly per org | Recompute lead score percentiles |
| import, export, bulk_* | on request | File imports with an error report; bulk actions; exports logged in `audit_log` |
| webhook_delivery | on insert, plus retries | Outbound webhooks |
| email_domain_verify | hourly until verified | DKIM/SPF/DMARC check through SES |
| telephony_refetch | 2-5 minutes after a terminal call event | Fetch final duration and recording |
| retention_purge | nightly | Apply per-institution retention; send the 48-hour warning; erase; record certificates |
| data_request_due | daily | Remind the institution about requests near their deadline |

## The parts that bite

- **Time zones:** store UTC. Each org has a time zone (default Asia/Kolkata). Follow-ups store their own time zone. Promotional-SMS quiet hours and auto check-out run on org local time.
- **Idempotency:** Meta retries webhooks for up to 7 days and batches them; gateways and SMS providers retry too. `webhook_events` dedupes. Sends use an outbox key written *before* the provider call. Automation runs are unique per trigger event. Refunds use our own `refund_ref`.
- **Races:** two submissions of the same enquiry at once are resolved by the unique index plus `INSERT ... ON CONFLICT`. Mobile-only leads use a transaction-scoped advisory lock on `(org, mobile)`. Round-robin takes the next counsellor with `SELECT ... FOR UPDATE SKIP LOCKED` on a per-rule counter, so two leads never land on the same slot.
- **Rate limits:**
  - WhatsApp allows 80 msg/s per number (1,000 after an upgrade, 20 for coexistence). Each portfolio starts at 250 unique users a day until the institution verifies. Error 131049 means do not retry that user for 24 h.
  - Meta lets us onboard only **10 new institutions per rolling 7 days** until our Business Verification, App Review and Access Verification are done, then 200.
  - SMS and telephony providers throttle; Exotel documents 20 or 200 calls per minute in different places.
- **File and body sizes:** Vercel bodies are limited to 4.5 MB, so uploads go straight to Storage with signed URLs. Email attachments are limited to 5 MB. WhatsApp limits: images 5 MB, video and audio 16 MB, documents 100 MB.
- **Search:** pg_trgm GIN index on name; email and mobile exact match or prefix; always filtered by `org_id`.
- **Realtime:** the inbox and the notification bell use Supabase Realtime broadcast on private channels `org:{id}:member:{id}`, authorised from JWT claims. Data still comes from our API.
- **Offline:** none in v1 (web). The phase-2 mobile app may queue actions offline.
- **Email deliverability:** one verified domain per institution with DKIM, SPF and DMARC. Bulk email is blocked until DMARC exists. One-click unsubscribe (RFC 8058) on marketing mail. Broadcasts pause automatically above a 0.3% spam rate.
- **Multi-tenancy:** FORCE RLS on every tenant table; app roles have no BYPASSRLS; tenant context is set only with `set_config(..., true)` inside a transaction. A CI check fails the build if any table with `org_id` lacks RLS. Every job queue is per org so one university's campaign cannot starve the others. Restoring a single tenant needs a side restore of the backup (point-in-time recovery restores the whole database), so build per-tenant export early.
- **DPDP (Digital Personal Data Protection Act):**
  - Institutions are Data Fiduciaries and we are their Data Processor. Most duties start **13 May 2027**, and MeitY has floated pulling that forward to 13 Nov 2026, so plan to be ready by then.
  - Under-18 leads stay `pending` parental consent: no marketing, scoring or tracking until a guardian is verified (s.9, Rule 10). The exemption for educational institutions covers only enrolled students' safety and education, not admission marketing.
  - Breaches: CERT-In within 6 h, the Data Protection Board within 72 h, affected people without delay.
  - Logs are kept 1 year, in India.
  - Each institution needs our standard Data Processing Agreement.
- **TRAI (telecom regulator):**
  - Promotional SMS needs consent, or a recipient who is not on DND. Each template is registered in one category; 5 templates blacklisted for wrong category suspend the institution's sending for a month.
  - Promotional calls must come from 140-series numbers. Calls are tagged with a purpose, and counsellors should not run promotional outreach from personal mobiles.
- **RBI:** we never collect, hold, split or net funds. The SaaS fee is billed separately. Otherwise we would fall under the Payment Aggregator Directions of 15 Sep 2025.
- **WhatsApp specifics:**
  - Set `data_localization_region=IN` *before* registering each number; changing it later means deregistering.
  - India WABAs must bill in INR; non-INR WABAs stop delivering from 1 Jan 2027.
  - Meta may re-categorise a template (utility to marketing) and the institution then pays the higher rate.
  - A Meta page says non-template and in-window utility messages are charged from 1 Oct 2026, but the main pricing page says they are free. Confirm before quoting costs.
- **Card data:** only gateway-hosted pages, redirects or gateway JS SDKs; never our own card forms. This keeps us out of PCI-DSS scope.
- **Secrets:** a leaked gateway key can refund an institution's money. Fields are write-only in the UI, decrypted only in the worker or payment code, and every decrypt is audited. Prefer OAuth (Razorpay) where it exists.

## Build order

Start these on day 1, outside the code, because they take weeks:
1. Meta Business Verification, then App Review for `whatsapp_business_messaging` and `whatsapp_business_management` (one screen recording per permission), then Access Verification as a Tech Provider.
2. Razorpay Technology Partner application, for OAuth.
3. SES production access in ap-south-1, and a check that tenant management is available there.
4. A lawyer: Data Processing Agreement, privacy policy, a note on whether the RBI Payment Gateway definition places any duty on us, and the coaching-institute question under DPDP.
5. A survey of the first 10-20 pilot institutions: which payment gateway, SMS provider and telephony provider they use today. This decides the adapter order.

**Vertical slice (about 2 weeks):** sign in (S03) → enquiry form settings (S31) → public form (S01) → capture upsert with duplicate check and attribution → round-robin assignment and an in-app alert → lead list (S05) → profile (S08) → change stage with follow-up (S09, S11) → send an email from a template (S10) → my day (S04) → funnel count (S21). Tables: orgs, users, roles, members, teams, stages, forms, leads, lead_owners, source_touches, capture_events, consents, notices, activities, notes, follow_ups, templates, channel_accounts (email), messages, notifications, automations (one built-in round-robin rule). Routes: `/f/:publicKey`, `POST /api/public/forms/:publicKey`, `/api/app/leads*`, `/api/app/me/day`, `/api/app/reports/funnel`, `/api/app/notifications`.

**Milestones for the must-haves** (every must row in `features.csv` is listed under one; generated, so none can be skipped):

**M1** (37): Embeddable enquiry form with configurable fields; Hidden capture of UTM params, gclid/fbclid, referrer and landing URL on form submit; Add a single lead by hand; Lead origin tag: offline, online, API, telephony, form widget, chat; Traffic channel tag: direct, publisher, social, organic, referral, other, telephony, offline, paid ads, chat; Email is the unique key: a repeat enquiry updates the existing lead; Repeat enquiry with a new mobile saves it as an alternate mobile; Registration attempts counter and last attempt date; First, second, third and latest source kept per lead; first three locked; Untouched marker on leads nobody has acted on yet; Lead list, newest first, 10 to 100 rows per page; Search leads by email, mobile, name, short user ID or lead ID; Choose and reorder list columns; Profile header: stage, verified contacts, created and last-engaged times, score, owner, source, next follow-up, message counts; Details tab, editable by the owner except email and mobile; Timeline of every action on the lead, with actor and time; Notes on a lead; Configurable lead stages with sub-stages; Per stage: follow-up required, sub-stage required; Enable, disable and reorder stages; Change-stage dialog sets sub-stage, owner, follow-up date and remark in one step; Assign or reassign a lead from its profile; Round-robin auto-assignment across chosen counsellors; Notify the counsellor when a lead is assigned; Schedule a follow-up (date and time) from the lead profile; My follow-ups: overdue and upcoming; Send an email from the lead profile; Template manager per channel with merge tokens and preview; Enquiry-to-enrolment funnel; In-app notification feed (bell); Invite users with role and team; set active or inactive; Built-in roles: admin, manager, counsellor, support staff; Teams with a reporting hierarchy; managers see their reports' work; Data visibility follows the team hierarchy (managers see their reports' records); Multi-tenant accounts, one per institution; Consent ledger with versioned privacy notices per institution; All personal data, backups and logs hosted in India.

**M2** (7): Communication log with delivery and engagement metrics per channel; Send a WhatsApp template message from the lead profile; Connect a WhatsApp Business API number (embedded sign-up); WhatsApp templates with category and Meta approval status; Receive inbound WhatsApp messages and attach them to the matching lead; WhatsApp chat history on the lead profile; WhatsApp numbers set to store message data in India before registration.

**M3** (7): Record application status on the lead (started, submitted) via API, inbound webhook or manual update; Journey milestones: unverified, verified, application started, payment approved, application submitted, token fee paid (enrolled); Payment products such as application fee and token fee; Generate a payment link from the lead profile and send it by WhatsApp, SMS or email; Hosted checkout through the institution's payment gateway; Payment statuses: initiated, pending, approved/success, failed, refunded; A successful payment updates the lead journey and can start automations.

**M4** (8): Rule-based auto-assignment on source, location, course, score and other fields; Workflow builder: trigger, conditions, actions; Triggers: lead created, lead updated, stage changed, field changed; Condition matching all or any, with if/else branches; Wait/delay step; Action: send email, SMS or WhatsApp; Action: assign counsellor (round robin, replace or add); Automation list with on/off status.

**M5** (22): Bulk import leads from a file; Create lead through public REST API with account API keys; Create-or-update lead through API, matched on email or mobile; Email and mobile verification of new leads with verified/unverified status; Quick filter bar that each user can edit; Advanced filters with AND/OR conditions on any field; Bulk export selected leads with chosen columns; Bulk send a message to selected leads; Bulk reassign owners: add owners or replace them; Bulk change lead stage; Custom lead fields: text, dropdown, paragraph, email, mobile, date, file upload, with validation; Send an SMS from the lead profile; Bulk send with per-recipient merge tokens; Opt-out and unsubscribe handling per channel; SMS templates carry their DLT template ID and registered sender ID (India); Click-to-call through the counsellor's own phone, logged to the timeline with an outcome; Attribution dashboard: channel to source to campaign, with funnel counts; Counsellor productivity: calls, follow-ups, assigned and engaged leads, by person and team; Verified parental consent before marketing to applicants under 18; Data requests desk: access, correction, erasure, consent withdrawal; Retention settings and erasure jobs per institution and data category; Breach register with CERT-In 6 h, Board 72 h and individual notices.

M1 = core CRM; M2 = WhatsApp (needs Meta approval from step 1); M3 = payments; M4 = automation; M5 = the rest of capture, the lead manager, SMS, calling, the attribution and productivity reports, and compliance. **Launch gate:** M1-M5 complete and the schema tests green. DPDP items are not optional for paying customers.

**Should-haves (M6),** grouped by screen:
- Inbox (S15), broadcasts (S16), calendar (S12), opportunities (S26, S27).
- Telephony providers and agents; email builder; custom roles and masking; 2FA; audit log (S38).
- Outbound webhooks; pivot report builder (S22) and dashboards (S21).
- Publishers (S41); multi-campus roll-ups; offline payments, approval, reminders and receipts.
- Unassign; opportunity routing rules; WhatsApp broadcasts and health panel; bank-portal payments; call purpose tags.

**Could-haves (M7):**
- Mobile app (M01-M06); publisher portal (S39); tickets (S40); landing pages.
- AI summary, chat and voice agents; LMS, ERP, Zapier, Outlook and video-meeting connectors; Google and Meta audience sync.
- Regional-language SMS; messaging credits.

**Fixes from `/replica-entrepreneur`:** once that has run, add its fix rows to `features.csv` and schedule them after M5.

## Open questions

1. Pricing: does Meta's 1 Oct 2026 charge for non-template and in-window utility messages apply to India? What are the official INR rates?
2. Is SES tenant management available in ap-south-1? If not, use separate configuration sets per tenant, or Postmark servers.
3. Which gateways, SMS providers and telephony providers do the pilot institutions use?
4. Is coexistence (the same number in the WhatsApp Business app and the Cloud API) available for Indian numbers?
5. Legal: is RBI's Payment Gateway definition a registration duty for a pure technology layer? Do coaching institutes count as "educational institutions" under DPDP? Does processing a minor's *application* (not marketing) need parental consent?
6. Can an SMS provider sub-account per institution be used without us registering as a Telemarketer? Get it in writing from the provider.

## Sources (fetched 2026-10-05)

**WhatsApp Business Platform**

- Partner type: Tech Provider vs Solution Partner vs Tech Partner (high confidence): https://developers.facebook.com/documentation/business-messaging/whatsapp/solution-providers/overview.md
- Becoming a Tech Provider: requirements (high confidence): https://developers.facebook.com/docs/whatsapp/solution-providers/get-started-for-tech-providers
- App Review details (medium confidence): https://developers.facebook.com/documentation/business-messaging/whatsapp/solution-providers/app-review.md
- Access Verification (Tech Provider verification) (high confidence): https://developers.facebook.com/documentation/development/release/access-verification
- Onboarding limit before and after verification (high confidence): https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/overview.md
- Embedded Signup: current version and deprecation (high confidence): https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/versions.md
- Embedded Signup: what our app receives and the required server steps (high confidence): https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/onboarding-customers-as-a-tech-provider.md
- India billing localization (INR) (high confidence): https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing.md
- Upcoming or new pricing: service and utility-in-window messages charged from Oct 1, 2026 (medium confidence): https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/non-template-messages
- Messaging limits (current model) (high confidence): https://developers.facebook.com/documentation/business-messaging/whatsapp/messaging-limits.md
- Cloud API throughput (high confidence): https://developers.facebook.com/documentation/business-messaging/whatsapp/throughput.md
- Templates: categories, review, limits (medium confidence): https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/overview.md
- Template quality and pausing (medium confidence): https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/template-pausing.md
- Per-user marketing message limits (high confidence): https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/marketing-templates/per-user-limits
- Opt-in policy (medium confidence): https://developers.facebook.com/documentation/business-messaging/whatsapp/getting-opt-in.md
- Webhook fields relevant to a multi-tenant CRM (high confidence): https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/overview.md
- Webhook security, retries and batching (high confidence): https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/create-webhook-endpoint.md
- Webhook overrides per tenant (medium confidence): https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/override.md
- Media handling (medium confidence): https://developers.facebook.com/documentation/business-messaging/whatsapp/business-phone-numbers/media.md
- Display names (medium confidence): https://developers.facebook.com/documentation/business-messaging/whatsapp/display-names.md
- Coexistence (number already on the WhatsApp Business app) (medium confidence): https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/onboarding-business-app-users.md

**Payments and RBI**

- RBI: current Payment Aggregator rule (Master Direction, Sept 2025) (high confidence): https://www.rbi.org.in/Scripts/BS_ViewMasDirections.aspx?id=12896
- RBI PA Directions: transition deadline (secondary source) (low confidence): https://www.independentdirectorsdatabank.in/newsletter/2025/10/3/1417
- Education usage evidence: Razorpay (medium confidence): https://razorpay.com/solutions/education/
- Education usage evidence: Easebuzz (medium confidence): https://easebuzz.in/case-study/parul-university/
- Education usage evidence: SBI Collect and ICICI Eazypay (bank collection portals) (high confidence): https://onlinesbi.sbi.bank.in/sbicollect/
- Education usage evidence: BillDesk and CCAvenue (low confidence): https://www.scitm.ac.in/pdf/New_BillDesk_Web_SDK_Specs_One_Time_Payments_(HMAC)_v1_5_20230805.pdf
- Razorpay: webhook authenticity (high confidence): https://razorpay.com/docs/webhooks/validate-test/
- Razorpay: checkout return signature, orders, payment links, refunds (high confidence): https://razorpay.com/docs/api/payments/payment-links/create-standard/?preferred-country=IN
- Razorpay Partners: OAuth on behalf of an existing merchant (high confidence): https://razorpay.com/docs/partners/technology-partners/onboard-businesses/integrate-oauth/integration-steps/partners-import-flow/
- Cashfree PG: orders, status, refunds, sandbox (high confidence): https://www.cashfree.com/docs/api-reference/payments/latest/orders/create
- Cashfree: webhook authenticity (high confidence): https://www.cashfree.com/docs/payments/online/webhooks/signature-verification
- Cashfree Partners: acting on behalf of merchants (high confidence): https://www.cashfree.com/docs/partners/embedded/integration/gateway-integration
- PayU: hosted checkout hash and response (reverse) hash (high confidence): https://docs.payu.in/docs/generate-hash-merchant-hosted
- PayU: status enquiry API (high confidence): https://docs.payu.in/reference/verify_payment_api
- PayU Partner Integration (medium confidence): https://docs.payu.in/docs/testing-and-go-live-partner-integration
- Easebuzz: initiate payment (server order then hosted checkout) (high confidence): https://docs.easebuzz.in/docs/payment-gateway/8ec545c331e6f-initiate-payment-api
- Easebuzz: transaction response/webhook hash sequence (low confidence): https://docs.easebuzz.in/docs/payment-gateway/paw9n1qc3kuoz-transaction-webhook
- CCAvenue: integration model (low confidence): https://www.jcrcab.com/wp-content/uploads/2020/08/CCAvenues_API_Vers-1_2_22052018-1.pdf
- BillDesk: integration model (low confidence): https://docs.billdesk.io/docs/guide-to-the-billdesk-documentation-portal
- HDFC SmartGateway (Juspay): integration model and authenticity (medium confidence): https://smartgateway.hdfcbank.com/docs/hdfc-resources/docs/common-resources/webhooks
- Paytm PG: integration model and authenticity (medium confidence): https://business.paytm.com/docs/jscheckout-initiate-payment

**SMS (TRAI DLT) and email**

- TCCCPR amendment history (newest first) (high confidence): https://www.trai.gov.in/sites/default/files/2026-09/PR_No119of2026.pdf
- Message categories (definitions after the Feb 2025 amendment) (high confidence): https://www.trai.gov.in/sites/default/files/2025-02/Regulation_12022025.pdf
- Header suffixes -P/-S/-T/-G (high confidence): https://www.pib.gov.in/PressReleasePage.aspx?PRID=2102413
- Template category misuse penalty (high confidence): https://www.trai.gov.in/sites/default/files/2024-09/Direction_30082024_0.pdf
- How PE-TM chain is set up in practice (MSG91 example) (high confidence): https://msg91.com/help/dlt-registration-in-india/pe-tm-chain-binding-on-dlt
- Time-of-day limits for promotional SMS (low confidence): https://www.twilio.com/en-us/guidelines/in/sms
- SMS character and segment limits (high confidence): https://www.twilio.com/docs/glossary/what-sms-character-limit
- Exotel SMS API DLT fields (high confidence): https://developer.exotel.com/docs/sms-api/api-reference/send-sms
- Kaleyra SMS API DLT fields and callbacks (high confidence): https://developers.kaleyra.io/docs/send-your-first-sms
- MSG91 API model and delivery webhooks (medium confidence): https://msg91.com/help/webhook-new/how-to-receive-sms-delivery-reports-via-webhook-new
- Gmail sender requirements (high confidence): https://support.google.com/mail/answer/14229414?hl=en
- Yahoo sender requirements (medium confidence): https://senders.yahooinc.com/best-practices/
- Amazon SES tenant management (multi-tenant isolation) (high confidence): https://docs.aws.amazon.com/ses/latest/dg/tenants.html
- Amazon SES DKIM for domain identities (high confidence): https://docs.aws.amazon.com/ses/latest/dg/send-email-authentication-dkim.html
- Postmark multi-client model, domains and webhooks (high confidence): https://postmarkapp.com/developer/api/domains-api
- Resend domain API and regions (high confidence): https://resend.com/docs/api-reference/domains/create-domain

**DPDP, CERT-In, TRAI calling**

- DPDP Rules: notified version and date (high confidence): https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa
- DPDP Act: phased commencement (G.S.R. 843(E)) (high confidence): https://www.meity.gov.in/static/uploads/2025/11/c56ceae6c383460ca69577428d36828b.pdf
- DPDP Rules: commencement of each rule (high confidence): https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf
- Proposal to shorten the DPDP compliance window (not confirmed as notified) (low confidence): https://chambers.com/articles/meity-plans-to-cut-short-dpdp-compliance-timeline-and-notify-cross-border-restrictions-for-sdfs
- DPDP: roles (Fiduciary / Processor / child / Data Principal) (high confidence): https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf
- CERT-In directions: 6-hour incident reporting and 180-day logs in India (high confidence): https://www.cert-in.org.in/PDF/CERT-In_Directions_70B_28.04.2022.pdf
- TRAI/DoT: 140 vs 160 numbering series (high confidence): https://www.pib.gov.in/PressReleasePage.aspx?PRID=2022249
- TRAI: 1600-series mandate (BFSI and government only) (high confidence): https://www.pib.gov.in/PressReleasePage.aspx?PRID=2205350
- TRAI TCCCPR Second Amendment 2025: definitions and series (high confidence): https://www.trai.gov.in/sites/default/files/2025-02/Regulation_12022025.pdf
- TRAI: steps required to become a registered sender (high confidence): https://trai.gov.in/advice-to-senders
- TRAI: Digital Consent Acquisition (DCA) status (low confidence): https://www.medianama.com/2026/08/223-trai-consent-system-spam-rules/
- WhatsApp: opt-in requirements (developer docs) (high confidence): https://developers.facebook.com/documentation/business-messaging/whatsapp/getting-opt-in
- WhatsApp Business Messaging Policy: key rules (high confidence): https://business.whatsapp.com/policy
- WhatsApp Cloud API: India local storage (data residency) (high confidence): https://developers.facebook.com/documentation/business-messaging/whatsapp/local-storage

**Telephony**

- Exotel: click-to-call (Connect Two Numbers) endpoint and leg order (high confidence): https://developer.exotel.com/docs/voice-v3/api-reference/connect-two-numbers
- Exotel: inbound caller lookup (Passthru applet) (high confidence): https://developer.exotel.com/docs/app-bazaar/passthru-applet-guide
- Exotel: number masking (medium confidence): https://developer.exotel.com/docs/call-support/advanced-features/number-masking
- Tata Tele Business Services Smartflo: click-to-call (high confidence): https://docs.smartflo.tatatelebusiness.com/reference/v1click_to_call-1
- Smartflo: webhooks (call status, recording, inbound) (high confidence): https://docs.smartflo.tatatelebusiness.com/docs/webhook
- MyOperator: API groups, auth, call webhooks, recordings (high confidence): https://support.myoperator.com/portal/en/kb/articles/myoperator-api-reference-postman-documentation-links
- Knowlarity: click-to-call (makecall) (medium confidence): https://developer.knowlarity.com/
- Ozonetel CloudAgent: click-to-call needs a logged-in agent (high confidence): https://docs.ozonetel.com/reference/post_ca-apis-agentmanualdial-2
- Google Play: call log permissions are restricted (high confidence): https://support.google.com/googleplay/android-developer/answer/10208820?hl=en
- Android: what an app can see without call log permission (high confidence): https://developer.android.com/reference/android/telephony/TelephonyManager
- iOS: CallKit only exposes call state, not numbers or history (high confidence): https://developer.apple.com/documentation/callkit/cxcall
- TRAI TCCCPR amendment (Feb 2025): 140 for promotional, 1600 for service/transactional, penalties (high confidence): https://www.pib.gov.in/PressReleasePage.aspx?PRID=2102413
- TRAI clarification (July 2026): who must use 1600 vs 140 (high confidence): https://www.trai.gov.in/sites/default/files/2026-07/PR_No91of2026.pdf
- TRAI 1601 series: extending to non-BFSI sectors (Aug 2026) (high confidence): https://www.pib.gov.in/PressReleasePage.aspx?PRID=2297141
- Older industry guidance: no 10-digit numbers for commercial calls, including via employees (medium confidence): https://www.apmiindia.org/storagebox/images/Circulars/Guidelines%20for%20sending%20Commercial%20Communications-31st%20May'24.pdf

**Infrastructure**

- Supabase: Mumbai region (ap-south-1) (high confidence): https://supabase.com/docs/guides/platform/regions
- Supabase: Postgres version (medium confidence): https://supabase.com/changelog?tags=database
- Supabase: plans and prices (high confidence): https://supabase.com/pricing
- Supabase Auth: Custom Access Token hook for tenant_id and role claims (high confidence): https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook
- Supabase RLS: security rules (high confidence): https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Supavisor / connection pooling (high confidence): https://supabase.com/docs/guides/database/connecting-to-postgres
- Supabase point-in-time recovery (PITR) (high confidence): https://supabase.com/docs/guides/platform/backups
- Supabase: pg_trgm for partial-match lead search (high confidence): https://supabase.com/docs/guides/database/extensions
- Neon: no India region (high confidence): https://neon.com/docs/introduction/regions
- AWS RDS for PostgreSQL: versions (high confidence): https://docs.aws.amazon.com/AmazonRDS/latest/PostgreSQLReleaseNotes/postgresql-release-calendar.html
- Vercel: Mumbai function region (high confidence): https://vercel.com/docs/regions
- Vercel: function duration, memory and payload limits (high confidence): https://vercel.com/docs/functions/limitations
- Vercel: cron jobs (high confidence): https://vercel.com/docs/cron-jobs/usage-and-pricing
- Trigger.dev: limits (high confidence): https://trigger.dev/docs/limits
- Trigger.dev: per-tenant concurrency and waiting runs (high confidence): https://trigger.dev/docs/queue-concurrency
- Trigger.dev: pricing (medium confidence): https://trigger.dev/pricing
- Trigger.dev: idempotency keys (high confidence): https://trigger.dev/docs/idempotency
- Inngest: limits including sleep (high confidence): https://www.inngest.com/docs/durable-execution/limits
- Inngest: pricing and self-hosting (high confidence): https://www.inngest.com/pricing
- Inngest: per-tenant flow control (medium confidence): https://www.inngest.com/blog/what-to-expect-when-youre-expecting-to-scale-asynchronous-workflows
- pg-boss and Graphile Worker: Postgres-native queues (medium confidence): https://github.com/timgit/pg-boss
- AWS guidance: shared schema with RLS (pooled model) (high confidence): https://docs.aws.amazon.com/prescriptive-guidance/latest/saas-multitenant-managed-postgresql/rls.html
- PostgreSQL 18: RLS bypass rules and covert channels (high confidence): https://www.postgresql.org/docs/current/ddl-rowsecurity.html

