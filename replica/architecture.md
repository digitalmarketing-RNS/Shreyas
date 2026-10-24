# Architecture: education CRM (a rebuild of Meritto Education CRM's core features)

Product name: not chosen yet (`/replica-brand` picks it). This file calls it "the CRM".
Owner decisions (2026-10-05): multi-tenant SaaS sold to Indian colleges, universities, coaching institutes and schools; each institution keeps the payment gateway it already uses; official Meta WhatsApp, with each institution connecting its own WhatsApp Business account through our app.
Inputs: `replica/recon.md`, `replica/features.csv`. Research on current vendor and regulator documentation, 2026-10-05, with sources at the end of this file. Reviewed 2026-10-06 by four adversarial reviewers (tenant security, integration accuracy, coverage, SQL quality); their findings are applied here and in the schema.

## Stack

| layer | choice | why |
| --- | --- | --- |
| web app | Next.js (App Router) + TypeScript | One codebase for the staff app, public forms, checkout pages and the REST API. Server actions keep tenant logic on the server. |
| styling | Tailwind with tokens from `/replica-design` | The usual default. Tokens let `/replica-brand` reskin later. |
| database | Postgres on Supabase Pro (17.x expected for new projects; confirm in the dashboard), **Mumbai (ap-south-1)** region, one shared project, Small compute or larger with 7-day point-in-time recovery on before the first paying tenant | Managed Postgres in India, with row level security, Auth, Storage, Realtime and pooling in one place. Pick the Mumbai region explicitly: Supabase's "APAC" region is Singapore, and Neon has no India region. |
| tenancy | Shared schema: `org_id` on every tenant table, plus RLS with `FORCE` | The pooled model AWS and Supabase recommend. A paid "dedicated" tier can later get its own project or an RDS instance in ap-south-1 running the same SQL. |
| ORM / SQL | Drizzle with postgres.js through the Supavisor **transaction** pooler (port 6543, `prepare: false`, `max: 1`, client created at module scope, no query pipelining, which can hang in transaction mode) | Typed queries. Every request runs in a transaction that sets the role and tenant context with `set_config(..., true)`, so pooled connections never leak a tenant. |
| auth | Supabase Auth: email + password, magic link, TOTP MFA, SAML SSO for universities (Pro plan) | Already part of the database project. A custom access-token hook adds `org_id` and `member_id` claims for Realtime channel authorisation. |
| background jobs | **Graphile Worker** on one always-on container in Mumbai (AWS ECS Fargate in ap-south-1), using the same Postgres | Jobs and long automation waits live as rows in our Mumbai database, so job state stays in India. Trigger.dev and Inngest have no confirmed India region. The worker connects through the Supavisor **session** pooler (port 5432) or a direct connection (IPv6 only, unless the IPv4 add-on is bought), never the transaction pooler, because Graphile Worker needs LISTEN/NOTIFY. Our `automation_runs` table holds the waits, so the executor stays swappable. |
| hosting | Vercel Pro with every function pinned to **bom1** (Mumbai) | Vercel's default region is iad1 (US). Pro allows functions up to 800 s and per-minute cron. |
| files | Supabase Storage, paths prefixed `{org_id}/`, with storage RLS; every object has a row in `files` | Lead documents, WhatsApp media copies, call recordings copied from the provider, import files, exports, receipts. Uploads go straight to Storage with signed URLs. |
| secrets | Envelope encryption with AWS KMS (ap-south-1). Ciphertext in the `secrets` table; only the worker and payment code decrypt | Gateway keys, WhatsApp business tokens and SMS/telephony keys can move money or send in an institution's name. |
| email | Amazon SES in ap-south-1, one verified sending domain per institution (SES itself and its tenant management in Mumbai still to be confirmed); Postmark as fallback only if it can keep data in India, otherwise separate SES configuration sets per institution | Gmail counts bulk-sender volume (about 5,000 a day) per primary domain and bulk status is permanent, so a shared sending domain would let one institution damage every other. Resend has no India region. |
| WhatsApp | Meta Cloud API with us as a **Tech Provider**; Embedded Signup **v4** | Each institution owns its WhatsApp Business account, and Meta bills it directly. v2 stops on 15 Oct 2026, and v3 and the previews end in Oct 2026. |
| payments | Our own adapter layer over each institution's own gateway account. Phase 1: Razorpay (OAuth partner), Easebuzz, PayU, Cashfree. Phase 2: CCAvenue, BillDesk, HDFC SmartGateway, Paytm. Bank portals (SBI Collect, ICICI Eazypay) as an external link | We never hold or settle funds, which keeps us out of RBI's Payment Aggregator definition. |
| SMS | Adapter over each institution's own DLT-registered SMS provider account. Phase 1: MSG91, Exotel, Kaleyra | Under TRAI's DLT rules the institution is the Principal Entity (registered sender) and its SMS provider is the Telemarketer. We stay outside that chain. |
| telephony | Click-to-call adapter over the institution's own provider (the counsellor's phone rings first; the lead sees the institution's 140 or 160 caller ID). Phase 1: Exotel (Mumbai-region accounts), Tata Smartflo, MyOperator. Manual call logging; `tel:` links only for service calls, behind an org setting that is off by default and always off when contacts are masked | Public APIs with click-to-call, call webhooks and recordings. Syncing native-dialer calls automatically is not possible without restricted Android permissions. |
| monitoring and logs | Error tracking either self-hosted in ap-south-1, or a SaaS tracker that receives only PII-free events and is listed as a sub-processor outside India. App, worker, Vercel and Supabase logs (Postgres, Auth audit, Storage, API) drained to storage in India; Supabase Pro keeps its own logs only 7 days, and a log drain costs $60 a month per drain. Worker and log clocks synced to NIC or NPL-traceable NTP | CERT-In (in force now): logs of all ICT systems kept in India for a rolling 180 days, clocks synced to NIC/NPL. DPDP Rule 8(3) (from 13 May 2027): personal data, traffic data and processing logs kept at least 1 year. |

One database, one web app, one worker. No microservices.

## Schema

Tables: **79** (`replica/schema.sql`), plus `replica/schema_supabase.sql` for the parts that exist only on Supabase (login roles, the access-token hook, the Realtime channel policy). Access rules: **Postgres row level security on every tenant table**, plus data-layer checks for permissions.

How tenant isolation works:
- The app connects as a login role that inherits `app_user`, which has no BYPASSRLS. For each request the server verifies the Supabase session, loads the member's membership, role and team through `app.memberships_for_user` (cached for at most 60 s; sensitive actions re-check live), then opens a transaction and sets `app.org_id`, `app.member_id`, `app.scope` and `app.visible_members` with `set_config(..., true)`.
- Every table with `org_id` has `ENABLE` and `FORCE ROW LEVEL SECURITY` with policy `org_id = app.current_org()`. With no tenant set, nothing is visible.
- **References stay inside one institution.** Every key between tenant tables is composite, `(org_id, x_id) → other (org_id, id)`. Foreign-key checks bypass RLS, so a plain key would let one institution point a lead at another institution's counsellor, stage or WhatsApp number (this was proved, and test T38 now guards it).
- **Data scope.** `leads` has a restrictive policy: scope `all`, the member's own walk-ins (`created_by_member_id`), or leads owned by someone in `app.visible_members` (the member alone for `own`, plus everyone below them for `team`). Every record that belongs to a lead (notes, activities, follow-ups, calls, messages, conversations, consents, payments, payment links, refunds, tickets, source touches, captures, automation runs, assignments, files and more) has a matching restrictive policy for reads and writes, so a counsellor cannot read or write anything on a lead they cannot see. Owners can be added only to visible leads, so nobody can assign themselves into a hidden lead. Notifications, saved filters, reports, dashboards and quick replies are personal unless shared.
- **System contexts** (public forms, REST API, publisher API, imports, the worker) run with `app.scope = all` and no member; the data layer limits what they return.
- **Tenant resolution.** Public routes, webhooks and API keys must find their institution before any tenant is set. Each uses one narrow `SECURITY DEFINER` function owned by `app_resolver`, a non-login role that can read only the routing columns (table below). Nothing else runs without a tenant.
- **Function-owner roles.** `app_resolver` (routing lookups and fuzzy name search), `app_platform` (creating institutions and user identities) and `app_eraser` (erasure and audit purge) never log in and only own functions. Each function sets an empty `search_path` and names every table in full. Only the worker can call the erasure functions.
- The worker connects as `app_worker` and sets the same context for the tenant it is processing. The web app may only *insert* verified webhook events; only the worker reads them.
- Supabase's `anon` and `authenticated` roles get no grants on our tables. We expose no PostgREST surface; all data goes through our server.
- Global unique constraints exist only on random tokens and provider IDs that route webhooks (Meta phone number ID while connected, WABA ID, sending domain). Lead reference numbers and receipt numbers come from per-institution counters (`org_counters`), so nothing reveals another tenant's volume.

| entry point | resolver |
| --- | --- |
| `/f/:publicKey`, `POST /api/public/forms/:publicKey` | `app.resolve_form` |
| `/pay/:shortCode` | `app.resolve_pay_link` |
| `/pay/return/:attemptRef` | `app.resolve_payment_attempt` |
| REST v1 and publisher API (`Authorization: Bearer <prefix>.<secret>`) | `app.resolve_api_key`, then a constant-time hash compare |
| `/webhooks/pay/:provider/:token` | `app.resolve_gateway_webhook` |
| Razorpay and Cashfree partner webhooks | `app.resolve_partner_account` (account id or merchant object) |
| `/webhooks/sms/...`, `/webhooks/tel/...` | `app.resolve_channel_webhook` |
| Meta webhooks | `app.resolve_wa_phone` (phone number ID), `app.resolve_waba` (account and template events), `app.resolve_meta_page` (lead ads) |
| `/webhooks/email/ses` | `app.resolve_ses_message` |
| `/webhooks/leadads/google/:token` | `app.resolve_lead_ad` |
| `/consent/:token`, `/v/:token` | `app.resolve_challenge` (sha256 of the token) |
| `/t/:trackingCode` | `app.resolve_publisher_link` |
| `/privacy/:orgSlug/...` | `app.resolve_org_slug` |
| `/unsubscribe/:token` | none: the token is base64url(org, lead, channel, address hash, issued at) plus an HMAC-SHA256 with a platform key held in KMS |
| sign-in middleware, access-token hook | `app.memberships_for_user` |

Rules the database enforces:
- One live lead per email per org: a partial unique index on `(org_id, email)` that ignores merged and deleted leads. Emails are stored lower-case as plain text, because text equality is LEAKPROOF and so can use the index under RLS (citext, ILIKE and jsonb `@>` cannot). `ON CONFLICT` must repeat the index's predicate.
- First, second and third source touches cannot be changed or deleted. A trigger blocks it; only the erasure function may scrub their click ids.
- `audit_log`, `lead_assignments` and published `automation_versions` are append-only for app roles; a published privacy notice is frozen.
- Nothing with history is deleted by app roles: leads are anonymised, members deactivated, stages, forms, templates, automations, channels and gateways disabled. Their keys are RESTRICT, so a stray delete fails instead of rewriting history.
- DPDP Rule 8(3) hold: a lead can be erased only after `erase_not_before`, which cannot be less than a year after the lead was created. Erasure (`app.erase_lead`, worker only) anonymises the lead and every record merged into it, deletes notes, activities and follow-ups, scrubs message bodies, form payloads, click ids and old audit values, and keeps the lead row, its payments and its consent records. The consent proof (s.6(10)) stays matchable by a keyed hash of the address, and an erasure certificate is written to the audit log.
- Minors: a minor always has a guardian-consent state, and can never carry a score (s.9(3)).
- At most one live automation run per subject (re-entry `once_active` or `once_ever`), one run per trigger event, and a run always points at a published, immutable automation version.
- An outbound message can be queued only once per idempotency key (outbox).
- A payment is either online (has a gateway) or offline (has a mode), never both or neither. Refunds need an approver different from the requester, cannot be approved without one, and can never add up to more than the payment.
- An SMS template must carry its DLT template ID, its single header and a DLT category that fits the header's category. Every template is classified as transactional or promotional when created; there is no default. A WhatsApp template is unique per (account, name, language).
- A WhatsApp number cannot be registered without India storage; a WABA cannot go live unless it bills in INR.
- WhatsApp broadcast retries are at least 24 h apart. Every call records a purpose (no default); a promotional call must go through the provider from a 140-series number.
- A lead has at most one primary owner; a sub-stage must belong to the lead's stage; reporting lines, teams and campuses cannot form cycles; tenants cannot change built-in activity types or reuse their codes.

Tested: `replica/tests/schema_test.sql` runs 55 numbered checks on Postgres 16, as `app_user` and `app_worker`: isolation, cross-tenant references, resolvers with no tenant, webhook ingest, sign-up, scope `own`/`team`/`all` on leads and their records, walk-ins, self-assignment, duplicates, locked sources, audit tampering, automation idempotency and versions, payment shape, refund rules, outbox idempotency, DLT rules, WhatsApp onboarding, call purpose, minors, the retention hold and erasure. Each rule was also checked by removing it and confirming its test then fails. Run:

```
psql -v ON_ERROR_STOP=1 -f replica/schema.sql -f replica/tests/schema_test.sql
```

Table groups: tenancy and access (orgs, org_counters, users, campuses, roles, members, member_attendance, teams, team_members); configuration (picklists, picklist_values, field_defs, stages, sub_stages, stage_rules); capture (publishers, publisher_costs, forms, leads, lead_owners, lead_assignments, member_assignment_counts, assignment_pools, lead_phones, lead_wa_contacts, source_touches, capture_events, verification_challenges, lead_ad_connections); opportunities (opportunity_lists, opportunities); timeline (activity_types, activities, lead_score_events, notes, event_types, follow_ups, follow_up_reminders, calls, telephony_agents); messaging (secrets, wa_business_accounts, channel_accounts, sms_headers, templates, quick_replies, notices, consents, suppressions, conversations, saved_filters, broadcasts, broadcast_recipients, messages); automation (automations, automation_versions, automation_runs, automation_steps); payments (payment_gateways, payment_products, payment_links, payments, refunds); reporting (saved_reports, dashboards); integration (webhook_events, api_keys, webhook_endpoints, webhook_deliveries); operations and compliance (jobs, files, notifications, ticket_categories, tickets, ticket_messages, audit_log, data_requests, incidents, subprocessors).

Scale plan (decided now, built when needed): `activities`, `messages`, `audit_log`, `automation_steps` and `webhook_events` grow to hundreds of millions of rows. The app generates time-ordered UUIDv7 ids for them from day one, and the hot-update tables use fillfactor 85. When any of them passes about 50 million rows it is partitioned by month on its time column; its global dedupe keys (message idempotency and provider ids, webhook dedupe) then move into small side tables, because a unique key on a partitioned table must include the partition column. Retention then drops whole partitions instead of running large deletes.

Security notes: tenant context is set only inside a transaction with `set_config(..., true)` and all SQL is parameterised. Signing the tenant context with an HMAC that the database checks would also stop an SQL-injection bug from switching tenants, but it costs a check on every row read, so it is listed as later hardening. Secrets are envelope-encrypted with AWS KMS using an encryption context of `{org_id, purpose}`, so a ciphertext cannot be decrypted for another institution even if it is copied.

## API

Staff UI calls go through server actions or `/api/app/*` route handlers; both run the same tenant-context middleware. "Who" names the permission checked in the data layer, on top of RLS.

### Public (no login)

| method path | does | who | input | output | flow |
| --- | --- | --- | --- | --- | --- |
| GET /f/:publicKey | Render the enquiry form (embeddable) | anyone | UTM and click-id query params | HTML | F01 |
| POST /api/public/forms/:publicKey | Capture an enquiry: upsert the lead, record a source touch and consent, start triggers | anyone (rate-limited per IP and form) | fields, hidden tracking, consent checkbox, Idempotency-Key | 200 + success message or redirect | F01, F02 |
| GET /pay/:shortCode | Fee summary page (S02): shows amount and product, or paid, expired or cancelled; never creates anything, so link-preview bots are harmless | anyone with the link | none | HTML | F08 |
| POST /pay/:shortCode/attempts | Start a payment: lock the link, refuse if already paid, create an attempt and redirect or post to the gateway | anyone with the link (CSRF token from the page) | none | redirect | F08 |
| GET\|POST /pay/return/:attemptRef | Browser return from the gateway; always confirm with the gateway's status API | anyone | gateway params | result page | F08 |
| GET\|POST /consent/:token | Guardian consent page for a minor: verify the guardian (OTP and Rule 10 evidence in `verification_challenges`), record the consent and set the lead's guardian status in one transaction | guardian | OTP, decision | confirmation | DPDP |
| POST /api/public/forms/:publicKey/verify; POST /api/public/verify; GET /v/:token | Send and check an email or mobile OTP, or an email link, for a new enquiry | the enquirer (rate-limited) | address; code | verified flag | F01 |
| POST /api/public/forms/:publicKey/uploads | Signed upload URL for a file field, single use, bound to the capture's Idempotency-Key | the enquirer (rate-limited) | filename, size, type | signed URL | F01 |
| GET /t/:trackingCode | Publisher tracking link: redirect to the form or landing page with `utm_source` and `pub` set | anyone | none | 302 | F01 |
| GET\|POST /privacy/:orgSlug/requests; GET\|POST /privacy/:orgSlug/withdraw | File an access, correction or erasure request (identity checked by OTP), or withdraw consent as easily as it was given; linked from every notice | the student or guardian | request; OTP | confirmation | DPDP |
| GET /unsubscribe/:token, POST same (RFC 8058 one-click) | Opt out of email: verify the token's HMAC, add a suppression and a withdrawn consent in one idempotent transaction. Promotional emails carry `List-Unsubscribe` and `List-Unsubscribe-Post` headers | recipient | none | 200 | compliance |

### Staff app (`/api/app`, signed-in members)

| method path | does | who | input | output | flow |
| --- | --- | --- | --- | --- | --- |
| POST /api/platform/orgs | Create an institution (`app.provision_org`): system roles, Untouched stage, draft notice, first admin | our staff, or self-serve trial sign-up (rate-limited) | name, slug, admin | org | F12 |
| POST /me/accept-invite; POST /me/org | Accept an invitation (invited to active); switch the active institution (re-issues the token claims) | member | invite id; org id | membership | F12 |
| GET\|PATCH /me/prefs | The member's list columns, quick filters and notification choices (updates only the caller's own row) | member | prefs JSON | prefs | F05 |
| GET /me/day | Overdue and upcoming follow-ups, untouched leads, alerts | member | none | lists | F04 |
| POST /me/check-in, /me/check-out | Attendance that gates auto-assignment | member | none | state | F01 |
| GET /leads | List with search, quick and advanced filters, columns, cursor pagination | leads.view | filter JSON, cursor, page size 10-100 | rows | F05 |
| POST /leads | Add one lead (walk-in) | leads.edit | fields, source, consent | lead | F13 |
| GET /leads/:id | Profile: header, journey, tabs | leads.view | none | lead | F03 |
| GET /leads/:id/(timeline\|messages\|calls\|payments\|follow-ups) | One profile tab, cursor-paginated | leads.view | cursor | page | F03 |
| POST /leads/:id/verify | Resend an email or mobile verification | leads.edit | channel | challenge | F01 |
| PATCH /leads/:id | Edit details (not email or mobile) | leads.edit | changed fields | lead | F03 |
| POST /leads/:id/stage | Change stage, sub-stage, owner, follow-up and remark; enforce stage rules | leads.edit | stage form | lead | F03 |
| POST /leads/:id/notes | Add a note | leads.edit | text | note | F03 |
| POST /leads/:id/follow-ups; PATCH /follow-ups/:id | Schedule; mark done, reopen or cancel | leads.edit | event form | follow-up | F04 |
| POST /leads/:id/owners | Assign, add, replace or unassign owners | leads.assign | members, mode | owners | F05 |
| POST /leads/:id/merge | Merge a duplicate into the primary record | leads.manage | other lead id | lead | F02 |
| POST /leads/:id/messages | Send email, SMS or WhatsApp (template or in-window text); checks consent, suppression and stage rules | messages.send | channel, template, variables | message | F03 |
| POST /leads/:id/calls | Click-to-call through the provider, or log a call; purpose is required (the UI defaults to promotional for leads not yet enrolled) | calls.make | purpose, outcome | call | F03 |
| POST /leads/:id/payment-links | Create and send a payment link | payments.link | product, gateway, channel | link | F08 |
| POST /leads/:id/application-status | Set application started or submitted | leads.edit | status | lead | F08 |
| POST /leads/:id/consents; POST /leads/:id/guardian-consent | Record consent or withdrawal; send a guardian consent request | leads.edit | channel, purpose, evidence | consent | DPDP |
| POST /leads/bulk | Bulk export, message, reassign, change stage, update, delete or push to webhook; runs as a job | per action | action, filter or ids | job | F05 |
| POST /uploads | Signed upload URL for an import, a file field, an email attachment or a document; records a `files` row | member (per purpose) | purpose, lead, filename, size, type | signed URL | F13 |
| POST /imports; GET /jobs/:id | Map columns of an uploaded file and run; poll progress and download the error report. Imported consents are marked `imported` and are unusable for promotional SMS until registered with the telcos | leads.import | file id, mapping | job | F13 |
| GET\|POST\|DELETE /saved-filters | Personal and shared filters | member | conditions | filter | F05 |
| GET /calendar | Follow-ups and events for a range | member | from, to, owner | events | F04 |
| GET /notifications; POST /notifications/:id/read | Alert feed | member | none | list | F01 |
| GET /conversations; POST /conversations/:id/(pick\|reply\|resolve) | WhatsApp inbox | inbox.use | status, text or template | conversation | F09 |
| POST /conversations/:id/messages/:msgId/save-to-field; CRUD /settings/quick-replies | Save a received document to a lead field; quick replies | inbox.use | field key; shortcut, body | lead; reply | F09 |
| POST /broadcasts; POST /broadcasts/:id/(schedule\|cancel); GET /broadcasts/:id | One template to a saved audience, with retries and a report | broadcasts.manage | channel, template, filter, time | broadcast | F10 |
| CRUD /automations; POST /automations/:id/(activate\|pause); GET /automations/:id/report | Workflow builder and per-step reporting | automations.manage | graph | automation | F06, F07 |
| CRUD /templates; POST /templates/whatsapp/sync | Templates per channel; pull WhatsApp templates from Meta | templates.manage | template | template | F12 |
| GET /reports/funnel, /reports/attribution, /reports/counsellors; POST /reports/query | Funnel, attribution, productivity, pivot builder; every query runs under the caller's data scope | reports.view | filters, metrics, groupings | data | F11, F14 |
| CRUD /reports/saved; POST /reports/saved/:id/export; CRUD /dashboards | Saved reports, CSV export (job, logged in the audit log), dashboards and team presets | reports.view | definition; widgets | report; job | F14 |
| GET /payments; POST /payments/offline; POST /payments/:id/approve; POST /refunds; POST /refunds/:id/approve | Payments list, offline entry and approval, refunds (maker-checker, capped at the payment) | payments.manage | payment data | payment | F08 |
| POST /payments/statements | Upload a bank statement for SBI Collect or ICICI Eazypay and match it to payment links | payments.manage | file id | matches | F08 |
| CRUD /opportunity-lists; POST /opportunities; GET\|PATCH /opportunities/:id; GET /opportunities | Opportunities | opportunities.* | list rules, fields | opportunity | F02 |
| CRUD /settings/fields, /settings/picklists, /settings/stages, /settings/stage-rules, /settings/lead-rules, /settings/forms, /settings/publishers, /settings/notices, /settings/event-types, /settings/lead-ads | Configuration. Stages, fields, forms and templates are disabled, never deleted; a published notice is frozen and changes publish a new version. UTM buckets live in `orgs.settings.utm_buckets` | settings.* | config | config | F12 |
| CRUD /settings/users (invite), /settings/roles, /settings/teams | Access control | users.manage | user, role, team | records | F12 |
| POST /settings/channels/whatsapp/embedded-signup | Finish Embedded Signup: exchange the code server-side, check with the business token that the WABA and phone number IDs the browser sent belong to it, subscribe our app to the WABA, set storage to India, register the number with a generated 6-digit PIN (stored in `secrets`, purpose `whatsapp_2fa_pin`), check the WABA currency, then wait for the customer's payment method and display-name approval (re-register within 14 days of approval) | channels.manage | code, waba_id, phone_number_id | channel state | F12 |
| CRUD /settings/channels/(sms\|email\|telephony) | Credentials, DLT headers, sending domain (returns DNS records), telephony agents | channels.manage | settings | channel | F12 |
| CRUD /settings/payments; GET /oauth/razorpay/start | Gateway connect (keys or OAuth), payment products | payments.settings (finance admin) | credentials | gateway | F12 |
| CRUD /settings/api-keys, /settings/webhooks | API keys (shown once) and outbound webhooks | integrations.manage | scopes, url, events | records | F12 |
| GET /settings/audit; CRUD /data-requests; CRUD /incidents | Audit log, DPDP requests desk, breach register | compliance.* | filters | records | DPDP |

### REST API v1 (institution integrations and publishers; API key in `Authorization: Bearer`)

| method path | does | who | input | output | flow |
| --- | --- | --- | --- | --- | --- |
| POST /api/v1/leads | Create or update, matched on email or mobile (`match: email\|mobile`), with an `Idempotency-Key` header | key with leads:write | fields, source | lead id, created or updated | F01 |
| POST /api/v1/leads/bulk | Up to 100 upserts with per-record results | leads:write | records | results | F13 |
| GET /api/v1/leads/:id; PATCH /api/v1/leads/:id; GET /api/v1/leads?updated_since= | Read, partial update, sync. The sync cursor is (updated_at, id); the server re-reads from 5 minutes before the cursor and de-duplicates, because a long transaction can commit rows with an earlier timestamp. Owner and consent changes bump the lead's updated_at | leads:read/write | fields | lead(s) | sync |
| POST /api/v1/leads/:id/activities | Record a custom activity (webinar attended, course progress) | activities:write | type code, fields | activity | F07 |
| POST /api/v1/leads/:id/application-status | Application started or submitted, from an external form system | leads:write | status, time | lead | F08 |
| GET /api/v1/activities?from=&to= | Activity export (window at most 30 days) | activities:read | range | page | sync |
| GET /api/v1/fields; GET /api/v1/picklists; GET /api/v1/users; GET /api/v1/teams | Field keys, picklists, users and teams | key | none | metadata | sync |
| POST /api/v1/publisher/leads | A publisher pushes leads; tagged channel=publisher; daily cap checked | publisher key (an `api_keys` row with `publisher_id`) | fields | id | F01 |

Route count: about 120 handlers (about 75 rows above, several of which cover CRUD sets).

### Webhooks in

All provider callbacks are verified against the raw request bytes, written to `webhook_events` (deduplicated by `(source, external_event_id)`), acknowledged with 200, and processed by the worker. Meta has no event ID and batches up to 1,000 changes per POST (batching is not guaranteed), so each POST is split into one row per change, keyed by `wamid` (inbound), `wamid:status` (statuses) or sha256(waba_id|field|value) (others). Keys are kept at least 8 days, longer than Meta's 7-day retries; raw payloads are purged once processed (see `webhook_events_purge`).

| endpoint | verification | routing to tenant |
| --- | --- | --- |
| GET\|POST /webhooks/meta | Verify handshake; `X-Hub-Signature-256` = HMAC-SHA256(raw body, app secret), constant-time compare | WABA ID / phone number ID → `channel_accounts`. Unknown IDs go to a dead-letter list. Overrides per WABA are not used, because template and account events always go to the app URL |
| POST /webhooks/pay/:provider/:webhookToken | Per gateway: Razorpay hex HMAC-SHA256 with the webhook secret (OAuth connections: the checkout return signature is HMAC-SHA256(order_id\|payment_id) with our OAuth client secret, and Checkout uses the `public_token`); Cashfree base64 HMAC-SHA256(timestamp+body) (partner webhooks: with the partner API key); PayU reverse SHA-512 hash (`sha512(SALT\|status\|\|\|\|\|\|udf5\|udf4\|udf3\|udf2\|udf1\|email\|firstname\|productinfo\|amount\|txnid\|key)`); Easebuzz reverse SHA-512 hash (sequence unverified, see open questions); HDFC Basic auth. Always confirmed by a status API call before a payment is marked successful | unguessable token → `payment_gateways` |
| GET /oauth/razorpay/callback; POST /webhooks/razorpay-partner; POST /webhooks/cashfree-partner | OAuth code exchange; partner-level webhooks: payments of connected merchants and events such as `account.app.authorization_revoked` | `state`; then `razorpay_account_id` or Cashfree's `merchant` object → `payment_gateways` |
| POST /webhooks/sms/:provider/:webhookToken | Shared secret or provider signature where offered | token → `channel_accounts` |
| POST /webhooks/email/ses | SNS message signature | SES message id → `messages` |
| POST /webhooks/tel/:provider/:webhookToken | Token in path plus a custom header secret where the provider allows it (no signing found for Exotel or Smartflo) | token → `channel_accounts`; call matched by our call id, else by provider call id |
| POST /webhooks/leadads/google/:token | Google Ads lead-form `google_key`, compared with the key stored for the connection | token → `lead_ad_connections` |
| GET\|POST /webhooks/meta-leadgen | Same app secret signature as /webhooks/meta; the page `leadgen` event is fetched with the page token, then captured | page id → `lead_ad_connections` |

### Webhooks out

`lead.created`, `lead.updated`, `lead.stage_changed`, `lead.assigned`, `application.status_changed`, `payment.succeeded`, `activity.recorded`. Each is signed with `X-CRM-Signature: sha256=<HMAC of body>` using the endpoint secret and carries an event id. Retries back off over 24 h (`webhook_deliveries`), then the delivery is marked dead.

### Jobs (Graphile Worker in Mumbai; per-tenant concurrency through per-org queues)

| job | schedule | what it does |
| --- | --- | --- |
| process_webhook_event | on insert | Route to the tenant, apply idempotently: message status by rank (sent < delivered < read; failed is terminal; never downgrade), inbound messages, template status and quality, payments, calls, bounces |
| copy_inbound_media | immediately on an inbound media message | Download from Meta (URLs expire in 5 minutes) into `{org_id}/media/` |
| run_triggers | after every capture or update | Match active automations, create runs on the current published version (unique per trigger event) |
| apply_score | on stage change and activity insert | Add `stages.score_delta` or `activity_types.counts_for_score`, log a `lead_score_events` row; never for minors |
| automation_tick | every minute | Advance due runs (`next_run_at <= now()`) one node at a time on the graph of the run's own version; record steps |
| automation_schedule_scan | hourly | Start runs for date-field and interval triggers |
| send_message | outbox rows (claimed queued → sending in its own commit; a stale 'sending' row is reconciled or marked unknown, never re-sent) | Check suppression, the WhatsApp window and quiet hours. Minors: nothing until a guardian is verified, and never promotional. SMS in the promotional or explicit-service category: a consent registered with the telcos (`tsp_registered_at`), or an enquiry stored less than 7 days ago (TCCCPR 2026). Then call the provider and store the provider id |
| broadcast_fanout, broadcast_retry | on schedule; retry every 8-48 h (WhatsApp: at least 24 h, and never retry error 131049 sooner), up to 5 times; WhatsApp marketing templates are never sent to +1 (US) numbers, which Meta does not deliver to | Expand the audience, enqueue sends at the channel's rate (WhatsApp 80 msg/s per number by default, 20 for coexistence numbers) |
| whatsapp_template_sync | on webhook, plus nightly | Reconcile templates with Meta, because institutions can edit them in WhatsApp Manager |
| whatsapp_health | daily, plus on account webhooks | Messaging limit, quality, display name, payment method, currency; alert admins |
| payment_reconcile | every 5 minutes for attempts pending or unknown; daily for the whole day | Status API polling with back-off; reconcile against the gateway. A success on an expired or already-paid link is recorded and flagged for refund review |
| payment_link_expire | every 5 minutes | Mark links past `expires_at` expired and cancel them at the gateway |
| payment_reminders | daily | Remind leads about unpaid links and failed or pending attempts |
| oauth_refresh | daily | Refresh Razorpay tokens older than 60 days (access expires at 90 days, refresh at 180) |
| follow_up_reminders | every minute | Claim due rows of `follow_up_reminders` (`update ... set sent_at = now() ... returning`) and send in-app, email and push reminders, so nothing is sent twice |
| auto_checkout | every 5 minutes | Check members out at their set time (org time zone) |
| score_percentiles | nightly per org | Recompute lead score percentiles |
| import, export, bulk_* | on request | File imports with an error report; bulk actions; exports logged in `audit_log` |
| webhook_delivery | on insert, plus retries | Outbound webhooks |
| email_domain_verify | hourly until verified | DKIM/SPF/DMARC check through SES |
| telephony_refetch | 2-5 minutes after a terminal call event | Fetch final duration and copy the recording into India storage (`recording_path`); the provider URL is never stored or shown |
| retention_purge | nightly | Move expired or withdrawn records to restricted (blocked from all business use) and set `erase_not_before` = the later of last processing + 1 year and any legal hold; send the 48-hour warning; after that date call `app.erase_lead` (anonymise in place); purge audit rows past retention with `app.purge_audit` (never younger than 1 year); record certificates |
| webhook_events_purge | nightly | Delete raw payloads of processed rows older than 8 days; keep the dedupe key |
| dlt_lifecycle | daily | Warn about SMS templates unused for 80 days or more (operators deactivate them at 90) and DLT self-certification due within 30 days |
| data_request_due | daily | Remind the institution about requests near their deadline |
| challenge_expire | hourly | Delete expired verification and guardian-consent challenges |
| storage_purge | nightly | Delete Storage objects of erased leads (files, recordings, media) and their `files` rows |

## The parts that bite

- **Time zones:** store UTC. Each org has a time zone (default Asia/Kolkata). Follow-ups store their own time zone. Auto check-out runs on org local time. Promotional SMS and calls use a configurable quiet-hours window, default 09:00-21:00 Asia/Kolkata for +91 recipients whatever the org's time zone (unverified industry practice: no TRAI text found; confirm with the provider).
- **Idempotency:** Meta retries webhooks for up to 7 days and batches them; gateways and SMS providers retry too. `webhook_events` dedupes. Sends use an outbox key written *before* the provider call. Automation runs are unique per trigger event. Refunds use our own `refund_ref`.
- **Races:** two submissions of the same enquiry at once are resolved by the partial unique index plus `INSERT ... ON CONFLICT (org_id, email) WHERE email IS NOT NULL AND merged_into_id IS NULL AND deleted_at IS NULL`. Mobile-only leads use a transaction-scoped advisory lock on `(org, mobile)`. Round-robin keeps one `assignment_pools` row per eligible member and takes the least recently used free one with `FOR UPDATE SKIP LOCKED`, so two simultaneous leads get different counsellors instead of one getting none. Daily and weekly quotas use `member_assignment_counts` (an upsert that refuses past the quota), so two assignments cannot both take the last slot. Two payment attempts on one link are serialised by locking the link row.
- **Rate limits:**
  - WhatsApp allows 80 msg/s per number (1,000 after an upgrade, 20 for coexistence). Each portfolio starts at 250 unique users per moving 24 h messaged outside a customer-service window, shared across its numbers. It rises to 2,000 through business verification, partner verification, or 2,000 high-quality templates in 30 days, then scales automatically to 10K, 100K and unlimited. Read `whatsapp_business_manager_messaging_limit` (`messaging_limit_tier` is deprecated). Error 131049 means do not retry that user for 24 h.
  - **No real institution can be onboarded until App Review (Advanced Access) and Access Verification pass**: management calls on WABAs we do not own fail with error 200 before that. After Business Verification, App Review and Access Verification, the cap is 200 new institutions per rolling 7 days (10 by default); more needs Meta Business Partner status.
  - SMS and telephony providers throttle. Exotel's page reads 20 calls per minute live and 200 in a cached copy, so plan for 20 until Exotel confirms.
- **File and body sizes:** Vercel bodies are limited to 4.5 MB, so uploads go straight to Storage with signed URLs. Email attachments are capped at 5 MB as our own product choice (not a provider limit). WhatsApp limits: images 5 MB, video and audio 16 MB, documents 100 MB.
- **Search:** email and mobile exact match or prefix (`^@`) use plain btree indexes, because text equality and prefix are LEAKPROOF and work under RLS. Name search goes through `app.search_lead_ids` (trigram index, explicit org filter), and the results are read back through RLS so data scope still applies. Custom-field filters scan the tenant until a field needs a typed side table.
- **Realtime:** the inbox and the notification bell use Supabase Realtime broadcast on private channels `org:{id}:member:{id}`, authorised by the policy in `schema_supabase.sql` from the access-token hook's claims. Messages carry ids only; data still comes from our API.
- **Offline:** none in v1 (web). The phase-2 mobile app may queue actions offline.
- **Email deliverability:** one verified domain per institution with DKIM, SPF and DMARC. Bulk email is blocked until DMARC exists. One-click unsubscribe (RFC 8058) plus a visible link on every promotional template, applied immediately (Gmail requires within 48 h). Warn at a 0.1% spam rate; pause broadcasts automatically at 0.3% (above it Gmail offers no mitigation until 7 clean days).
- **Multi-tenancy:** FORCE RLS on every tenant table; composite same-org keys; tenant resolution only through the resolver functions; app roles have no BYPASSRLS; tenant context is set only with `set_config(..., true)` inside a transaction. A CI check fails the build if any table with `org_id` lacks RLS, or if any foreign key from such a table leaves out `org_id`. Every job queue is per org so one university's campaign cannot starve the others. Restoring a single tenant needs a side restore of the backup (point-in-time recovery restores the whole database), so build per-tenant export early.
- **DPDP (Digital Personal Data Protection Act):**
  - Institutions are Data Fiduciaries and we are their Data Processor. Most duties start **13 May 2027** (Rules 3, 5-16, 22-23). Press reports from early 2026 say MeitY may cut this to 13 Nov 2026, possibly only for Significant Data Fiduciaries; nothing was notified as of 5 Oct 2026. Treat it as a risk and watch the Gazette. From 13 Nov 2026 Consent Managers can register (Rule 4), so the consent ledger should accept their artefacts once the Board publishes the interoperability standard.
  - Under-18 leads: until a guardian is verified (s.9(1), Rule 10), keep only what is needed to confirm age and run the Rule 10 check (Fourth Schedule Part B); no assignment, calls, messages or enrichment. Even after guardian consent, s.9(3) bars tracking, behavioural monitoring (engagement scoring, open and click tracking, attribution profiling) and targeted advertising directed at the child. Only the Fourth Schedule Part A exemption (educational activities or safety of enrolled children) lifts this; whether it covers applicants is for counsel (our reading: it does not).
  - Breaches: CERT-In within 6 h of noticing (in force now; ours and the institution's). DPDP Rule 7 (from 13 May 2027, the institution's duty): every breach, with no threshold; the Board and affected people told without delay; a detailed report to the Board within 72 h of becoming aware. Our DPA commits to telling the institution well inside 6 h.
  - Retention: personal data, related traffic data and processing logs are kept at least 1 year from processing (Rule 8(3)), including after an erasure request, in a restricted state that blocks all business use; then erased unless another law needs longer. The retention setting cannot go below 365 days. CERT-In logs: 180 days in India.
  - A sub-processor register (vendor, purpose, data categories, storage and processing region) feeds the DPA and every access response (s.11(1)(b)).
  - Each institution needs our standard Data Processing Agreement.
- **TRAI (telecom regulator):**
  - Promotional SMS needs consent, or a recipient who is not on DND. Each template is registered in one category; 5 templates blacklisted for wrong category suspend sending for 1 month or until all templates are re-verified, whichever is later.
  - DLT template rules: at least 30% fixed text; at most 3 tagged variables unless justified; templates unused for 90 days lapse; headers and templates must be self-certified every year; consent templates are registered and consent is sought through 127xxx; consent cannot be re-sought for 90 days after an opt-out. A broken PE-TM chain fails sends silently, so we store its status.
  - **TCCCPR Third Amendment (18 Sep 2026; commencement dates not yet confirmed):** promotional or explicit-service SMS to an enquirer without registered consent only within 7 days of a stored, verifiable enquiry; imported or legacy consents are unusable until registered on the telcos' consent platform; a misused header or template is suspended within 6 h; complaints trigger action at 3 in 10 days if AI-flagged (otherwise 5); a first violation bars all the institution's telecom resources for 15 days, and a repeat disconnects them for 1 year and blacklists the sender. A2P voice calls must be pre-declared.
  - Calls: until counsel says otherwise, every counsellor call to a lead who is not an enrolled student is treated as promotional: it goes through the provider from a 140-series number, never from a personal mobile (`tel:` links are for service calls only, and a breach can bar all the institution's numbers for 15 days). Purpose is chosen per call, defaulting in the UI to promotional for leads not yet enrolled. Promotional dial lists are scrubbed against DND unless explicit consent is recorded. Caller IDs per purpose are configuration, because 1601 may reach education with about 90 days to migrate.
- **RBI:** we never collect, hold, split or net funds. The SaaS fee is billed separately. Otherwise we would fall under the Payment Aggregator Directions of 15 Sep 2025.
- **WhatsApp specifics:**
  - Set `data_localization_region=IN` *before* registering each number; changing it later means deregistering.
  - Local storage covers message content at rest only. Meta may still process it abroad for up to 60 minutes (90 minutes for the Marketing Messages API), and contact-book numbers are stored at Meta whatever the setting. Turn the contact book off and disclose both in the DPA. Call recordings are copied into India storage; provider recording URLs (Exotel's are in Singapore) are never shown.
  - Customers whose Billing Hub Sold-To country is India must move every WABA to INR by **31 Dec 2026** (WABA Currency Migration API, available since 1 Jun 2026). From 1 Jan 2027 Meta stops delivering from their non-INR WABAs. Onboarding reads the WABA currency and blocks go-live, or starts migration, if it is not INR. Whether Tech Provider clients count as "eligible customers" is open.
  - Meta may re-categorise a template (utility to marketing) and the institution then pays the higher rate.
  - Broadcast fan-out budgets against the portfolio's messaging limit (unique users outside the service window per moving 24 h, shared by all its numbers), not per number.
  - A Meta page says non-template and in-window utility messages are charged from 1 Oct 2026, but the main pricing page says they are free. Confirm before quoting costs.
- **Card data:** only gateway-hosted pages, redirects or gateway JS SDKs; never our own card forms. This keeps us out of PCI-DSS scope.
- **Secrets:** a leaked gateway key can refund an institution's money. Fields are write-only in the UI; the web role cannot update or delete secrets, only add a new version. Decryption happens only in the worker or payment code, uses a KMS encryption context of `{org_id, purpose}`, and every decrypt is audited. Prefer OAuth (Razorpay) where it exists.
- **Erasure:** anonymise, never delete (see Schema). Payments stay as financial records with their gateway payload removed; how long fee records must be kept by law is open question 13.

## Build order

Start these on day 1, outside the code, because they take weeks:
1. Meta Business Verification, then App Review for `whatsapp_business_messaging` and `whatsapp_business_management` (one screen recording per permission). Requesting Advanced Access starts Access Verification as a Tech Provider at the same time. M2 cannot onboard a real institution until all three pass.
2. Razorpay Technology Partner application, for OAuth.
3. SES production access in ap-south-1, and a check that SES and its tenant management are available there.
4. Supabase log drain to India storage and NTP sync (CERT-In applies from the first tenant).
5. A lawyer: Data Processing Agreement, privacy policy, a note on whether the RBI Payment Gateway definition places any duty on us, the coaching-institute question under DPDP, whether the Fourth Schedule exemption covers applicants, and the TCCCPR 2026 rules for counsellor calls.
6. A survey of the first 10-20 pilot institutions: which payment gateway, SMS provider and telephony provider they use today. This decides the adapter order.
7. Check on a Supabase branch that the migration role can create the BYPASSRLS function-owner roles, and that `schema_supabase.sql` applies.

**Vertical slice (about 2-3 weeks):** create an institution (`POST /api/platform/orgs`) → sign in (S03) → enquiry form settings (S31) → public form (S01) through `app.resolve_form` → capture upsert with duplicate check and attribution → round-robin assignment from an `assignment_pools` pool and an in-app alert → lead list (S05) → profile (S08) → change stage with sub-stage and follow-up (S09, S11) → send an email from a template (S10) → my day (S04) → funnel count (S21). Tables: orgs, org_counters, users, roles, members, teams, team_members, stages, sub_stages, field_defs, forms, leads, lead_owners, lead_assignments, assignment_pools, member_assignment_counts, source_touches, capture_events, consents, notices, activities, notes, follow_ups, follow_up_reminders, templates, channel_accounts (email), suppressions, messages, notifications, automations, automation_versions, automation_runs, automation_steps, audit_log. Routes: `/api/platform/orgs`, `/f/:publicKey`, `POST /api/public/forms/:publicKey`, `/api/app/leads*`, `/api/app/follow-ups/:id`, `/api/app/templates`, `/api/app/settings/forms`, `/api/app/settings/channels/email`, `/api/app/me/day`, `/api/app/me/check-in`, `/api/app/reports/funnel`, `/api/app/notifications`; resolvers `app.resolve_form` and `app.memberships_for_user`.

**Milestones for the must-haves** (every must row in `features.csv` is listed under one; generated, so none can be skipped):

**M1** (37): Embeddable enquiry form with configurable fields; Hidden capture of UTM params, gclid/fbclid, referrer and landing URL on form submit; Add a single lead by hand; Lead origin tag: offline, online, API, telephony, form widget, chat; Traffic channel tag: direct, publisher, social, organic, referral, other, telephony, offline, paid ads, chat; Email is the unique key: a repeat enquiry updates the existing lead; Repeat enquiry with a new mobile saves it as an alternate mobile; Registration attempts counter and last attempt date; First, second, third and latest source kept per lead; first three locked; Untouched marker on leads nobody has acted on yet; Lead list, newest first, 10 to 100 rows per page; Search leads by email, mobile, name, short user ID or lead ID; Choose and reorder list columns; Profile header: stage, verified contacts, created and last-engaged times, score, owner, source, next follow-up, message counts; Details tab, editable by the owner except email and mobile; Timeline of every action on the lead, with actor and time; Notes on a lead; Configurable lead stages with sub-stages; Per stage: follow-up required, sub-stage required; Enable, disable and reorder stages; Change-stage dialog sets sub-stage, owner, follow-up date and remark in one step; Assign or reassign a lead from its profile; Round-robin auto-assignment across chosen counsellors; Notify the counsellor when a lead is assigned; Schedule a follow-up (date and time) from the lead profile; My follow-ups: overdue and upcoming; Send an email from the lead profile; Template manager per channel with merge tokens and preview; Enquiry-to-enrolment funnel; In-app notification feed (bell); Invite users with role and team; set active or inactive; Built-in roles: admin, manager, counsellor, support staff; Teams with a reporting hierarchy; managers see their reports' work; Data visibility follows the team hierarchy (managers see their reports' records); Multi-tenant accounts, one per institution; Consent ledger with versioned privacy notices per institution; All personal data, backups and logs hosted in India.

**M2** (10): Communication log with delivery and engagement metrics per channel; Send an SMS from the lead profile; Send a WhatsApp template message from the lead profile; SMS templates carry their DLT template ID and registered sender ID (India); Connect a WhatsApp Business API number (embedded sign-up); WhatsApp templates with category and Meta approval status; Receive inbound WhatsApp messages and attach them to the matching lead; WhatsApp chat history on the lead profile; WhatsApp numbers set to store message data in India before registration; SMS sends check the 7-day enquiry window or a telco-registered consent.

**M3** (7): Record application status on the lead (started, submitted) via API, inbound webhook or manual update; Journey milestones: unverified, verified, application started, payment approved, application submitted, token fee paid (enrolled); Payment products such as application fee and token fee; Generate a payment link from the lead profile and send it by WhatsApp, SMS or email; Hosted checkout through the institution's payment gateway; Payment statuses: initiated, pending, approved/success, failed, refunded; A successful payment updates the lead journey and can start automations.

**M4** (8): Rule-based auto-assignment on source, location, course, score and other fields; Workflow builder: trigger, conditions, actions; Triggers: lead created, lead updated, stage changed, field changed; Condition matching all or any, with if/else branches; Wait/delay step; Action: send email, SMS or WhatsApp; Action: assign counsellor (round robin, replace or add); Automation list with on/off status.

**M5** (21): Bulk import leads from a file; Create lead through public REST API with account API keys; Create-or-update lead through API, matched on email or mobile; Email and mobile verification of new leads with verified/unverified status; Quick filter bar that each user can edit; Advanced filters with AND/OR conditions on any field; Bulk export selected leads with chosen columns; Bulk send a message to selected leads; Bulk reassign owners: add owners or replace them; Bulk change lead stage; Custom lead fields: text, dropdown, paragraph, email, mobile, date, file upload, with validation; Bulk send with per-recipient merge tokens; Opt-out and unsubscribe handling per channel; Click-to-call through the counsellor's own phone, logged to the timeline with an outcome; Attribution dashboard: channel to source to campaign, with funnel counts; Counsellor productivity: calls, follow-ups, assigned and engaged leads, by person and team; Verified parental consent before processing applicants under 18; no tracking, scoring or targeted marketing of minors; Data requests desk: access, correction, erasure, consent withdrawal; Retention settings and erasure jobs per institution and data category; Breach register: CERT-In within 6 h; Board and individuals without delay; Board detailed report within 72 h; Call purpose tag and 140-series caller ID for promotional calls.

M1 = core CRM, including tenant resolution, sign-up, invitations and the score job for stage changes; M2 = messaging channels: WhatsApp (needs Meta approval from step 1) and SMS with DLT, because M3 and M4 send by both; M3 = payments; M4 = automation; M5 = the rest of capture, the lead manager, calling through the first telephony provider (with call purpose and 140-series caller IDs), the attribution and productivity reports, and compliance. **Launch gate:** M1-M5 complete and the schema tests green. DPDP items are not optional for paying customers.

**Should-haves (M6),** grouped by screen:
- Inbox (S15), broadcasts (S16), calendar (S12), opportunities (S26, S27).
- More telephony providers and agent mapping; email builder; custom roles and masking; 2FA; audit log (S38).
- Outbound webhooks; pivot report builder (S22) and dashboards (S21).
- Publishers (S41); multi-campus roll-ups; offline payments, approval, reminders and receipts.
- Unassign; opportunity routing rules; WhatsApp broadcasts and health panel; bank-portal payments; lead score percentiles and activity weights; sub-processor register; DLT lifecycle warnings.

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
7. How long does a WhatsApp business token last, what revokes it, and how long is the Embedded Signup code valid?
8. Can a number send while its display name is pending?
9. Which DigiLocker or other authorised-entity age-token APIs can a private Data Fiduciary use for Rule 10?
10. Easebuzz transaction-webhook reverse-hash sequence (unverified; confirm before coding the verifier).
11. Is SES itself, not only its tenant management, available in ap-south-1?
12. Can existing Cashfree or PayU merchants be linked through a partner account?
13. Legal retention periods for admission and fee records (UGC, AICTE, school boards, tax law). These set the retention defaults.
14. Can one Supabase project hold many SAML identity providers?
15. When do the TCCCPR Third Amendment rules commence, and how are legacy consents registered with the telcos?
16. Is a counsellor's call to an enquirer promotional or service under TCCCPR?
17. Do Tech Provider clients count as Meta's "eligible customers" for INR billing, and does Embedded Signup create INR WABAs for India Sold-To businesses?
18. Is there a current TRAI or operator time-of-day window for promotional SMS and calls?

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

