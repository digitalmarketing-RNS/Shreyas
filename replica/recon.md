# Recon map: Meritto Education CRM (web app, plus counsellor mobile app)

Scope: **confirmed by the owner on 2026-10-05.** The Education CRM's core loop, from first enquiry to paid enrolment: capture and attribution, lead list and profile, stages, assignment, follow-ups, email/SMS/WhatsApp, automation, payment links for application and token fees, and the funnel, attribution and counsellor reports. Not in scope: Meritto's separate Application product (form builder, student portal), Post-Application (interviews, merit lists, offers), the full fee-management product (Collexo), the AI agents (Mio AI), and voice broadcast. The mobile app is phase 2.
For: **confirmed.** A multi-tenant CRM sold to many Indian education institutions (colleges and universities, coaching institutes, K-12 schools, study-abroad consultants).
Payments: **confirmed.** Each institution keeps the payment gateway it already uses; we integrate several gateways behind one adapter.
WhatsApp: **confirmed.** Official Meta WhatsApp Business Platform (Cloud API). Each institution connects its own WhatsApp Business account through our app (Embedded Signup).
Platform: web first. Meritto also has Android and iOS apps ([66], [67]).
Date: 2026-10-05

## How this was researched

Public sources only. Nobody signed in, signed up, submitted a form or asked for a demo. Pages were fetched one at a time with automated fetch tools (Firecrawl, WebFetch), and some fetches were retried after rate limits. There was no site-wide crawl. Eight readers each worked from a fixed list of public pages, capped at 9 to 15 each, about 70 pages in all. The lead researcher read three more pages directly: [1], [68] and [69]. For the enquiry widget embedded on Meritto's own pages (served from widgets.nopaperforms.com), the rendered page markup was read to list its visible and hidden field names. Nothing was submitted, no network traffic was captured, and no JavaScript bundles or private endpoints were inspected. Their text, images and code were not copied. Everything below describes what the product does, in our own words. Exact UI labels are kept only where they are facts about the interface (field names, status values). Each row in `features.csv` gives its source URL.

**Terms of service ([69], read directly).** The terms say they apply to anyone who accesses or visits the site. Their acceptable-use section is written for customers: a customer may not "reverse engineer the Services or the Software or access the Services to (a) build a competitive product or service, or (b) copy any features, functions, or graphics of the Services", and may not scrape, crawl or otherwise copy the platform by automated or similar means. Whether any of this binds someone who only reads public pages is a legal question this recon does not answer. Our own rules apply either way:
- No Meritto customer account may be used for this project, by you or anyone on the team. Public pages only. No site-wide crawling.
- Their names stay out of our product because of trademark risk: Meritto, NoPaperForms (NPF), Collexo, Mio AI, Niaa, Echo, Echo Bubble, Zing, Amplify, METS, Calendar Pro, Pixi, One View Lead Profile, Mutually Exclusive Impact (MEI), Lead Strength, Enrollment Cloud, Meritto Secure, and "Education CRM" used as a product name. So do their screenshots, copy and templates. `/replica-brand` sweeps for these before launch.
- This is not legal advice. Before you sell the product, a lawyer should read their terms against your plans.

## Sources

| # | type | URL | what it gave us |
| --- | --- | --- | --- |
| 1 | marketing site | https://www.meritto.com/education-crm/ | product overview: modules, verticals, suite map (read directly) |
| 2 | marketing site | https://www.meritto.com/education-crm/lead-management-system/ | capture sources, dedupe, PST attribution, verification, score, filters, allocation |
| 3 | marketing site | https://www.meritto.com/education-crm/campaign-management-system-for-higher-education/ | campaign dashboard, channels, sole-source metric, cost KPIs, publisher throttle |
| 4 | marketing site | https://www.meritto.com/education-crm/admission-marketing-publisher-panel/ | external publisher dashboards |
| 5 | marketing site | https://www.meritto.com/education-crm/admission-remarketing-tools-integration/ | Google/Meta audience sync |
| 6 | marketing site | https://www.meritto.com/education-crm-for-enrollment-marketing-team/ | marketing-team overview |
| 7 | marketing site | https://www.meritto.com/university-channel-partner-crm/ | channel-partner variant |
| 8 | marketing site | https://www.meritto.com/education-crm/opportunity-manager/ | opportunities under one lead |
| 9 | marketing site | https://www.meritto.com/education-crm/user-management/ | roles, teams, masking, SSO, audit |
| 10 | marketing site | https://www.meritto.com/crm-software-for-sales-counseling-teams/ | allocation criteria, quotas, calling, sales reports |
| 11 | marketing site | https://www.meritto.com/education-crm-for-admission-management-teams/ | admissions-team overview |
| 12 | marketing site | https://www.meritto.com/real-time-sales-enrollment-notification-alert-zing/ | real-time notifications |
| 13 | marketing site | https://www.meritto.com/calendar-pro/ | events and follow-ups calendar |
| 14 | marketing site | https://www.meritto.com/dynamic-activity/ | custom activity types |
| 15 | marketing site | https://www.meritto.com/mobile-app/ | mobile CRM |
| 16 | marketing site | https://www.meritto.com/education-crm/lead-nurturing/ | channels, lead profile, email builder |
| 17 | marketing site | https://www.meritto.com/education-crm/marketing-automation-for-educational-institutions/ | drip workflow triggers and actions |
| 18 | marketing site | https://www.meritto.com/education-crm/whatsapp-business-api-for-education/ | WhatsApp broadcasts, templates, retries, onboarding |
| 19 | marketing site | https://www.meritto.com/whatsapp-live-chat-for-education-organizations/ | shared WhatsApp inbox |
| 20 | marketing site | https://www.meritto.com/meritto-engagement-and-transactional-system/ | prepaid messaging credits |
| 21 | marketing site | https://www.meritto.com/amplify-voice-broadcast-solution-for-education-organizations/ | voice broadcast |
| 22 | marketing site | https://www.meritto.com/enquiry-to-enrolment-reports-analytics-for-education-industry/ | report builder, dashlets, funnel |
| 23 | marketing site | https://www.meritto.com/education-payment-platform-for-finance-teams/ | finance/payments overview |
| 24 | marketing site | https://www.meritto.com/extensions-and-integrations/ | integration catalogue |
| 25 | marketing site | https://www.meritto.com/security/ | security controls (non-functional requirements) |
| 26 | marketing site | https://www.meritto.com/chatbot-for-education/ | chatbot (read as a summary only) |
| 27 | marketing site | https://www.meritto.com/education-crm-for-management-teams/ | management dashboards, attribution |
| 28 | marketing site | https://www.meritto.com/education-crm-for-it-teams/ | ERP connector, JSON validator |
| 29 | sister product site | https://www.getmio.ai/ | AI agents layer |
| 30 | sister product site | https://www.collexo.com/payment-cloud/fee-management/ | fee management (out of slice) |
| 31 | sister product site | https://www.collexo.com/payment-cloud/fee-collection/ | fee collection channels and statuses |
| 32 | marketing site | https://www.meritto.com/application-management-software/ | suite split: CRM vs Application vs Post-Application |
| 33 | marketing site | https://www.meritto.com/application-management-software/admission-application-manager/ | application console (out of slice) |
| 34 | marketing site | https://www.meritto.com/application-management-software/advanced-online-form-builder/ | form builder (out of slice) |
| 35 | marketing site | https://www.meritto.com/application-management-software/student-admission-portal/ | student portal (out of slice) |
| 36 | marketing site | https://www.meritto.com/application-management-software/admission-form-payment-manager/ | application fee payments, vouchers |
| 37 | marketing site | https://www.meritto.com/application-management-software/student-query-management-system/ | query tickets (read as a summary only) |
| 38 | marketing site | https://www.meritto.com/post-application-automation/ | post-application modules (read as a summary only) |
| 39 | help center | https://help.meritto.com/portal/en/kb/product-guide | module map: section and article titles |
| 40 | help center | https://help.meritto.com/portal/en/kb/getting-started | setup sections and titles |
| 41 | help center | https://help.meritto.com/portal/en/kb/how-to-s | how-to sections and titles |
| 42 | help center | https://help.meritto.com/portal/en/kb/product-guide/leads | leads article list |
| 43 | help center | https://help.meritto.com/portal/en/kb/getting-started/setting-up-your-workspace | workspace setup titles (users, permissions, 2FA, audit) |
| 44 | help center | https://help.meritto.com/portal/en/kb/articles/lead-manager-an-overview | lead list, search, filters, 11 bulk actions |
| 45 | help center | https://help.meritto.com/portal/en/kb/articles/untitled | lead glossary: origins, channels, attribution, field catalogue |
| 46 | help center | https://help.meritto.com/portal/en/kb/articles/one-view-lead-profile-27-2-2025 | lead profile: summary, journey, tabs, actions |
| 47 | help center | https://help.meritto.com/portal/en/kb/articles/lead-allocation-in-meritto-crm-11-3-2025 | manual and automated allocation |
| 48 | help center | https://help.meritto.com/portal/en/kb/articles/all-about-counsellor-allocation-automation | automation nodes and allocation options |
| 49 | help center | https://help.meritto.com/portal/en/kb/articles/all-scenarios-of-re-registration-on-widget-enquiry-form | duplicate rules and merge |
| 50 | help center | https://help.meritto.com/portal/en/kb/articles/configuring-lead-stages | stages, sub-stages, stage rules |
| 51 | help center | https://help.meritto.com/portal/en/kb/articles/create-a-custom-lead-fields | custom field types and settings |
| 52 | help center | https://help.meritto.com/portal/en/kb/articles/how-to-create-communication-templates | template types and options |
| 53 | help center | https://help.meritto.com/portal/en/kb/articles/user-management-and-team-hierarchy | roles, permissions, teams |
| 54 | help center | https://help.meritto.com/portal/en/kb/product-newsletters | changelog index |
| 55 | changelog | https://help.meritto.com/portal/en/kb/articles/see-what-s-new-at-meritto-october-2025-product-updates | Oct 2025 release notes |
| 56 | changelog | https://help.meritto.com/portal/en/kb/articles/see-what-s-new-at-meritto-september-2025-product-updates-6-11-2025 | Sep 2025 release notes |
| 57 | changelog | https://help.meritto.com/portal/en/kb/articles/see-what-s-new-at-meritto-august-s-2025-product-updates | Aug 2025 release notes |
| 58 | changelog | https://help.meritto.com/portal/en/kb/articles/see-what-s-new-at-meritto | Jul 2025 release notes |
| 59 | help center | https://help.meritto.com/portal/en/kb/faqs-troubleshooting | FAQ categories and titles |
| 60 | help center | https://help.meritto.com/portal/en/kb/solutioning-business-cases | solution article titles |
| 61 | help center | https://help.meritto.com/portal/en/kb/articles/faqs-lead-manager | re-enquiry filter |
| 62 | help center | https://help.meritto.com/portal/en/kb/articles/troubleshooting-unassigned-leads-in-meritto | assignment automation edge cases |
| 63 | help center | https://help.meritto.com/portal/en/kb/articles/faq-waba | WhatsApp history on profile |
| 64 | public API docs | https://developer.nopaperforms.com/ | auth, error format, status codes |
| 65 | public API docs | https://documenter.getpostman.com/view/10228290/2s8YRqmAkK | full public API: leads, opportunities, activities, forms, payments, users, teams, tickets |
| 66 | app store | https://apps.apple.com/in/app/meritto-attract-engage-enroll/id1551119550 | iOS listing, release notes, 4.4 stars / 29 ratings |
| 67 | app store | https://play.google.com/store/apps/details?id=com.nopaperforms.mobile&hl=en_IN&gl=IN | Android listing, 50K+ installs, 4.2 stars / 413 reviews (India locale; the default-locale page showed no rating) |
| 68 | marketing site | https://www.meritto.com/developer-portal/ | API families: lead, opportunity, payments, master data (read directly) |
| 69 | legal | https://www.meritto.com/terms-and-conditions/ | terms of service: customer acceptable-use clauses (read directly) |
| 70 | video | https://www.youtube.com/@merittoofficial/videos | did not render; no walkthroughs captured |

Not available: the YouTube channel ([70]) did not render, so no walkthrough videos were watched. Pricing was not researched in depth: the product page links to no pricing page, and its calls to action ask for a demo or a callback ([1], [68]).

## Core loop

An institution records each enquiry with its source, assigns it to a counsellor by rule, and the counsellor, helped by automated WhatsApp, SMS and email, moves the student from enquiry to a paid application or token fee. Managers see which campaigns and which counsellors lead to enrolments.

The suite map puts the CRM's chain as: enquiry, lead management, counselling, campaign attribution, fee collection ([1]; [32] calls the last step basic fee collection).

Where the journey milestones get their data while the application product is out of scope: verified comes from contact verification; application started and submitted come from the API, an inbound webhook or a counsellor's update; payment approved comes from the application-fee payment; token fee paid (enrolled) comes from the token-fee payment.

## Screens

Routes are proposals for our build. "How reached" describes the original where it is known. In the states column, a state with a citation was seen in the original, and a state without one is our design.

### Public (student-facing)

| ID | screen | route / how to reach | purpose | key components | states |
| --- | --- | --- | --- | --- | --- |
| S01 | Enquiry form (embeddable) | `/f/:formId`, embedded by script or iframe on the institution's site | Turn a visitor into a lead, with the attribution attached | Name, email (with verify action), mobile with country code, dropdowns, multi-selects with a max count, hidden UTM/gclid/fbclid/referrer/landing-URL fields, submit. As seen on the original's own demo-request widget [2], [12] | empty, field error, multi-select limit reached [2], submitting, success, email already known (existing lead updated: new source, alternate mobile, attempts +1) [49] |
| S02 | Payment checkout | `/pay/:linkId`, opened from a payment link sent by WhatsApp/SMS/email | Student pays an application or token fee | Fee summary, amount, payment methods from the gateway (UPI, cards, net banking, wallets) [31], [36] | pending, paid, failed, expired link, already paid |

### Staff web app

| ID | screen | route / how to reach | purpose | key components | states |
| --- | --- | --- | --- | --- | --- |
| S03 | Sign in | `/login` | Staff sign-in | Email + password, 2FA code step, SSO button [43], [9] | error, 2FA required, IP not allowed [9], account inactive |
| S04 | My day (home) | `/` after sign-in | Counsellor's work queue | Follow-ups overdue and upcoming (a due-today group is our design), untouched leads, recent alerts, check-in toggle; manager variant with team tiles [13], [16], [10] | empty (no work), filled, checked out (no new leads) [55] |
| S05 | Lead list | `/leads`; main nav "Leads" (original: Lead Manager) [44] | Find, filter and act on leads in bulk | Table newest first; search with key picker (email, mobile, name, user ID, lead ID); quick-filter bar with manage; advanced-filter button; column chooser; import; bulk-action menu; rows per page 10–100; untouched marker; merged rows greyed [44] | empty (no leads yet), loading, filled, filter returns nothing, rows selected (bulk menu active), masked contacts for restricted roles [9] |
| S06 | Advanced filter panel | Panel on S05 (also on S26, S16) | Build AND/OR conditions on any field and save them | Condition rows (field, operator, value), AND/OR switch, call-activity filters, save-as, saved-filter list [44], [2] | no conditions, invalid condition, saved |
| S07 | Add lead / Import leads | S05 → Add, S05 → Import [44] | Add one walk-in or upload a sheet | Single form; file upload → column mapping → preview → run → result report (created, updated, failed with reasons) | mapping error, partial failure, duplicates updated not created [49] |
| S08 | Lead profile | `/leads/:id`; click a row in S05 [46] | Everything about one student, plus every action | Header: name, stage, verified email/phone, created and last-engaged times, score and percentile, emails/SMS/WhatsApp sent counts, call status, next follow-up, source, owner. Journey bar: unverified → verified → application started → payment approved → application submitted → token fee paid (enrolled). Tabs: details, timeline, follow-ups, notes, messages, calls, documents, tickets [46], plus opportunities and payments (ours, from [8], [65]). Actions: change stage, add follow-up, add note, message, WhatsApp chat, reassign, payment link [46], call (ours, from [10], [58]) | loading, contacts masked [9], merged secondary (read-only) [49], stage locked by rule [50], no permission |
| S09 | Change stage | Modal from S08 [46] | Record the outcome of a conversation | Stage, sub-stage, owner, follow-up date, remark [46] | sub-stage required, follow-up required, remark required, stage locked or "can't move back" [50] |
| S10 | Compose message | Modal from S08 or S05 bulk [46], [44] | Send email, SMS or WhatsApp to one or many leads | Channel tabs, template picker, merge-token insert, preview, attachments (email), recipient count [52] | template not approved (WhatsApp) [18], recipients opted out (skipped), blocked by stage rule [50], sending, sent |
| S11 | Add follow-up | Modal from S08 [46] | Schedule the next touch | Event type, date and time, time zone, owner, reminder settings, custom fields per event type [13] | time in the past, clash warning (both ours) |
| S12 | Calendar | `/calendar` [13] | See and work follow-ups and events | Day/week/month switch, overdue and upcoming counts, event cards [13] | empty, overdue, completed, cancelled, reopened [13] |
| S13 | Bulk reassign | S05 bulk menu → Reassign [44], [2] | Move many leads to other counsellors | Target counsellors, round-robin toggle, add or replace owners [2], [47], unassign [62], confirm, progress | running, finished with counts, partial failure |
| S14 | Merge leads | S08 → Merge (original: offered on telephony duplicates) [49] | Fold a duplicate into the main record | Pick primary, field-by-field preview, confirm [49] | conflict on email, done (secondary read-only) |
| S15 | WhatsApp inbox | `/inbox` [19] | Live one-to-one WhatsApp chats | Conversation list by status, chat thread, lead side panel, quick replies, save attachment to field, pick and resolve [19] | queued, picked, resolved, reopened [19]; 24-hour window closed (template only) and no number connected are ours |
| S16 | Broadcast | `/broadcasts/new` and `/broadcasts/:id` [18] | Send one template to a filtered audience | Channel, approved template, audience (saved filter), buttons, retry settings [18], schedule (ours); report: sent, delivered, replies, failed, contribution to applications and enrolments [18] | undelivered, retrying [18]; draft, scheduled, sending, done, failed are ours |
| S17 | Automations | `/automations` [48] | List of workflows | Name, trigger, on/off, last run, counts [48] | empty, active, paused |
| S18 | Automation builder | `/automations/:id` [48], [17] | Build trigger → condition → action flows | Trigger picker (created, updated, stage change, field change, date, interval, activity), condition block (all/any), if/else, wait, actions (assign counsellor, send message, update field, change stage, notify user, webhook) [48], [17], [55], [56], plus unassign [62], create follow-up and assign to team (ours); per-step counts are our design (the original has communication-node reporting, title only [48], and channel drill-down [17]) | draft, invalid (e.g. trigger on a field that is empty at creation leaves leads unassigned) [62], active, paused |
| S19 | Templates | `/templates` [52] | Write and manage message templates | List by channel; email editor (drag-and-drop and HTML), SMS editor with character count, WhatsApp template form with category, buttons, approval status and quality rating [52], [18], [57] | draft; WhatsApp approval status shown [18] (values pending/approved/rejected are Meta's, our labels); quality high/medium/low [57] |
| S20 | Attribution dashboard | `/reports/attribution` [3] | Which channels, sources and campaigns produce enrolments | Channel summary → source → campaign drill-down; leads, verified, applications, paid, enrolled; first vs later source; cost per verified lead; period compare [3], [27] | no data yet, filtered, drilled |
| S21 | Dashboards | `/reports` [22] | Preset and custom dashboards made of widgets | Widget library by category (leads, enrolments, payments, campuses), funnel widget, team presets [22] | empty, loading, filled |
| S22 | Report builder | `/reports/new` [22] | Pivot reports on any field, custom fields included | Metric picker, multi-level group-by, filters, table/chart toggle [22]; save and CSV export are our design | no metrics, too many groups, saved |
| S23 | Counsellor productivity | `/reports/team` [10], [22] | How each counsellor and team performs | Calls, follow-ups, assigned and engaged leads, by person and team [10], [22], [67]; stage moves and conversions are our additions | empty, filled |
| S24 | Notifications | Bell icon and `/notifications` [12] | Real-time alerts on student actions | Feed, unread/acted marker, link to lead, preferences per event and channel [12] | none, unread, missed (not acted on) [12] |
| S25 | Payments | `/payments` [36], [65] | All fee transactions | Filters (status, product, date), list, mark offline payment approved, export CSV [36] | empty, pending, approved, failed, refunded [65] |
| S26 | Opportunities | `/opportunities` [8] | Several interests per student (programmes, campuses, services) | Opportunity-list switcher, table, saved views, owner per row [8] | empty, filled |
| S27 | Opportunity profile | `/opportunities/:id` [8], [57] | One interest with its own stage and owner | Details, stage, timeline, linked opportunities, custom tabs [8], [57] | duplicate on key fields blocked [65] |
| S28 | Settings › Lead fields | `/settings/fields` [51] | Add custom fields | Field list; create: label, type (text, dropdown, paragraph, email, mobile, date, upload), section, validation, required, hidden, quick-add visibility, sensitive flag [51] | field limit reached [51], no permission |
| S29 | Settings › Stages | `/settings/stages` [50] | Stages, sub-stages and stage rules | Stage rows: name, follow-up required, sub-stage required, score −10..+10, enable, drag to reorder; rule builder: if stage is X then (lock, only these users, no moving back, lock follow-up, no remarks allowed, remark required, no messages), optionally limited to chosen users [50] | saved, disabled stage still shown in reports [50] |
| S30 | Settings › Lead rules | `/settings/lead-rules` [49], [40] | Duplicate and verification behaviour | Unique-mobile toggle [49], lead verification on/off (ours; the original's lead-flow settings are known only from a help title [50]), offline source tags [50], UTM buckets [62] | — |
| S31 | Settings › Enquiry forms | `/settings/forms` [39], [41] | Build and embed S01 | Field picker, hidden tracking fields, success message/redirect, embed code, active toggle [2], [44] | inactive form |
| S32 | Settings › Users | `/settings/users` [53] | Invite and manage staff | List, invite (email, role, team, programmes), attributes, quota, active/inactive [53], [65], [10] | invited, active, inactive [65] |
| S33 | Settings › Roles | `/settings/roles` [53] | What each role may do and see | Permission matrix (view, edit, download, manage per module) [53], [9], masking of phone/email [9]; data scope (own/team/all) is our design, the original shows hierarchy-based visibility and a 'show data' permission [9], [43] | — |
| S34 | Settings › Teams | `/settings/teams` [53] | Team tree and managers | Tree, members, reporting manager [53], [65] | — |
| S35 | Settings › Channels | `/settings/channels` [18], [40] | Connect messaging and calling | WhatsApp number sign-up, email sending domain, SMS sender and DLT templates, telephony provider [18], [40], [24] | not connected, pending verification, connected |
| S36 | Settings › Payments | `/settings/payments` [24], [65] | Gateway and fee products | Gateway keys, payment products (name [65]; amount is our design) | not connected, connected |
| S37 | Settings › Integrations & API | `/settings/integrations` [24], [64] | API keys, webhooks, lead-ad sources, audiences | Key pair, webhook endpoints and events, Google/Meta lead-ad connections [64], [44], [40] | — |
| S38 | Audit log | `/settings/audit` [9] | Who did what and when | Filter by user, action, date; before and after values [9] | — |
| S39 | Publisher portal (external) | `/partner` [4] | Agencies see their own lead quality | Leads, campaigns, duplicates sent, geography; personal data masked [4] | institution hid applications section [4] |
| S40 | Query tickets | `/tickets` [37], [65] | Student questions as tickets | Category/sub-category, owner, thread, status [65] | open, in progress, closed [65] |
| S41 | Settings › Publishers | `/settings/publishers` [3], [4] | Register agencies and portals that send leads | Publisher list, own API credential and tracking link per publisher, daily cap, cost inputs, partner-portal access (our design; the original onboards publishers who push by API or redirect traffic [3]) | active, paused, over daily cap |

### Mobile app (phase 2)

| ID | screen | route / how to reach | purpose | key components | states |
| --- | --- | --- | --- | --- | --- |
| M01 | Home | app launch [66] | Today's numbers and tasks | KPI tiles, follow-ups [66] | — |
| M02 | Lead list | tab [66] | Filtered leads | Filters by stage and movement, search [66] | masked contacts [66] |
| M03 | Lead profile | M02 → lead [66], [15] | Work a lead in the field | Call (with virtual number pick), message, voice note, follow-up, stage, reassign, timeline [66], [15] | iOS calling needed cloud telephony [66] |
| M04 | Quick add / QR | FAB [2], [15] | Capture at fairs | Short form, QR for self-registration [2], [51] | — |
| M05 | Check-in / field day | header toggle [15], [66] | Attendance, route, meetings | Check in/out, map, distance, meetings [15], [66] | checked in, checked out, auto check-out [55] |
| M06 | Dashboards | tab [66] | Web dashboards on the phone | Favourites, share, switch [15] | — |

Counts: 2 public screens, 39 staff web screens, 6 mobile screens.

## Flows

Click counts are for the original where known, otherwise our target. They become the numbers to beat.

```
F01 Student enquires and is auto-assigned (our target: under a minute)
    S01 enquiry form -> (system) dedupe + attribution + verification -> (automation) assign -> S24 alert to counsellor -> S08
    happy path: student fills 3-5 fields + submit; counsellor 1 click from alert to profile
    edge: email already exists (update, new source, attempts +1) [49]; new email but known mobile [49];
          nobody checked in -> lead stays unassigned in the original [62][55]; everyone at quota -> undocumented [10];
          trigger set on a field empty at creation leaves the lead unassigned [62]

F02 Repeat enquiry from a new source does not create a duplicate
    (system) match on email -> keep first source locked -> add second/third source -> latest source always updated -> attempts +1
    -> if opportunity rules match, add a new opportunity on the existing lead instead [8]
    edge: same email + new mobile -> alternate mobile [49]; unique-mobile setting on -> mobile recorded as 'NA' [49];
          caller with different mobile, same email -> manual merge S14 [49]

F03 Counsellor works a new lead
    S04 untouched list -> S08 profile -> call (click-to-call) -> S09 change stage (sub-stage, follow-up, remark) -> S10 WhatsApp template
    happy path clicks: 7
    edge: stage rule requires remark or blocks moving back [50]; contacts masked but call/message still allowed [9];
          WhatsApp template not approved [18]; lead opted out

F04 Counsellor clears today's follow-ups
    S04 due/overdue -> S08 -> log outcome in S09 -> mark follow-up done (S12) or reschedule (S11)
    happy path clicks: 4 per follow-up
    edge: overdue items carry over (original shows overdue and upcoming counts [13]); reopen a completed event [13]

F05 Manager reassigns a batch of leads
    S05 -> S06 filter (e.g. stage=Hot, owner=X) -> select all -> bulk menu -> S13 add/replace + round robin -> confirm
    happy path clicks: 6
    edge: leads assigned by hand protected from automation [48]; partial failures listed

F06 Admin sets up auto-assignment
    S18 new automation -> trigger "lead created" -> conditions (all: verified = yes, source in bucket) -> action "assign counsellor" (round robin, replace) -> notify user -> activate
    happy path clicks: about 12
    edge: wrong dial code or missing sources leave leads unassigned [62]; "only checked-in owners" with nobody checked in [62]

F07 Nurture journey runs on its own
    (automation) lead created and not verified -> wait 1 h -> WhatsApp template -> wait 3 days -> if no application started then SMS + create follow-up for the owner
    edge: re-entry rules and duplicate sends are undocumented in the original [17] -> we must decide; opt-outs honoured

F08 Collect an application or token fee
    S08 -> generate payment link (product, amount) -> send by WhatsApp -> S02 student pays -> gateway webhook -> payment status -> journey milestone -> S24 alert
    happy path clicks: counsellor 4, student 3
    edge: payment failed or pending -> reminder [30]; link expired; offline cash/DD approved in S25 [36];
          duplicate webhook (idempotency)

F09 Inbound WhatsApp chat
    student messages -> S15 queued -> counsellor picks -> lead auto-created or matched -> reply (free text in 24 h window, else template) -> save sent document to a field -> resolve
    edge: reopened chat [19]; 24-hour window closed; chat from unknown number

F10 WhatsApp broadcast
    S19 approved template -> S16 audience from saved filter -> buttons -> send now or schedule -> replies update leads -> report
    edge: undelivered messages retried up to 5 times, 8-48 h apart [18] (the original does not say why delivery fails); low-quality template warning [57]

F11 Marketing head checks which campaigns convert
    S20 channel summary -> drill to source -> drill to campaign -> compare first-source vs later-source credit -> compare with last period
    edge: no UTM -> referral fallback [45]; unmapped UTM sources [62]

F12 New institution gets set up
    S32 invite users -> S34 teams -> S33 roles -> S29 stages -> S28 fields -> S31 enquiry form + embed -> S35 channels -> S36 gateway -> S18 assignment automation
    edge: field limit [51]; WhatsApp and DLT verification take days outside our control

F13 Branch uploads offline leads from a fair
    S05 -> S07 import -> map columns -> preview -> run -> result report -> leads tagged offline + fair source tag
    edge: rows matching existing emails update, not duplicate [49]; bad rows reported

F14 Admin builds a pivot report
    S22 pick metrics -> group by programme then source -> filter intake -> table/chart -> save -> export
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| Button | primary, secondary, ghost, danger, icon | default, hover, focus, disabled, loading | all |
| Data table | selectable rows, sortable columns, column chooser, pagination 10–100 | loading (skeleton), empty, filtered-empty, row selected, row greyed (merged), row marker (untouched) | S05, S16, S17, S21–S26, S32, S38, S40 |
| Search with key picker | email, mobile, name, user ID, lead ID | empty, typing, no match | S05 |
| Quick-filter bar | chips, manage dialog | none active, active, editing | S05, S26 |
| Condition builder | field/operator/value rows, AND/OR, nested group | empty, invalid, valid | S06, S18, S16, S29 |
| Saved filter / view picker | personal, shared | none, selected | S05, S26, S16 |
| Bulk action menu | 11 actions in original [44] | disabled (nothing selected), enabled, running | S05 |
| Modal / drawer | small, large, side drawer | open, submitting, error | S09–S11, S13, S14 |
| Tabs | standard, configurable per team | active, empty tab | S08, S27 |
| Stage badge and picker | stage + sub-stage | normal, locked by rule | S05, S08, S09, S29 |
| Journey milestone bar | 6 steps | reached, current, not reached | S08 |
| Timeline | activity, message, call, note, stage change, payment | loading, empty, filled, paginated | S08, S27 |
| Message composer | email, SMS, WhatsApp | template chosen, free text (WhatsApp 24 h only), preview, sending, sent, blocked | S10, S15, S16 |
| Merge-token inserter | profile, course, stage, owner, link | — | S10, S19 |
| Chat thread | inbound, outbound, template, media | sending, delivered, read, failed | S15, S08 |
| Workflow canvas node | trigger, condition, if/else, wait, action | configured, invalid, selected | S18 |
| Calendar | day, week, month | empty, overdue, completed, cancelled | S12, S04 |
| Date/time + time zone picker | date, datetime | past date warning | S11, S12, S06 |
| KPI tile | count, percent, delta | loading, empty, filled | S04, S20, S21, S23 |
| Funnel chart | horizontal steps | loading, empty | S20, S21 |
| Pivot table / chart | table, bar, line | loading, empty, too many groups | S22 |
| File upload + column mapper | CSV, XLSX | uploading, mapping, error rows | S07 |
| Toast | success, error, info | — | all |
| Status pill | payment, ticket, chat, template approval, quality rating | — | S15, S16, S19, S25, S40 |
| Masked value | phone, email | masked, revealed (permitted) | S05, S08 |
| Notification bell + feed | unread count | none, unread, missed | header, S24 |
| Check-in toggle | — | checked in, checked out | header, S04 |
| Permission matrix | module × right | — | S33 |
| Tree editor | teams, picklists | drag, collapsed | S34, S28 |

## Inferred data model

Every table also gets `id`, `org_id` (tenant), `created_at` and `updated_at`. Confidence: **high** means a help article or the API shows it, **medium** means it appears on marketing pages, **guess** means we inferred it.

```
Organization  name, plan, settings (unique_mobile, lead_verification, timezone)
              evidence: [49] unique-mobile setting; lead_verification and multi-tenancy are our design
              confidence: guess (structure ours)

Campus        name, city, parent_campus_id (head office sees all)
              evidence: [2] branch centralisation, [22] multi-centre reports
              confidence: medium

User          name, email, mobile, role_id, permission_group, team_ids, status (invited | active | inactive),
              attributes (programme, region, language), daily_quota, weekly_quota, checked_in, auto_checkout_at
              evidence: [65] user API, [9], [10] quotas, [55] auto check-out
              confidence: high

Role          name, permissions (module x view/edit/download/manage), data_scope (own | team | all), mask_contacts
              evidence: [53], [9], [65] role list
              confidence: high (roles, permissions), guess (data_scope tiers are our design)

Team          name, parent_team_id, manager_user_id
              evidence: [65] team list has team_parent_id, [53]
              confidence: high

Lead          lead_id (public 32-char id), short user_id (5-6 digits), name, email (unique per org), mobile,
              country_dial_code, alt_mobiles[], state, city, course/programme (picklist), campus_id,
              stage_id, sub_stage_id, first_stage_id, previous_stage_id, stage_change_count, remark,
              follow_up_at, owner_ids[] (one or more), first_owner_id, previous_owner_id, reassigned_by, reassigned_at,
              email_verified, mobile_verified, verified_at, score, score_percentile, untouched (bool),
              registration_attempts, last_attempt_at, merged_into_id, custom (jsonb)
              evidence: [45] field glossary, [46] profile, [49] duplicates, [65] lead API
              confidence: high

SourceTouch   lead_id, position (first | second | third | latest), origin (offline | online | api | telephony | form | chat),
              channel (direct | publisher | social | organic | referral | other | telephony | offline | paid_ads | chat),
              source, medium, campaign, utm_* (campaignid, adgroupid, creativeid, keyword, matchtype, network, device, placement),
              gclid, fbclid, fb_lead_id, referrer, landing_url, publisher_id, registered_at
              evidence: [45] PST + latest, [2] locked sources and live widget hidden fields, [12] live widget, [1]
              confidence: high (first three locked; latest overwritten). The cap is not certain: the glossary shows three plus latest, one marketing page says 'and beyond' [2]

Stage         name, sort, enabled, follow_up_required, sub_stage_required, score (-10..10), is_default (Untouched)
SubStage      stage_id, name
StageRule     stage_ids[], effect (lock | only_users | no_move_down | lock_follow_up | no_remarks | remark_required | no_messages),
              user_ids[] ("performed by": optionally limits any effect to these users)
              evidence: [50]
              confidence: high

FieldDef      entity (lead | opportunity), label, key, type (text | dropdown | paragraph | email | mobile | date | upload),
              section, options_source (picklist id), required, hidden, quick_add (hide | mandatory), sensitive (personal | health), position
              evidence: [51], [55] PII tagging, [65] getMetaData
              confidence: high

Picklist      title, machine_key, parent_id (tree), is_active, sort_order
              evidence: [65] master data API, [68]
              confidence: high

Opportunity   lead_id, list_id, stage, owner_id, custom (jsonb); unique on list.key_fields
OpportunityList  name, key_fields[] (duplicate check), department/team_ids
              evidence: [65] opportunity API, [8], [57]
              confidence: high

Activity      lead_id, opportunity_id, type_code, actor_user_id, text, payload (jsonb), occurred_at
ActivityType  code, name, category, custom_fields (for institution-defined activity types)
              evidence: [65] activity codes and log, [14], [56]
              confidence: high

Note          lead_id, author_id, body
FollowUp      lead_id, event_type_id, owner_id, organiser_id, starts_at, timezone, status (upcoming | done | cancelled;
              overdue is derived from starts_at; reopen sets it back to upcoming),
              reminder_minutes, remind_email, custom (jsonb)
EventType     name, form_fields, allowed_role_ids
              evidence: [46], [13]
              confidence: high (notes), medium (follow-up fields and event types come from [13], a marketing page)

Message       lead_id, channel (email | sms | whatsapp), direction (out | in), template_id, body, status
              (queued | sent | delivered | failed | bounced; 'read' is our addition), opened_at, clicked_at, provider_id, broadcast_id, automation_run_id
              evidence: [46] communication logs, [18], [19]
              confidence: high

Template      channel, name, nature (transactional | promotional), applies_to (lead | payment | ...), subject, body, tokens,
              attachments, allowed_user_ids, wa_category (Meta's own categories: marketing | utility | authentication; the original's page lists marketing, utility, service [18]), wa_status (pending | approved | rejected: Meta's values,
              our labels; the original shows an approval status [18]), wa_quality (high | medium | low), dlt_template_id,
              encoding (plain | unicode; ours)
              evidence: [52], [18], [57], [40] DLT
              confidence: high (fields from [52]), medium ([18], [57]), guess (wa_status values, encoding)

ChannelAccount  type (whatsapp | email | sms | telephony), provider, credentials (encrypted), status, wa_phone_number_id
              evidence: [18], [24], [40]
              confidence: medium

Consent       lead_id, channel, status (opted_in | opted_out), source, at
              evidence: [18] opt-in/opt-out settings
              confidence: medium

Conversation  lead_id, channel_account_id, status (queued | picked | resolved), assignee_id, reopened_count, last_inbound_at
              evidence: [19]
              confidence: medium

Broadcast     channel, template_id, saved_filter_id, status, retry_max (<=5), retry_interval_h (8..48), counts, scheduled_at (ours)
              evidence: [18]
              confidence: medium

Automation    name, trigger (lead_created | lead_updated | stage_changed | field_changed | date | interval | activity),
              graph (nodes: condition, if_else, wait, assign, send, update_field, change_stage, notify, webhook), active
AutomationRun automation_id, lead_id, node_id, status, next_run_at, log
              evidence: [48], [17], [55], [56], [62]
              confidence: high (node types), guess (run storage)

Call          lead_id, user_id, direction, status (connected | missed), duration_s, recording_url, virtual_number
              evidence: [46], [65], [66]
              confidence: medium

PaymentProduct  name (application fee, token fee), form/programme link, amount and currency (ours)
PaymentLink   lead_id, product_id, amount, expires_at, short_code, sent_via (all ours; [46] names only the action)
Payment       lead_id, product_id, link_id, gateway, order_id, transaction_id, method, status
              (initiated | pending | approved | failed | refunded; original API: Payment Pending / Payment Approved / Refund), amount, discount, offline_mode, approved_by
              evidence: [65] payments API, [31] statuses, [46] payment link
              confidence: high (Payment fields, product name), guess (PaymentProduct amount/currency, all PaymentLink fields)

SavedFilter   owner_id, entity, name, conditions (jsonb), shared
              evidence: [2], [8]
              confidence: medium

Notification  user_id, event, lead_id, channel, acted_at
              evidence: [12]
              confidence: medium

AuditLog      user_id, action (login | download | message | change), entity, entity_id, before, after, at, ip (ours)
              evidence: [9], [43] title only
              confidence: medium

ImportJob / BulkJob  type, status (in_process | completed), totals, errors
              evidence: [65] async delete jobs
              confidence: high (BulkJob for deletes), guess (ImportJob shape is ours)

Publisher     name, api_key, daily_cap, min_verification_rate, cost_inputs
              evidence: [3], [4]
              confidence: medium

Ticket        lead_id, category_id, sub_category_id, assignee_id, status (open | in_progress | closed), feedback
              evidence: [65], [37]
              confidence: high
```

Relationships: Organization 1-n everything. Campus 1-n Lead, User. Team 1-n User, Team 1-n Team. Lead n-n User (owners). Lead 1-n SourceTouch (max 3 locked + 1 latest). Lead 1-n Opportunity, Activity, Note, FollowUp, Message, Call, Payment, Ticket, Conversation. Stage 1-n SubStage. Automation 1-n AutomationRun. Template 1-n Message. PaymentProduct 1-n PaymentLink 1-n Payment.

## Feature matrix

See `features.csv` (228 rows; the `evidence` column gives the source URL for each). Priority: must 74, should 65, could 89. 14 of the could rows are marked `clone=skip` as not cloneable, so the parity score counts 214 rows.

## Out of scope (cannot or should not be cloned)

- **Their names and assets.** Meritto, NoPaperForms (NPF), Collexo, Mio AI, Niaa, Echo, Echo Bubble, Zing, Amplify, METS, Calendar Pro, Pixi, One View Lead Profile, Mutually Exclusive Impact (MEI), Lead Strength, Enrollment Cloud, Meritto Secure, and "Education CRM" used as a product name; their screenshots, icons, copy, form templates and email image library. We build the same capability under our own names.
- **Partner networks and approvals.** Meta tech-partner status, Google Ads/Meta app approvals, lead-portal partnerships (Shiksha, Collegedunia and others), exam vendors, telephony carriers. We integrate through official APIs with each institution's own accounts.
- **Regulated services.** Aadhaar authentication and DigiLocker (government approvals). Payment processing, EMI, eNACH and split settlement (licensed partners).
- **Their data.** Industry-wide benchmarks across many institutions would need data a new product does not have. Ranking an institution's own publishers against each other is cloneable and is in the matrix.
- **Their certifications.** SOC 2, ISO 27001 and similar are earned by audit, not copied. They can be roadmap items.
- **Separate products in the suite** (not cloneable *in this slice*): the Application platform, Post-Application, full fee management, voice broadcast, AI agents, ID cards. These are `skip` or `could` rows.

## Open questions

1. ~~Scope and who it is for~~: answered (multi-tenant, sold to Indian institutions).
2. ~~Payment gateway~~: answered (whatever each institution already uses; multi-gateway adapters).
3. ~~WhatsApp~~: answered (official Meta Cloud API; each institution's own account via Embedded Signup).
4. Behaviours the original does not document, which we must decide: what happens when every counsellor is at quota (when nobody is checked in, the original leaves the lead unassigned [62]; we may add a fallback queue); lead-score formula; sole-source metric formula; automation re-entry and duplicate-send rules; 24-hour WhatsApp window handling in the inbox.
5. **No reference screenshots were saved.** The skill normally keeps them in `replica/screens/`, but Meritto's marketing screenshots are their copyright, and a Meritto account must not be used. `/replica-design` will design the look from this map rather than measuring theirs, which lowers the risk of copying their trade dress; the final design should still be reviewed before launch.

## Size

Screens: 41 web (2 public + 39 staff) plus 6 mobile. Flows: 14. Entities: about 35.

Hard parts:
1. **Duplicate handling and attribution must be right from day one.** The first three sources are locked and the latest is overwritten. Every capture path (form, API, import, WhatsApp, calls) has to go through one upsert.
2. **The automation engine.** Triggers, waits, branching, idempotent sends, re-entry rules and opt-outs, on a job queue.
3. **WhatsApp Business API.** Meta onboarding per institution, template approval sync, the 24-hour window, delivery webhooks. **India SMS DLT** registration.
4. **Access control.** Role permissions times data scope (own/team/all) times contact masking, applied to every query, export and report.
5. **Reports over custom fields.** Pivot reports on fields each institution defines (jsonb, or a reporting store).
6. **Telephony.** Provider integrations; calling from iOS needs cloud telephony [66].

Size: **L** (a quarter) for the must + should web slice with a small team. The must-only vertical slice (enquiry form → dedupe/attribution → auto-assign → profile → stage/follow-up → WhatsApp/SMS/email → payment link → funnel report) is **M** (a few weeks). The whole Meritto suite is **XL**: rescope it, don't attempt it.
