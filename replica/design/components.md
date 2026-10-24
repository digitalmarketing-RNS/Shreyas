# Components

Date: 2026-10-18. Step: replica-design, component specs. This file joins the three group specs, written on
2026-10-06 and corrected after review, into one.
Inputs: `replica/recon.md` (Screens, Flows, Components), `replica/architecture.md` (Stack, API, Jobs),
`replica/schema.sql` (status values), and in this folder `tokens.json`, `tokens.dark.json`, `tailwind.css`,
`decisions.md` and `measurements.md`.

What it covers:
- **Group 1, foundations and forms.** Buttons, the form controls, the field wrapper, form layout, consent capture,
  the copy and secret patterns on the integration screens, and four small primitives (Link, Kbd, Separator,
  Disclosure).
- **Group 2, shell, navigation, overlays, feedback and display.** The frame around every staff screen; dialogs,
  drawers, popovers, menus and tooltips; toasts, alerts, banners, empty states, loading and progress; cards,
  description lists, steppers, avatars, badges, status pills, masked values, and the formatters for money, numbers,
  dates, times and phone numbers.
- **Group 3, CRM data and domain.** The lead table and its tools, stages and the admission journey, the lead
  profile, calls, messaging, templates and the WhatsApp inbox, the automation builder, the settings editors, the
  calendar, charts and dashboards, import and merge, the public and sign-in pages, and the payment and privacy
  desks.
- **Status vocabulary.** Every status label, tone and icon the app shows.
- **Missing pairs** (none) and the **Open questions**.

What holds for every block:
- Tokens are final, except the placeholder colours (`accent`, `accent-hover`, `accent-subtle`, `focus-ring` and
  `chart-*`), which `/replica-brand` replaces. Replacing them changes values, never class names.
- Every utility named here exists in `tailwind.css`: Tailwind CSS v4 core utilities plus our token utilities. No
  hex values appear.
- Every colour pair named under `a11y` is in the `pairs` list of `tokens.json` and `tokens.dark.json` (the same
  112 pairs), so it passes AA in both themes. `contrast-report.txt` has the numbers.
- All copy is ours. `{Institution}` stands for the tenant's name and `{Product}` for our product name, which
  `/replica-brand` picks. Person and institution names in examples are invented.
- Screen IDs are the IDs from `recon.md` (S01 to S41, M01 to M06). S42 Privacy requests, S43 Incidents and S44
  Retention are new here (open question 23).

Each block has the same eleven fields, in this order: purpose, anatomy, variants, sizes, states, tokens, content,
keyboard, a11y, base (the element or Radix primitive under it) and used on (screen IDs). The a11y field gives the
screen reader behaviour and every colour pair the block uses. Groups 1 and 3 also state target sizes there; some
group 2 blocks give them under sizes instead.

## Contents

- [Conventions](#conventions)
- [Group 1: Foundations and forms](#group-1-foundations-and-forms)
  - [Buttons](#buttons): [Button](#button) · [IconButton](#iconbutton)
  - [Text and choice inputs](#text-and-choice-inputs): [TextInput](#textinput) · [Textarea](#textarea) · [Select](#select) · [Combobox (single and multi-select)](#combobox-single-and-multi-select) · [Checkbox](#checkbox) · [RadioGroup (list and cards)](#radiogroup-list-and-cards) · [Switch](#switch) · [NumberStepper](#numberstepper)
  - [Phone, code, date and file inputs](#phone-code-date-and-file-inputs): [PhoneInput](#phoneinput) · [OtpInput](#otpinput) · [DatePicker](#datepicker) · [DateTimePicker (with time zone)](#datetimepicker-with-time-zone) · [DateRangePicker](#daterangepicker) · [FileUpload](#fileupload)
  - [Form structure and consent](#form-structure-and-consent): [Field (form field wrapper)](#field-form-field-wrapper) · [FormLayout (staff and public form rules)](#formlayout-staff-and-public-form-rules) · [ConsentCapture](#consentcapture)
  - [Switchers and search](#switchers-and-search): [SegmentedControl](#segmentedcontrol) · [ChannelTabs](#channeltabs) · [SearchInput](#searchinput)
  - [Copy and secrets](#copy-and-secrets): [CopyButton](#copybutton) · [CodeBlock (with copy)](#codeblock-with-copy) · [SecretReveal (shown once, and write-only secrets)](#secretreveal-shown-once-and-write-only-secrets)
  - [Small primitives](#small-primitives): [Link](#link) · [Kbd](#kbd) · [Separator](#separator) · [Disclosure](#disclosure)
- [Group 2: Shell, navigation, overlays, feedback and display](#group-2-shell-navigation-overlays-feedback-and-display)
  - [Shell and navigation](#shell-and-navigation): [AppShell](#appshell) · [SkipLink](#skiplink) · [Sidebar](#sidebar) · [AppHeader](#appheader) · [OrgSwitcher](#orgswitcher) · [UserMenu](#usermenu) · [CheckInToggle](#checkintoggle) · [NotificationBell](#notificationbell) · [NotificationFeed](#notificationfeed) · [PageHeader](#pageheader) · [Breadcrumbs](#breadcrumbs) · [Tabs](#tabs) · [Pagination](#pagination)
  - [Overlays](#overlays): [Dialog](#dialog) · [ConfirmDialog](#confirmdialog) · [Drawer](#drawer) · [Popover](#popover) · [DropdownMenu](#dropdownmenu) · [Tooltip](#tooltip)
  - [Feedback](#feedback): [Toast](#toast) · [Alert](#alert) · [Banner](#banner) ([Compliance and condition messages](#compliance-and-condition-messages)) · [EmptyState](#emptystate) ([Empty-state copy](#empty-state-copy)) · [Skeleton](#skeleton) ([Loading rules](#loading-rules)) · [ProgressBar](#progressbar) · [JobProgress](#jobprogress) · [Spinner](#spinner)
  - [Display](#display): [Card](#card) · [DescriptionList](#descriptionlist) · [Stepper](#stepper) · [Avatar](#avatar) · [AvatarGroup](#avatargroup) · [Badge](#badge) · [StatusPill](#statuspill) · [MaskedValue](#maskedvalue)
  - [Formatters as display components](#formatters-as-display-components): [Money](#money) · [NumberText](#numbertext) · [DateText](#datetext) · [RelativeTime](#relativetime) · [PhoneText](#phonetext)
- [Group 3: CRM data and domain](#group-3-crm-data-and-domain)
  - [Group 3 conventions](#group-3-conventions)
  - [A. Lead list tools](#a-lead-list-tools): [DataTable](#datatable) · [ColumnChooser](#columnchooser) · [LeadSearch](#leadsearch) · [QuickFilterBar](#quickfilterbar) · [QuickFilterManager](#quickfiltermanager) · [SavedViewPicker](#savedviewpicker) · [ConditionBuilder](#conditionbuilder) · [BulkActionBar](#bulkactionbar)
  - [B. Stages, journey and the lead profile](#b-stages-journey-and-the-lead-profile): [StageBadge](#stagebadge) · [StagePicker](#stagepicker) · [JourneyBar](#journeybar) · [LeadProfileHeader](#leadprofileheader) · [Timeline](#timeline)
  - [C. Calls, messaging and the inbox](#c-calls-messaging-and-the-inbox): [CallAction](#callaction) · [MessageComposer](#messagecomposer) · [TemplatePicker](#templatepicker) · [TemplateEditor](#templateeditor) · [MergeTokenInserter](#mergetokeninserter) · [SmsSegmentCounter](#smssegmentcounter) · [ServiceWindowIndicator](#servicewindowindicator) · [RecipientCheck](#recipientcheck) · [ConversationList](#conversationlist) · [ChatThread](#chatthread) · [WhatsAppTemplatePreview](#whatsapptemplatepreview)
  - [D. Automation builder and settings editors](#d-automation-builder-and-settings-editors): [WorkflowCanvas](#workflowcanvas) · [WorkflowNode](#workflownode) · [WorkflowEdge](#workflowedge) · [WorkflowOutline](#workflowoutline) · [ReorderableList](#reorderablelist) · [TreeEditor](#treeeditor) · [PermissionMatrix](#permissionmatrix) · [NoticeEditor](#noticeeditor)
  - [E. Calendar, reports and dashboards](#e-calendar-reports-and-dashboards): [Calendar](#calendar) · [ChartFrame](#chartframe) · [KpiTile](#kpitile) · [FunnelChart](#funnelchart) · [BarChart](#barchart) · [LineChart](#linechart) · [PivotTable](#pivottable) · [DashboardGrid](#dashboardgrid)
  - [F. Import and merge](#f-import-and-merge): [ImportWizard](#importwizard) · [ColumnMapper](#columnmapper) · [MergeDiffView](#mergediffview)
  - [G. Public and sign-in pages](#g-public-and-sign-in-pages): [PublicEnquiryForm](#publicenquiryform) · [PublicPaymentPage](#publicpaymentpage) · [GuardianConsentPage](#guardianconsentpage) · [PrivacyRequestPage](#privacyrequestpage) · [SignInPage](#signinpage)
  - [H. Payment and privacy desks](#h-payment-and-privacy-desks): [PaymentLinkDialog](#paymentlinkdialog) · [OfflinePaymentForm](#offlinepaymentform) · [RefundDialog](#refunddialog) · [DataRequestDesk](#datarequestdesk) · [IncidentRegister](#incidentregister) · [RetentionSettings](#retentionsettings)
- [Status vocabulary](#status-vocabulary)
  - [Leads](#leads)
  - [Verification](#verification)
  - [Follow-ups, calls, attendance](#follow-ups-calls-attendance)
  - [Messaging](#messaging)
  - [Channels and WhatsApp onboarding](#channels-and-whatsapp-onboarding)
  - [Payments](#payments)
  - [People, operations and compliance](#people-operations-and-compliance)
  - [Settings, import and incident states](#settings-import-and-incident-states)
  - [Labels for other enums](#labels-for-other-enums)
- [Missing pairs](#missing-pairs)
- [Open questions](#open-questions)
  - [Group 1 questions: foundations and forms](#group-1-questions-foundations-and-forms)
  - [Group 2 questions: shell, feedback and display](#group-2-questions-shell-feedback-and-display)
  - [Group 3 questions: CRM data and domain](#group-3-questions-crm-data-and-domain)

---

## Conventions

Every block assumes these. Each block repeats the ones that matter for it. Group 3 adds rules for CRM data
([Group 3 conventions](#group-3-conventions)).

- **Two surfaces.**
  - Staff app: Inter, 14 px text, controls 32 px (toolbars, filters) or 40 px (forms), hit areas at least 24 px.
    A block is for the staff app unless it says otherwise.
  - Public pages (S01, S02, `/consent/:token`, `/privacy/:orgSlug/*`): `data-surface="public"`, system fonts, 16 px
    text in every field, 48 px controls, 44 px hit areas, light theme only. They use native controls and work
    before JavaScript loads. They have no toasts, no tooltips and no overlays.
- **Focus.** `tailwind.css` gives every `:focus-visible` element a 2 px `focus-ring` outline with a 2 px offset. A
  background highlight alone is never the focus indicator.
  - Inside rows, menus, listbox options and calendar cells, add `focus-inset`.
  - `focus-inset` on `bg-accent` or `bg-accent-hover` also adds `focus-visible:outline-on-accent` (on `bg-danger`
    or `bg-danger-hover`: `focus-visible:outline-on-danger`). The inset ring sits on the fill, and `focus-ring` on
    `accent` is under 3:1 (with the grey placeholder they are the same colour). `on-accent` on `accent` is 10.37:1
    (light) and 10.86:1 (dark); `on-danger` on `danger` is 6.44:1 and 7.99:1.
  - Controls that keep the default 2 px offset (checkboxes, radios, switches, segments, and IconButtons inside
    cells) never take `focus-inset`, even inside table cells, so their ring sits on the row fill and not on their
    own accent fill.
  - When the focused element is hidden, as with a native radio inside a styled label, the outline moves to the
    visible box. It is never removed.
  - Never put `outline-none` or `outline-hidden` on an element unless a wrapper draws its ring
    (`has-[…:focus-visible]:outline-2` or `peer-focus-visible:outline-2`). In Tailwind v4, `outline-none` on the
    same element as `focus-visible:outline-2` cancels the ring, because both use `--tw-outline-style`.
- **Colour utilities.**
  - Text is `text-fg` (not `text-text`). `text-muted` is the secondary text.
  - `border-input` is the edge that identifies a control. `bg-input` is the same role used as a fill (switch
    track). `border-strong` is a heavier divider; plain `border` is the default divider.
  - `border-muted` is the `text-muted` role used as a stronger hover edge.
  - Components never use `dark:` and never raw hex.
- **Radius.**
  - `rounded-xs` (2 px): checkboxes.
  - `rounded-sm` (4 px): chips, tags, options, segments, menu items, tooltips.
  - `rounded-md` (6 px): buttons, inputs, selects, segmented tracks, code blocks, nav items.
  - `rounded-lg` (8 px): popovers, menus, toasts, dialogs, cards, radio cards, dropzones.
  - `rounded-pill`: radios, switches, avatars, status pills, badges and count badges.
  - Drawers have square edges.
- **Elevation and stacking.** Raised surfaces are `bg-surface-raised` with `border border-border` and `shadow-pop`
  (popover, menu, toast) or `shadow-modal` (dialog, drawer). Z order uses the tokens: `z-(--z-header)` 30,
  `z-(--z-sidebar)` 40, `z-(--z-overlay)` 50, `z-(--z-modal)` 60, `z-(--z-popover)` 70, `z-(--z-toast)` 80,
  `z-(--z-tooltip)` 90, `z-(--z-skiplink)` 100. A popover or menu opened inside a dialog sits above it.
- **Disabled.**
  - Use native `disabled` when nothing needs explaining.
  - When the person needs to know why, use `aria-disabled="true"` instead. The control stays focusable, the handler
    blocks the action, and the reason is linked with `aria-describedby` and shown in a tooltip.
  - Disabled controls are exempt from contrast rules. Ours still use listed pairs.
- **Clipping.**
  - Text that truncates keeps `pt-0.5 pb-1` inside its clipping box, so deep Indic subscripts are not cut
    (decisions.md section 2).
  - User-entered text (names, messages) gets `dir="auto"`.
- **Motion.**
  - Colour changes use `duration-fast`. Menus, popovers and tooltips use `duration-base` with `ease-standard`.
    Dialogs, drawers and toasts enter with `duration-slow` and `ease-standard`, and leave one step shorter with
    `ease-exit`.
  - Overlays, listboxes and calendars use the `animate-*` utilities from `tailwind.css` (fade-in, fade-out,
    rise-in, pop-in, slide-in-right, slide-out-right, slide-in-left, slide-out-left, indeterminate), keyed to
    Radix's `data-state`: entering `data-[state=open]:motion-safe:animate-…` plus
    `data-[state=open]:motion-reduce:animate-fade-in`, leaving `data-[state=closed]:animate-fade-out`. Popovers,
    listboxes and calendars enter with `animate-pop-in`.
  - Anything that moves sits behind `motion-safe:`. Spinners become a static icon under reduced motion. Under
    reduced motion `tokens.css` collapses every animation to 0.01 ms, so overlays appear in place and Radix still
    gets its `animationend`.
- **Icons.** `lucide-react` 1.52, imported by name, `aria-hidden`. Every icon name in this file is an export of
  that version. Only canonical names are used, never the older aliases that 1.52 still exports (so
  CircleQuestionMark, Trash and Funnel). Sizes: 16 px next to 12 to 14 px text; 20 px in navigation and in 40 and
  48 px controls; 24 px in the top bar and empty states.
- **Formatting.** Money, numbers, dates and phone numbers are formatted on the server with the `en-IN` locale and
  passed to client components as strings, so browser ICU differences cannot cause hydration mismatches.
- **Tone words.** A status or message has one tone: `neutral`, `info`, `success`, `warning` or `danger`. A tone
  sets colour only. The label and the icon carry the meaning, so colour is never the only signal.
- **Class merging.** `cn()` uses the `twMerge` exported by `replica/design/tw-merge.ts` (generated by
  `build_tokens.py`), so token names such as `text-table`, `h-control-md` and `duration-fast` merge correctly.

---

## Group 1: Foundations and forms

The parts every screen is built from: buttons, the form controls, the field wrapper, form layout, consent capture,
the copy and secret patterns on the integration screens, and four small primitives. Card, DescriptionList and
Stepper are in group 2, under Display.

### Buttons

#### Button

```text
Button
  purpose   Starts an action or submits a form. A link that navigates uses the same look on an <a>.
  anatomy   <button> (or <a> through asChild) > optional leading icon > label > optional trailing icon (ChevronDown for a
            menu trigger, ExternalLink for a new tab). In the loading state a spinner takes the leading-icon slot.
  variants  - primary: the main action of a view, card or dialog. At most one per region.
            - secondary: other actions ("Cancel", "Export", "Import").
            - ghost: low-emphasis actions in toolbars, table rows and card headers.
            - danger: solid fill. Only the final confirm of a destructive action ("Delete 12 leads"), usually in a confirm
              dialog.
            - danger-outline: a destructive action that opens a confirm step ("Revoke key", "Remove member").
            - link: looks like a text link, acts as a button ("Resend code", "Change number", "Show 3 more").
            Modifiers: leading icon, trailing icon, full width (public primary), menu trigger (trailing ChevronDown).
            icon-only: any variant with no visible label. It renders through IconButton (square, same heights) and
            must have an accessible name: aria-label naming the action and its object ("Delete Hindi"), never just
            the icon's name ("Trash"). The Button type makes `aria-label` required when `children` holds only an
            icon, and an axe test (button-name) fails the build if one slips through.
  sizes     xs 24 px: h-control-xs px-2 text-xs gap-1, icon 16. Dense toolbars and table rows only.
            sm 32 px: h-control-sm px-3 text-sm gap-2, icon 16. Page bar, filter bar, card headers. Staff default.
            md 40 px: h-control-md px-4 text-sm gap-2, icon 16. Form and dialog footers, next to 40 px inputs.
            lg 48 px: h-control-lg px-5 text-base gap-2, icon 20. Public pages only; the primary is w-full there.
            link: no height or padding. Standalone: inline-flex items-center min-h-hit, so the target is 24 px.
            Inside a sentence: plain inline, no min-height.
  states    default; hover; active (pressed); focus-visible (global outline: 2 px focus-ring, offset 2 px); disabled;
            disabled-with-reason; loading.
            - Loading starts when the click starts async work. LoaderCircle with motion-safe:animate-spin replaces the
              leading icon, or sits before the label. The label stays; an optional loadingLabel replaces it ("Saving…").
              min-width is fixed at the pre-loading width, so nothing shifts. The button gets aria-disabled="true" and
              ignores further clicks. Under reduced motion the icon is the static Loader and the label still says what is
              happening.
            - Submit buttons are never disabled to signal invalid input. They only show loading while the request runs.
              Public forms also send an Idempotency-Key, so a repeat tap creates nothing twice.
            - There is no success state on the button. Results go to a toast or an inline message.
  tokens    base       inline-flex items-center justify-center rounded-md font-medium whitespace-nowrap select-none
                       transition-colors duration-fast ease-standard
            primary    bg-accent text-on-accent hover:bg-accent-hover active:bg-accent-hover
            secondary  bg-transparent text-fg border border-strong hover:bg-surface-hover active:bg-surface-sunken
            ghost      bg-transparent text-fg hover:bg-surface-hover active:bg-surface-sunken; icons text-muted,
                       hover:text-fg
            danger     bg-danger text-on-danger hover:bg-danger-hover active:bg-danger-hover
            danger-outline  bg-transparent text-danger border border-danger hover:bg-danger-subtle
                       active:bg-danger-subtle
            link       text-accent underline decoration-1 underline-offset-2 hover:decoration-2. The colour does not
                       change on hover, so the link works on every surface.
            disabled   (all except link) bg-surface-sunken text-muted border-transparent cursor-not-allowed;
                       link: text-muted no-underline
  content   Verb first, sentence case, 1 to 3 words: "Add lead", "Save changes", "Send", "Cancel", "Try again".
            A destructive label names its object and count: "Delete 12 leads".
            Never "Click here", "OK" or "Submit".
            Loading labels: "Saving…", "Sending…", "Checking…".
            Reasons for a disabled button: "Select at least one lead first." "Only admins can change this."
  keyboard  Tab focuses. Enter and Space activate. Variants rendered as <a> activate on Enter only.
            In dialogs the primary is last in tab order and rightmost.
            Enter in a single-line field submits the form through its type="submit" button.
  a11y      <button type="button"> by default; type="submit" only on purpose. Navigation is <a href>.
            The accessible name is the visible label. Icons next to a label are aria-hidden.
            Menu trigger: aria-haspopup="menu" and aria-expanded come from Radix DropdownMenu.
            New-tab link: visible ExternalLink icon plus sr-only " (opens in a new tab)".
            Disabled-with-reason: aria-disabled="true" plus aria-describedby to the reason text, and the tooltip shows
            the same words.
            Icon-only: the name is the aria-label (see variants); the tooltip repeats it and adds nothing new.
            Loading: the form's polite status region announces the loadingLabel once.
            Targets: xs 24 px meets 2.5.8; sm 32 and md 40 exceed it; lg 48 px meets 2.5.5 (44 px) on public pages.
            A standalone link button keeps min-h-hit (24 px). Inside a sentence it uses the 2.5.8 inline exception
            and adds no height.
            Pairs: on-accent on accent, accent-hover; text on surface, surface-raised, bg, surface-hover,
            surface-sunken; danger on surface, surface-raised, danger-subtle; on-danger on danger; accent on surface,
            surface-raised, bg; text-muted on surface-sunken; on-danger on danger-hover; focus-ring on surface,
            surface-raised, bg.
  base      native <button>; Radix Slot (asChild) to render a Next <Link>; class-variance-authority for the variants.
  used on   every screen: S01-S41, M01-M06.
```

#### IconButton

```text
IconButton
  purpose   An action shown only as an icon, where space is tight: toolbars, table rows, inputs, card headers.
  anatomy   <button> > Lucide icon (aria-hidden). Radix Tooltip with the same words as the accessible name. Optional badge:
            a dot, or a count (notification bell, active filter count).
  variants  ghost (default); secondary (bordered); danger-ghost (row "Remove"); toggle (aria-pressed: wrap lines,
            show password, bold); in-field (clear, show password, open calendar), which always uses size xs.
  sizes     xs 24 px: size-control-xs, icon 16, rounded-sm. Inside inputs and chips, and in dense rows.
            sm 32 px: size-control-sm, icon 16, rounded-md. Default.
            md 40 px: size-control-md, icon 20. Next to 40 px fields.
            md-bar 40 px: size-control-md, icon size-icon-lg (24 px). Header only (AppHeader, NotificationBell),
            the top-bar size from decisions.md section 5.
            lg 48 px: size-control-lg, icon 24. Public pages.
            Always square. Count badge: h-5 min-w-5 px-1.5 rounded-pill text-xs font-medium tabular-nums, top-right,
            overlapping the corner by 4 px. Every count badge in the app uses these sizes.
  states    default, hover, active, focus-visible, pressed (toggle), disabled, disabled-with-reason, loading (the icon
            becomes a spinner; the name is unchanged), with badge.
  tokens    ghost         text-muted hover:text-fg hover:bg-surface-hover active:bg-surface-sunken
            secondary     text-fg border border-strong hover:bg-surface-hover active:bg-surface-sunken
            danger-ghost  text-muted hover:text-danger hover:bg-danger-subtle
            toggle        border border-transparent in every state, so the size never changes
            pressed       aria-pressed:bg-accent-subtle aria-pressed:text-accent aria-pressed:border-accent (a 1 px
                          accent edge, so the state is not fill alone); forced-colors:aria-pressed:border-[Highlight]
            badge dot     size-2 rounded-pill bg-danger
            badge count   rounded-pill bg-danger text-on-danger text-xs font-medium tabular-nums
            disabled      text-muted cursor-not-allowed, no hover fill
            tooltip       bg-inverse text-on-inverse text-xs rounded-sm px-2 py-1 shadow-pop z-(--z-tooltip)
  content   The name states the action and the object: "Edit stage", "Remove Hindi", "Copy API key",
            "More actions for Ravi Kumar", "Show password", "Open calendar".
            The tooltip uses the same words and adds a shortcut when one exists: "Search (/)".
  keyboard  Tab, then Enter or Space.
            The tooltip opens on hover after 400 ms and at once on keyboard focus. Esc closes it and keeps focus.
            Inside a Radix Toolbar (role="toolbar"), the group is one tab stop and arrow keys move between buttons.
  a11y      aria-label goes on the button, never on the svg.
            Toggle: aria-pressed; the name stays the same in both states.
            A badge count is part of the name: "Notifications, 3 unread". The tooltip never replaces the name.
            Target at least 24 px. Use xs only where no other target is within 24 px (2.5.8 spacing exception).
            Pairs: text-muted on surface, surface-raised, surface-hover, surface-sunken, bg; text on surface,
            surface-hover; accent on accent-subtle, surface, surface-raised (the pressed edge); danger on danger-subtle,
            surface; on-danger on danger; on-inverse on inverse; focus-ring on surface, surface-raised, surface-hover,
            surface-sunken, bg.
  base      native <button>; Radix Tooltip; Radix Toolbar for grouped toolbars.
  used on   all staff screens, mainly S04, S05, S08, S10, S12, S15, S18, S21, S22, S24, S31, S34, S37; S01 (remove file).
```

### Text and choice inputs

#### TextInput

```text
TextInput
  purpose   Single-line text: names, email addresses, URLs, codes, amounts, passwords.
  anatomy   Field wrapper (label, hint, error) > box: optional leading icon or prefix text > <input> > optional suffix
            text > optional trailing action (clear, show password) or status icon (checking, verified).
  variants  type text, email, url or password. Search uses SearchInput, small numbers NumberStepper, phone numbers
            PhoneInput, and stored secrets SecretReveal.
            Options: prefix ("₹", "https://"); suffix ("days", "%"); leading icon; clearable; password with show/hide;
            inline edit (S08 key-value rows: size sm, Enter saves, Esc cancels).
  sizes     sm 32 px: h-control-sm px-2.5 text-sm. Filters, toolbars, inline edit.
            md 40 px: h-control-md px-3 text-sm. Staff forms; the default.
            lg 48 px: h-control-lg px-4 text-base. Public pages.
            With a leading icon or prefix: pl-9, icon 16 px placed 12 px from the left edge.
            Width follows the expected value: full width in forms; fixed for short values (PIN code w-24, amount w-40).
            Staff inputs use 16 px text on touch screens (pointer-coarse:text-base) so iOS Safari does not zoom.
  states    empty (a placeholder only as a format example); hover; focus-visible; filled; invalid; disabled; read-only;
            checking (an async check such as "is this email already a lead?"); confirmed (verified email); autofilled.
            - Format is checked on blur, and only when the field is not empty. "Required" errors appear only on submit.
            - Once an error shows, the field is re-checked on every input, and the error goes as soon as the value is
              valid.
            - On blur, outer spaces are trimmed from email, URL and code values. Inner spaces in names are kept.
            - Free text has no native maxlength, because it silently cuts pasted text. Any limit is checked and shown as an
              error. Fixed-format fields may use maxlength (PIN code: 6).
            - Passwords: never trimmed, paste allowed, show/hide toggle.
  tokens    box        bg-surface text-fg border border-input rounded-md placeholder:text-muted hover:border-muted
                       transition-colors duration-fast
            adornments prefix, suffix and icons text-muted
            invalid    border-danger (with aria-invalid="true"); the error text sits below the box
            disabled   bg-surface-subtle text-muted border-border cursor-not-allowed
            read-only  bg-surface-sunken text-fg border-transparent
            checking   trailing LoaderCircle text-muted
            confirmed  trailing CircleCheck text-success, hint "Verified" in text-success
            autofilled autofill:shadow-[inset_0_0_0_1000px_var(--surface)] autofill:[-webkit-text-fill-color:var(--text)]
                       keeps our colours in both themes instead of the browser's autofill tint
  content   Labels: "Full name", "Email address", "Amount (₹)", "Website address".
            Hint: "We'll send the fee receipt here."
            Placeholder (format examples only): "name@example.com".
            Errors: "Enter an email address like name@example.com." "Enter the student's full name."
            Duplicate notice (staff, S07). The check runs under the person's data scope:
            - lead they can see: "This email already belongs to lead #10482, Arjun Mehta." with link "Open lead";
            - lead outside their scope: "This email is already on a lead you can't see. Saving adds this enquiry to
              that lead; ask your manager if you need to work on it." No name, no number, no link.
  keyboard  Standard text editing. Enter submits the form.
            Esc inside a dialog closes the dialog; it does not clear the field.
            The clear button is the next tab stop after the input. Clearing returns focus to the input.
  a11y      A visible <label for> always; never a placeholder used as the label.
            aria-describedby lists the error id first, then the hint id. aria-invalid is set only while an error shows.
            Required fields carry required. The form uses noValidate, so our messages replace the browser's.
            autocomplete tokens go only where people type their own data: public pages, S03 and their own profile.
            Tokens used: name, email, tel-national, postal-code, address-level1, address-level2, username,
            current-password, new-password (one-time-code lives in OtpInput).
            When staff type a lead's data, use autocomplete="off"; otherwise the browser offers the counsellor's own
            details. The same applies on public pages to someone else's details: the guardian fields in S01 minor
            mode are autocomplete="off" (on /consent/:token the guardian is the person, so their name is "name").
            Names and free text: dir="auto". Email, URL and codes: spellcheck="false" and autocapitalize="off".
            Password toggle: IconButton xs with aria-pressed and the name "Show password", which does not change.
            Targets: the box is 32, 40 or 48 px tall; the in-field clear and show buttons are 24 px and sit at least
            4 px from the box edge, so nothing else is inside their 24 px circle.
            Pairs: text on surface, surface-sunken; text-muted on surface, surface-subtle; border-input on surface,
            surface-raised, bg; danger on surface, surface-raised, bg; success on surface; focus-ring on surface,
            surface-raised, bg.
  base      native <input> and <label>. Not Radix Label: a plain <label> renders in Server Components.
  used on   S01, S03, S06, S07, S08, S09, S10, S11, S13, S16, S18, S19, S22, S25, S28, S29, S30, S31, S32, S33, S34,
            S35, S36, S37, S40, S41, M04.
```

#### Textarea

```text
Textarea
  purpose   Multi-line text: remarks, notes, replies, SMS bodies, success messages.
  anatomy   Field wrapper (label, hint, error) > <textarea> > footer row: SMS part count (left, sms mode) and the
            character counter (right). An sr-only polite live region announces the count.
  variants  plain; with a character limit (counter); sms (counts SMS parts and encoding); auto-grow (default) or
            fixed rows.
  sizes     staff: text-sm (14/22, which meets the 1.57 rule for multi-line user text), px-3 py-2. Starts at 3 rows
            (84 px) and grows to 10 rows, then scrolls.
            public: text-base leading-prose (16/26), px-4 py-3, 3 rows (104 px).
            Growth uses field-sizing-content with a min and max height. Where CSS.supports("field-sizing", "content")
            is false, a small script resizes the field on input. resize-y stays available.
            Footer: mt-1, text-xs (public text-sm).
  states    empty; typing; near the limit (10% or less left); over the limit; invalid; disabled; read-only.
            - The count uses code points ([...value].length), which matches Postgres char_length, so the browser and
              the server agree.
            - Near the limit the counter turns to warning colour. Over the limit, the counter turns to danger colour,
              the box gets border-danger and aria-invalid at once, and the text is never cut.
            - On submit over the limit, the field shows its error and the form's error summary lists it.
            - sms mode, encoding: GSM-7 when every character is in the GSM 03.38 basic or extension set, otherwise
              Unicode (UCS-2). Extension characters (^ { } \ [ ] ~ | €) count as 2.
            - sms mode, part sizes: GSM-7 holds 160 characters in one part, or 153 per part when longer. Unicode holds
              70 in one part, or 67 per part, counted in UTF-16 units.
            - sms mode, warning: above 3 parts, a warning line appears.
            - sms mode, merge tokens: each token counts at the maximum length set for it in S19, and the counter then
              says "about".
  tokens    box: as TextInput (bg-surface text-fg border border-input rounded-md placeholder:text-muted
            hover:border-muted). Invalid: border-danger. Disabled: bg-surface-subtle text-muted border-border.
            Read-only: bg-surface-sunken border-transparent.
            counter: text-muted tabular-nums. Near the limit: text-warning. Over: text-danger font-medium.
            sms line: text-muted. Part warning: text-warning with TriangleAlert.
  content   Label "Remark". Hint "Up to 500 characters."
            Counter: "180 left", "18 left", "12 over the limit".
            Error: "Shorten this to 500 characters or fewer."
            sms footer: "148 characters · 1 SMS" or "172 characters · 2 SMS parts".
            Unicode note: "Uses Unicode (Hindi, emoji and some symbols), so each part holds 70 characters."
            Part warning: "This message is 4 SMS parts. Each part is charged."
            Shortcut hint (staff dialogs): "Ctrl + Enter to save".
  keyboard  Enter adds a new line. Tab leaves the field and is never captured.
            In staff dialogs (S09, S15, S40), Ctrl+Enter (Cmd+Enter on Mac) submits the form.
  a11y      <label for>. aria-describedby lists the error, then the hint ("Up to 500 characters").
            The visible counter is aria-hidden. A separate sr-only live region (polite) says "{n} characters left" or
            "{n} over the limit". It updates 800 ms after typing stops, and only when 20% or less is left or the text
            is over the limit.
            dir="auto". The 22 and 26 px line heights keep Indic subscripts clear of the next line.
            Targets: the field is at least 84 px tall (staff) and 104 px (public); the counter is text, not a target.
            Pairs: text on surface, surface-sunken; text-muted on surface, surface-raised, surface-subtle; warning on
            surface, surface-raised; danger on surface, surface-raised; border-input on surface, surface-raised;
            focus-ring on surface, surface-raised.
  base      native <textarea>.
  used on   S01 (paragraph fields), S08 (notes), S09 (remark), S10 (SMS and WhatsApp text), S11 (paragraph fields),
            S15 (reply), S19 (SMS editor), S28 (paragraph field type), S31 (success message), S40 (ticket reply), M03.
```

#### Select

```text
Select
  purpose   Pick one value from a short fixed list (up to about 15 options) where search is not needed.
  anatomy   Field wrapper > trigger (value or placeholder, ChevronDown) > popover listbox > options (label, optional
            description, Check on the chosen option). Options may sit in groups with headings. Optional fields add a
            "None" option.
  variants  staff: Radix Select with position="popper", opening below the trigger.
            public: a native <select> styled as the same box.
            inline: sm, no visible label, aria-label required (rows per page in table footers).
            with a leading colour dot (stage colour): the dot is decorative; the label carries the meaning.
            Longer lists, or lists that need search, use Combobox.
  sizes     trigger sm 32, md 40, lg 48, as TextInput. The value text truncates with pt-0.5 pb-1 inside the clip.
            popover: at least the trigger's width (min-w-(--radix-select-trigger-width)), max height 320 px or the
            space available, p-1.
            option: h-menu-item (32 px) px-2 text-sm. Two-line option: min-h-12 py-1.5.
  states    closed and empty (placeholder); closed and filled; hover; focus-visible; open; option highlighted; option
            chosen; option disabled (its reason is its description); invalid; disabled; read-only (shown as text);
            loading options (the trigger says "Loading…" and is disabled); no options (the popover shows a sentence,
            not an option).
            Radix Select reads a value of "" as "nothing chosen" and shows the placeholder, so an item cannot use "".
            "None" uses the sentinel value "__none", which is mapped to null on submit.
  tokens    trigger   as TextInput box: bg-surface text-fg border border-input rounded-md hover:border-muted;
                      placeholder text-muted; chevron text-muted; invalid border-danger
            popover   bg-surface-raised border border-border rounded-lg shadow-pop z-(--z-popover); opens and closes
                      with the popover motion in the conventions (animate-pop-in, animate-fade-out)
            option    rounded-sm text-fg data-[highlighted]:bg-surface-hover focus-inset
            chosen    font-medium, Check icon text-accent
            disabled  option text-muted cursor-not-allowed
            group heading  text-xs font-medium text-muted px-2 py-1
            native select (public)  appearance-none bg-surface border border-input rounded-md pr-10, with a ChevronDown
                      overlay (pointer-events-none, text-muted)
  content   Placeholder "Choose a stage". Option "None".
            Empty list: "This stage has no sub-stages." Loading: "Loading…".
            Description on a disabled option: "Turned off in Settings".
            Rows per page (inline) name: "Rows per page".
  keyboard  Closed: Enter, Space, ArrowDown or ArrowUp opens; typed letters jump to a match.
            Open: arrows move; Home and End go to the first and last; typed letters jump; Enter or Space chooses and
            closes; Esc closes without a change. Radix blocks Tab while the list is open. Focus returns to the trigger.
            Native select: browser behaviour.
  a11y      Radix gives the trigger role="combobox", aria-expanded and aria-controls; the list role="listbox"; options
            role="option".
            The label points at the trigger id (<label for>; Select.Trigger takes an id). Required: Radix required,
            which sets aria-required.
            Radix renders a hidden native select, so Server Actions receive the value.
            Keep option names short; a description is shown but is not part of the name.
            Targets: trigger 32 px or more; options 32 px tall (h-menu-item) and the full popover width.
            Pairs: text on surface, surface-raised, surface-hover; text-muted on surface, surface-raised; accent on
            surface-raised, surface-hover; border-input on surface, surface-raised, bg; danger on surface; focus-ring
            on surface, surface-raised, surface-hover.
  base      Radix Select (staff). Native <select> on public pages and for the phone country code.
  used on   S01, S05 (rows per page), S06 (operator), S09 (stage, sub-stage), S11 (event type), S16, S18, S19, S22,
            S25, S28, S29, S32, S33, S35, S36, S41, M04.
```

#### Combobox (single and multi-select)

```text
Combobox
  purpose   Pick one or many values from a long or searchable list: counsellors, programmes, time zones, saved filters,
            templates, fields.
  anatomy   Field wrapper > control box: chosen chips (multi), text input (role="combobox"), clear-all button, toggle
            button (ChevronDown) > popover: visible status line (count, limit, loading, no matches; aria-hidden)
            above a listbox > options (optional avatar or icon, label, optional second line, chosen mark).
            Next to the input, outside the popover: one sr-only role="status" region, always mounted.
  variants  single: the input shows the chosen label.
            multi: chips plus the input.
            multi with max: max={n}.
            async: server search with debounce.
            grouped options.
            dense filter (sm, filter bars): shows the first chip and a "+3" summary chip.
            The public multi-choice on S01 is not a combobox. It is a Checkbox group with max (see Checkbox).
  sizes     control: min height sm 32 or md 40. Chips wrap and the box grows up to 3 rows, then scrolls inside.
            chip: h-chip (24 px) pl-2 rounded-sm text-xs. The label truncates with pt-0.5 pb-1 inside the clip.
            chip remove button: 24 x 24 (size-hit) with a 16 px X.
            popover: the control's width, max height 320 px.
            option: min-h-menu-item (32 px) px-2 text-sm. With a second line: min-h-12 py-1.5.
            chosen mark in multi: a 16 px box (size-checkbox).
  states    empty; typing (filtering); open; option highlighted; option chosen; option disabled; limit reached; no
            matches; loading (async); load error; invalid; disabled; read-only (chips without remove buttons, no input).
            - Filtering: case- and accent-insensitive "contains" match on the label and the second line. The matched
              text is shown in font-semibold.
            - Async: 250 ms debounce. Starts at 1 character, or 2 for name search across more than 1,000 rows. Shows
              the last results while loading. Cancels stale requests.
            - Single: choosing fills the input with the label and closes the list. Typing over a chosen value clears
              the choice until a new option is chosen. On blur with no new choice, the input shows the last chosen
              label again.
            - Multi: Enter or a click toggles an option. The list stays open and the query stays. Chosen options stay
              in the list with their mark.
            - Max: at the max, unchosen options get aria-disabled and the status line says the limit is reached.
              Trying one only repeats that message. Removing a chip frees a slot at once.
            - Clear all appears when 1 or more values are chosen. It acts at once, except above 10 values, where it
              asks first.
  tokens    control   bg-surface border border-input rounded-md hover:border-muted; invalid border-danger.
                      The input is bg-transparent text-fg placeholder:text-muted with focus-visible:outline-none. The
                      ring moves to the box: has-[input:focus-visible]:outline-2
                      has-[input:focus-visible]:outline-focus-ring has-[input:focus-visible]:outline-offset-2
            chip      bg-accent-subtle text-fg; remove button text-muted hover:text-fg hover:bg-surface-hover
                      rounded-sm
            popover   bg-surface-raised border border-border rounded-lg shadow-pop z-(--z-popover)
            status line  text-xs text-muted px-2 py-1.5 border-b border-border; at the limit text-fg font-medium.
                      Visible only; it is aria-hidden (the sr-only region announces)
            option    text-fg rounded-sm. The highlighted option (aria-activedescendant, so it never has DOM focus)
                      gets bg-surface-hover plus outline-2 outline-focus-ring focus-inset, so it is as visible as real
                      focus.
            chosen mark  single: Check text-accent at the right. Multi: box border border-input rounded-xs; when
                      chosen bg-accent border-accent with a Check in text-on-accent.
            aria-disabled option  text-muted cursor-not-allowed
  content   Placeholders: "Search counsellors", "Search time zones".
            Status line: "3 of 5 chosen". At the limit: "5 of 5 chosen. Remove one to add another."
            No matches: "No counsellor matches "anj"." Loading: "Searching…".
            Load error: "Couldn't load the list." with a "Retry" link button.
            Chip remove name: "Remove Anjali Rao". Clear all name: "Clear all counsellors".
            Announcements: "12 results". "Anjali Rao removed."
  keyboard  Input:
            - Typing filters and opens the list.
            - ArrowDown and ArrowUp open the list and move the active option. Alt+ArrowDown opens it without moving.
            - Enter chooses the active option (multi: toggles it).
            - Esc closes the list. A second Esc clears the query but keeps the choice.
            - Tab closes the list and moves on without choosing the highlighted option.
            - Home and End move the caret.
            Chips (multi):
            - Backspace in an empty input moves focus to the last chip.
            - ArrowLeft and ArrowRight move between chips and back into the input.
            - Backspace or Delete removes the focused chip, then focuses the next chip or the input.
            The toggle button is pointer-only (tabindex -1). Clear all is a tab stop after the input.
  a11y      Input: role="combobox", aria-expanded, aria-controls (the listbox id), aria-autocomplete="list",
            aria-activedescendant (the active option id). aria-describedby lists only the error and the hint.
            Listbox: role="listbox", named after the field. In multi mode it also has aria-multiselectable="true".
            Options: role="option". aria-selected marks the active option, as in the APG combobox. In multi mode,
            aria-checked="true" or "false" marks whether the option is chosen. Options blocked by the limit get
            aria-disabled.
            One sr-only role="status" region, always mounted next to the input, carries every announcement: result
            counts, "Searching…", the limit, and chips added or removed (which happen while the list is closed). The
            visible status line in the popover is aria-hidden, because the popover mounts and unmounts with the
            list and a region inserted with its text is often not read.
            Chip remove buttons are 24 px (2.5.8). Options are at least 32 px tall.
            Screen-reader check before release: in multi mode, confirm NVDA (Chrome), JAWS (Chrome) and VoiceOver
            (Safari) read aria-checked on options. If one does not, switch multi mode to aria-selected for the
            chosen state on every option and leave the active option to aria-activedescendant alone.
            Pairs: text on surface, surface-raised, surface-hover, accent-subtle; text-muted on surface,
            surface-raised, accent-subtle, surface-hover; accent on surface-raised, surface-hover; on-accent on
            accent; border-input on surface, surface-raised, surface-hover; danger on surface; focus-ring on surface,
            surface-raised, surface-hover.
  base      Downshift useCombobox and useMultipleSelection (MIT) for state, ARIA and keys. Radix Popover places the list:
            Anchor is the control box, modal={false}, and onOpenAutoFocus is prevented so focus stays in the input.
            Not cmdk: it marks the highlighted item with aria-selected and cannot also mark chosen items in a
            multi-select.
  used on   S05 (owner filter, column chooser search), S06 (value pickers), S09 (owner), S10 (template picker),
            S11 (owner, time zone), S13 (target counsellors), S16 (audience), S18 (action targets), S22 (group-by fields),
            S26, S28 (picklist), S32 (team, programmes), S37 (webhook events), S41. S01 uses the Checkbox group with max.
```

#### Checkbox

```text
Checkbox
  purpose   Turn one option on or off inside a form, or choose any number of options from a visible list.
  anatomy   <label> row: box (native input, appearance-none, peer) + Check or Minus icon on top + label text + optional
            description.
            Group: <fieldset> > <legend> > hint > counter (with max) > rows > error.
  variants  single; group (vertical, or horizontal for 3 or fewer short labels); group with max (public multi-choice on
            S01); indeterminate (select-all in table headers, S33 module rows); table row (no visible label);
            card (bordered row with a description, for S37 scopes).
  sizes     staff: box 16 px (size-checkbox) in a 24 px hit area. Rows are min-h-hit. In tables, the box is wrapped in a
            size-hit label. Label text-sm, gap-2, icon 12 px (size-3).
            public: box 20 px (size-5) in a 44 px row (min-h-hit-public); the label is part of the target. Label
            text-base, gap-3, icon 16 px.
            card: border rounded-lg p-3.
  states    unchecked; hover; checked; indeterminate; focus-visible; disabled (checked or not); invalid; limit reached
            (the unchecked boxes in a group with max); read-only (shown as the text "Yes" or "No", not as a control).
            Group with max:
            - The counter ("2 of 3 chosen") updates as boxes change.
            - At the max, the unchecked boxes get aria-disabled="true" and an aria-describedby to the limit note.
            - A click on one of them is prevented, and the status says the limit is reached.
            - Without JavaScript the boxes stay enabled, and the server returns the same words as a field error.
            Long group (more than 12 options, S01 programme lists):
            - Without JavaScript the full list shows, grouped under the picklist's parent headings (nested fieldsets).
            - With JavaScript a "Filter programmes" text input appears above the list. It hides rows that do not
              match (same matching as Combobox). Ticked rows always stay visible, so the person can see and untick
              them. The rows stay native checkboxes, so the S01 script budget is not spent on a combobox.
            Indeterminate: set through the DOM property (el.indeterminate = true). Clicking it checks every row.
  tokens    box       appearance-none rounded-xs border border-input bg-surface hover:border-muted
            on        checked:bg-accent checked:border-accent indeterminate:bg-accent indeterminate:border-accent
            icon      text-on-accent, shown with peer-checked:block or peer-indeterminate:block, pointer-events-none
            invalid   border-danger
            disabled  bg-surface-subtle border-border. Checked and disabled: bg-surface-sunken, icon text-muted. Label
                      text-muted.
            aria-disabled (limit)  label text-muted; the box is unchanged
            forced colours  forced-colors:appearance-auto on the input; the icon is forced-colors:hidden
            focus     the global ring with its 2 px offset, also in table cells (the 24 px label leaves room).
                      Never focus-inset: the ring would sit on the checked accent fill.
            description text-xs text-muted (public text-sm)
            counter   text-sm text-muted; at the max text-fg font-medium
            card      border border-border has-[:checked]:border-accent has-[:checked]:bg-accent-subtle
  content   Single: "Send a copy to my email", "Make this field required".
            Group: legend "Programmes you're interested in"; hint "Choose up to 3."; counter "1 of 3 chosen".
            Limit status: "You can choose up to 3. Untick one to choose another."
            Filter label: "Filter programmes". Filter status: "8 of 40 programmes shown." No match: "No programme
            matches "civil"."
            Required group error: "Choose at least one programme."
            Table row name: "Select Meera Pillai". Header name: "Select all 25 leads on this page".
  keyboard  Each box is its own tab stop. Space toggles. Clicking the label toggles.
  a11y      Native <input type="checkbox">: it submits without JavaScript, and screen readers report checked,
            not checked and mixed.
            The label wraps the input or uses for/id. Description and limit note through aria-describedby.
            Group errors: the fieldset gets aria-describedby to the error, and each box gets aria-invalid.
            The counter is role="status" (polite).
            Never pre-ticked for consent or marketing.
            The select-all name says how many rows it affects.
            Filter (long group): a labelled text input; a polite status says "8 of 40 programmes shown". Hidden rows
            use the hidden attribute, so they leave the tab order.
            Targets: staff rows and table cells are 24 px or more (the 16 px box sits in a 24 px label); public rows
            are 44 px and the label is part of the target.
            Pairs: border-input on surface, surface-hover, accent-subtle, surface-raised, bg; accent on surface,
            accent-subtle, surface-hover; on-accent on accent; text on surface, accent-subtle; text-muted on surface;
            danger on surface; focus-ring on surface, surface-hover, accent-subtle.
  base      native <input type="checkbox">. Not Radix Checkbox, which needs JavaScript to submit; public pages
            cannot rely on that.
  used on   S01, S05 (row select, select all), S07, S10, S13, S16, S20 (compare), S22, S24 (preference grid), S26,
            S28 (field flags in the builder), S29, S32, S33 (permission matrix), S37 (scopes, events), M02, M04;
            /consent/:token, /privacy/:orgSlug/withdraw.
```

#### RadioGroup (list and cards)

```text
RadioGroup
  purpose   Choose exactly one of a few visible options (2 to 6). Radio cards add a description to each option.
  anatomy   <fieldset> > <legend> > hint > rows (native radio, peer + dot + label + optional description) > error.
            Card: the whole card is the <label>, with the radio at top left, a title, a description, and an optional
            icon or badge.
  variants  list (vertical); inline (3 or fewer short labels); cards (stacked); card grid (2 or 3 columns from md up);
            conditional reveal: a choice shows one extra field right under it ("Schedule for later" shows the
            DateTimePicker).
  sizes     staff: circle 16 px (size-checkbox) in a 24 px hit area, dot 8 px (size-2), label text-sm, gap-2.
            public: circle 20 px (size-5), dot 10 px (size-2.5), 44 px rows (min-h-hit-public), text-base.
            card: p-4 gap-3 rounded-lg, title text-sm font-medium, description text-xs, minimum width 200 px.
  states    none chosen; hover; chosen; focus-visible; disabled option (its reason is the description); disabled group;
            invalid (required and none chosen); read-only (the chosen label shown as text).
            Starting value: settings show the saved value. Choices with consequences (bulk owner mode, data scope, send
            now or later) start with nothing chosen, unless one option is clearly safe.
  tokens    circle    appearance-none rounded-pill border border-input bg-surface hover:border-muted
                      checked:border-accent; forced-colors:appearance-auto
            dot       rounded-pill bg-accent, shown with peer-checked:block; forced-colors:hidden
            card      bg-surface border border-border rounded-lg hover:bg-surface-hover
                      has-[:checked]:border-accent has-[:checked]:bg-accent-subtle
            card focus  has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus-ring
                      has-[:focus-visible]:outline-offset-2. The radio inside uses focus-visible:outline-none, so one
                      ring shows.
            invalid   circles border-danger; error text-danger
            disabled  text-muted; circle border-border bg-surface-subtle
  content   S13 cards:
            - "Add to current owners" / "The leads keep their owners and gain the people you pick."
            - "Replace current owners" / "Current owners are removed. The people you pick become the only owners."
            S33 data scope: "Only their own leads", "Their team's leads", "All leads".
            S16: "Send now", "Schedule for later".
            Error: "Choose how to assign these leads."
  keyboard  Tab enters the group on the chosen radio, or the first one when none is chosen. The next Tab leaves.
            Arrow keys move and choose (native). Space chooses the focused radio when none is chosen.
  a11y      Native radios share one name inside fieldset and legend, so the group name is read with each option.
            Each description is linked with aria-describedby on its input.
            A conditional field comes right after its radio in DOM order, and only the chosen option's field exists.
            A chosen card shows by its fill and the dot, not by colour alone.
            Targets: staff rows 24 px or more (16 px circle in a 24 px label); public rows 44 px; a card's whole
            surface is its target.
            Pairs: border-input on surface, surface-hover, accent-subtle; accent on surface, accent-subtle; text on
            surface, surface-hover, accent-subtle; text-muted on surface, accent-subtle; danger on surface; focus-ring
            on surface.
  base      native <input type="radio"> in a <fieldset>. Not Radix RadioGroup, which needs JavaScript.
  used on   S01, S07 (duplicate handling), S13, S16, S18 (all or any), S22, S25 (payment mode), S28 (field type cards),
            S29, S30, S33 (data scope cards), S36, S37 (key type), S41; /consent/:token (guardian decision).
```

#### Switch

```text
Switch
  purpose   Turn a setting on or off with immediate effect, with no Save button.
  anatomy   Row: label and optional description on the left; on the right a <label> holding a visually hidden native
            checkbox (role="switch", peer), the track and the thumb. An inline message appears if saving fails.
  variants  settings row; in a table (S17 on/off, with an sr-only label); with confirmation (turning off something that
            stops sending asks first in a dialog).
            Rule: inside a form that has a Save button, use Checkbox instead.
  sizes     sm: track 36 x 20 px (w-9 h-5), thumb 16 px (size-4), moves 16 px.
            md: track 44 x 24 px (w-11 h-6), thumb 20 px (size-5), moves 20 px.
            The hit area is the whole row label, at least min-h-hit (24 px). In tables the switch cell's label is at
            least 24 px.
            Not used on public pages (they use Checkbox).
  states    off; on; hover; focus-visible; pending (saving); failed (flips back); disabled; disabled-with-reason (no
            permission: aria-disabled).
            - The switch flips at once and the change is sent.
            - While the save runs, the input is aria-disabled. After 300 ms the thumb shows a small spinner.
            - On failure it flips back, and "Couldn't save. Try again." appears under the row (role="alert").
            - On success there is no toast; the switch state is the confirmation.
  tokens    track off   bg-input (the border-input role as a fill) hover:bg-muted
            thumb off   bg-surface
            track on    bg-accent hover:bg-accent-hover
            thumb on    bg-on-accent
            both        rounded-pill border border-transparent (the border shows in forced-colours mode); thumb
                        shadow-card
            motion      thumb motion-safe:transition-transform duration-fast ease-standard;
                        peer-checked:translate-x-4 (md: translate-x-5)
            forced colours  forced-colors:peer-checked:bg-[Highlight] on the track
            focus       ring on the track: peer-focus-visible:outline-2 peer-focus-visible:outline-focus-ring
                        peer-focus-visible:outline-offset-2
            disabled    off: track bg-surface-sunken, thumb bg-surface. On: track bg-accent-subtle, thumb bg-surface.
                        Label text-muted. The thumb position still shows the state.
            failure     message text-danger with CircleAlert
  content   Labels name the setting, not the action:
            - "Round-robin assignment" / "Spreads new leads evenly across the people you pick."
            - "Remark required"
            - "Email me when a lead is assigned to me"
            - "Form accepts enquiries"
            In-table sr-only name: "Automation: Welcome series".
            Failure: "Couldn't save. Try again." No permission: "Only admins can change this."
  keyboard  Tab focuses. Space toggles (native checkbox). Enter does nothing.
  a11y      <input type="checkbox" role="switch">: screen readers say "switch, on" or "off". The label never changes
            with the state.
            The description is linked with aria-describedby.
            While pending: aria-busy on the row and aria-disabled on the input. Failure text is role="alert".
            Both the thumb position and the fill show the state. The thumb edge has 3:1 against the track.
            Targets: the whole row label, at least 24 px tall; in a table the cell label is at least 24 x 44 px.
            Pairs: border-input on surface, surface-raised (the track against the page; the thumb against the track);
            text-muted on surface (hover track); on-accent on accent, accent-hover; accent on surface, surface-raised;
            text on surface; text-muted on surface; danger on surface; focus-ring on surface, surface-raised.
  base      native <input type="checkbox" role="switch"> with sibling spans. Not Radix Switch: this way it renders in
            Server Components and behaves like Checkbox.
  used on   S13 (round robin), S17 (on/off), S24 (preferences), S29 (stage flags, enable), S30, S31 (form active),
            S32 (active/inactive), S35, S37 (webhook endpoint on/off), S41 (publisher active).
```

#### NumberStepper

```text
NumberStepper
  purpose   Enter a small whole number, with buttons to step it: the stage score (-10 to +10), daily caps, quotas,
            retry counts, waits.
  anatomy   Field wrapper > group: decrease button (Minus) | input (role="spinbutton") | increase button (Plus) >
            optional unit text, or a unit Select (minutes, hours, days) > hint and error.
  variants  signed (score: shows "+5", "0", "-3"); count (minimum 0); with unit text ("leads a day"); duration (value
            plus unit Select, stored as minutes; S18 waits and S11 reminders).
  sizes     sm 32 or md 40, the same heights as TextInput. Buttons are square at that height.
            input: w-14 (56 px) for up to 3 characters, w-20 for 5; text-center tabular-nums.
            The group has one border and rounded-md. A border-input line separates each button from the input.
  states    empty; valid; hover (each button); focus-visible (input or button); at minimum (decrease aria-disabled);
            at maximum (increase aria-disabled); invalid (out of range, not a whole number, or empty when required);
            disabled; read-only (text only: "+5 points").
            - Accepts digits, a leading "-" or "−" (U+2212) and a leading "+". Spaces are trimmed.
            - A typed value outside the range stays as typed, and the error states the range. Nothing is clamped
              silently. The buttons clamp.
            - Holding a button repeats after 400 ms, then every 80 ms, and stops at the limit.
            - Mouse-down on a button does not take focus from the input, so a screen reader hears the new value on the
              spinbutton.
            - The signed variant shows "+" on positive values after blur. 0 has no sign.
            - Value out: an integer, or null when empty and optional. Duration: integer minutes.
  tokens    group     bg-surface border border-input rounded-md hover:border-muted; invalid border-danger
            buttons   text-muted hover:text-fg hover:bg-surface-hover active:bg-surface-sunken; aria-disabled
                      text-muted cursor-not-allowed with no hover fill; dividers border-input
            input     bg-transparent text-fg text-center tabular-nums
            disabled  bg-surface-subtle text-muted border-border
  content   S29: label "Score change"; hint "From -10 to +10. Use a negative number when this stage means less
            interest."; error "Enter a whole number from -10 to +10."; button names "Decrease score change" and
            "Increase score change".
            S41: label "Daily lead limit"; unit "leads a day"; hint "Leave empty for no limit."
            S18: label "Wait"; unit select "minutes", "hours", "days".
            S16 retries: label "Retries" (count, 0 to 5); label "Retry every" (duration with the unit text "hours",
            8 to 48, stored as minutes). For WhatsApp the minimum is 24, with the error "WhatsApp retries must be at
            least 24 hours apart." Other channels: "Enter a whole number from 8 to 48."
            Empty and required: "Enter a number."
  keyboard  Input: ArrowUp and ArrowDown change the value by 1; PageUp and PageDown by 5; typing edits freely; Enter
            submits the form. Home and End move the caret, as in any text field.
            The buttons are not tab stops (tabindex -1), because the input covers keyboard use. Screen-reader cursors
            and touch still reach them.
  a11y      The input has role="spinbutton", aria-valuenow, aria-valuemin, aria-valuemax, and aria-valuetext ("plus 5",
            "minus 3", "5 leads a day").
            It is type="text", not type="number": no scroll-wheel changes and no "e". It uses inputmode="numeric" only
            when the minimum is 0 or more, because the iOS numeric keypad has no minus key.
            Label for/id. aria-invalid, and aria-describedby lists the error then the hint.
            The buttons have names and are aria-disabled at the limits.
            After a button press, a polite live region repeats the value for touch screen-reader users, whose focus
            moves to the button.
            Targets: each button is square at the control height, 32 or 40 px.
            Pairs: text on surface, surface-hover; text-muted on surface; border-input on surface, surface-raised;
            danger on surface; focus-ring on surface.
  base      native <input type="text" role="spinbutton"> and two native <button>s. Radix has no number field.
  used on   S11 (reminder before), S16 (retry count and retry interval), S18 (wait), S29 (score), S32 (assignment
            quota), S41 (daily cap).
```

### Phone, code, date and file inputs

#### PhoneInput

```text
PhoneInput
  purpose   Enter a phone number with its country code. The value leaves as E.164, for example +919876543210.
  anatomy   Field wrapper (label "Mobile number") > group: native country-code <select> | national-number input >
            hint > error.
            With JavaScript, a hidden input name="{field}" holds the E.164 value. Without JavaScript the server gets
            "{field}_country" and "{field}_national" and builds the same value.
  variants  public (lg, native select, India first, no formatting library); staff (md, same native select,
            libphonenumber-js loaded for formatting and checks); inline extra number (S08 alternate numbers, sm).
            A masked number is shown by the masked-value display component, not by this input.
  sizes     The select is w-28 (112 px) and the input flex-1. Heights: h-control-lg (public), h-control-md (staff),
            h-control-sm (inline).
            The two parts share one outer border: the select has rounded-l-md, the input rounded-r-md, and a
            border-input line divides them.
  states    empty (+91 chosen); typing; filled; invalid (digit count); invalid from the server (not a real number for
            that country); pasted international number (the country switches); duplicate found (staff S07, async);
            disabled; read-only.
            Country list:
            - India (+91) first, then the institution's pinned countries (up to 5, set in S30), then every country
              A to Z.
            - Option text "+91 India", so the closed select shows the code first.
            Accepted input:
            - Spaces, dashes, brackets and a leading 0.
            - A pasted "+91…", "0091…" or "91" followed by 10 digits. It is normalised on blur.
            - A pasted "+971 50 123 4567" switches the select to +971.
            - Shared codes (+1, +7, +44): keep the current country if it has that code, otherwise pick the main one.
            Checks:
            - The browser checks the digit count only: exactly 10 national digits for India, 4 to 14 elsewhere.
            - The server validates with the libphonenumber-js "max" metadata.
            - Never guess mobile or landline from the first digit.
            Display on blur:
            - India: "98765 43210".
            - Staff screens format other countries with libphonenumber-js AsYouType.
            - Public pages leave other countries as typed digits, because of the public script budget.
  tokens    Both parts use the TextInput box. Chevron text-muted. Divider border-input.
            invalid   the whole group border-danger
            focus     each part keeps its own outline (global rule)
            duplicate notice  text-sm text-fg with a link in text-accent underline
  content   Label "Mobile number". Public hint: "We'll send a code to check it's yours."
            Select name: "Country code".
            Errors: "Enter a 10-digit mobile number." "This doesn't look like a valid number for the United Arab
            Emirates." "Enter a mobile number."
            Staff duplicate notice, under the person's data scope: "This number is on lead #10482, Arjun Mehta." with
            link "Open lead"; for a lead outside their scope: "This number is already on a lead you can't see.
            Saving adds this enquiry to that lead; ask your manager if you need to work on it." (no name, number or
            link).
  keyboard  Tab goes to the select, then the number.
            The select is native. Typing "+97" jumps to +971, because options start with the code.
            The number field uses standard editing.
  a11y      The group has role="group" and aria-labelledby pointing at the label. The visible <label for> points at
            the number input. The select has aria-label="Country code", and its visible text is the code.
            Hint and error ids go on the number input's aria-describedby. aria-invalid goes on the part at fault, or
            on both when the server cannot tell.
            Public autocomplete: select "tel-country-code"; input type="tel", "tel-national". When staff enter a lead's
            number, and for the guardian's mobile in S01 minor mode, both are autocomplete="off".
            dir="ltr" on the number input, so digits stay left to right on Urdu pages.
            Targets: select and input are each 48 px tall on public pages (40 staff, 32 inline); the select is 112 px
            wide.
            Pairs: text on surface; text-muted on surface; border-input on surface, bg, surface-raised; accent on
            surface; danger on surface, bg; focus-ring on surface, bg.
  base      native <select> and native <input type="tel">; libphonenumber-js on staff screens only.
  used on   S01, S07, S08 (alternate numbers), S32 (member mobile), S35 (test number), M04; /consent/:token (guardian
            mobile).
```

#### OtpInput

```text
OtpInput
  purpose   Enter a 6-digit code sent by SMS or email, or shown in an authenticator app.
  anatomy   Field wrapper: label > hint (where the code went, plus a "Change number" or "Change email" link) > one
            input > error. Then a row: "Verify" button and the "Resend code" link button with its countdown. A polite
            status region.
  variants  sms (WebOTP and one-time-code autofill); email; totp (S03 two-step sign-in: no resend, plus a "Use a
            recovery code" link that swaps in a text input for a recovery code); guardian (the code goes to the
            guardian, /consent/:token; opening the link sends nothing, and the code goes only when the guardian
            presses "Send code", so link previews are harmless).
  sizes     public: h-control-lg, w-44, text-base. Staff (S03): h-control-md, w-40, text-base.
            The input uses tabular-nums tracking-widest.
            Verify: Button primary (lg and full width on public pages, md on staff screens).
  states    waiting (code sent, field empty); typing; filled (6 digits); verifying (button loading, field read-only);
            verified (field read-only, "Verified" with CircleCheck, the flow continues); wrong code; expired; too many
            tries (field disabled until the time shown); resend countdown; resent; send failed.
            Input:
            - One field. Never one box per digit, so not Radix one-time-password-field.
            - On input and on paste, everything except digits is removed and the first 6 digits are kept. Pasting
              "Your code is 482 913" gives 482913.
            - No maxlength attribute: it would cut a pasted "482 913" before the script cleans it.
            - No auto-submit when the 6th digit arrives (3.2.2). Enter or Verify submits.
            Autofill:
            - Where WebOTP exists, call navigator.credentials.get({ otp: { transport: ["sms"] }, signal }) on mount,
              fill the field with the result, and abort on submit or unmount.
            - Inside a cross-origin iframe this needs allow="otp-credentials" on the embed (open question 5).
            - The SMS template ends with the line "@{host} #{code}", registered on DLT, so Android and iOS can offer
              the code.
            Errors and resend:
            - Wrong code: the digits are kept and selected, so typing replaces them. After 2 wrong tries the error
              says how many are left (the number comes from the server).
            - Resend is aria-disabled for 30 s. The countdown shows after the label but is not part of the name
              (see a11y). Each resend restarts the countdown and invalidates the old code.
  tokens    input     the TextInput box plus tabular-nums tracking-widest
            hint      text-muted; links text-accent underline
            countdown text-muted (inside the aria-disabled link button)
            error     text-danger with CircleAlert
            verified  CircleCheck text-success and the word "Verified" in text-success
  content   Label: "Enter the 6-digit code".
            Hint: "We sent it by SMS to +91 98765 43210." with link "Change number". Email: "We sent it to
            priya@example.com." Expiry: "The code works for 10 minutes."
            TOTP label: "Code from your authenticator app".
            Errors:
            - "That code isn't right. Check the latest SMS and try again. 3 tries left."
            - "This code has expired. Ask for a new one."
            - "Too many wrong codes. Try again after 4:45 pm."
            - "We couldn't send the code. Check the number and try again."
            Resend link: "Resend code" with " in 0:24" after it while waiting, then "Resend code" alone.
            Wait note (sr-only, written once): "You can ask for a new code in 30 seconds"
            Status: "We sent a new code." "You can ask for a new code now."
  keyboard  Tab order: input, Verify, Resend code, Change number. Enter in the input submits. Paste works.
  a11y      type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" (the server checks again).
            Visible label. aria-describedby lists the error, then the hint.
            Server errors render in a role="alert" container. Focus stays in the field and would not re-read its
            description otherwise.
            Resend markup: <button aria-disabled="true" aria-describedby="otp-wait">Resend code<span
            aria-hidden="true"> in 0:24</span></button>, plus an sr-only #otp-wait that says "You can ask for a new
            code in 30 seconds", written once. The name never changes, so NVDA and JAWS do not re-announce it every
            second. When the wait ends, the status region says "You can ask for a new code now" once.
            The hint shows where the code went, so nobody types the address again (3.3.7).
            The only time limit is the code's own expiry, which is stated in the hint (2.2.1).
            Targets: field and Verify 48 px on public pages. "Resend code" and "Change number" are standalone link
            buttons with min-h-hit-public (44 px) on public pages and min-h-hit (24 px) on S03.
            Pairs: text on surface; text-muted on surface, bg; accent on surface, bg; danger on surface, bg; success
            on surface, bg; border-input on surface, bg; focus-ring on surface, bg.
  base      native <input type="text">; the WebOTP API where available.
  used on   S01 (email or mobile check; not in minor mode, where no code goes to the child), S03 (two-step sign-in);
            /consent/:token (guardian),
            /privacy/:orgSlug/requests and /privacy/:orgSlug/withdraw (identity check).
```

#### DatePicker

```text
DatePicker
  purpose   Enter or pick one calendar date, with no time.
  anatomy   Field wrapper > text input (typed date) with a trailing calendar IconButton > Radix Popover:
            - month caption with previous and next month buttons, plus month and year selects when the range is wide;
            - the day grid;
            - footer with "Today" and "Clear".
            The memorable-date variant is three short inputs in a fieldset.
  variants  popover (staff default); memorable date (dates people know, such as date of birth, on public pages and
            for date of birth in S07 and S08); inline calendar (no input, inside DateTimePicker and DateRangePicker);
            with min and max; with disabled dates.
  sizes     input: sm 32 or md 40 (lg 48 on public pages), w-40 (160 px), wide enough for "06 Sept 2026".
            popover: p-3 rounded-lg. Day cell 32 x 32 (size-control-sm), text-sm tabular-nums. Caption text-sm
            font-semibold. Navigation buttons IconButton sm.
            memorable date: day w-14, month w-14, year w-20; lg on public pages.
  states    empty; typing; valid (shows the canonical "06 Oct 2026"); invalid (cannot be read, not a real date, or
            outside min/max); open; day hover; day focused; day chosen; today; outside-month day; disabled day;
            warning (a past date that is allowed but unusual, as on S11); disabled; read-only.
            Typed dates:
            - Accepted forms: DD/MM/YYYY, D/M/YY, DD-MM-YYYY, DD.MM.YYYY, "6 Oct 2026", "6 Sept 2026" and
              "2026-10-06".
            - The day always comes first; never month first.
            - Read on blur and on Enter. A valid date is shown again in the canonical form.
            - Two-digit years: 00 to 69 mean 2000s, 70 to 99 mean 1900s.
            Calendar:
            - Weeks start on Sunday. Set weekStartsOn: 0 explicitly; do not rely on the locale object's default.
            - Opening the calendar focuses the chosen day, or today, or the nearest enabled day.
            - Choosing a day fills the input, closes the popover and returns focus to the calendar button.
            Value out: an ISO date with no time zone, "2026-10-06".
            Memorable date: day 1 to 31, month 1 to 12 or a name ("oct", "October"), 4-digit year. The three parts
            are checked as one date.
  tokens    input     the TextInput box; calendar button IconButton xs ghost (text-muted)
            popover   bg-surface-raised border border-border rounded-lg shadow-pop z-(--z-popover)
            caption   text-fg; weekday headers text-xs text-muted
            day       rounded-md text-fg hover:bg-surface-hover focus-inset
            chosen    bg-accent text-on-accent hover:bg-accent-hover focus-visible:outline-on-accent (the inset
                      ring on the accent fill; opening the calendar focuses this day)
            today     font-semibold plus a 2 px bar under the number in bg-accent (bg-on-accent when chosen)
            outside month  text-muted
            disabled  text-muted line-through cursor-not-allowed
            warning   hint row text-warning with TriangleAlert
  content   Labels: "Follow-up date", "Date of birth". Hint: "For example 06/10/2026".
            Memorable-date hint: "For example 27 3 2008". Its inputs: "Day", "Month", "Year".
            Errors: "Enter a date like 06/10/2026." "That date doesn't exist. Check the day and month." "Choose a date on
            or after 06 Oct 2026."
            S11 warning: "This date has passed. The follow-up will show as overdue."
            Buttons: "Open calendar", "Previous month", "Next month", "Today", "Clear". Dialog name: "Choose a date".
  keyboard  Input: type a date. Alt+ArrowDown or the calendar button opens the calendar.
            Grid:
            - Arrows move by a day or a week.
            - Home and End go to the start and end of the week.
            - PageUp and PageDown change the month; with Shift they change the year.
            - Enter or Space chooses.
            - Esc closes and returns focus to the calendar button.
            - Tab moves through the caption controls, the grid and the footer. Focus stays in the popover until it
              closes.
  a11y      The popover content is role="dialog" with aria-label "Choose a date" (Radix Popover, modal).
            The grid is role="grid". Each day is a button with the full date as its name ("Tuesday, 6 October 2026").
            The chosen day has aria-selected, today has aria-current="date", and disabled days have aria-disabled.
            The caption is aria-live="polite", so month changes are read.
            The input is always enough on its own; nobody has to use the calendar.
            Memorable date: fieldset and legend; inputs labelled "Day", "Month" and "Year"; inputmode="numeric" on all
            three (month names still work from a keyboard). Public date of birth uses autocomplete bday-day, bday-month
            and bday-year.
            Targets: day cells and navigation buttons 32 px; the calendar button inside the input is 24 px. The
            calendar is not used on public pages, where the memorable-date inputs are 48 px.
            Pairs: text on surface-raised, surface-hover; text-muted on surface-raised; on-accent on accent,
            accent-hover; accent on surface-raised; warning on surface, surface-raised; danger on surface; border-input
            on surface; focus-ring on surface, surface-raised, surface-hover.
  base      react-day-picker 9 (MIT) inside Radix Popover; native inputs for the memorable date.
  used on   S01 (date fields, date of birth), S06 (date conditions), S07, S08 (date fields), S09 (follow-up date when no
            time is needed), S25 (offline payment date), S28 (date field preview), S40, M04.
```

#### DateTimePicker (with time zone)

```text
DateTimePicker
  purpose   Pick a moment: a date, a time and the time zone it belongs to (follow-ups, scheduled sends).
  anatomy   <fieldset> and legend > row of three parts:
            - DatePicker (input and calendar);
            - time Combobox (typed time plus a 15-minute list);
            - time zone Combobox (closed, it shows the zone name and offset).
            Below the row: a summary line ("Tue, 06 Oct 2026, 4:30 pm IST"), an optional line for the viewer's own
            zone, and warnings and errors.
  variants  with a zone picker (S11, S16); zone fixed to the institution's, shown as the text "Times in IST"; with an
            end time (S11: "Add end time" reveals a second time field).
  sizes     date w-40, time w-32, zone flex-1 with min-w-48. md 40 in dialogs, sm 32 in compact rows.
            Below 480 px the three parts stack.
            Time list: max-h-60 (240 px), options h-menu-item.
  states    empty; date only (a "choose a time" error on submit); valid; past (a warning, not an error, unless the
            consumer forbids past times); a time that does not exist (clocks go forward); a time that happens twice
            (clocks go back); time text that cannot be read; viewer's zone differs (second summary line); clash
            (S11, S12 reschedule: the owner already has a follow-up within 30 minutes of the chosen moment; a
            warning, never an error, so saving still works); disabled; read-only.
            Clash check: runs after the date, time and zone are all valid, against the chosen owner's open
            follow-ups. The message never names the other lead, because the person may not be allowed to see it.
            Only this component shows the clash on S11; a calendar beside it does not repeat it.
            Time input:
            - Accepted: "4:30 pm", "4.30pm", "16:30", "1630", "430p", "4".
            - Without am or pm: 1:00 to 7:59 means pm, 8:00 to 11:59 means am, and 12 means noon.
            - The summary line shows the result at once, so the person sees how it was read.
            - The list offers every 15 minutes. It opens scrolled to the current choice, or the next quarter hour.
            Zone list:
            - Source: Intl.supportedValuesOf("timeZone").
            - Top group: the institution's zone (default Asia/Kolkata), the viewer's browser zone if different, and
              recently used zones. Then every zone, A to Z by city.
            - Option label: "India Standard Time (UTC+05:30) · Kolkata". Offsets are computed for the chosen date.
            - Legacy names: V8 (Chrome, Edge, Node) uses old aliases. Checked in Node 22.22:
              supportedValuesOf lists "Asia/Calcutta" and has no "Asia/Kolkata", and resolvedOptions().timeZone
              returns "Asia/Calcutta" even when asked for "Asia/Kolkata". A small alias map turns legacy names into
              current IANA names (Asia/Calcutta to Asia/Kolkata, Asia/Katmandu to Asia/Kathmandu, Asia/Rangoon to
              Asia/Yangon, Asia/Saigon to Asia/Ho_Chi_Minh) before zones are listed, compared or stored. Without it,
              the list has no Kolkata entry, and Indian staff see a "your zone differs" line for the same zone.
            Clock changes:
            - A time that does not exist: "1:30 am doesn't exist in London on 29 Mar 2026, because clocks go forward.
              Pick another time."
            - A time that happens twice: use the first occurrence and show the offset in the summary.
            Value out: { startsAt: ISO 8601 UTC instant, timezone: IANA name } (follow_ups.starts_at and timezone).
            A stored value is shown in its own stored zone, not the viewer's.
  tokens    The parts use DatePicker, Combobox and TextInput tokens.
            summary        text-sm text-fg
            second line    text-xs text-muted
            past warning   text-warning with TriangleAlert
            zone alert     Alert info: bg-info-subtle text-fg rounded-md p-3, Info icon text-info (used when the
                           viewer's zone differs and the moment is close: within 24 hours)
            clash alert    Alert warning (group 2): bg-warning-subtle text-fg rounded-md p-3, TriangleAlert
                           text-warning, under the summary line
  content   Legend "When". Labels "Date", "Time", "Time zone".
            Summary: "Tue, 06 Oct 2026, 4:30 pm IST". Second line: "That's 3:00 pm for you (Gulf Standard Time)."
            Warning: "This time has passed. The follow-up will show as overdue."
            Clash: "Asha already has a follow-up at 4:30 pm IST on 07 Oct. You can still save."
            Errors: "Enter a time like 4:30 pm." "Choose a time."
  keyboard  Tab order: date, calendar button, time, time zone.
            Time and zone use the Combobox keys (type, arrows, Enter, Esc). The calendar uses the DatePicker keys.
  a11y      The fieldset and legend group the three parts. Each part has its own visible label.
            The summary line is role="status" (polite). It updates after a change, so screen-reader users hear the
            resolved moment once.
            Zone abbreviations are written out in accessible text ("India Standard Time").
            The warning is linked to the fieldset with aria-describedby.
            The clash alert has no live role of its own. The summary status region adds its sentence once, after
            the check returns, and the alert joins the fieldset's aria-describedby.
            Targets: each part is 40 px (32 in compact rows); time and zone options 32 px; calendar button 24 px.
            Pairs: as DatePicker and Combobox, plus text on surface, surface-raised, info-subtle, warning-subtle;
            text-muted on surface, surface-raised; warning on surface, surface-raised, warning-subtle; info on
            info-subtle; focus-ring on info-subtle, warning-subtle.
  base      DatePicker (react-day-picker and Radix Popover); two Combobox instances (Downshift and Radix Popover);
            Intl.DateTimeFormat for zone names and offsets.
  used on   S09 (follow-up date and time), S11, S12 (reschedule), S16 (schedule a broadcast), S18 (date trigger), M03.
```

#### DateRangePicker

```text
DateRangePicker
  purpose   Pick a start and an end date for reports and list filters, with quick presets and an optional comparison
            period.
  anatomy   Trigger button (CalendarRange icon, range text, ChevronDown) > Radix Popover:
            - preset list on the left;
            - on the right, "From" and "To" inputs above a two-month calendar;
            - an optional "Compare with" checkbox and select;
            - footer with "Clear", "Cancel" and "Apply".
  variants  presets and calendar (reports S20 to S23); calendar only (list filters S25, S38); with compare (S20).
            Under 768 px it shows one month; under 640 px the popover becomes a full-width sheet.
  sizes     trigger sm 32 (page bar) or md 40, min-w-56.
            popover up to 640 px wide: preset column w-44, calendars 2 x 7 x 32 px plus gaps. Day cells 32 x 32.
  states    empty ("Any date"); preset chosen; custom range; start chosen (waiting for the end; hover previews the
            range); invalid (typed end before start, or longer than maxDays); open; applied; disabled.
            Applying:
            - Nothing changes until "Apply", so reports query once. "Cancel" or Esc keeps the previous range.
            Choosing days:
            - The first click sets the start. The second sets the end; if it is before the start, the two swap. A third
              click starts again.
            Presets:
            - Today, Yesterday, Last 7 days, Last 30 days, This month, Last month, This quarter, This financial year
              (Apr-Mar), Custom.
            - A preset fills the inputs and the calendar. Editing either one switches to Custom.
            - Presets are computed in the institution's time zone.
            Compare:
            - "Previous period" (the same length, just before) or "Same period last year".
            - Shown as a second line on the trigger.
            Value out: { from: "2026-09-01", to: "2026-09-30" }, inclusive whole days in the institution's zone, plus
            compare: "previous" | "last_year" | null.
  tokens    trigger   Button secondary look: bg-transparent border border-strong text-fg hover:bg-surface-hover; icon
                      text-muted
            popover   bg-surface-raised border border-border rounded-lg shadow-pop z-(--z-popover)
            preset    h-menu-item px-2 rounded-sm text-sm text-fg hover:bg-surface-hover; the native radio is
                      sr-only; row has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus-ring focus-inset
            chosen preset  bg-accent-subtle font-medium, Check icon text-accent at the right (a shape cue, not fill
                      alone)
            range ends  bg-accent text-on-accent focus-visible:outline-on-accent
            between   bg-accent-subtle text-fg, rounded only at the two ends
            preview   bg-surface-hover
            today     font-semibold with the accent bar (bg-on-accent when the day is a range end)
            footer    border-t border-border
            error     text-danger
  content   Trigger: "1 Sept - 30 Sept 2026". Empty: "Any date". Compare line: "vs 1 Aug - 31 Aug 2026".
            Inputs "From" and "To". Preset group legend "Quick ranges".
            Errors: "The end date is before the start date." "Choose a range of 366 days or less."
            Footer note: "Dates in IST".
  keyboard  Trigger: Enter or Space opens. Focus goes to the chosen preset, or to "From" when there are no presets.
            Presets are a radio group: arrows move and choose.
            Inputs: type dates as in DatePicker.
            Grid: DatePicker keys. Enter sets the start, then the end.
            Esc cancels and returns focus to the trigger. Ctrl+Enter (Cmd+Enter) applies from anywhere inside.
  a11y      The popover is role="dialog" with aria-label "Choose a date range".
            Presets are native radios in a fieldset.
            Days have full-date names. Days in the range have aria-selected. The start and end days add sr-only text:
            "start of range" and "end of range".
            The caption month is aria-live="polite".
            The trigger's name spells the range out: "Date range: 1 September to 30 September 2026".
            After Apply, the report's own status region announces the new results.
            Targets: trigger 32 or 40 px; presets 32 px; day cells 32 px; footer buttons 32 px.
            Pairs: text on surface, surface-raised, surface-hover, accent-subtle; text-muted on surface,
            surface-raised; on-accent on accent; accent on surface-raised, accent-subtle; border-input on
            surface-raised; danger on surface-raised; focus-ring on surface-raised, accent-subtle, surface-hover.
  base      react-day-picker 9 (mode="range", numberOfMonths={2}) inside Radix Popover; native radios for the presets.
  used on   S16 (report), S20, S21, S22, S23, S25, S38, S39.
```

#### FileUpload

```text
FileUpload
  purpose   Add one or more files by choosing them or dropping them, with clear size and type errors and visible
            progress.
  anatomy   Field wrapper (label, plus a hint with accepted types and the limit) > dropzone: CloudUpload icon, text, and
            the "Choose file" button. The button is the <label> of a visually hidden native file input.
            Below it, the file list. Each row has a file icon, name, size, status (progress bar, done or error) and an
            action (Cancel, Retry, Remove or Replace).
            Then the error, and a polite status region.
  variants  single (S07 import, S01 file field, S25 statement): once a file is added, its row replaces the dropzone,
            with "Replace" and "Remove".
            multiple (S10 attachments, S08 documents): with a maximum count and total size.
            compact (S15 reply, S40): a Button sm with a Paperclip icon, no dropzone.
            public (S01): button only (lg), no drag text.
  sizes     dropzone min-h-32 (128 px) p-6 rounded-lg text-sm. compact: Button sm.
            file row h-row (48 px) px-3; public rows 56 px.
            progress bar h-1 (4 px) rounded-pill.
  states    empty; drag over (a file is over the zone); drag over with too many files (the zone shows the limit);
            choosing (the system dialog is open); checking; uploading (progress); uploaded; wrong type; too large;
            empty file; too many files; total too large; upload failed (network); server could not read the file;
            cancelled; disabled; read-only (list only, with download links).
            Checks:
            - Type (extension and MIME) and size are checked in the browser before upload. The server checks again by
              content.
            - Limits come from the purpose: email attachments 5 MB in total (product choice), WhatsApp images 5 MB,
              video and audio 16 MB, documents 100 MB. Import and lead-document limits are still open (see open
              questions). The hint always states the limit.
            Upload:
            - Ask for a signed URL: POST /api/app/uploads, or /api/public/forms/:publicKey/uploads on public pages.
            - PUT the bytes with XMLHttpRequest, which reports upload progress.
            - Add the returned file id as a hidden input (name="{field}[]").
            - Submit waits for uploads still running, and the submit button says "Uploading…".
            Other behaviour:
            - While mounted, a file dropped anywhere else on the page is ignored (window dragover and drop are
              prevented), so the browser never leaves a half-filled form.
            - Long names are shortened in the middle ("admission-fair-…-oct.csv"). The full name is in the title
              attribute and the accessible name.
  tokens    dropzone   border border-dashed border-input bg-surface-subtle text-muted
            drag over  border-solid border-accent bg-accent-subtle text-fg
            choose button  the native input sits inside the <label> styled as the button. In every variant the
                       label has has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-focus-ring
                       has-[input:focus-visible]:outline-offset-2, so focus is visible in the compact and public
                       variants too
            zone focus has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus-ring
                       has-[:focus-visible]:outline-offset-2 (dropzone variant only; the button ring stays)
            row        bg-surface border border-border rounded-md; name text-fg; size text-muted
            done       CircleCheck text-success
            error row  bg-danger-subtle border-danger text-fg; CircleAlert and message text-danger
            progress   track bg-surface-sunken, bar bg-accent (motion-safe:transition-[width] duration-base)
            disabled   bg-surface-subtle border-border text-muted cursor-not-allowed
  content   Zone: "Drag a file here, or" and the button "Choose file" ("Choose files" when several are allowed).
            Hint: "CSV or XLSX, up to 10 MB." Drag over: "Drop to add".
            Errors, which always name the file:
            - "leads-oct.pdf isn't a CSV or XLSX file."
            - "photo.jpg is 7.2 MB. The limit is 5 MB."
            - "notes.txt is empty."
            - "You can attach up to 5 files. Remove one first."
            - "These files add up to 6.1 MB. Email attachments can total 5 MB."
            - "brochure.pdf didn't upload. Check your connection and try again."
            - "We couldn't read leads-oct.xlsx. Save it again and retry."
            Status: "Uploading leads-oct.csv". "leads-oct.csv added".
            Action names: "Cancel upload of leads-oct.csv", "Retry", "Remove leads-oct.csv", "Replace file".
  keyboard  Tab reaches the native input, which is styled through its label as a button. Enter or Space opens the
            file dialog.
            Then Tab goes through each row's actions. The dropzone is not a tab stop, and dragging is never the only
            way (2.5.7).
  a11y      The native <input type="file" accept="…"> (multiple when allowed) is sr-only and still focusable. Its
            name is the "Choose file" label. aria-describedby points at the field hint and error. Its focus ring is
            drawn on the label that holds it (tokens), never left invisible.
            The field label names the group (role="group", aria-labelledby).
            Progress: role="progressbar" with aria-valuenow, aria-valuemin 0, aria-valuemax 100 and the aria-label
            "Uploading {name}".
            The status region announces the start, end and failure of each file, never each percent.
            After Remove, focus moves to the next row's action, or back to "Choose file".
            Targets: "Choose file" is a 32 or 40 px button (48 px public); row actions are 32 px IconButtons
            (44 px on public rows).
            Pairs: text-muted on surface-subtle, surface; border-input on surface-subtle; text on accent-subtle,
            surface, danger-subtle; accent on accent-subtle, surface-sunken; success on surface; danger on
            danger-subtle; focus-ring on surface-subtle, accent-subtle, danger-subtle, surface.
  base      native <input type="file">; HTML drag events on the zone, with no drag-and-drop library.
  used on   S01 (file field), S07 (import), S08 (documents tab), S10 (email attachments), S15 (reply attachment),
            S19 (media header), S25 (bank statement, offline payment proof), S28 (upload field type), S40, M03.
```

### Form structure and consent

#### Field (form field wrapper)

```text
Field
  purpose   Wraps any single control with its label, required marker, hint, error and the ids that link them.
  anatomy   <div>:
            - <label for={id}> with the text, then the required marker or "(optional)";
            - hint <p id="{id}-hint">;
            - the control, which receives id, aria-describedby, aria-invalid and required;
            - error <p id="{id}-error"> with a CircleAlert icon.
            Grouped controls (radios, checkboxes, phone, date parts) use <fieldset> and <legend> for the same parts.
  variants  stacked (default: label above the control); inline (Checkbox and Switch: label beside the control);
            key-value row (S08: label column w-kv-label, 200 px, on the left from md up, stacked below that);
            visually hidden label (table cells, toolbars: the label stays for screen readers as sr-only).
  sizes     staff: label text-sm font-medium; hint and error text-xs. Label to hint mt-0.5 (2 px); hint to control
            mt-2 (8 px); control to error mt-1 (4 px).
            public: label text-base font-medium; hint and error text-sm; the same gaps, but the error is mt-2.
            Fields stack with gap-4 (staff) or gap-6 (public).
  states    default; required; optional; with hint; invalid; disabled (label and hint text-muted); read-only.
            Behaviour:
            - ids come from React useId(). Consumers never pass ids by hand.
            - The error renders only when there is one, and its id joins aria-describedby only then.
            - aria-describedby lists the error id first, then the hint id, so the problem is read before the help.
            Required marker, staff:
            - "*" after the label (aria-hidden), and the control gets required.
            - The form shows "* required" once at the top.
            Required marker, public:
            - Nothing on required fields; "(optional)" on optional fields.
            - The form intro says "All fields are required unless marked optional."
  tokens    label text-fg; marker text-danger; "(optional)" text-muted font-normal; hint text-muted
            error text-danger font-medium, icon text-danger size-icon-sm
            disabled label text-muted
  content   Labels are nouns: "Email address", "Stage".
            Hints say what helps, once: "We'll use this to send the fee receipt."
            Errors say what to do: "Enter an email address like name@example.com." "Choose a stage."
            Never "Invalid input" or "This field is required".
  keyboard  Nothing of its own. Clicking the label focuses the control. Tab order follows the DOM.
  a11y      The label is always visible, except in the visually hidden variant.
            aria-invalid is set only while an error shows.
            The error <p> starts with the sr-only text "Error: ".
            Fields have no live region of their own. The form's error summary and status region do the announcing;
            single-field async checks (OTP) use role="alert" inside that component.
            Groups use fieldset and legend; the fieldset's aria-describedby links the error.
            Fields sit on surface, surface-raised (dialogs) or bg (headings on public pages), never on surface-subtle.
            Targets: the label is part of the control's target (clicking it focuses or toggles the control); the
            control sets its own size, 24 px minimum.
            Pairs: text on surface, surface-raised, bg; text-muted on surface, surface-raised, bg; danger on surface,
            surface-raised, bg.
  base      native <label>, <fieldset> and <legend>; React useId.
  used on   every form: S01, S03, S06, S07, S08, S09, S10, S11, S13, S14, S16, S18, S19, S22, S25, S27-S37, S40, S41,
            M03, M04; /consent/:token and /privacy/:orgSlug/*.
```

#### FormLayout (staff and public form rules)

```text
FormLayout
  purpose   How fields, sections, errors and buttons are arranged, and how a form behaves on submit, in the staff app
            and on public pages.
  anatomy   <form> > optional error summary > optional intro > sections (<section> with a heading, or a fieldset) >
            fields > actions row.
            A polite status region (role="status") says "Saving…" and "Saved". A danger Alert (group 2) appears on
            network failure.
  variants  staff page form (settings S28 to S37, S41):
            - max-w-form (720 px), one column, sections with text-md headings.
            - Two columns (grid-cols-2 gap-x-4) only from md up, and only for short paired fields: date and time,
              city and PIN code.
            - The actions sit in a sticky footer bar (h-pagebar, 56 px) when the form is taller than the viewport.
              While it shows, it adds var(--layout-pagebar) to --bottom-bar on <html> (AppShell), so the last
              field can scroll clear of it.
            staff dialog form (S09, S11): dialog-md (560 px). S13 and S14 use dialog-lg (800 px). One column,
            actions in the dialog footer.
            staff inline edit (S08 details): key-value rows. "Edit" turns a row group into fields, with Save and
            Cancel under it.
            public form (S01, S02 details, consent and privacy pages):
            - One column, max-w-public (480 px), 16 px side gutter, labels above.
            - The primary button is full width.
            - The institution's contact details sit in the footer of every public page (3.2.6).
  sizes     Section gap gap-8 (32 px). Field gap gap-4 (16 px) staff, gap-6 (24 px) public. Heading to first field
            16 px.
            Actions: gap-2. Buttons md 40 (staff) or lg 48 (public).
            Staff actions are right-aligned, primary rightmost. A destructive extra action ("Delete field") sits at
            the far left. Public: the primary is full width, and a secondary action is a link button under it.
  states    pristine; dirty; submitting (the primary shows loading, and fields stay editable); client errors; server
            errors (shown the same way); network failure; success.
            Dirty: leaving a staff page or dialog asks "Discard your changes?"
            Success:
            - Staff: a toast, or the dialog closes and focus returns to whatever opened it.
            - Public: a success page, or the form's success message replaces the form and takes focus.
            Validation timing:
            - Nothing while a field is typed in for the first time.
            - Format checks on blur when the field is not empty.
            - Everything on submit.
            - After an error, that field is re-checked on each input.
            On submit with errors:
            - Forms with 1 or 2 fields focus the first invalid field.
            - Longer forms show the error summary at the top and move focus to it.
            Server and network:
            - Server errors map to the same fields and summary (useActionState). Values are always kept.
            - Network failure keeps every value and shows the danger Alert with a "Try again" button. A retry reuses
              the same Idempotency-Key (public).
            - Public forms work before JavaScript loads: <form action={serverAction} noValidate>; the server returns
              errors and values.
            Other rules:
            - Enter in a single-line field submits. Ctrl+Enter (Cmd+Enter) submits from a textarea in staff dialogs.
            - The submit button is never disabled to signal invalid fields.
            - No "confirm email" or "confirm mobile" fields. Prefill what the system already knows (3.3.7).
            - No alternating grey bands. Fields sit on bg-surface (pages) or bg-surface-raised (dialogs).
  tokens    form           bg-surface (page card) or bg-surface-raised (dialog)
            heading        text-md text-fg; intro text-sm text-muted
            error summary  bg-danger-subtle border border-danger rounded-md p-4; heading text-sm font-semibold text-fg;
                           one link per error in text-fg underline
            network alert  Alert danger with role="alert" (it appears after submit): bg-danger-subtle text-fg
                           rounded-md p-3, CircleAlert text-danger
            sticky footer  bg-surface border-t border-border shadow-bar z-(--z-sticky); adds var(--layout-pagebar)
                           to --bottom-bar while shown
            dialog footer  bg-surface-raised border-t border-border
  content   Error summary heading: "2 fields need changes" ("1 field needs a change"). Its links repeat each field's
            error text.
            Staff required note: "* required".
            Public intro: "All fields are required unless marked optional."
            Network alert: "Not sent. Check your connection and try again."
            Discard dialog (the one discard prompt for forms, dialogs and drawers): title "Discard your changes?";
            body "You'll lose what you've typed."; buttons "Keep editing" and "Discard".
            This is the only error summary spec. Alert's error-summary layout (group 2) points here.
            Default S01 success, used when the institution sets none: "Thank you. {Institution} has your enquiry and
            will contact you soon."
  keyboard  Tab follows the visual order (row by row in two-column grids). Enter submits from single-line fields.
            Each error summary link moves focus to its field (href="#{id}"; the control is focused). The field scrolls
            clear of sticky bars through scroll-margin.
            Esc in a dialog form closes it, or asks "Discard your changes?" when the form is dirty.
  a11y      One <h1> per page. A dialog form is titled by the dialog title.
            Error summary: tabindex="-1", aria-labelledby its heading, and focused on appearance, so it is read once.
            It has no role="alert", which would read it twice.
            Sections: <section aria-labelledby>, or fieldset and legend when the fields answer one question.
            Sticky header and footer set scroll-padding on the scroll container, so a focused field is never hidden
            (2.4.11). The sticky footer does this through --bottom-bar (AppShell), which also pads the bottom of
            main so the last field can scroll clear.
            Public success message: tabindex="-1", focused.
            Targets: staff action buttons 40 px; public buttons 48 px; error summary links are block links at least
            24 px tall (44 px on public pages).
            Pairs: text on surface, surface-raised, danger-subtle, bg; text-muted on surface, bg; danger on
            danger-subtle; focus-ring on danger-subtle, surface, surface-raised.
  base      native <form> with a Next.js Server Action and React useActionState; Field for every control.
  used on   every form: S01, S02, S03, S06, S07, S09, S10, S11, S13, S14, S16, S18, S19, S22, S25, S27-S37, S40, S41,
            M03, M04; /consent/:token and /privacy/:orgSlug/*.
```

#### ConsentCapture

```text
ConsentCapture
  purpose   Ask for consent one purpose at a time, in plain words. Link the exact notice version, and record what was
            shown and what was ticked.
  anatomy   <fieldset> and legend:
            - one checkbox row per consent item (the label is the purpose in plain words, with optional sub-text);
            - notice line: link "Read how {Institution} uses your data", the version and date, and links to other
              languages;
            - withdrawal line;
            - error.
            Hidden inputs: notice_id, notice_version, notice_language, items_shown (item keys).
            The staff variant adds, per item, a "How did they agree?" select and an optional proof upload.
            Items come from the published notice (notices.purposes), so their wording is frozen with the version.
  variants  public enquiry (S01):
            - One required item for answering the enquiry (purpose data_processing), when the institution relies on
              consent for that (open question 2).
            - Then optional items, one per channel the institution uses: WhatsApp, SMS, email, calls (purpose
              marketing).
            minor mode:
            - When the date of birth or the age question says under 18, the marketing items are removed.
            - An info Alert says a parent or guardian must agree first, and guardian fields appear:
              "Guardian's full name" (TextInput, autocomplete="off": not the person's own data) and "Guardian's
              mobile" (PhoneInput, both parts autocomplete="off").
            - The guardian confirms later on /consent/:token with an OTP. No email or mobile OTP is sent to the
              child; the guardian is the one verified.
            - Server side (s.9(1), Rule 10): store only full name, date of birth or the age answer, guardian name,
              guardian mobile and the Rule 10 evidence. Other answers (course, city, files, free text) are dropped,
              or held in the capture payload in the restricted state until a guardian agrees (counsel to confirm
              which). gclid, fbclid, referrer and the landing-URL query string are discarded; the source touch keeps
              only channel and form.
            staff record (S07 add lead, S08 consents panel):
            - The same items, never pre-ticked.
            - Plus a method ("Paper form", "In person", "On a phone call", "Email reply") and an optional proof file.
            read-only summary (S08): one line per purpose and channel: "Given 06 Oct 2026, notice v3",
            "Withdrawn 12 Oct 2026", "Not asked".
            withdraw (S08 for staff; /privacy/:orgSlug/withdraw for the public):
            - One checkbox per active consent.
            - Withdrawing takes one step, as giving did.
  sizes     public: Checkbox public size (20 px box, 44 px rows), labels text-base, sub-text and notice line text-sm.
            staff: Checkbox staff size, text-sm. Method select md 40.
  states    unticked (always the starting state); ticked; required item missing (error on submit); minor mode; no
            published notice; language switched; staff method missing (an error when a box is ticked); read-only
            summary; withdrawn.
            No published notice:
            - The form cannot be published in S31. Staff see the Alert "Forms can't go live until a notice is
              published." with a link to Settings > Privacy notices, where NoticeEditor creates and publishes
              versions.
            - Public visitors see "This form isn't available right now."
            Ticks:
            - No item is ever pre-ticked, on a repeat enquiry or anywhere else.
            - After a validation error, the person's own ticks are kept.
            - Optional items never block submission. The required item's error says why it is needed.
            Notice link:
            - Opens the published version in a new tab, so the form keeps its values.
            - The version, date and language shown are the ones recorded.
            Recording:
            - On submit the server writes one consents row per ticked item: purpose, channel, status granted, given_by
              self, method form_checkbox, notice_id. Channel values are the schema's: the required item is purpose
              data_processing with channel all; channel items are purpose marketing with whatsapp, sms, email or
              call.
            - The server does not trust the hidden inputs. It checks that notice_id is a published notice of this
              institution and that every ticked key is in that notice's purposes. If a newer version was published
              while the page was open, it still records the version that was shown, because that is what the person
              read. An unknown notice_id or key rejects the submission with the generic "This form isn't available
              right now." and keeps the values.
            - Each row's evidence holds: IP, user agent, form id, page URL, time, item keys shown, item keys ticked,
              notice language.
            - Unticked items write nothing.
            - A form tick is not telco-registered SMS consent. Promotional and explicit-consent service SMS still
              need a telco-registered consent or an enquiry from the last 7 days (architecture, send_message).
              Transactional and implicit-consent service SMS do not.
  tokens    as Checkbox
            legend text-fg font-medium; sub-text and notice line text-muted; link text-accent underline
            minor alert Alert info (group 2): bg-info-subtle text-fg rounded-md p-3, Info icon text-info
            error text-danger
  content   Legend: "How {Institution} may use your details".
            Required item: "Use my details to answer this enquiry and help me with admission."
            Optional group sub-legend: "Updates about courses, fees and deadlines (optional)". Items:
            - "Send me updates from {Institution} on WhatsApp"
            - "Send me updates by SMS"
            - "Send me updates by email"
            - "Call me about courses"
            Notice line: "Read how {Institution} uses your data (notice version 3, 01 Oct 2026)". Then "Also in:"
            followed by the language names written in their own scripts.
            Withdrawal line: "You can change your mind at any time." with link "How to withdraw".
            Required error: "Tick this box so {Institution} can reply to you. Your enquiry can't be sent without it."
            Minor alert: "You're under 18. Before {Institution} contacts you, a parent or guardian must agree. Add
            their details below and we'll send them a code. We'll keep only what we need to contact your parent or
            guardian."
            Guardian labels: "Guardian's full name", "Guardian's mobile".
            Staff note: "Only tick what the student agreed to, and record how they agreed."
            Plain-language rules:
            - Short sentences that name the institution, the purpose and the channel.
            - No legal terms in labels.
            - The full notice carries the detail.
  keyboard  As Checkbox: Tab between boxes, Space toggles. The notice link is a normal link (Enter). The language
            links follow it.
  a11y      fieldset and legend. Each item is a native checkbox with its own label. There is no single "I agree to
            everything" box.
            The required item has required, and its error is linked with aria-describedby.
            The link text says where it goes and that it opens a new tab: an ExternalLink icon plus sr-only
            " (opens in a new tab)".
            Language links carry lang and hreflang (lang="hi" on "हिन्दी").
            On page load the minor Alert is not a live region. When minor mode turns on, the form status region
            announces it once.
            The fieldset carries lang={notice_language}, the recorded language of the notice, so the items are read
            with the right rules.
            Targets: public rows 44 px with the label as part of the target; staff rows 24 px; the notice and
            language links are block links at least 44 px tall on public pages.
            Pairs: text on surface, info-subtle; text-muted on surface; accent on surface; border-input on surface;
            on-accent on accent; danger on surface; info on info-subtle; focus-ring on surface, info-subtle.
  base      native fieldset and checkboxes (Checkbox); native select and FileUpload in the staff variant.
  used on   S01, S07, S08 (consents panel and withdrawal), S31 (form preview), M04; /consent/:token (guardian),
            /privacy/:orgSlug/withdraw.
```

### Switchers and search

#### SegmentedControl

```text
SegmentedControl
  purpose   Switch between 2 to 5 views of the same content, or pick one short value, with every option visible.
  anatomy   <fieldset> (legend visible or sr-only) > track > segments. Each segment is a native radio (sr-only, peer)
            and a <label> with text, an optional icon and an optional count.
  variants  text; icon and text; icon only (each segment has an sr-only label and a tooltip); full width (segments share
            the width; mobile and narrow panels).
            in a sentence (ConditionBuilder: "Leads that match [all | any] of these conditions"): the root is
            <div role="radiogroup" aria-labelledby="{before-id} {after-id}"> around the native radios, with no
            fieldset or legend of its own. A legend may hold only phrasing content, so this control never sits
            inside another fieldset's legend. The two text spans before and after it name the group.
            Rule: when each option shows a different panel of content (Details, Timeline), use tabs. Use this control
            when the option changes how the same content is shown, or sets one value (Day, Week, Month; Table, Chart).
  sizes     sm: track h-control-sm (32 px) p-0.5; segments h-7 (28 px) px-3 text-sm.
            md: track h-control-md (40 px) p-1; segments h-8 (32 px) px-4 text-sm.
            Icons 16 px. Each segment is at least 48 px wide.
  states    unselected; hover; selected; focus-visible; disabled segment; disabled control.
            The choice applies at once (no Apply). It may be kept in the URL (?view=week) or in member prefs.
  tokens    track      bg-surface-sunken rounded-md
            segment    rounded-sm text-muted font-medium hover:text-fg hover:bg-surface-hover transition-colors
                       duration-fast
            selected   peer-checked:bg-accent peer-checked:text-on-accent peer-checked:hover:bg-accent-hover
            focus      on the label: peer-focus-visible:outline-2 peer-focus-visible:outline-focus-ring
                       peer-focus-visible:outline-offset-2
            disabled   text-muted cursor-not-allowed, no hover fill
  content   S12: "Day", "Week", "Month". S22: "Table", "Chart". S20: "Counts", "Percentages".
            S23: "People", "Teams". Legends: "Calendar view", "Show results as".
  keyboard  Tab enters on the selected segment; the next Tab leaves. Arrow keys move and select. Disabled segments are
            skipped.
  a11y      Native radios give each segment the radio role inside the group. The legend names the group (in a
            sentence: the aria-labelledby spans).
            The selected segment shows by fill and text colour, and by its checked state.
            Icon-only segments have sr-only label text and a tooltip.
            Segments are 28 px tall (sm), above the 24 px minimum.
            Pairs: text-muted on surface-sunken; text on surface-hover; on-accent on accent, accent-hover; accent on
            surface-sunken; focus-ring on surface-sunken, surface.
  base      native <input type="radio"> and <label>. Not Radix ToggleGroup: its arrow keys move focus without
            selecting, which is not how a radio group behaves.
  used on   S12, S20, S21, S22, S23, M06; in a sentence on S06, S16, S18 (ConditionBuilder, sm).
```

#### ChannelTabs

```text
ChannelTabs
  purpose   Switch a composer or a list between Email, SMS and WhatsApp, and show when a channel can't be used.
            Other tab sets (S08 and S27 profile tabs, S31 embed tabs) use Tabs (group 2; S08 and S27 with manual
            activation).
  anatomy   tablist > tabs (channel icon, label, optional count badge, optional unavailable icon, optional draft dot) >
            one tabpanel per channel.
  variants  composer tabs (S10, S16: each panel holds that channel's composer); list tabs (S19, with counts); compact
            (S08 messages filter, sm).
  sizes     md: tab h-control-md (40 px) px-3 text-sm font-medium, icon 16 px, gap-2.
            sm: tab h-control-sm (32 px) px-2.
            The active tab has a 2 px bar (h-0.5) under its bottom edge, over the tablist's border-b border-border.
            Count badge: h-5 min-w-5 px-1.5 rounded-pill text-xs font-medium tabular-nums (the app-wide count badge
            sizes, see IconButton).
  states    inactive; hover; active; focus-visible; unavailable (still selectable, and the panel explains why);
            with draft (the person has unsent text in that channel).
            A channel the institution does not use at all is hidden, not disabled.
            Tabs activate as focus moves (automatic activation). Each channel keeps its own draft while switching.
            The lead's preferred channel, or else the institution's default, opens first.
  tokens    tab        relative text-muted hover:text-fg hover:bg-surface-hover rounded-t-md transition-colors
                       duration-fast; focus uses the global outline with focus-inset
            active     data-[state=active]:text-fg with after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5
                       after:bg-accent (the bar sits over the tablist border, outside the inset focus ring)
            count      bg-surface-sunken text-fg; on the active tab bg-accent-subtle text-fg
            unavailable  TriangleAlert text-warning after the label
            draft dot  size-1.5 rounded-pill bg-accent
            In dialogs the same utilities sit on surface-raised.
  content   Labels "Email", "SMS", "WhatsApp", with the generic Lucide icons Mail, MessageSquare and MessageCircle.
            Never WhatsApp's logo.
            Unavailable panel texts:
            - "SMS isn't set up yet. An admin can connect an SMS provider in Settings > Channels."
            - "Ananya opted out of SMS on 02 Oct 2026. You can't send SMS to her."
            - "Her last WhatsApp reply was more than 24 hours ago, so you can only send an approved template."
            - "This lead's stage doesn't allow messages."
            Accessible names: "SMS, unavailable"; "Email, 24 templates"; "WhatsApp, unsent draft".
  keyboard  Tab enters the tablist on the active tab. Left and Right move and activate. Home and End go to the first
            and last tab.
            The next Tab moves into the panel. The panel itself is focusable when it has no focusable content.
  a11y      Radix Tabs gives role tablist, tab and tabpanel, with aria-selected, aria-controls and aria-labelledby.
            The tablist has aria-label="Channel".
            Unavailable is part of the tab's name (sr-only ", unavailable") and explained in the panel. It is never
            shown by colour alone.
            Counts and drafts are in the name.
            Targets: tabs are 40 px tall (32 px in sm) and at least 48 px wide.
            Pairs: text-muted on surface, surface-raised; text on surface, surface-hover, surface-sunken,
            accent-subtle; accent on surface, surface-raised; warning on surface, surface-raised, surface-hover;
            focus-ring on surface, surface-hover.
  base      Radix Tabs (activationMode="automatic").
  used on   S08 (messages filter), S10, S16, S19, S24 (preferences by channel), S35 (channel sections).
```

#### SearchInput

```text
SearchInput
  purpose   Find records in a list as you type, or search inside a picker.
  anatomy   <search> element (or a form with role="search") > Search icon > <input type="search"> > clear IconButton
            (when not empty) > optional shortcut hint (kbd "/").
            S05 adds a scope picker on the left (a Select: Auto, Name, Email, Mobile, Lead no., API ID).
  variants  page search (in the page bar, sm, w-72; full width under 640 px); with scope picker (S05); in a panel (S15
            conversation list, full width); in a popover (Combobox, column chooser).
  sizes     sm 32: h-control-sm pl-8 text-sm. md 40: h-control-md pl-9.
            Icon 16 px, 10 px from the left. Clear button xs (24 px).
  states    empty (placeholder); typing; searching (the icon becomes a spinner after 300 ms); results (the count is
            announced); no results (the list shows its own empty state); error (the list shows "Couldn't search. Try
            again."); disabled.
            Searching:
            - 300 ms debounce. Enter searches at once.
            - Name search starts at 2 characters. Email, mobile and ID searches start at any length (prefix match).
            Scope "Auto" (the same rule as LeadSearch, group 3):
            - Text with "@" searches email.
            - Digits with an optional "#", 7 digits or fewer: lead number.
            - 8 to 15 digits, or a leading "+": mobile.
            - A UUID (36 characters with hyphens, or 32 hex characters without): API ID.
            - Anything else: name (from 2 characters).
            - A chosen scope overrides this.
            Other behaviour:
            - The query is kept in the URL (?q=), so Back and reload keep it.
            - Esc clears a non-empty field. On an empty field Esc does nothing, except inside a popover, where it
              closes the popover.
            - "/" focuses the page search when focus is not in a text field and keyboard shortcuts are on (a member
              preference, 2.1.4).
  tokens    input      the TextInput box (bg-surface border border-input rounded-md hover:border-muted); icon
                       text-muted
            kbd hint   Kbd (this group): border border-border rounded-xs px-1 text-xs text-muted
            scope picker  shares the border: picker rounded-l-md, input rounded-r-md
  content   Names (aria-label), also used as placeholders: "Search leads", "Search chats", "Search templates", "Search
            people", "Search the audit log".
            Clear: "Clear search".
            Result status: "24 leads found". "No leads match "kavya"."
  keyboard  "/" focuses the field (when shortcuts are on). Type. Enter searches now. Esc clears. Tab moves to the clear
            button and the scope picker.
  a11y      The <search> element (or role="search") wraps it.
            The input has an accessible name (aria-label when there is no visible label). The placeholder is not the
            name.
            type="search", autocomplete="off", spellcheck="false".
            A polite status region next to the list announces the result count; the input does not.
            The clear button is 24 px.
            Pairs: text on surface; text-muted on surface; border-input on surface, surface-subtle; focus-ring on
            surface, surface-subtle.
  base      native <input type="search">; Radix Select for the scope picker.
  used on   S05, S15, S17, S19, S24, S25, S26, S32, S38, S40, M02; inside Combobox on S06, S09, S13 and the others
            listed there.
```

### Copy and secrets

#### CopyButton

```text
CopyButton
  purpose   Copy a value to the clipboard in one action: embed code, API key, tracking link, DNS record, lead number.
  anatomy   button > icon (Copy, which becomes Check for 2 s) > optional label ("Copy", which becomes "Copied").
            One polite live region shared across the app. A fallback message under the value.
  variants  icon only (with tooltip); labelled (Button secondary sm, "Copy code"); inline xs (next to a value in a
            key-value row or table cell).
  sizes     xs 24, sm 32 (default), md 40. The labelled variant is as wide as its longer label, so it does not jump.
  states    idle; hover; focus-visible; copied (2 s, then idle); failed (the clipboard is blocked or not allowed);
            disabled (nothing to copy yet).
            - It calls navigator.clipboard.writeText(value) with the exact string: no trailing spaces, no line
              numbers.
            - On failure it selects the source text, if it is on screen, and shows the fallback message under the value.
            - Another click restarts the 2 s timer.
  tokens    as IconButton (ghost or secondary) or Button secondary.
            The copied state keeps the idle colours; only the icon and the words change. That works on every surface,
            including code blocks on surface-sunken.
            The failure message sits on the page surface in text-danger.
  content   Names: "Copy embed code", "Copy API key", "Copy tracking link", "Copy DKIM record value", "Copy lead
            number", "Copy API ID".
            Label after copying: "Copied". Announcement: "Embed code copied".
            Failure: "Couldn't copy. The text is selected, so press Ctrl+C." On Mac: "press Cmd+C".
  keyboard  Tab, then Enter or Space copies. Focus stays on the button.
  a11y      The name says what gets copied. It does not change after copying, because some screen readers ignore name
            changes. The live region says "{Thing} copied" once.
            The icon-only variant's tooltip uses the same words as its name.
            Targets: 24 px (xs, inline next to a value, with nothing else inside its 24 px circle), 32 px default.
            Pairs: text-muted on surface, surface-sunken, surface-raised; text on surface, surface-hover; danger on
            surface; on-inverse on inverse; focus-ring on surface, surface-sunken.
  base      native <button>; the Clipboard API; Radix Tooltip.
  used on   S08 (lead number, API ID), S31 (embed code, form link), S35 (DNS records), S37 (API key, webhook secret,
            endpoint URL),
            S41 (tracking link, publisher key).
```

#### CodeBlock (with copy)

```text
CodeBlock
  purpose   Show code, or a value to paste somewhere else (form embed code, webhook payload sample), with one-click
            copy.
  anatomy   frame > header bar (title, language label, CopyButton labelled "Copy code") > optional tabs above it
            (Script, iframe) > scroll region <pre><code>. An optional footer note says where to paste it.
  variants  single snippet; tabbed snippets (S31: script tag or iframe); inline value (one line with no header: a
            read-only input plus a CopyButton, as for the form link).
  sizes     header h-control-md (40 px) px-3. Code p-4 text-table (13/20) font-mono whitespace-pre.
            The code area is at most 320 px tall (max-h-80) and scrolls both ways. The frame is rounded-md.
  states    default; overflowing (scrollbars, plus a fade at the right edge that hints at more); copied; copy failed;
            loading (a skeleton bar while the form key is created); unavailable (the form is turned off).
  tokens    frame      border border-border bg-surface-sunken
            header     bg-surface border-b border-border, title text-sm font-medium text-fg, language label text-xs
                       text-muted
            code       text-fg
            copy       CopyButton, Button secondary sm
            There are no syntax colours. One text colour keeps both themes simple and needs no extra pairs.
  content   Title "Embed code". Tab labels "Script" and "iframe".
            Footer: "Paste this into your website where the form should appear."
            Unavailable Alert (warning): "This form is turned off, so the code shows nothing until you turn it on."
            Example snippets, ours (the key is the form's public_key, 32 hex characters):
            <script src="https://app.example.com/embed.js" data-form="3f9a1c7e5b2d4086a1e9c3b7d5f20a64"
            async></script>
            <iframe src="https://app.example.com/f/3f9a1c7e5b2d4086a1e9c3b7d5f20a64" title="Admission enquiry form"
            width="100%" height="720" loading="lazy"></iframe>
  keyboard  Tab order: tabs, "Copy code", then the code region. The code region has tabindex 0, so arrow keys scroll
            it. Ctrl+A inside it is not overridden.
  a11y      The code region has role="region", aria-label "{title}" and tabindex="0", because a scrolling region must
            be reachable by keyboard.
            dir="ltr" and translate="no" on the code.
            The iframe snippet carries a title, so the institution's page passes the same check.
            Targets: "Copy code" 32 px; tabs 32 px.
            Pairs: text on surface-sunken, surface; text-muted on surface; focus-ring on surface-sunken, surface.
  base      native <pre><code>; Radix Tabs for tabbed snippets; CopyButton.
  used on   S31, S37 (webhook payload sample, signature example).
```

#### SecretReveal (shown once, and write-only secrets)

```text
SecretReveal
  purpose   Show a new secret exactly once, let the person copy it safely, and never show it again. Also the
            write-only field for secrets the institution pastes in.
  anatomy   shown once (inside a Dialog):
            - warning Alert (group 2);
            - label and read-only input (masked or shown);
            - show/hide IconButton and a CopyButton (labelled);
            - key details (name, access, created);
            - footer "Done".
            write-only (inside a Field):
            - stored-state text ("Saved · updated 06 Oct 2026") and a "Replace" button;
            - after "Replace": a password input with Save and Cancel.
  variants  shown once: S37 API key, S37 webhook signing secret, S41 publisher key.
            write-only: S35 SMS and telephony keys, S36 gateway keys and secrets.
  sizes     input md 40, font-mono text-sm, full width of dialog-md (560 px). Buttons md.
  states    shown once: masked (default); shown; copied; copy failed; closing without copying (asks first); closed (lists
            then show only the prefix, "ak_7Hq2…").
            write-only: not set; saved; replacing; saving; invalid (format check per provider); failed.
            Handling:
            - The secret arrives only in the create response. It lives in component state and is dropped on close.
            - It never goes into a URL, a log, analytics, local storage or a query cache.
            - Copy works while the value is masked.
            - "Done" before any Copy or Show asks: "Close without copying? You won't be able to see this key again."
              Buttons "Go back" and "Close anyway".
            - Write-only fields never receive the stored value from the server. The web role cannot decrypt
              secrets (architecture), so the field shows only that a secret is saved and when: the latest version's
              created_at in the secrets table. A last-4 hint would need a non-secret column written at save time
              (open question 12).
  tokens    alert      Alert warning: bg-warning-subtle text-fg rounded-md p-3, TriangleAlert text-warning
            input      bg-surface-sunken text-fg border-transparent font-mono (read-only)
            buttons    IconButton secondary for show/hide; Button secondary for copy; Button primary for "Done"
            stored state  text-sm text-fg; dates text-muted
  content   Dialog title "Your new API key".
            Alert: "Copy this key now. We only show it once. If you lose it, revoke it and create a new one."
            Label "API key". Toggle name "Show key".
            Details: "Name: Website forms · Access: create and update leads · Created 06 Oct 2026, 2:30 pm IST".
            Masked example: "ak_7Hq2Xc.••••••••••••••••".
            Write-only:
            - Stored state: "Saved · updated 06 Oct 2026". Not set: "Not added yet". Button "Replace key secret"
              ("Add key secret" when not set).
            - Hint: "Paste the new secret from your gateway's dashboard. We store it encrypted and can't show it again."
            - Errors: "This doesn't look like a key secret for this gateway. Check you copied all of it." "Couldn't
              save. Try again."
  keyboard  When the dialog opens, focus starts on the Copy button. Tab order: input (read-only, selectable), Show,
            Copy, Done. Esc acts like Done and asks first if nothing was copied.
  a11y      Masked: <input type="password" readonly>, so screen readers treat it as protected. Shown: type="text"
            readonly.
            Show toggle: IconButton with aria-pressed and the name "Show key", which does not change.
            The warning Alert is part of the dialog's description (aria-describedby), so it is read on open.
            autocomplete="off", spellcheck="false", autocapitalize="off", dir="ltr". The mask character is U+2022.
            Write-only input: type="password" with autocomplete="new-password" plus data-1p-ignore and
            data-lpignore="true", so password managers neither fill nor offer to save a gateway secret.
            Targets: Show 40 px, Copy and Done 40 px.
            Pairs: text on warning-subtle, surface-sunken, surface-raised; warning on warning-subtle; text-muted on
            surface-raised; border-input on surface-raised; focus-ring on warning-subtle, surface-raised,
            surface-sunken.
  base      Dialog (Radix Dialog, specified in the overlays group); native <input>; CopyButton; IconButton.
  used on   S35, S36, S37, S41.
```

### Small primitives

#### Link

```text
Link
  purpose   Text that navigates: inside a sentence, on its own line, or to another site.
  anatomy   <a href> (Next <Link> for app routes) > text > for a new tab, an ExternalLink icon and sr-only " (opens in
            a new tab)".
  variants  inline (inside a sentence); standalone (its own line); external (new tab); muted (breadcrumbs and meta
            lines: text-muted, underline on hover only, never inside body text).
  sizes     Inherits the text size. Standalone: inline-flex items-center min-h-hit (24 px; min-h-hit-public 44 px on
            public pages). ExternalLink icon size-icon-sm, gap-1.
  states    default; hover (the underline thickens); visited (no change: staff revisit the same records all day);
            focus-visible (global outline); current page (aria-current="page": text-fg, no underline).
  tokens    link       text-accent underline decoration-1 underline-offset-2 hover:decoration-2
            muted      text-muted hover:text-fg hover:underline underline-offset-2
            current    text-fg no-underline
            The colour does not change on hover, so a link works on every surface that has an accent pair.
  content   The text names where it goes: "Open lead", "How {Institution} uses your data", "View DNS records".
            Never "Click here" or "Read more" alone.
  keyboard  Tab focuses; Enter follows.
  a11y      A real <a href>. Underlined by default, so a link is never shown by colour alone (1.4.1).
            New tab: the icon is aria-hidden and sr-only " (opens in a new tab)" follows the text.
            Something that acts like a button but looks like a link is Button link, never an <a> without href.
            Targets: standalone links at least 24 px tall (44 px on public pages); links inside a sentence use the
            2.5.8 inline exception.
            Pairs: accent on surface, surface-raised, bg, surface-subtle, surface-hover, accent-subtle, info-subtle,
            success-subtle, warning-subtle, danger-subtle; text-muted on surface, bg; text on surface, bg; focus-ring
            on surface, surface-raised, bg.
  base      native <a>; Next <Link> for app routes.
  used on   every screen: S01-S41; /consent/:token and /privacy/:orgSlug/*.
```

#### Kbd

```text
Kbd
  purpose   Shows a key or a key combination inside a hint.
  anatomy   <kbd> > key name. A combination is several <kbd> elements joined by " + " text: Ctrl + Enter.
  variants  in a field (the "/" hint in SearchInput); in a hint line ("Ctrl + Enter to save"); in a tooltip the key
            is plain text in brackets, with no box ("Search (/)").
  sizes     inline-flex items-center justify-center h-5 min-w-5 px-1 text-xs rounded-xs.
  states    static. Single-key hints are hidden when the person turns single-key shortcuts off.
  tokens    bg-surface border border-border rounded-xs px-1 text-xs text-muted
  content   Key names as printed on keyboards: "/", "Esc", "Enter", "Ctrl", "Alt", "Shift". On a Mac "Cmd" replaces
            "Ctrl".
  keyboard  Not focusable.
  a11y      The <kbd> element. Inside a field it is aria-hidden; the field's description says the shortcut in words
            ("Press slash to search").
            Targets: none; it is not interactive.
            Pairs: text-muted on surface, surface-raised, surface-subtle.
  base      native <kbd>.
  used on   S05, S15, S17, S19, S24, S25, S26, S32, S38, S40 (search hint); S09, S15, S40 (Ctrl + Enter hints).
```

#### Separator

```text
Separator
  purpose   A thin line between groups: menu groups, card sections, toolbar groups, the "or" on the sign-in page.
  anatomy   <hr> between blocks of content, or role="separator" inside menus and toolbars (Radix sets it). Lines
            that only decorate one group are aria-hidden.
  variants  horizontal (default); vertical (toolbar groups: w-px self-stretch); labelled (a centred word between
            two lines: S03 "or").
  sizes     h-px full width, or w-px. The parent sets the spacing (my-1 in menus, my-4 in cards).
  states    static.
  tokens    bg-border (h-px or w-px; no border utility). Labelled: text-xs text-muted between two bg-border lines.
            border is a decorative role: no contrast rule applies.
  content   Labelled form only: "or".
  keyboard  Not focusable.
  a11y      Semantic separators are <hr> or role="separator". Meaning never depends on a line.
            Targets: none; it is not interactive.
            Pairs: text-muted on surface, surface-raised (the labelled form).
  base      native <hr>; Radix Separator (DropdownMenu.Separator, Toolbar.Separator).
  used on   every staff screen (menus, cards, toolbars); S03 ("or").
```

#### Disclosure

```text
Disclosure
  purpose   Shows or hides extra detail under a button, in place.
  anatomy   Trigger button (ChevronRight, which turns to point down when open, then the label) > region with the
            content.
  variants  native: <details> and <summary>, which work without JavaScript (public pages, SmsSegmentCounter
            "Details");
            controlled: Radix Collapsible (RecipientCheck "14 skipped", MergeDiffView "Show them", JobTray "Hide task
            details").
  sizes     trigger min-h-hit (24 px; 44 px on public pages), text-sm, gap-1, chevron size-icon-sm. Region pt-2.
  states    collapsed; expanded; hover; focus-visible.
            Opening never moves focus; the content follows the trigger in the tab order.
  tokens    trigger   text-fg font-medium hover:underline underline-offset-2; chevron text-muted, turned with
                      group-open:rotate-90 (native) or data-[state=open]:rotate-90 (Radix),
                      motion-safe:transition-transform duration-fast
            region    text-sm text-fg; secondary lines text-muted
  content   The label names what opens: "Details", "14 skipped", "Show them", "Hide task details". It changes between
            states only when the action changes ("Show them", "Hide them").
  keyboard  Tab focuses the trigger; Enter or Space toggles.
  a11y      Radix Collapsible gives the trigger aria-expanded and aria-controls. A native <summary> exposes the
            expanded state itself. The chevron is aria-hidden.
            Targets: triggers at least 24 px tall (44 px on public pages).
            Pairs: text on surface, surface-raised; text-muted on surface, surface-raised; focus-ring on surface,
            surface-raised.
  base      native <details> and <summary>; Radix Collapsible.
  used on   S05 (bulk message), S10, S14, S16, S18, S19; JobProgress tray; public notice details.
```

---

## Group 2: Shell, navigation, overlays, feedback and display

The frame around every staff screen and the parts that tell people what is happening, then the display parts and
the formatters. Group 1 supplies the controls these blocks reuse (Button, IconButton, Switch, SegmentedControl,
ChannelTabs, SearchInput, CopyButton). Public pages use only SkipLink, Alert, Spinner, Money, DateText and PhoneText
from this group.

What we do not take from the original (`measurements.md`, "What we will not take"): its dark navy icon rail, its
grey workspace-picker box, accent-coloured outline header icons, coloured row-edge markers with lettered circle
badges, and its chevron milestone bar. Our shell is a light sidebar with text labels, a plain header, and status
shown as labelled pills.

### Shell and navigation

#### AppShell

```text
AppShell
  purpose   The frame of every signed-in staff screen: header, sidebar, banner slot, main content, the background-task
            tray and the toast region, with the same landmarks and focus rules everywhere.
  anatomy   In DOM order:
            1. SkipLink.
            2. <header> AppHeader, sticky at the top, full width.
            3. A row below the header: <nav aria-label="Main"> Sidebar | content column.
            4. Content column: BannerStack (page-level Banners) > <main id="main" tabindex="-1"> > PageHeader >
               page body.
            5. <section aria-label="Background tasks"> JobTray (JobProgress tray items), bottom-right, above any
               sticky bottom bar.
            6. Toast viewport (region), bottom-right, above the tray.
            7. One sr-only polite status region for shell messages (route errors, org-switch notices).
            The page canvas is bg-bg. Cards, tables and panels inside main are bg-surface.
  variants  - standard: list and detail pages (S04-S11, S13, S14, S16, S17, S19-S27, S40).
            - settings: adds a second column, the section subnav (see Sidebar), at lg and up (S28-S38, S41).
            - full-bleed: main has no max width and no vertical padding; inner panes scroll, the page does not
              (S12 calendar, S15 inbox, S18 builder).
            - partner: S39 publisher portal. Header with the publisher's name and Sign out only. No sidebar, no
              org switcher, no check-in, no bell.
            S01-S03 do not use AppShell. They have their own minimal layout with SkipLink and a footer.
  sizes     Header h-header (48 px). Sidebar w-sidebar (240 px) expanded, w-sidebar-collapsed (56 px) collapsed.
            Main padding: px-gutter (20 px) and pt-4 pb-8 at md and up; px-gutter-sm (16 px) below md.
            Vertical rhythm between page blocks: gap-section-gap (16 px).
            Width: tables, boards and the calendar run full width; other pages sit in max-w-content (1440 px)
            mx-auto; single forms sit in max-w-form (720 px).
            Breakpoints and behaviour:
            - xl and up (1280 px): sidebar persistent; expanded unless the person collapsed it.
            - lg to xl (1024-1279 px): sidebar persistent; collapsed by default; the person may expand it, which
              pushes content.
            - md to lg (768-1023 px): collapsed rail only. "Expand menu" opens the full nav as a left Drawer over the
              page instead of pushing content.
            - below md: no rail. The header's menu button opens the full nav as a left Drawer.
  states    default; sidebar collapsed; mobile nav open; route loading; offline; idle warning; session expired;
            switched org in another tab; read-only institution (suspended); no permission for this page; page error.
            - Route loading: each route segment has a loading.tsx that renders the page's Skeleton. While a client
              navigation is pending for more than 300 ms, a 2 px indeterminate ProgressBar (sm) shows along the
              bottom edge of the header.
            - Offline: a warning Banner appears when the browser reports offline and goes when it is back. Nothing
              is queued; actions fail with their own error.
            - Idle warning: 2 minutes before the idle limit, an AlertDialog opens with focus on its primary. "Stay
              signed in" refreshes the session; "Sign out now" signs out. The sign-out time is static text, not a
              live countdown. Activity in any tab of the app also extends the session and closes the warning in
              every tab. Unless the idle limit is 20 hours or more, this warning is required (2.2.1).
            - Session expired: a Dialog (not dismissible) sits over the page without unmounting it. "Sign in again"
              opens sign-in in a new tab; when this tab regains focus with a valid session, the dialog closes and
              whatever the person had typed is still there. Nothing is written to browser storage (staff often share
              college PCs, and form values hold students' personal data).
            - Switched org in another tab: on window focus the shell compares the org in the session cookie with the
              org this page was rendered for. If they differ, a blocking Dialog explains and offers "Reload". No
              request is sent with the wrong institution's screen showing.
            - Suspended institution: a danger Banner; every action that changes data is aria-disabled with the
              reason "{Institution}'s account is suspended."
            - No permission: main shows EmptyState (no-permission). The nav item is hidden, not disabled, so this
              appears only on a typed or shared URL.
            - Page error: the route's error.tsx shows EmptyState (error) with a reference code and "Try again".
              Header and sidebar keep working.
  tokens    html bg-bg text-fg font-sans; header bg-surface border-b border-border; sidebar bg-surface
            border-r border-border; main bg-bg; tray and toasts bg-surface-raised shadow-pop.
            Scroll padding on html: scroll-pt-[calc(var(--layout-header)+var(--sticky-extra,0px))] and
            scroll-pb-[var(--bottom-bar,0px)], so a focused element is never hidden under a bar (2.4.11).
            - Top: every sticky layer under the header sets --sticky-extra on <html> while it shows: a sticky
              table header, the builder PageHeader and the compact profile bar (var(--layout-pagebar)).
            - Bottom: every fixed or sticky bottom layer adds its height to --bottom-bar on <html>: the FormLayout
              sticky footer (var(--layout-pagebar)), a sticky BulkActionBar, and the JobTray (its measured height
              plus the 1rem gap under it, from a ResizeObserver). One shell hook sums the layers and writes the
              total. --bottom-sticky holds the sticky bars alone; the JobTray sits at
              bottom-[calc(var(--bottom-sticky,0px)+1rem)], so it never covers a form's primary button.
            - main adds pb-[var(--bottom-bar,0px)], so the last content can scroll clear of every bottom layer.
  content   Document title: "{Page} · {Institution}", for example "Leads · Lakeview College" or
            "Ananya Rao · Leads · Lakeview College". The product name is appended once chosen.
            Landmark names: "Main" (sidebar nav), "Settings" (settings subnav), "Background tasks" (tray),
            "Updates (F8)" (toast viewport).
            Session expired dialog: title "You've been signed out", body "For your security we sign you out after a
            period without activity. Sign in again in the new tab, then come back here. What you typed is kept.",
            button "Sign in again" (ExternalLink icon, sr-only " (opens in a new tab)").
            Idle warning: title "You'll be signed out soon", body "For your security we sign you out after {n}
            minutes without activity. You'll be signed out at 4:32 pm.", buttons "Stay signed in" (primary) and
            "Sign out now".
            Other-tab dialog: title "You switched institution in another tab", body "This tab still shows Lakeview
            College. Reload to continue in Lakeview Public School.", button "Reload".
  keyboard  Tab order: SkipLink > header controls (menu button, home link, org switcher, search, check-in, bell,
            account menu) > sidebar links and the collapse button > banners > main > background tasks.
            F8 moves focus to the toast region. Esc closes the topmost overlay.
            On a client-side route change, focus moves to the page's h1 (tabindex="-1"); on the first load the
            browser default is kept. Back and forward restore scroll position.
  a11y      Landmarks: banner (header), navigation x2, main, region (tasks, toasts). One h1 per page.
            <html lang="en-IN">, meta color-scheme "light dark", data-theme set by the server from the cookie so the
            theme never flashes. Zoom is never blocked.
            Next.js's route announcer reads the new document title, so titles must be unique per page.
            Time limits (2.2.1): the idle warning gives at least 20 seconds (2 minutes) to extend with one button.
            Content reflows at 320 px except data tables, the calendar and the workflow canvas, which scroll inside
            their own container (decisions.md section 1).
            Pairs: text on bg, surface; text-muted on bg, surface; focus-ring on bg, surface.
  base      Next.js App Router layouts: app/(staff)/layout.tsx is a Server Component that reads the member, prefs
            and the sidebar cookie; native landmarks; Radix Tooltip.Provider and Toast.Provider at the root;
            Radix Dialog for the mobile nav and the blocking dialogs; Radix AlertDialog for the idle warning.
  used on   S04-S38, S40, S41 (standard, settings and full-bleed variants); S39 (partner variant).
```

#### SkipLink

```text
SkipLink
  purpose   Lets keyboard and screen-reader users jump past the header and sidebar straight to the page content.
  anatomy   <a href="#main"> as the first focusable element in <body>. Target: <main id="main" tabindex="-1">.
            Public pages and sign-in point it at their form's first heading instead.
  variants  one variant. A second link "Skip to filters" may follow it on S05 when the filter bar exists.
  sizes     h-control-md (40 px), px-4, text-sm font-medium, rounded-md. Fixed at top-2 left-2.
  states    hidden (off-screen: sr-only, not display:none, so it stays in the tab order); visible on focus
            (focus:not-sr-only); pressed (moves focus to main and hides again).
  tokens    bg-accent text-on-accent shadow-pop z-(--z-skiplink); focus uses the global outline.
  content   "Skip to main content". On S01 and S02: "Skip to the form". On S05: second link "Skip to filters".
  keyboard  First Tab on any page shows it. Enter follows it; focus lands on main (or the target heading) and the
            next Tab continues from there.
  a11y      A real link with a visible label; it appears on focus, so sighted keyboard users see it too.
            Target size 40 px tall. Main has tabindex="-1" so the browser moves focus, not only the scroll position.
            Pairs: on-accent on accent; focus-ring on surface, bg.
  base      native <a>. Tailwind sr-only and focus:not-sr-only.
  used on   every page: S01-S41.
```

#### Sidebar

```text
Sidebar
  purpose   The main navigation between the app's sections, with an expanded and a collapsed form, and a drawer form
            on small screens. Also the second-level subnav of the Settings area.
  anatomy   <nav aria-label="Main"> > scroll area (overflow-y-auto) > groups. Each group: a label (<p id>) and a
            <ul aria-labelledby> of items. Each item: <Link> > icon (20 px) > label > optional count Badge.
            Footer, pinned at the bottom: Settings item, then the collapse button.
            Items and routes (shown only when the role has the permission; hidden otherwise):
            - Work: My day "/" House (S04); Leads "/leads" UsersRound (S05, leads.view); Opportunities
              "/opportunities" Layers (S26); Calendar "/calendar" CalendarDays (S12); Inbox "/inbox" MessagesSquare
              (S15, inbox.use); Tickets "/tickets" LifeBuoy (S40).
            - Outreach: Broadcasts "/broadcasts" Megaphone (S16); Automations "/automations" Workflow (S17);
              Templates "/templates" FileText (S19).
            - Money and reports: Payments "/payments" IndianRupee (S25); Reports "/reports" ChartColumn (S20-S23).
            - Footer: Settings "/settings" Settings (S28-S38, S41).
            Settings subnav (variant below): Lead fields, Stages, Lead rules, Enquiry forms, Privacy notices,
            Users, Roles, Teams, Channels, Payments, Integrations and API, Publishers, Privacy requests (S42),
            Incidents (S43), Retention (S44), Audit log.
  variants  - expanded: icon, label and count; group labels visible.
            - collapsed: icon only, centred; group labels become a 1 px divider (the label stays as sr-only text so
              each list keeps its name); the label shows in a Tooltip on the right; a count becomes a dot. The
              active item keeps its 1 px accent edge, which carries the state when there is no label.
            - drawer: the expanded form inside a left Drawer (below md, and on "Expand menu" from md to lg). Its top
              holds the OrgSwitcher and the CheckInToggle, which the narrow header hides.
            - settings subnav: a second column w-subnav (240 px) inside the Settings layout at lg and up, same item
              style, no icons, aria-label="Settings". Below lg it becomes a "Settings section" Button secondary sm
              (ChevronDown) above the page header that opens a Popover listing the same links; the current section
              has aria-current="page". Nothing navigates until a link is chosen (3.2.2).
  sizes     Expanded w-sidebar (240 px); collapsed w-sidebar-collapsed (56 px). Width changes at once, with no
            animation, so content reflows a single time.
            Item: h-control-sm (32 px), mx-2, px-2, gap-3, rounded-md, text-sm. Collapsed item: h-control-sm by
            w-control-md (40 px), centred. Icons size-icon-md (20 px).
            Group label: text-xs font-medium, px-4 pt-4 pb-1. Collapsed divider: border-t mx-3 my-2.
            Count Badge: h-5 min-w-5 px-1.5. Collapsed dot: size-2, top-right of the icon.
            Collapse button: an item-sized button at the very bottom.
  states    item: default; hover; active (current section); focus-visible; with count; with dot (collapsed).
            sidebar: expanded; collapsed; drawer open; loading counts (counts absent until loaded, no skeleton);
            narrow-height (the scroll area scrolls; the footer stays pinned).
            - Active: the item whose route is the longest prefix of the current path. Exact match gets
              aria-current="page"; a deeper page in that section (a lead profile under Leads) gets
              aria-current="true".
            - The collapsed or expanded choice is saved in member prefs and mirrored to a cookie, so the server
              renders the right width and nothing shifts on load.
            - Counts come from one lightweight request and Realtime updates: Inbox shows chats waiting for the
              person (queued and unassigned or assigned to them); My day shows overdue follow-ups. Counts are capped
              at "99+".
            - The drawer closes on navigation, on Esc and on the overlay.
  tokens    nav            bg-surface border-r border-border
            item           border border-transparent text-fg hover:bg-surface-hover transition-colors
                           duration-fast; icon text-muted group-hover:text-fg
            active item    bg-accent-subtle text-accent font-semibold border-accent forced-colors:border-[Highlight];
                           icon text-accent. The 1 px accent edge and the weight show the state, so it is never
                           fill or colour alone. In the collapsed rail, which has no label, the edge carries it.
            group label    text-muted
            count Badge    bg-surface-sunken text-fg (on the active item too)
            collapsed dot  rounded-pill bg-accent
            drawer         bg-surface-raised (Drawer, side left, w-sidebar)
            focus          global outline with focus-inset (items sit edge to edge in a scroll area)
  content   Group labels: "Work", "Outreach", "Money and reports".
            Collapse button: "Collapse menu" (PanelLeftClose) and "Expand menu" (PanelLeftOpen).
            Collapsed tooltips repeat the label and the count: "Inbox · 4 waiting".
            Accessible names with counts: "Inbox, 4 chats waiting"; "My day, 3 overdue follow-ups".
  keyboard  Tab moves through the links in order, then the collapse button. Enter follows a link. No arrow-key
            roving: it is a list of links, not a menu.
            In collapsed mode each link shows its Tooltip on focus.
            In the drawer: focus starts on the current page's link; Tab is trapped in the drawer; Esc closes it and
            returns focus to the menu button.
  a11y      <nav> landmark with a name; lists named by their group label; aria-current as above.
            Collapsed links keep their full accessible name (aria-label = label and count), so the icon is never
            the only label for assistive tech.
            Collapse button: aria-expanded (true when expanded) and aria-controls pointing at the nav.
            Targets: items 32 px tall and at least 40 px wide.
            Pairs: text on surface, surface-hover, surface-raised, surface-sunken; text-muted on surface,
            surface-hover, surface-raised; accent on accent-subtle, surface, surface-hover, surface-raised (the
            active edge); focus-ring on surface, surface-hover, accent-subtle, surface-raised.
  base      native <nav>, <ul>, Next <Link>; Radix Tooltip (collapsed labels); Drawer (Radix Dialog) for the drawer
            form; Popover with a link list for the narrow settings subnav.
  used on   S04-S38, S40, S41. Settings subnav: S28-S38, S41.
```

#### AppHeader

```text
AppHeader
  purpose   The bar at the top of every staff screen that holds the institution context and the person's own
            controls: home, org switcher, search, check-in, notifications and the account menu.
  anatomy   <header> > left cluster: menu IconButton (below lg), home link with our product mark (placeholder until
            /replica-brand), OrgSwitcher > flexible space > right cluster: global search slot, CheckInToggle,
            NotificationBell, UserMenu. Under the bottom edge, a 2 px route-loading ProgressBar when navigating.
            Our product mark is text or our own SVG. Never the original's logo or the institution's logo here.
  variants  - standard: every control.
            - narrow (below md): menu button, home link, the org name as text (switching moves into the nav
              drawer), bell, account menu. Check-in moves into the nav drawer and into the account menu.
            - partner (S39): product mark, publisher name, account menu with Sign out only.
  sizes     h-header (48 px), px-3, gap-2. Header icon controls are IconButton md-bar (group 1: size-control-md,
            40 px, with 24 px icons, size-icon-lg), the top-bar size from decisions.md section 5. Product mark
            24 px tall.
            The org name truncates at max-w-60 (240 px).
  states    default; scrolled (no change: the border already separates it); route loading (2 px bar);
            read-only institution (a Banner below, not a header change); offline (Banner below).
  tokens    bg-surface border-b border-border sticky top-0 z-(--z-header). Icon buttons: text-muted
            hover:text-fg hover:bg-surface-hover (IconButton ghost). Org name text-fg font-medium.
  content   Home link accessible name: "{Product} home". Menu button: "Open menu". Search slot placeholder:
            "Search leads by name, email or mobile" (specified with SearchInput in group 1).
  keyboard  Tab moves left to right through the controls. Each control's own keys apply (menus: arrows; popover:
            Esc). "/" focuses search only when single-key shortcuts are on (account menu setting).
  a11y      <header> is the banner landmark. Every icon control has a visible tooltip and an aria-label.
            Targets 40 px. The header never covers focused content: html scroll-padding-top equals its height.
            Pairs: text on surface, surface-hover; text-muted on surface, surface-hover; focus-ring on surface,
            surface-hover.
  base      native <header>; IconButton (group 1); Radix Tooltip.
  used on   S04-S38, S40, S41; S39 (partner variant).
```

#### OrgSwitcher

```text
OrgSwitcher
  purpose   Shows which institution the person is working in and lets people who belong to several (group admins,
            our support staff) switch, without ever mixing two institutions' data in one screen.
  anatomy   Trigger: ghost button > institution Avatar (square, initials, 24 px) > name (truncates) > optional Badge
            ("Trial") > ChevronsUpDown icon. Menu: label "Switch institution" > radio items (one per membership:
            Avatar, name, the person's role there as a second line, StatusPill when suspended) > separator >
            "Manage institutions" (only for our staff).
            With one membership the trigger is plain text (no button, no chevron).
            With more than 8 memberships the menu becomes a Popover with a SearchInput and a listbox (Combobox,
            group 1).
            Not a grey filled box: the trigger looks like the other ghost controls in the header.
  variants  single (static text); menu (2-8 institutions); searchable (9 or more); in-drawer (full width, inside the
            nav drawer below md).
  sizes     Trigger h-control-sm (32 px), px-2, gap-2, max-w-72 (288 px) with the name truncating. Menu w-72.
            Items two lines, min-h-menu-item, py-1.5.
  states    closed; open; hover; focus-visible; switching (trigger shows a Spinner and "Switching…"; the menu is
            closed; further clicks ignored); switch failed (error Toast, trigger restored); suspended institution
            (item aria-disabled with its reason as the second line); stale tab (handled by AppShell).
            Switching posts to POST /me/org, which re-issues the session claims, then does a full navigation to "/"
            so no client cache from the previous institution survives.
  tokens    trigger text-fg hover:bg-surface-hover rounded-md; chevron text-muted; menu as DropdownMenu
            (bg-surface-raised border border-border rounded-lg shadow-pop p-1); selected item shows a Check in
            text-accent; second line text-xs text-muted.
  content   Menu label: "Switch institution". Item second line: "Admin", "Counsellor", "Support staff".
            Suspended item: "Suspended. Contact your account owner."
            Switching state: "Switching…". Error toast: "Couldn't switch institution. Try again."
            Trigger accessible name: "Institution: Lakeview College. Switch institution".
  keyboard  Enter or Space or Down opens; arrows move; typeahead jumps by name; Enter chooses; Esc closes and
            returns focus to the trigger. Searchable form: typing filters, Down moves into the list.
  a11y      Trigger aria-haspopup="menu" and aria-expanded (Radix). Items are menuitemradio with aria-checked on
            the current institution. Disabled items keep their reason in the item text.
            Pairs: text on surface, surface-hover, surface-raised; text-muted on surface-raised, surface-hover;
            accent on surface-raised, surface-hover; warning on warning-subtle; info on info-subtle; focus-ring on
            surface, surface-hover.
  base      Radix DropdownMenu (RadioGroup, RadioItem, ItemIndicator); Popover and Combobox for the searchable form.
  used on   AppHeader on S04-S38, S40, S41.
```

#### UserMenu

```text
UserMenu
  purpose   The person's own menu: who they are, their preferences (theme, reduced motion, shortcuts, notifications)
            and sign out.
  anatomy   Trigger: IconButton-sized button holding the person's Avatar (md, 32 px, the "you" colours).
            Menu: header block (name, email, role at this institution; not focusable) > separator > "Your profile" >
            "Notification settings" > Theme submenu (radio: Match system, Light, Dark) > checkbox item "Reduce
            motion" > checkbox item "Single-key shortcuts" > separator > "Help and guides" (opens in a new tab) >
            separator > "Sign out".
            In the narrow header the menu also holds the CheckInToggle as a checkbox item "Checked in".
  variants  standard; partner (S39: header block and "Sign out" only).
  sizes     Trigger size-control-md (40 px) with a 32 px Avatar. Menu w-64 (256 px). Items h-menu-item (32 px).
  states    closed; open; theme changing (applies at once: data-theme on <html> is set before the request, then
            PATCH /me/prefs and the cookie; on failure the choice still applies for this session and an error
            Toast says it wasn't saved); signing out (item shows a Spinner; then navigation to /login).
  tokens    As DropdownMenu. Header block: name text-sm font-semibold text-fg, email and role text-xs text-muted,
            px-2 py-2. Checked indicators Check in text-accent.
  content   Items: "Your profile" (UserRound), "Notification settings" (Bell), "Theme" (Monitor) with "Match system",
            "Light" (Sun), "Dark" (Moon), "Reduce motion", "Single-key shortcuts" (Keyboard), "Help and guides"
            (CircleQuestionMark, ExternalLink), "Sign out" (LogOut).
            Trigger accessible name: "Account menu for Priya Nair".
            Save failure toast: "Couldn't save your preference. It applies until you sign out."
  keyboard  As DropdownMenu: arrows, typeahead, Right opens the Theme submenu, Left closes it, Space toggles
            checkbox items without closing the menu, Esc closes.
  a11y      Theme items are menuitemradio; Reduce motion and shortcuts are menuitemcheckbox with aria-checked.
            Reduce motion sets data-motion="reduce" on <html> at once. "Help and guides" has sr-only
            " (opens in a new tab)". Sign out needs no confirmation.
            Pairs: text on surface-raised, surface-hover; text-muted on surface-raised, surface-hover; accent on
            surface-raised, surface-hover, accent-subtle; focus-ring on surface, surface-hover.
  base      Radix DropdownMenu (Sub, RadioGroup, CheckboxItem); Avatar.
  used on   AppHeader on S04-S38, S40, S41; S39.
```

#### CheckInToggle

```text
CheckInToggle
  purpose   Lets a counsellor say they are at work and taking new leads. Only checked-in counsellors receive leads
            from automations that ask for it (F01, F06), so the state must always be visible.
  anatomy   Built on the group 1 Switch: a <label> holding a visually hidden checkbox with role="switch", the track
            and thumb, the constant label "Checked in", and a status line under or beside it.
            Status line (text-xs): when on, "Since 9:12 am"; when off, "Not taking new leads"; after an automatic
            check-out, "Checked out automatically at 7:00 pm".
            Card variant adds: title, today's leads assigned so far, the next automatic check-out time and a link to
            the attendance history.
  variants  - header: Switch sm with label, status line shown at xl and up, otherwise in the Tooltip.
            - menu item: inside UserMenu and the nav drawer below md, a menuitemcheckbox "Checked in" with the status
              line as its second line.
            - card: S04 My day, a bg-surface card with the Switch md.
            Shown only to members who can receive leads by assignment (role setting). Hidden for everyone else,
            never disabled.
  sizes     Header: Switch sm (track 36 x 20 px), label text-sm font-medium, whole label at least min-h-hit (24 px),
            total control h-control-sm (32 px) with px-2.
            Card: Switch md (track 44 x 24 px), label text-base font-semibold, padding p-4, rounded-lg.
  states    checked in; checked out; checked out automatically; saving; failed; hover; focus-visible.
            - The switch flips at once and posts to POST /me/check-in or /me/check-out (optimistic). While saving it
              is aria-disabled; after 300 ms a small Spinner sits on the thumb.
            - Failed: it flips back and "Couldn't update. Try again." appears in the status line (role="alert").
              No toast on success: the switch is the confirmation (same rule as group 1 Switch).
            - Automatic check-out: the auto_checkout job runs at the member's set time in the org's time zone. A
              Realtime message flips the switch, sets the status line and adds a notification ("You were checked
              out automatically at 7:00 pm IST").
            - Another device changed it: Realtime updates this one; no announcement unless focus is on it.
  tokens    As group 1 Switch: track off bg-input hover:bg-muted, on bg-accent hover:bg-accent-hover; thumb
            bg-surface (off) and bg-on-accent (on); rounded-pill border border-transparent.
            Label text-fg; status line text-muted; failure text text-danger.
            Card: bg-surface border border-border rounded-lg shadow-card.
  content   Label: "Checked in" (constant; the switch shows on or off).
            Status lines: "Since 9:12 am", "Not taking new leads", "Checked out automatically at 7:00 pm".
            Tooltip (header, below xl): "Checked in since 9:12 am" or "Checked out. New leads go to colleagues who
            are checked in."
            Card title: "Check-in". Card facts: "Leads assigned today: 6", "Automatic check-out: 7:00 pm IST".
            Card link: "Attendance history".
  keyboard  Tab focuses the switch; Space toggles. In the menu-item form, Space toggles without closing the menu.
  a11y      role="switch" with aria-checked; the accessible name is the constant visible label "Checked in", so
            label-in-name holds and the state is never part of the name.
            The status line is linked with aria-describedby.
            Failure line is role="alert". Targets: the label row is at least 24 px tall.
            Pairs: border-input on surface, surface-raised; accent on surface; on-accent on accent, accent-hover;
            text on surface, surface-raised; text-muted on surface, surface-raised; danger on surface; focus-ring on
            surface, surface-raised.
  base      group 1 Switch (native checkbox with role="switch"); Radix DropdownMenu CheckboxItem for the menu form;
            Radix Tooltip.
  used on   AppHeader (S04-S38, S40, S41); S04 (card); M05 (phase 2 mobile pattern).
```

#### NotificationBell

```text
NotificationBell
  purpose   Shows how many alerts the person hasn't read and opens the alert feed, so an assigned lead or a payment
            is seen within seconds (F01, F08).
  anatomy   IconButton (ghost, md-bar) with the Bell icon and a count Badge at its top-right > Radix Popover holding
            NotificationFeed (popover variant). An sr-only polite live region in the header for new-alert
            announcements.
  variants  - popover: md and up.
            - link: below md the button navigates to /notifications (S24) instead of opening a popover.
  sizes     Button: IconButton md-bar (size-control-md, 40 px; icon size-icon-lg, 24 px). Badge h-5 min-w-5 px-1.5
            (the shared count size), overlapping the top-right corner by 4 px. Popover width
            w-[min(var(--layout-dialog-sm),calc(100vw-2rem))] (400 px at most),
            max-h-[min(560px,calc(100dvh-6rem))].
  states    no unread (no badge); unread (count badge, "99+" above 99); new alert arrives (count updates; announced);
            open; loading feed; feed error; offline (count frozen, feed shows its error state).
            Opening the popover does not mark anything as read; only opening an item or "Mark all as read" does.
  tokens    Button as IconButton ghost: text-muted hover:text-fg hover:bg-surface-hover; open state
            data-[state=open]:bg-surface-hover data-[state=open]:text-fg.
            Count badge: rounded-pill bg-danger text-on-danger text-xs font-medium tabular-nums (the same badge as
            group 1 IconButton).
            Popover: bg-surface-raised border border-border rounded-lg shadow-pop z-(--z-popover).
  content   Accessible name: "Notifications" with no unread; "Notifications, 3 unread"; "Notifications, 99+
            unread".
            Tooltip: "Notifications".
            Announcements (polite, at most one every 10 seconds, batched): "New notification: Lead assigned, Ananya
            Rao" or "3 new notifications". The person can switch these off in Notification settings ("Read out new
            notifications").
  keyboard  Tab focuses; Enter or Space opens; focus moves into the feed (its heading container); Esc closes and
            returns focus to the bell.
  a11y      Radix Popover trigger: aria-haspopup="dialog", aria-expanded, aria-controls. The count is in the
            accessible name; the badge itself is aria-hidden. The live region is separate from the button, so the
            name changing is not announced twice.
            Target 40 px.
            Pairs: text-muted on surface, surface-hover; text on surface-hover; on-danger on danger; danger on
            surface (badge edge); focus-ring on surface.
  base      IconButton (group 1), Badge, Radix Popover, NotificationFeed. Supabase Realtime private channel
            org:{id}:member:{id} carries ids only; data comes from GET /notifications.
  used on   AppHeader on S04-S38, S40, S41; links to S24.
```

#### NotificationFeed

```text
NotificationFeed
  purpose   The list of alerts about the person's leads and work, with unread, done and missed states, used in the
            bell popover and on the full notifications page.
  anatomy   Header: heading "Notifications" (h2), "Mark all as read" (Button link, sm), settings IconButton (xs) >
            filter: SegmentedControl sm "Unread" | "All" | "Missed" > list grouped by day ("Today", "Yesterday",
            "03 Oct 2026") > footer link "See all notifications" (popover only).
            Item (<li>): a link covering the row to the item's target (usually the lead, S08) > event icon in a
            32 px circle > title (text-sm) > body (text-xs leading-prose, up to 2 lines) > meta line: lead name,
            RelativeTime,
            optional StatusPill "Missed" > unread dot at the right > "Mark as read" IconButton (xs, Check) shown on
            hover and focus-within, always shown on touch.
            "Show N new" button pinned at the top when new items arrive while the list is scrolled.
            Event icons: lead_assigned UserRoundPlus; whatsapp_received MessageCircle; email_opened MailOpen;
            payment_started IndianRupee; payment_succeeded CircleCheck; payment_failed CircleX; follow_up_due
            AlarmClock; stage_changed ArrowRight; job_finished ListChecks; auto_checkout TimerOff; channel_problem
            TriangleAlert; anything else Bell.
  variants  popover (in NotificationBell; 20 most recent per filter, then "See all"); page (S24: full width
            max-w-form, cursor pagination with Pagination load-more, plus a link to preferences).
  sizes     Item min-h-16 (64 px), px-3 py-2, gap-3. Icon circle size-control-sm (32 px) with a 16 px icon.
            Unread dot size-2. Day heading text-xs font-medium px-3 pt-3 pb-1. Body text-xs leading-prose
            (12/19.5: user-entered names need a line height of at least 1.57) line-clamp-2 pb-1, with the pb-1
            inside the clamp box.
  states    item: unread (dot, title font-semibold, bg-accent-subtle); read; acted (done: a CircleCheck before the
            time, sr text "Done"; acting also marks the item read, so the icon never sits on the unread fill);
            missed (not acted on within the response window: warning icon circle and a "Missed" pill); target gone
            (the lead was merged: the link goes to the primary lead; erased or on hold: no link, text "This lead
            is no longer available"); hover; focus-visible.
            list: loading (3 Skeleton items); empty per filter (EmptyState, compact); error ("Couldn't load
            notifications." with "Try again"); new items waiting ("Show 2 new"); all read.
            - Opening an item marks it read and navigates. Acting on it (for example opening the lead from it, or
              the payment being handled) sets acted_at on the server.
            - "Missed" means acted_at is still empty after the response window (default 30 minutes; open question 15).
            - New items never push the list down under the pointer: they wait behind "Show 2 new" unless the list is
              at the top.
  tokens    container      bg-surface-raised (popover) or bg-surface (page card)
            item           hover:bg-surface-hover; unread bg-accent-subtle hover:bg-surface-hover; focus with
                           focus-inset
            icon circle    rounded-pill bg-surface-sunken text-muted; missed bg-warning-subtle text-warning
            title          text-fg (font-semibold when unread); body and meta text-muted
            unread dot     rounded-pill bg-accent
            day heading    text-muted
  content   Titles (ours): "Lead assigned to you", "New WhatsApp message", "Payment received", "Payment failed",
            "Follow-up due in 15 min", "Stage changed by Vikram Shah", "Import finished", "You were checked out
            automatically", "WhatsApp needs reconnecting".
            Body examples: "Ananya Rao enquired about B.Tech Computer Science from the website form." "₹1,000.00
            application fee paid by UPI."
            Empty: "You're all caught up" (Unread); "No notifications yet" (All); "Nothing missed" (Missed).
            Buttons: "Mark all as read", "Mark as read", "See all notifications", "Show 2 new".
            Settings button name: "Notification settings".
  keyboard  Tab order: Mark all as read > settings > filter (arrows switch segments) > each item link > its Mark
            as read button > See all. Enter opens an item. Esc closes the popover. "Show N new" moves focus to the
            first new item after loading them.
  a11y      Heading h2 names the popover (aria-labelledby). The list is <ul>; each day group is a nested list
            named by its heading.
            Unread is conveyed by the dot, the weight and sr-only "Unread" at the start of the link text; Missed by
            its pill text. Never by colour alone.
            The link's accessible text reads: state, title, body, lead, time ("Unread. Lead assigned to you. Ananya
            Rao. 5 min ago, 06 Oct 2026, 2:30 pm IST").
            Targets: rows 64 px; Mark as read 24 px.
            Pairs: text on surface-raised, surface, accent-subtle, surface-hover; text-muted on surface-raised,
            surface, accent-subtle, surface-hover, surface-sunken; accent on surface-raised, accent-subtle (dot);
            warning on warning-subtle; success on surface-raised, surface, surface-hover (acted icon, also on a
            hovered row); focus-ring on surface-raised, accent-subtle, surface-hover.
  base      native <ul>, Next <Link>; SegmentedControl, IconButton, Button (group 1); StatusPill; RelativeTime;
            Skeleton; EmptyState; Pagination (load-more on S24).
  used on   NotificationBell (all staff screens); S24.
```

#### PageHeader

```text
PageHeader
  purpose   The top of every page: where you are, what the page is, its state, and the page-level actions.
  anatomy   Optional Breadcrumbs (above) > row: title block | actions.
            Title block: h1 > optional StatusPill or count after it > optional description (one line, can wrap) >
            optional meta row (key facts as text-xs text-muted items separated by gaps).
            Actions: Buttons sm, secondary ones first, the primary last (rightmost); overflow into a "More actions"
            DropdownMenu (IconButton, Ellipsis).
            Optional Tabs attached to the bottom edge (detail pages).
  variants  - list: title, record count, description optional, actions (S05 "Import", "Add lead").
            - detail: Breadcrumbs, title (the record name), StatusPill, meta row, actions, Tabs (S08, S27).
            - settings: Breadcrumbs "Settings > Lead fields", title, one-line description of what the page controls.
            - builder (sticky): S18 and S16 editors; sticks under the header with bg-surface border-b shadow-bar
              and holds Save state ("Saved", "Unsaved changes") and actions. While it shows, the page sets
              --sticky-extra: var(--layout-pagebar) on <html> (AppShell), so a focused field scrolls clear of it.
            The page header sits on the canvas (bg-bg) with no band, except the sticky builder variant.
  sizes     min-h-pagebar (56 px); title text-lg (20/30, semibold); record names on detail pages text-xl
            leading-prose (24/39: a wrapped user-entered name needs a line height of at least 1.57);
            description text-sm; meta text-xs; gap between rows 4 px; bottom margin gap-section-gap (16 px).
            Actions h-control-sm (32 px), gap-2.
            Below md: actions wrap under the title; only the primary stays visible, the rest go into More actions.
  states    default; loading (title Skeleton line and two button Skeletons with the same sizes); saving (builder:
            "Saving…" with a Spinner, then "Saved"); unsaved (builder: "Unsaved changes" in text-warning with an
            icon); read-only (actions that change data are aria-disabled with a reason; a neutral StatusPill
            "Read-only" after the title, for merged records and records on hold).
  tokens    title text-fg; description and meta text-muted; builder variant bg-surface border-b border-border
            shadow-bar sticky top-[var(--layout-header)] z-(--z-sticky).
  content   Titles are nouns: "Leads", "Broadcasts", "Lead fields". Counts: "Leads" with "12,480" in text-muted.
            Descriptions: "Fields you can add to every lead, with their type and rules." "Rules that decide when a
            lead can move between stages."
            Meta row (S08): "Lead #10482", "Created 03 Oct 2026", "Owner Priya Nair".
            Builder state: "Saved", "Saving…", "Unsaved changes".
            More actions name: "More actions".
  keyboard  Normal Tab order: breadcrumbs, then the actions in visual order. The h1 receives focus after a client
            route change (tabindex="-1").
  a11y      Exactly one h1 per page, matching the document title's first part. The record name has dir="auto" and
            wraps (no truncation on the h1).
            Status after the title is text, inside the h1's container but not inside the h1.
            Pairs: text on bg, surface; text-muted on bg, surface; warning on bg, surface; focus-ring on bg,
            surface.
  base      native <h1>, <p>; Breadcrumbs; Button, IconButton (group 1); DropdownMenu; StatusPill; Tabs.
  used on   S04-S41 (S03 has its own header); detail variant S08, S16 (report), S18, S27; settings variant
            S28-S38, S41; builder variant S16 (new), S18, S22.
```

#### Breadcrumbs

```text
Breadcrumbs
  purpose   Shows where a detail or settings page sits and gives a one-step way back up.
  anatomy   <nav aria-label="Breadcrumb"> > <ol> > items. Each item: link (ancestors) or plain text (current page,
            last). ChevronRight separators (16 px) between items, aria-hidden.
            When there are more than 4 items, the middle ones collapse into an IconButton (Ellipsis) that opens a
            DropdownMenu of the hidden levels.
  variants  full (md and up); back link (below md: only the parent, as "ChevronLeft Leads").
  sizes     text-sm; items min-h-hit (24 px); gap-1; separators size-icon-sm. Long labels (lead names) truncate at
            max-w-48 (192 px) with the full name in a Tooltip.
  states    default; hover (link underlines); focus-visible; collapsed middle; current page.
  tokens    links text-muted hover:text-fg hover:underline underline-offset-2; current text-fg font-medium;
            separators text-muted.
  content   "Leads > Ananya Rao"; "Settings > Channels > WhatsApp"; "Automations > New enquiry welcome";
            "Opportunities > MBA 2027 intake > Ananya Rao". Collapse button name: "Show 2 more levels".
            Back link: "Leads" with sr-only "Back to ".
  keyboard  Tab moves through the links; the current page is not focusable. The collapse button opens its menu
            with Enter, Space or Down.
  a11y      nav landmark named "Breadcrumb"; ordered list; aria-current="page" on the last item. Labels with
            user-entered names have dir="auto".
            Pairs: text-muted on bg, surface; text on bg, surface; focus-ring on bg, surface.
  base      native <nav>, <ol>, Next <Link>; Radix DropdownMenu for the collapsed levels; Radix Tooltip.
  used on   S08, S14, S16 (detail), S18, S22, S27, S28-S38, S41.
```

#### Tabs

```text
Tabs
  purpose   Switch between panels of one record or one page (Details, Timeline, Notes...), with overflow handling
            for long, team-configured tab sets. Group 1's ChannelTabs is this component with channel labels.
  anatomy   Tabs root > tablist row: tablist (only the tabs that fit) + "More" DropdownMenu trigger outside the
            tablist (only when some tabs do not fit) > tabpanels.
            Tab: label > optional count Badge > optional state icon (TriangleAlert when the panel needs attention).
            Panels mount lazily; a panel that fetches shows its Skeleton inside.
  variants  - page tabs: under a detail PageHeader, full width, md size (S08, S27).
            - panel tabs: inside a card, drawer or dialog, sm size.
            - URL-synced: the active tab is kept in ?tab=, written with router.replace, so a tab can be linked and
              reloading keeps it, without adding history entries for each switch.
            - activation: manual for panels that fetch data (S08, S27: the panel loads on Enter or Space or click,
              not while arrowing past); automatic for panels already in memory.
            - configurable: the tab set and order come from the team's profile settings; a tab hidden for the team
              is not rendered at all.
            S08 tab set: Details, Timeline, Follow-ups, Notes, Messages, Calls, Documents, Tickets, Opportunities,
            Payments. S27: Details, Timeline, Linked opportunities, then custom tabs.
  sizes     md: tab h-control-md (40 px), px-3, gap-2, text-sm font-medium. sm: h-control-sm (32 px), px-2.
            Active indicator: a 2 px bar (h-0.5) under the tab's bottom edge, over the tablist's border-b
            border-border, so it sits outside the inset focus ring.
            Count Badge h-5 min-w-5 px-1.5 (the shared count size). Each tab at least 48 px wide.
            Overflow: a ResizeObserver measures the row; tabs that do not fit move, in order, into "More". If the
            active tab would be hidden, it swaps into the last visible slot.
  states    inactive; hover; active; focus-visible; with count; empty (count 0 is not shown; the panel shows its
            EmptyState); needs attention (icon plus sr text); disabled (avoid: hide instead; if a tab must show but
            cannot open, aria-disabled with a Tooltip reason); loading panel (Skeleton); panel error (EmptyState
            error inside the panel, the tabs stay usable).
            Weight does not change between states, so tabs never shift sideways.
  tokens    tab        relative text-muted hover:text-fg hover:bg-surface-hover rounded-t-md transition-colors
                       duration-fast; focus with focus-inset
            active     data-[state=active]:text-fg plus after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5
                       after:bg-accent (the bar sits over the tablist border, outside the inset focus ring)
            count      Badge neutral bg-surface-sunken text-fg; on the active tab bg-accent-subtle text-fg
            attention  TriangleAlert text-warning
            More       Button ghost sm with ChevronDown; the menu lists hidden tabs as radio items
  content   Labels are one or two words, sentence case: "Details", "Timeline", "Follow-ups", "Notes", "Messages",
            "Calls", "Documents", "Tickets", "Opportunities", "Payments".
            More trigger: "More" with name "More tabs, 3 hidden".
            Accessible names with counts: "Notes, 3"; "Payments, needs attention".
  keyboard  Tab enters the tablist on the active tab. Left and Right move between visible tabs (wrapping); Home and
            End jump. Manual activation: Enter or Space opens the focused tab. Automatic: moving opens it.
            The next Tab goes to the More trigger (if shown), then into the panel. Choosing a tab from More
            activates it and moves focus to that tab.
  a11y      Radix Tabs: tablist, tab, tabpanel, aria-selected, aria-controls, aria-labelledby. The tablist has an
            aria-label ("Lead sections"). The More trigger sits outside the tablist so the tablist holds only tabs.
            A panel with no focusable content gets tabindex="0" so it is reachable.
            Active state shown by the bar and text colour together; the selected state is in aria-selected.
            Targets: 40 px (md), 32 px (sm).
            Pairs: text-muted on surface, bg, surface-raised; text on surface, bg, surface-hover, surface-sunken,
            accent-subtle; accent on surface, bg, surface-raised; warning on surface, bg, surface-hover (the
            attention icon on a hovered tab); focus-ring on surface, bg, surface-hover.
  base      Radix Tabs (activationMode manual or automatic); Radix DropdownMenu for More; Badge.
  used on   S08, S27 (page tabs); S10, S16, S19 (ChannelTabs, group 1); S15 (conversation status), S31 (embed:
            script or iframe), S35 (channel types), S37 (API keys, Webhooks, Lead ads) as panel tabs.
```

#### Pagination

```text
Pagination
  purpose   Moves through long lists page by page with 10 to 100 rows per page, on the cursor-based list APIs. It is
            the only pager in the app: group 3's DataTable puts it in its footer slot.
  anatomy   <nav aria-label="Pagination for {list}"> holding: "Rows per page" label and Select > range text >
            buttons "First page", "Previous page", "Next page".
            Load-more variant: one Button under a feed and an sr-only status line.
            There is no numbered page list: the APIs use cursors (GET /leads with cursor and page size 10-100), so
            jumping to page 7 is not possible. The cursor lives in the URL (?after=…), so Back and reload return to
            the same page; the client keeps the cursors it has seen for "Previous page".
  variants  - pager: tables (S05 and every other list), alone in the table footer.
            - combined (S05, S26): the right part of the footer bar, with BulkActionBar (group 3) on the left.
            - compact (narrow containers): range text plus "Previous page" and "Next page".
            - load-more: feeds and timelines (S08 tabs, S15 thread history, S24, S27).
  sizes     Alone: footer h-table-footer (48 px), px-4, gap-4. Combined: inside the footer bar h-pagebar (56 px);
            below lg it wraps to a second line under BulkActionBar.
            Buttons secondary sm (32 px) with text and chevrons at md and up; IconButtons sm (32 px) with the same
            names below md and in the compact variant. Select h-control-sm, w-20.
            Rows-per-page options: 10, 25, 50, 100. Default 25 (saved per person and per list in member prefs).
  states    first page (First page and Previous page aria-disabled); middle; last page (Next page aria-disabled);
            loading next page (the pressed button shows its loading state; rows stay until the new page arrives;
            a 2 px ProgressBar runs along the table top); count unknown (range without a total until the count
            returns); count capped ("of 10,000+"); single page (footer still shows the range and the select,
            buttons aria-disabled); page size changed (back to the first page); empty (footer hidden; the table
            shows its EmptyState); error loading a page (the old rows stay; an Alert above the table says so and
            offers "Try again").
            Load-more: idle; loading ("Loading…"); all loaded (button replaced by text "That's everything"); error.
  tokens    footer bg-surface-subtle border-t border-border; range text text-sm text-muted tabular-nums, numbers
            text-fg; buttons as group 1 Button secondary; aria-disabled buttons take Button's disabled look
            (bg-surface-sunken text-muted border-transparent) and no hover fill.
  content   Range: "1–25 of 12,480"; "26–50 of 12,480"; "1–25 of 10,000+"; "1–25" (count still loading).
            Select label: "Rows per page". Buttons: "First page", "Previous page", "Next page".
            Status after a page change (sr-only, polite): "Showing leads 26 to 50 of 12,480." On the first or last
            page it adds "First page." or "Last page."
            Load more: "Show older activity", "Show 20 more", "That's everything".
  keyboard  Tab: select > First page > Previous page > Next page. Changing the select keeps focus on it, resets to
            the first page and announces "Showing 50 rows per page".
            After Next page or Previous page, focus stays on the pressed button, even when it has just become
            aria-disabled, and the table scrolls to its top.
            Load more: after loading, focus moves to the first newly loaded item (it has tabindex="-1"), so
            keyboard and screen-reader users continue from there.
  a11y      <nav> named after the list ("Pagination for leads"). Buttons at the ends use aria-disabled="true", not
            disabled, so focus stays on the pressed button instead of dropping to <body> (2.4.3); pressing them
            does nothing. The range text is not a live region; the separate status line announces changes.
            The total is counted up to 10,001 rows only (a capped count keeps it fast under RLS).
            Targets 32 px.
            Pairs: text on surface-subtle, surface-hover, surface-sunken; text-muted on surface-subtle,
            surface-sunken, surface-hover; border-input on surface-subtle; focus-ring on surface-subtle, surface.
  base      native <nav>; Button, IconButton, Select (group 1); ProgressBar.
  used on   S05, S16 (recipients), S17, S19, S22, S23, S25, S26, S32, S38, S40, S41 (pager; combined on S05 and
            S26); S08, S15, S24, S27 (load-more).
```

### Overlays

Which overlay to use:

- **Tooltip**: a short, non-interactive hint for something already labelled (icon names, absolute times, exact
  amounts). Never the only place for information a task needs.
- **Popover**: small interactive content tied to a trigger that does not block the page (notification feed, column
  chooser, quick-filter edit, the full owner list).
- **DropdownMenu**: a list of actions or choices. No forms inside.
- **Dialog**: a focused task with a form or a decision (S09, S10, S11, S13, S14). Blocks the page.
- **ConfirmDialog**: a yes-or-no before something destructive or hard to undo.
- **Drawer**: a side panel for secondary detail or filters that benefits from height (S06, S34, audit entries).

#### Dialog

```text
Dialog
  purpose   A focused task over the current page (change a stage, compose a message, schedule a follow-up, reassign
            or merge leads), with a form, a clear way out, and safe handling of errors and unsaved input.
  anatomy   Portal > overlay (scrim) > content panel (flex column):
            header: Dialog.Title (h2) > optional Dialog.Description > close IconButton (X) at the top right;
            body: scrolls on its own; form fields, Alerts, previews;
            footer: optional left action (mr-auto: a tertiary or destructive action, or a step indicator) > secondary
            Button(s) > primary Button (rightmost, last in tab order).
            The form element wraps body and footer so Enter in a single-line field submits.
  variants  - form dialog (S09, S11, S28 create field, S32 invite).
            - wizard dialog: steps inside one dialog, never a dialog over a dialog (S14 merge: "Which record
              stays?", "Choose values", "Check and merge"). Footer left shows the compact Stepper
              "Step 2 of 3 · Choose values". S14 is a dialog when opened from a duplicate warning, and a page
              when opened from S08. S07 import is a page (ImportWizard, group 3), not a dialog.
            - result dialog: after a long action starts, the body becomes JobProgress and the footer shows "Close"
              only (S13).
            - read-only dialog: details with only "Close".
            - full-screen sheet: every dialog except sm becomes full screen below sm (640 px).
  sizes     sm max-w-dialog-sm (400 px): short forms and confirmations.
            md max-w-dialog-md (560 px): S09, S11, S28, S32.
            lg max-w-dialog-lg (800 px): S10, S13, S14.
            Width w-[calc(100vw-2rem)] up to the max; height max-h-[calc(100dvh-4rem)], centred.
            Below sm (md and lg): inset-0, h-dvh, rounded-none; the footer adds pb-[env(safe-area-inset-bottom)].
            Header px-5 pt-5 pb-3; body px-5 py-4; footer px-5 py-4 gap-2 border-t. Title text-md (18/28,
            semibold); description text-sm. Close button IconButton sm (32 px).
  states    closed; opening; open; closing; loading content; dirty; submitting; server error; blocked by rule;
            result; read-only.
            - Loading content: the body shows Skeleton fields of the final size; the primary is aria-disabled with
              "Loading…" as its reason; aria-busy="true" on the body.
            - Dirty: closing with Esc, the close button or Cancel opens ConfirmDialog "Discard your changes?". An
              overlay click on a dirty dialog does nothing (accidental clicks don't prompt). A clean dialog closes on
              any of the four.
            - Submitting: the primary shows its loading state; Esc, the overlay and the close button are ignored
              (close is aria-disabled with "Saving…" as the reason); fields stay as typed.
            - Success: the dialog closes, a success Toast confirms, focus returns to the trigger, or to the updated
              row if the trigger is gone.
            - Server error: a danger Alert appears at the top of the body with tabindex="-1" and no live role,
              listing what went wrong. The body scrolls to the top and focus moves to the Alert, so it is read once.
              Field errors appear under their fields (group 1 Field). Nothing typed is lost.
            - Blocked by rule: a warning Alert at the top explains the rule (stage locked, messages off at this
              stage, WhatsApp window closed); the primary is aria-disabled with the same reason.
            - Result: JobProgress in the body; Esc and Close are allowed; the job continues in the background tray.
  tokens    overlay  fixed inset-0 bg-overlay z-(--z-overlay) data-[state=open]:animate-fade-in
                     data-[state=closed]:animate-fade-out
            panel    bg-surface-raised text-fg border border-border rounded-lg shadow-modal z-(--z-modal);
                     data-[state=open]:motion-safe:animate-rise-in data-[state=open]:motion-reduce:animate-fade-in
                     data-[state=closed]:animate-fade-out (rise-in: opacity and an 8 px rise, duration-slow
                     ease-standard; fade-out: duration-base ease-exit)
            header   description text-muted
            footer   border-t border-border (same fill as the panel)
            close    IconButton ghost: text-muted hover:text-fg hover:bg-surface-hover
  content   Titles say the task, with the object: "Change stage for Ananya Rao", "Message 24 leads", "Add follow-up",
            "Reassign 240 leads", "Merge duplicate leads", "Import leads".
            Primary labels match the title's verb: "Save stage", "Send", "Add follow-up", "Reassign 240 leads",
            "Merge leads", "Start import". Secondary: "Cancel". Close button name: "Close".
            Server error Alert: title "Couldn't save the stage", body "The lead was changed by Vikram Shah a moment
            ago. Reload it to see the latest, then try again." Generic: "Something went wrong on our side. Your
            changes are still here. Try again in a moment. Ref: 7F3K-21".
            Discard prompt: see ConfirmDialog.
  keyboard  Opening moves focus to the first field (or the first invalid one), never to the close button. Tab and
            Shift+Tab cycle inside the panel. Esc closes (with the dirty check). Enter in a single-line field
            submits. Focus returns to the trigger on close.
  a11y      Radix Dialog: role="dialog", aria-modal="true", aria-labelledby (title), aria-describedby (description;
            pass undefined when there is none). Content outside is hidden from assistive tech and inert while open.
            Body scroll is locked. A dialog never opens another Dialog; only a ConfirmDialog may sit on top.
            Targets: close 32 px; footer buttons 40 px (md) to match form fields.
            Pairs: text on surface-raised, surface-hover; text-muted on surface-raised; on-accent on accent,
            accent-hover; danger on surface-raised, danger-subtle; text on danger-subtle, warning-subtle;
            warning on warning-subtle; focus-ring on surface-raised, surface-hover, danger-subtle, warning-subtle.
  base      Radix Dialog (Root, Portal, Overlay, Content, Title, Description, Close).
  used on   S09, S10, S11, S13, S14, S28, S29 (rule builder), S31 (embed code), S32 (invite), S36 (connect
            gateway), S37 (new key, with SecretReveal), S41; ConfirmDialog everywhere.
```

#### ConfirmDialog

```text
ConfirmDialog
  purpose   Asks for a clear yes or no before an action that deletes, stops, overwrites or is hard to undo.
  anatomy   Overlay > panel (sm): title (a question) > description (what will happen and what will not) > optional
            typed confirmation field > footer: Cancel (secondary) and the confirm Button (danger, or primary for
            non-destructive confirmations).
  variants  - destructive: danger confirm (delete leads, revoke an API key, deactivate a member, cancel a
              broadcast, stop an import).
            - non-destructive: primary confirm (send a broadcast now, publish an automation, switch a gateway to
              live mode).
            - discard changes: from a dirty Dialog or page ("Keep editing" / "Discard").
            - typed: for bulk deletes over 100 leads and for erasure requests, the confirm stays aria-disabled
              until the exact number of leads (or the lead number) is typed. BulkActionBar's delete (group 3) opens
              this dialog: typed above 100 leads, plain below.
  sizes     max-w-dialog-sm (400 px); stays a centred card below sm (never full screen). Footer buttons md (40 px).
  states    open; confirming (confirm Button loading; Cancel and Esc ignored until it finishes); error (danger
            Alert inside the panel; the panel stays open); typed-not-matching (confirm aria-disabled with the reason
            "Type 312 to confirm").
  tokens    As Dialog (sm). Confirm uses Button danger (bg-danger text-on-danger) or primary.
  content   Questions name the object and the count: "Delete 312 leads?" Description: "They'll be hidden from every
            list and report. Their payments and consent records are kept. You can't undo this." This is the one
            copy for deleting leads, single or bulk.
            "Revoke this API key?" / "Any system using it will stop sending leads at once."
            "Cancel this broadcast?" / "Messages already sent stay sent. The rest won't go out."
            "Send this broadcast now?" / "1,240 leads will get the 'Open day invite' template on WhatsApp."
            "Discard your changes?" / "You'll lose what you've typed." Buttons "Keep editing" and "Discard". This
            is the one discard prompt for forms, dialogs and drawers (group 1 FormLayout uses the same words).
            Typed field label: "Type 312 to confirm".
            Confirm labels repeat the verb and object: "Delete 312 leads", "Revoke key", "Cancel broadcast",
            "Send now". Never "OK" or "Yes".
  keyboard  Focus starts on Cancel (Radix AlertDialog default), so Enter alone never destroys. Tab moves to the
            confirm button. Esc cancels. The overlay does not close it.
  a11y      Radix AlertDialog: role="alertdialog", aria-labelledby, aria-describedby. The description states the
            consequence in words; the danger colour is never the only warning.
            Pairs: text on surface-raised; text-muted on surface-raised; on-danger on danger; on-accent on accent;
            danger on surface-raised, danger-subtle; border-input on surface-raised; focus-ring on surface-raised.
  base      Radix AlertDialog (Cancel, Action). Typed variant uses TextInput (group 1).
  used on   S05 (bulk delete), S07 (stop import), S08 (merge, erase), S13, S14, S16 (send now, cancel), S17 and S18
            (publish, pause), S19 (delete template), S25 (approve offline payment, refund), S29, S32 (deactivate),
            S35 (disconnect channel), S36 (go live), S37 (revoke key), S41; every dirty Dialog and Drawer.
```

#### Drawer

```text
Drawer
  purpose   A side panel over the page for filters, secondary detail or a tree, where height matters more than width
            and the page behind stays in context.
  anatomy   Portal > overlay > panel anchored to the right (or the left for navigation), full height, flex column:
            header (title h2, optional description, close IconButton) > body (scrolls) > optional footer (actions;
            filters: "Clear all" at the left, "Apply" at the right).
  variants  - right (default): S06 advanced filters, S12 event detail, S34 team detail, S38 audit entry (before and
              after values), S15 lead panel below xl.
            - left: the navigation drawer (Sidebar drawer form).
            - with pending changes: filter drawers show "3 changes not applied" in the footer until Apply.
            All drawers are modal. Below sm every drawer is full width.
  sizes     sm w-drawer-sm (400 px), md w-drawer-md (560 px), lg w-drawer-lg (720 px), each
            max-w-[calc(100vw-3rem)] so a strip of the page shows; full width below sm. Navigation drawer
            w-sidebar (240 px).
            Header min-h-control-lg (48 px) px-5 py-3 border-b; body px-5 py-4; footer px-5 py-4 border-t.
  states    closed; opening; open; closing; loading (Skeleton in the body); dirty (as Dialog: the discard prompt on
            Esc or close; the overlay does nothing); pending changes (filters); applying (Apply loading); error
            (Alert at the top of the body); empty (EmptyState compact in the body).
  tokens    overlay   as Dialog: fixed inset-0 bg-overlay z-(--z-overlay) data-[state=open]:animate-fade-in
                      data-[state=closed]:animate-fade-out
            panel     fixed inset-y-0 right-0 (left-0 for navigation) bg-surface-raised border-l border-border
                      (border-r for left) shadow-modal z-(--z-modal) rounded-none;
                      data-[state=open]:motion-safe:animate-slide-in-right
                      data-[state=closed]:motion-safe:animate-slide-out-right (left drawer: animate-slide-in-left
                      and animate-slide-out-left); data-[state=open]:motion-reduce:animate-fade-in
                      data-[state=closed]:motion-reduce:animate-fade-out
            footer    pending-changes note text-xs text-muted
  content   Titles: "Filters", "Follow-up with Ananya Rao", "Admissions team", "Change to Ananya Rao's stage".
            Footer: "Clear all", "Apply", "3 changes not applied". Close name: "Close".
  keyboard  Opens with focus on the first control (filters) or the title container (detail). Tab is trapped.
            Esc closes (dirty check). Focus returns to the trigger.
  a11y      Radix Dialog (modal): role="dialog", aria-modal, aria-labelledby. Outside content inert.
            Pairs: text on surface-raised, surface-hover; text-muted on surface-raised; accent on surface-raised;
            on-accent on accent; border-input on surface-raised; focus-ring on surface-raised.
  base      Radix Dialog with side-anchored content classes.
  used on   S05, S16, S26 (S06 filter drawer); S12; S15; S34; S38; navigation drawer on all staff screens below lg.
```

#### Popover

```text
Popover
  purpose   Small interactive content anchored to a trigger, without blocking the page: lists, a few fields, a
            short explanation with a link.
  anatomy   Trigger > Portal > content panel: optional heading (h2 or h3) > body > optional footer actions.
            No arrow.
  variants  - list (notification feed, owner list from AvatarGroup, column chooser with checkboxes and Move up and
              Move down buttons, decisions.md section 1).
            - mini form (quick-filter edit on S05 and S26: one condition and Apply).
            - explainer ("Why can't I send this?" next to a disabled action: text and a link).
            - picker host (group 1 DatePicker and Combobox use the same panel styles).
            - link list (the "Settings section" list below lg): links in a <ul>, the current one with
              aria-current="page" and the Sidebar active-item look.
            Below sm a Popover longer than half the screen opens as a full-width Drawer instead.
  sizes     sm w-64 (256 px), md w-80 (320 px), lg w-[min(var(--layout-dialog-sm),calc(100vw-2rem))] (400 px).
            max-h-[min(480px,var(--radix-popover-content-available-height))] with overflow-y-auto. Padding p-3 (lists
            use p-1 with full-width rows). sideOffset 4 px, collisionPadding 8 px.
  states    closed; open; loading (Skeleton rows); empty (one line of text-muted); error (one line and "Try again");
            applying (footer primary loading).
  tokens    bg-surface-raised text-fg border border-border rounded-lg shadow-pop z-(--z-popover);
            data-[state=open]:motion-safe:animate-pop-in data-[state=open]:motion-reduce:animate-fade-in
            data-[state=closed]:animate-fade-out (pop-in: opacity and a 4 px rise, duration-base).
            Heading text-sm font-semibold; helper text text-muted.
  content   Column chooser heading "Columns", buttons "Move up", "Move down", "Reset to default".
            Quick filter: "Stage is", "Apply", "Clear".
            Explainer: "WhatsApp can't be used here. Ravi hasn't written in the last 24 hours, so only approved
            templates can be sent." Link "Choose a template".
  keyboard  Enter or Space on the trigger opens it and moves focus to the first control inside (or the heading
            container when there is none). Tab and Shift+Tab cycle inside the popover. Esc, a click outside, or its
            Close or Apply button closes it and returns focus to the trigger.
  a11y      Radix Popover with modal set: focus is trapped and loops while open, and content outside is hidden from
            assistive tech, so a portalled popover never loses keyboard users at the end of the page. Trigger:
            aria-haspopup="dialog", aria-expanded, aria-controls. Content role="dialog", named by its heading
            (aria-labelledby) or aria-label. Content that fits a Tooltip should be a Tooltip; content with a
            decision belongs in a Dialog.
            Pairs: text on surface-raised, surface-hover; text-muted on surface-raised; accent on surface-raised;
            border-input on surface-raised; focus-ring on surface-raised, surface-hover.
  base      Radix Popover (Root with modal, Trigger, Anchor, Portal, Content, Close).
  used on   Header bell (all staff screens), S05 and S26 (column chooser, quick filters), S10 and S15 (why-blocked
            explainers), S12 (event preview), S13 and S05 (AvatarGroup owner lists), S20 (metric definitions);
            S28-S38, S41 below lg (settings section list).
```

#### DropdownMenu

```text
DropdownMenu
  purpose   A short list of actions or choices opened from a button: row actions, page "More actions", the account
            and institution menus, bulk actions.
  anatomy   Trigger (Button with ChevronDown, or IconButton with Ellipsis) > Portal > content panel (p-1) > items.
            Item: optional icon (16 px) > label > optional second line > optional shortcut hint or ChevronRight
            (submenu). Also: group label, separator, checkbox item, radio group, submenu.
  variants  action menu; row menu ("More actions for Ananya Rao", align end); selection menu (radio items: sort
            order, theme); toggles (checkbox items: column visibility in small sets); with submenus (one level
            only); the More menu inside BulkActionBar (group 3).
            Destructive items sit last, after a separator, and always open a ConfirmDialog; they never act directly.
            More than 12 options, or options that need search, use a Combobox (group 1) instead.
  sizes     Content min-w-48 (192 px), max-w-80 (320 px), p-1, sideOffset 4. Items h-menu-item (32 px), px-2, gap-2,
            rounded-sm, text-sm; two-line items min-h-menu-item py-1.5. Icons size-icon-sm. Group label text-xs
            font-medium px-2 py-1.5. Separator h-px my-1 -mx-1.
  states    item: default; highlighted (hover or keyboard: the same look); focus-visible (outline with
            focus-inset); unavailable (reason as the second line; see a11y); checked (Check indicator); destructive
            (text-danger); submenu open.
            menu: open; closed. A menu never shows a loading state: actions that run show their progress in the
            trigger, a Dialog or a Toast.
  tokens    panel        bg-surface-raised border border-border rounded-lg shadow-pop z-(--z-popover);
                         data-[state=open]:motion-safe:animate-pop-in data-[state=open]:motion-reduce:animate-fade-in
                         data-[state=closed]:animate-fade-out
            item         text-fg; icon text-muted; data-[highlighted]:bg-surface-hover data-[highlighted]:text-fg
                         focus-inset. No outline utilities: the global :focus-visible rule draws the 2 px
                         focus-ring outline, inset. (outline-none here would cancel it in Tailwind v4, leaving only
                         the hover fill, which is not a focus indicator.)
            unavailable  aria-disabled:text-muted aria-disabled:cursor-not-allowed (the highlight still shows, so
                         keyboard users see where they are)
            destructive  text-danger; icon text-danger; data-[highlighted]:bg-danger-subtle
            indicator    Check in text-accent
            label        text-muted; separator bg-border; shortcut text-xs text-muted ml-auto
  content   Row menu (S05, the DataTable row menu): "Open", "Open in new tab", "Change stage", "Add follow-up",
            "Send message", "Reassign", "Copy lead link", separator, "Delete lead".
            More menu in BulkActionBar (S05): "Update a field", "Unassign", "Send to a webhook", separator,
            "Delete". The other bulk actions are toolbar buttons (group 3).
            Trigger names: "More actions"; row menus "More actions for {name}" ("More actions for Ananya Rao");
            "More actions for selected leads".
  keyboard  Enter, Space or Down opens on the first item; Up opens on the last. Up and Down move (wrapping), Home and
            End jump, typing jumps by label. Enter or Space activates. Right opens a submenu, Left closes it. Space
            toggles a checkbox item without closing. Esc closes and returns focus to the trigger. Tab closes the
            menu and moves on.
  a11y      Radix DropdownMenu: role="menu", menuitem, menuitemcheckbox, menuitemradio, aria-checked, aria-haspopup
            and aria-expanded on the trigger.
            Unavailable items do not use Radix's disabled prop, which removes them from arrow-key focus. They set
            aria-disabled="true" themselves and call event.preventDefault() in onSelect, so keyboard and
            screen-reader users still reach them and hear the reason in the second line.
            Targets 32 px.
            Pairs: text on surface-raised, surface-hover; text-muted on surface-raised, surface-hover; accent on
            surface-raised, surface-hover; danger on surface-raised, danger-subtle; focus-ring on surface-hover,
            danger-subtle.
  base      Radix DropdownMenu (Content, Item, CheckboxItem, RadioGroup, RadioItem, ItemIndicator, Label, Separator,
            Sub, SubTrigger, SubContent).
  used on   S05, S08, S16, S17, S19, S21 (widget menu with move and size items), S22 (export), S25, S26, S29 (row
            menu with "Move to position…"), S32, S34, S35, S37, S40, S41; AppHeader (OrgSwitcher, UserMenu).
```

#### Tooltip

```text
Tooltip
  purpose   A short text hint on hover and keyboard focus: names of icon-only controls, collapsed nav labels, the
            absolute time behind a relative one, the exact amount behind a compact one, full text of a truncated
            label.
  anatomy   Trigger (any focusable element) > Portal > content: plain text, one or two lines. No links, buttons or
            other controls inside, and no arrow.
  variants  label (repeats an icon button's accessible name, optionally with a shortcut: "Search (/)"); detail
            ("06 Oct 2026, 2:30 pm IST"; "₹12,34,567.89"); truncation (the full lead name).
  sizes     text-xs, px-2 py-1, max-w-64 (256 px), rounded-sm, sideOffset 6. Appears after 400 ms on hover, at once
            on keyboard focus; once one is open, neighbours open at once for 300 ms (skipDelayDuration).
  states    closed; open (hover or focus); dismissed with Esc (stays closed until the pointer leaves or focus moves);
            touch: not shown, except RelativeTime, which toggles it on tap.
  tokens    bg-inverse text-on-inverse shadow-pop z-(--z-tooltip); motion: opacity only, duration-fast.
  content   Short and plain, under 80 characters, no full stop for labels: "Notifications", "Collapse menu",
            "Copy lead link". Details state facts: "Checked in since 9:12 am", "Exact amount ₹12,34,567.89".
  keyboard  Opens when its trigger gets keyboard focus; closes on blur. Esc closes it and keeps focus on the trigger.
  a11y      Radix Tooltip: content role="tooltip", linked to the trigger with aria-describedby while open. It stays
            open while the pointer moves onto it (hoverable), until dismissed, and does not disappear on its own
            (1.4.13). Because Radix links it as a description, a label tooltip is read after the name on focus;
            that repeat is accepted.
            Essential information is never only in a tooltip: icon buttons carry aria-label; compact amounts and
            relative times carry their exact value in sr-only text.
            Pairs: on-inverse on inverse.
  base      Radix Tooltip (Provider at the app root: delayDuration 400, skipDelayDuration 300).
  used on   every staff screen (S04-S41): IconButtons, collapsed Sidebar, RelativeTime, Money compact, NumberText
            compact, truncated names, AvatarGroup, disabled-with-reason controls.
```

### Feedback

Which message to use:

- **Toast**: the result of something the person just did, or a background job finishing. Short, temporary, never
  the only record (the bell and the page keep it).
- **Alert**: a message about one part of a page, form, dialog or panel. Stays until its cause goes.
- **Banner**: a condition that affects the whole institution or session (account suspended, WhatsApp disconnected,
  offline). Sits above the page header.
- **EmptyState**: a region has nothing to show, and why.
- Field errors belong to group 1's Field, under the field. They are never toasts.

#### Toast

```text
Toast
  purpose   Confirms the result of an action, or reports a background job, without moving focus or blocking work.
  anatomy   Viewport (region, bottom-right) > stacked toasts. Toast: tone icon (20 px) > title (one line) > optional
            description (up to 2 lines) > optional action Button (link style) > close IconButton (X).
  variants  - success: CircleCheck in text-success. Duration 6 s.
            - error: CircleX in text-danger. Stays until dismissed (an error usually needs reading or a retry).
            - info: Info in text-info. Duration 6 s.
            - with action ("Undo", "View report", "Try again"): never dismisses itself (decisions.md section 8).
            - job: a running job's toast holds a compact JobProgress and stays until the job ends.
            Toasts are not used on public pages (S01, S02), which show inline messages that work without
            JavaScript.
  sizes     Width w-[min(360px,calc(100vw-2rem))]; p-3 gap-3; title text-sm font-semibold; description text-sm.
            Viewport fixed right-4 (right-5 at md) bottom-[calc(var(--bottom-bar,0px)+1rem)], flex column gap-2,
            z-(--z-toast). --bottom-bar holds every sticky bottom bar and the JobTray (AppShell), so toasts always
            sit above them. At most 3 visible; older ones wait in a queue. Below sm: centred, full width minus
            32 px.
  states    entering; shown; paused (pointer over it, focus inside it, or the window not focused: the timer stops);
            leaving (timeout, close, Esc, or a swipe right on touch); replaced (same id: the content updates in
            place, for example a job going from running to done; it is not a second toast); queued; moved (on
            focusin, if the focused element's rect overlaps the viewport, the viewport moves to
            top-[calc(var(--layout-header)+1rem)] right-4 until focus leaves that element).
  tokens    toast    bg-surface-raised text-fg border border-border rounded-lg shadow-pop;
                     data-[state=open]:motion-safe:animate-slide-in-right
                     data-[state=open]:motion-reduce:animate-fade-in data-[state=closed]:animate-fade-out
                     data-[swipe=end]:animate-slide-out-right
            title    text-fg; description text-muted
            icon     text-success / text-danger / text-info
            action   Button link: text-accent underline
            close    IconButton xs ghost: text-muted hover:text-fg hover:bg-surface-hover
  content   Success: "Stage changed to Counselling done", "Follow-up added for 07 Oct, 10:00 am IST", "Message sent to
            Ananya Rao", "240 leads reassigned".
            Error: "Couldn't send the message" with description "The WhatsApp number isn't connected. An admin can
            reconnect it in Settings > Channels." Action "Try again" where a retry can work.
            Info: "Export is being prepared. We'll tell you when it's ready."
            With undo: "Lead moved to Not interested" + "Undo" (altText "Change the stage back from the lead
            profile").
            Job done: "Import finished: 1,180 created, 20 failed" + "View report".
            Close name: "Dismiss". Viewport name: "Updates (F8)". Provider label: "Update".
  keyboard  Toasts never take focus. F8 moves focus to the viewport; Tab moves through actions and close buttons;
            Esc dismisses the focused toast; Shift+Tab or F8 again returns. Swipe right dismisses on touch.
  a11y      Radix Toast. Each toast is announced through its own live region: success and info use
            type="background" (polite); an error caused by the person's own action uses type="foreground"
            (assertive); errors from background jobs use "background".
            The provider label is "Update" and the viewport "Updates (F8)", so screen readers don't confuse toasts
            with the bell's "Notifications".
            Every action has an altText naming another way to do it (Radix requires it), and the outcome is also
            visible on the page or in the bell, so nothing depends on catching a toast in time (2.2.1).
            A toast never covers the focused element or a sticky bottom bar (2.4.11): the viewport sits above
            --bottom-bar, and moves to the top while it would cover the focused element.
            Targets: close 24 px; actions at least 24 px tall.
            Pairs: text on surface-raised, surface-hover; text-muted on surface-raised; success on surface-raised;
            danger on surface-raised; info on surface-raised; accent on surface-raised; focus-ring on
            surface-raised, surface-hover.
  base      Radix Toast (Provider: duration 6000, label "Update", swipeDirection "right"; Viewport: hotkey F8,
            label "Updates ({hotkey})"; Root type and duration per variant; Title; Description; Action; Close).
  used on   S04-S38, S40, S41.
```

#### Alert

```text
Alert
  purpose   A message about one region (a form, dialog, panel or table) that stays visible until its cause is gone:
            errors after submit, rules that block an action, compliance limits, facts the person must know before
            acting.
  anatomy   Container > tone icon (20 px) > content: title (optional, one line) > body (one to three sentences) >
            optional actions (Buttons sm or links) > optional dismiss IconButton (only for advice that may be
            ignored).
            Error summary: specified once, in group 1 FormLayout ("2 fields need changes", bg-danger-subtle border
            border-danger, focused when it appears, no live role). Alert does not restyle it.
  variants  tones: info (Info), success (CircleCheck), warning (TriangleAlert), danger (CircleAlert), neutral (the
            icon of the topic, on bg-surface-subtle).
            Per-message icons from the compliance catalogue below replace the default icon where given.
            Layouts: standard (icon, title, body, actions below); compact (one line, no title: in table toolbars and
            narrow panels); error summary (FormLayout's, see anatomy).
            Live behaviour: off (present when the page renders; most alerts); polite (appears after a change the
            person made, such as picking a template: role="status"); assertive (submit errors: role="alert");
            focused (a Dialog's server error: tabindex="-1", focus moves to it, no live role, so it is read once).
  sizes     p-3 (compact py-2 px-3), gap-3, rounded-md, border. Title text-sm font-semibold; body text-sm.
            Actions h-control-sm (32 px), gap-2, mt-2. Full width of its container; max-w-form inside forms.
  states    shown; updated (the text changes when its cause changes, for example the window countdown); resolved
            (removed when its cause goes); dismissed (only dismissible advice; remembered per person and alert key
            in member prefs); action running (its Button loading).
            - Countdown: when only a countdown inside the text changes ("closes in 40 min"), the region drops its
              live role after the first announcement (aria-live="off"), so it is not re-read every minute. A change
              of state (closing to closed) is announced by the owning component's status region.
  tokens    info     bg-info-subtle border-info-subtle text-fg; icon text-info
            success  bg-success-subtle border-success-subtle text-fg; icon text-success
            warning  bg-warning-subtle border-warning-subtle text-fg; icon text-warning
            danger   bg-danger-subtle border-danger-subtle text-fg; icon text-danger
            neutral  bg-surface-subtle border-border text-fg; icon text-muted
            body     text-fg; secondary sentences text-muted
            actions  Button secondary (text-fg, border-strong, hover:bg-surface-hover) or Button link
                     (text-accent)
            The border repeats the fill so the box keeps its edge in forced-colours mode.
  content   Body text says what happened, why, and what to do, in that order, with dates in IST. The compliance
            catalogue below gives the standard messages.
            Error summary: see group 1 FormLayout ("2 fields need changes"; each link repeats its field's error,
            such as "Remark is needed for this stage").
            Dismiss button name: "Dismiss this tip".
  keyboard  Actions and links are in the normal Tab order. An error summary receives focus when it appears
            (tabindex="-1"); each link moves focus to its field.
  a11y      Tone is in the icon and the words, never colour alone; the icon is aria-hidden and a tone word starts the
            sr text only when the title doesn't already say it ("Warning: ").
            role="alert" only for errors that appear after submit; role="status" for alerts that appear after a
            change; none for alerts present on load (a live role on load is noise). An alert that receives focus
            when it appears (a Dialog's server error, the error summary) has no live role either: the focus move
            reads it once, and a role would read it twice.
            Pairs: text on info-subtle, success-subtle, warning-subtle, danger-subtle, surface-subtle, surface-hover;
            text-muted on info-subtle, success-subtle, warning-subtle, danger-subtle, surface-subtle; info on
            info-subtle; success on success-subtle; warning on warning-subtle; danger on danger-subtle; accent on
            info-subtle, success-subtle, warning-subtle, danger-subtle, surface-subtle; focus-ring on info-subtle,
            success-subtle, warning-subtle, danger-subtle, surface-subtle, surface-hover.
  base      native <div> with the role rules above; Button, IconButton (group 1).
  used on   S01, S02 (public: inline only, no JavaScript needed), S03, S07, S08, S09, S10, S11, S13, S14, S15, S16,
            S18, S19, S25, S28, S29, S30, S35, S36, S37.
```

#### Banner

```text
Banner
  purpose   A message about a condition that affects the whole institution or session, shown at the top of every
            page until it is fixed: a disconnected channel, a suspended account, test-mode payments, offline.
  anatomy   BannerStack (in the content column, above the PageHeader) > banners. Banner: tone icon > text (title and
            one sentence on one line where it fits) > one action (Button sm or link) > dismiss IconButton (only for
            dismissible kinds).
            More than 2 banners: the first 2 show, then a link "2 more notices" that expands the stack.
  variants  tones as Alert (info, success, warning, danger). Kinds:
            - blocking (danger, not dismissible): something cannot be done at all until an admin acts.
            - attention (warning, dismissible for 24 hours, then it returns while the cause remains).
            - info (dismissible until the cause changes).
            - session (offline, other-tab switch, new version available): not dismissible, goes when resolved.
            Audience: each kind names who sees it (admins only, everyone who sends on that channel, everyone).
  sizes     Full width of the content column, px-gutter py-2, gap-3, border-b. Text text-sm. Action h-control-sm.
            Not sticky: it scrolls away with the page.
  states    shown; dismissed (stored per member and banner key, with an expiry); expanded stack; resolved (gone on
            the next server render or Realtime update); action running.
  tokens    As Alert per tone, with rounded-none and border-b instead of a full border.
  content   See the compliance catalogue below (rows marked Banner). Dismiss name: "Hide this notice for today".
  keyboard  Banners come after the header and sidebar and before main in the Tab order; the SkipLink goes past them
            to main.
  a11y      A region with aria-label "Notices". Not a live region, except offline and the other-tab switch, which
            announce once (role="status") when they appear during a session.
            Pairs: text on info-subtle, success-subtle, warning-subtle, danger-subtle, surface-hover; text-muted on
            info-subtle, success-subtle, warning-subtle, danger-subtle; info on info-subtle; success on
            success-subtle; warning on warning-subtle; danger on danger-subtle; accent on info-subtle,
            success-subtle, warning-subtle, danger-subtle; focus-ring on info-subtle, success-subtle,
            warning-subtle, danger-subtle, surface-hover.
  base      native <section>; Button, IconButton (group 1).
  used on   AppShell on S04-S38, S40, S41; the content comes from server state (orgs, channel_accounts,
            wa_business_accounts, payment_gateways, data_requests, incidents).
```

##### Compliance and condition messages

Our own words. "Where" names the surface: A = Alert (inline), B = Banner (page-level). `{lead}` is the lead's first
name. Dates and times are in the org's time zone and carry "IST" where it is Asia/Kolkata.

| key | where | tone, icon | title | body | action |
| --- | --- | --- | --- | --- | --- |
| wa_window_closed | A: S15 composer, S10 WhatsApp tab | warning, `TimerOff` | Reply window closed | {lead}'s last message was on 05 Oct, 4:12 pm IST, more than 24 hours ago. WhatsApp only allows approved templates until {lead} writes again. | Choose template |
| wa_window_closing | A: S15 composer | info, `Clock` | Reply window closes in 40 min | After 6:12 pm IST you can only send approved templates. | none |
| wa_not_connected | A: S15, S10, S16; B for admins | warning, `MessageCircle` | WhatsApp isn't connected | Connect a WhatsApp Business number to send and receive WhatsApp messages. Admins can do this in Settings > Channels. | Connect WhatsApp (admins only) |
| wa_reconnect | B: everyone who sends on WhatsApp | danger, `Unplug` | WhatsApp needs reconnecting | WhatsApp messages can't be sent for {Institution} until an admin reconnects the account. | Reconnect (admins) |
| wa_payment_method | B: admins | warning, `CreditCard` | Add a payment method in Meta | WhatsApp won't send messages until your business adds a payment method in Meta's billing settings. | Open Meta Business settings |
| wa_display_name | A: S35 | info, `Hourglass` | Display name in review | Meta is checking the name students will see. Sending starts once it's approved. | none |
| waba_currency | B: admins | warning, `IndianRupee` | Switch WhatsApp billing to INR by 31 Dec 2026 | Meta stops delivering messages from accounts billed in other currencies after that date. | How to switch |
| wa_template_review | A: S10, S16, S19 | warning, `Hourglass` | This template is still in review | You can send it once Meta approves it. | Pick another template |
| wa_template_rejected | A: S19 | danger, `CircleX` | Meta rejected this template | Reason given: {reason}. Edit it and submit again, or appeal. | Edit template |
| wa_template_paused | A: S19, S16 | warning, `CirclePause` | Meta paused this template | It can't be sent until {date}. Broadcasts that use it are on hold. | Pick another template |
| wa_template_low | A: S19, S16 | warning, `SignalLow` | Low quality rating | Students have blocked or reported messages from this template. Meta may pause it. Consider rewording it before the next broadcast. | none |
| sms_promo_no_consent | A: S10 SMS (one lead) | danger, `ShieldX` | Promotional and explicit-consent SMS can't go to {lead} | There's no telco-registered consent, and the enquiry is more than 7 days old. Transactional and implicit-consent service SMS are still allowed. | Use a transactional or implicit-consent template |
| sms_promo_skipped | A: S10 bulk, S16 | warning, `ShieldX` | 38 of 250 leads will be skipped | They have no telco-registered consent for promotional or explicit-consent SMS, and their enquiries are more than 7 days old. | Download the list |
| consent_imported | A: S07 result, S08 consents | info, `ShieldAlert` | Imported consents can't be used for promotional or explicit-consent SMS yet | They must be registered on the telcos' consent platform first. | How registration works |
| opted_out | A: S10, S08 | warning, `BellOff` | {lead} opted out of WhatsApp | {lead} opted out on 02 Oct 2026. Messages on this channel are off for this lead. | none |
| email_suppressed | A: S10, S08 | warning, `MailX` | Email can't reach this address | Emails to an•••@gmail.com bounced on 03 Oct 2026, so we stopped sending to it. | Edit email (if permitted) |
| quiet_hours | A: S10, S16 | info, `Clock` | Promotional messages wait for 9:00 am IST | They're held during quiet hours. Service messages go now. | none |
| minor_pending | A: S08 (top of profile) | warning, `ShieldAlert` | Waiting for guardian consent | {lead} is under 18. Until a parent or guardian agrees, you can't call, message or assign {lead}. | Resend consent request |
| minor_refused | A: S08 | danger, `ShieldX` | Guardian refused consent | We've stopped using {lead}'s details. They're kept only as the law requires. | none |
| minor_limits | A: S08, S10 | info, `ShieldCheck` | Guardian consent given | Promotional messages, scoring and tracking stay off for students under 18. | none |
| stage_no_messages | A: S10 | warning, `Lock` | Messages are off at this stage | A rule for the stage "Not interested" stops messages to these leads. | none |
| stage_locked | A: S09 | warning, `Lock` | This stage is locked | Only Priya Nair and admins can change it. | none |
| stage_no_back | A: S09 | info, `Lock` | Stages only move forward from here | From "Applied" you can pick a later stage only. | none |
| contacts_masked | A: S08, S05 (table toolbar, compact) | info, `EyeOff` | Contact details are hidden for your role | You can still call and message students through the app. | none |
| lead_merged | A: S08 | neutral, `Merge` | This record was merged | It's now part of Ananya Rao (lead #10482) and can't be edited. | Open Ananya Rao |
| lead_restricted | A: S08 | neutral, `Lock` | This lead is on hold | After a request to erase or withdraw, the details are kept only as the law requires and can't be used. | none |
| checked_out | A: S04 | info, `UserRoundX` | You're checked out | New leads go to colleagues who are checked in. | Check in |
| follow_up_clash | A: S11 | warning, `CalendarClock` | Another follow-up at this time | Asha already has a follow-up at 4:30 pm IST on 07 Oct. You can still save. | none |
| field_limit | A: S28 | warning, `OctagonAlert` | Custom field limit reached | You've used all 200 custom fields on your plan. Turn off a field you don't need, or contact us. "Add field" is aria-disabled with the same reason. | none |
| notice_missing | A: S31, privacy notices page | warning, `FileExclamationPoint` | No privacy notice published | Forms can't go live until a privacy notice is published. | Open privacy notices (admins) |
| dlt_chain_broken | B: admins and SMS senders | danger, `Unlink` | SMS may not be delivered | Your SMS provider reports a problem with your DLT registration chain. Messages can fail without an error until it's fixed. | Check SMS settings |
| dlt_templates_lapsing | B: admins | warning, `Clock` | 4 SMS templates lapse soon | Operators deactivate templates unused for 90 days. Use them or register them again. | View templates |
| dlt_self_cert | B: admins | warning, `CalendarClock` | Renew DLT self-certification by 14 Nov 2026 | Headers and templates need it every year. | How to renew |
| email_domain | B: admins; A: S16 email | warning, `MailX` | Bulk email is off | Add the DNS records for admissions.lakeview.edu.in. DMARC is missing. Single emails still send. | View DNS records |
| email_spam_pause | B: admins and broadcast owners | danger, `CirclePause` | Email broadcasts are paused | The spam complaint rate reached 0.3%. Broadcasts stay paused until it falls. | View sending health |
| gateway_reconnect | B: admins and finance | danger, `Unplug` | Payments can't be taken | The connection to Razorpay has expired. Payment links won't open until an admin reconnects it. | Reconnect |
| gateway_test | B: everyone who sends payment links | warning, `FlaskConical` | Payments are in test mode | No real money moves. An admin can switch to live mode in Settings > Payments. | none |
| org_suspended | B: everyone | danger, `CirclePause` | {Institution}'s account is suspended | You can view data, but you can't send messages or take payments. Contact your account owner. | none |
| trial_ending | B: admins | info, `Clock` | Trial ends in 5 days | Choose a plan to keep your data and settings. | View plans |
| support_access | B: our support staff | info, `UserCog` | You're viewing {Institution} as support staff | Every action you take is logged. | none |
| requests_overdue | B: admins with privacy rights | danger, `AlarmClock` | 2 privacy requests are past their due date | Students asked to see or erase their data. Reply as soon as you can. | Open requests |
| incident_deadline | B: admins | danger, `Siren` | Incident report due | CERT-In must hear within 6 hours of noticing. Noticed at 2:10 pm IST. | Open incident |
| offline | B: session | warning, `CloudOff` | You're offline | Changes won't save until your connection is back. | none |
| new_version | B: session | info, `RefreshCw` | A new version is available | Reload to get the latest fixes. Your open dialog will close. | Reload |

#### EmptyState

```text
EmptyState
  purpose   Explains why a page, tab, panel or list has nothing to show, and offers the next step.
  anatomy   Container > icon in a circle (decorative) > title (one line) > body (one or two sentences) > actions
            (primary, optional secondary, optional link). Error variant adds a reference code line.
  variants  - first-use: nothing exists yet; explains what will appear and how to start.
            - no-results: a filter or search matched nothing; offers to clear it.
            - cleared: work is done ("You're all caught up").
            - needs-setup: something must be connected first (WhatsApp, a gateway); admins get the action, others
              get who to ask.
            - no-permission: the role can't see this; names who can help, no action.
            - error: loading failed; "Try again" and a reference code.
            Sizes by place: page (main area), section (a tab or card), compact (a popover, a table body or a small
            panel: no icon, title and one action at most).
  sizes     page: py-16, max-w-sm (384 px) text centred, icon circle size-12 (48 px) with a 24 px icon, title text-md,
            body text-sm, actions mt-4 gap-2 (Buttons md).
            section: py-8, icon circle size-control-md (40 px) with 20 px icon, title text-sm font-semibold.
            compact: py-6, no icon, title text-sm, action Button sm or link.
  states    shown; action running (its Button loading); retrying (error variant: "Try again" loading, then content
            or the error again with a new reference).
  tokens    icon circle rounded-pill bg-surface-sunken text-muted; title text-fg; body text-muted; reference
            text-xs text-muted font-mono. Sits on bg-surface (tabs, cards) or bg-bg (page).
  content   Copy pattern, our own: the title states the state in plain words (no blame, no exclamation marks, no
            jokes, at most 6 words); the body says what appears here or why it's empty, then what to do, in one or
            two sentences; the action is a verb plus object. The table below gives the copy for each place.
  keyboard  Actions in normal Tab order. When an empty state replaces content after a filter change, focus stays on
            the control that changed; the status line announces "No leads match these filters".
  a11y      The title is a heading at the right level for its place (h2 on a page, h3 in a tab). The icon is
            aria-hidden. The result count announcement comes from the list's status line, not from the empty
            state itself.
            Pairs: text on surface, bg, surface-raised; text-muted on surface, bg, surface-raised, surface-sunken;
            on-accent on accent; focus-ring on surface, bg.
  base      native elements; Button (group 1).
  used on   S04, S05, S08 (each tab), S12, S15, S16, S17, S19, S20, S21, S22, S23, S24, S25, S26, S32, S38, S39,
            S40, S41; NotificationFeed; every error.tsx and no-permission page.
```

##### Empty-state copy

| place | variant | icon | title | body | action |
| --- | --- | --- | --- | --- | --- |
| S04 My day | cleared | `CalendarCheck` | Nothing due right now | No follow-ups are due and no new leads are waiting. New work appears here as it arrives. | View all leads |
| S04 My day, checked out | needs-setup | `UserRoundX` | You're checked out | New leads go to colleagues who are checked in. | Check in |
| S05 Leads | first-use | `UsersRound` | No leads yet | Leads appear here when someone fills in your enquiry form, you import a file, or you add one by hand. | Add lead; Import leads; link "Set up an enquiry form" |
| S05 Leads, counsellor | first-use | `UsersRound` | No leads assigned to you yet | New leads appear here as soon as they're assigned to you. | none |
| S05 Leads, filtered | no-results | `SearchX` | No leads match these filters | Remove a filter or widen the date range. | Clear filters |
| S05 search | no-results | `SearchX` | No lead found for "98765" | Check the number, or search by email, name or lead number. | Clear search |
| S08 Timeline | first-use | `RotateCcwClock` | No activity yet | Calls, messages, notes and stage changes for this lead will show here. | none |
| S08 Follow-ups | first-use | `CalendarClock` | No follow-ups planned | Schedule the next call or meeting so it shows in your day. | Add follow-up |
| S08 Notes | first-use | `PencilLine` | No notes | Write down what you learn from the student. Only staff can see notes. | Add note |
| S08 Messages | first-use | `MessageSquare` | No messages yet | Emails, SMS and WhatsApp messages to this lead appear here with their delivery status. | Send message |
| S08 Calls | first-use | `Phone` | No calls logged | Calls made through the app, and calls you log by hand, appear here. | Log a call |
| S08 Documents | first-use | `FileText` | No documents | Files the student sends, or that you save from a chat, appear here. | Upload file |
| S08 Tickets | first-use | `LifeBuoy` | No questions from this student | When the student raises a question, it appears here. | none |
| S08 Payments | first-use | `IndianRupee` | No payments yet | Send a payment link for an application or token fee. | Create payment link |
| S08 Opportunities | first-use | `Layers` | No other interests | Add one when the student is also interested in another programme or campus. | Add opportunity |
| S12 Calendar | cleared | `CalendarDays` | Nothing scheduled | Follow-ups you schedule from a lead appear here. | none |
| S15 Inbox | cleared | `MessagesSquare` | No chats waiting | New WhatsApp messages from students arrive here. | none |
| S15 Inbox, no number | needs-setup | `MessageCircle` | WhatsApp isn't connected | Connect your institution's WhatsApp Business number to chat with students here. Ask an admin if you can't. | Connect WhatsApp (admins) |
| S16 Broadcasts | first-use | `Megaphone` | No broadcasts yet | Send one approved template to a saved list of leads, now or at a set time. | New broadcast |
| S17 Automations | first-use | `Workflow` | No automations yet | Automations assign leads and send messages when something happens, such as a new enquiry. | Create automation |
| S19 Templates | first-use | `FileText` | No templates for this channel | Write messages once and reuse them, with fields such as the student's name. | New template |
| S20 Attribution | no-results | `ChartColumn` | No enquiries in this period | Pick a longer date range, or check that your forms and ads pass UTM tags. | Change dates |
| S21 Dashboard | first-use | `ChartColumn` | This dashboard is empty | Add widgets for the numbers your team checks every day. | Add widget |
| S22 Report builder | first-use | `ChartColumn` | Pick what to measure | Choose at least one metric, such as Leads or Payments, then group the results. | none |
| S23 Productivity | no-results | `UsersRound` | No activity in this period | Numbers appear once calls, follow-ups or stage changes are recorded. | Change dates |
| S24 Notifications | cleared | `Bell` | You're all caught up | No unread notifications. | none |
| S24 Notifications, all | first-use | `Bell` | No notifications yet | Alerts about your leads, such as new assignments and payments, appear here. | Notification settings |
| S24 Notifications, missed | cleared | `Bell` | Nothing missed | Every alert has been opened. | none |
| S25 Payments | first-use | `IndianRupee` | No payments yet | Payments appear here when students pay a link, or when you record an offline payment. | Record offline payment |
| S26 Opportunities | first-use | `Layers` | No opportunities in this list | They're added when a lead's interest matches this list, or when you add one. | Add opportunity |
| S32 Users | first-use | `UsersRound` | Only you so far | Invite counsellors and managers so leads can be assigned to them. | Invite people |
| S38 Audit log | no-results | `SearchX` | No activity matches | Try a different person, action or date range. | Clear filters |
| S39 Publisher portal, applications | no-permission | `EyeOff` | Applications aren't shared | {Institution} hasn't shared application numbers with publishers. | none |
| S40 Tickets | cleared | `LifeBuoy` | No open tickets | Student questions appear here when they're raised by email, form or a counsellor. | none |
| S41 Publishers | first-use | `Building` | No publishers yet | Add the agencies and portals that send you leads, to track their quality and cost. | Add publisher |
| any page | no-permission | `Lock` | You don't have access to this page | Ask an admin at {Institution} to give your role access. | link "Go to My day" |
| any region | error | `CloudOff` | Couldn't load this | Check your connection and try again. If it keeps happening, share the reference below with your admin. Ref: 7F3K-21 | Try again |
| popover list | compact | none | No matches | none | Clear search |

#### Skeleton

```text
Skeleton
  purpose   A placeholder in the shape of content that is loading for the first time, so the page doesn't jump when
            it arrives.
  anatomy   Blocks with the final layout's sizes: text lines, a circle (avatar), a pill, a button, a table row (one
            block per column), a KPI tile, a card. Composed per page in that route's loading.tsx.
  variants  line (h-3 rounded-sm, widths 40% to 90% so lines look natural); title (h-5 w-48); circle (avatar sizes);
            pill (h-chip w-20 rounded-pill); button (h-control-sm w-24 rounded-md); table (header row stays real;
            8 body rows at the current row height); tile (h-28); card (any height set by the page).
  sizes     Matches the content it stands for: row h-row (48 px) or h-row-compact (40 px); text lines sized to the
            text's line height minus its padding (a 14/22 line is an h-3 block in a 22 px box).
  states    waiting (hidden for the first 300 ms: opacity 0, then fades in, so fast loads never flash); shown
            (motion-safe:animate-pulse); still loading after 10 s ("Still loading…" line under the region);
            replaced (content arrives); failed (EmptyState error replaces it).
  tokens    bg-surface-sunken on surface, surface-raised and bg; rounded as the content; motion-safe:animate-pulse;
            under reduced motion it is a static block.
  content   The only text is the sr-only status ("Loading leads…") and, after 10 s, "Still loading…".
  keyboard  Not focusable.
  a11y      Blocks are aria-hidden. The region being loaded has aria-busy="true"; one sr-only polite status says
            "Loading {thing}…" when the skeleton becomes visible (after 300 ms), not before.
            Decorative blocks have no contrast requirement.
            Pairs: text-muted on surface (the "Still loading…" line).
  base      native <div>; Next.js loading.tsx and React Suspense boundaries.
  used on   S04, S05, S08, S12, S15, S16, S17, S19, S20-S27, S32, S38, S40, S41; NotificationFeed; Dialog and Drawer
            bodies.
```

##### Loading rules

1. First load of a page or region shows its Skeleton, after a 300 ms delay. Never a full-page spinner, and never a
   spinner and a skeleton together.
2. Refetching (filter, sort, page change) keeps the current content in place, sets aria-busy, and shows a 2 px
   indeterminate ProgressBar along the top of that region. Content is not dimmed (dimming would break contrast).
3. A pressed button shows its own loading state (group 1 Button). Inline saves show a Spinner (xs) and "Saving…",
   then "Saved" for 2 s in a polite status line.
4. Toggles (Switch, CheckInToggle) update at once and revert with an inline error if the save fails.
5. Long jobs (imports, bulk actions, exports) never block the screen: they become JobProgress.
6. After 10 s, a region adds "Still loading…". After 30 s it shows EmptyState (error) with "Try again".
7. One region failing never blanks the page. The header, sidebar and other regions keep working.
8. Announce once: "Loading leads…" when the skeleton appears, then the result through the list's status line
   ("Showing 25 of 12,480 leads"). Never announce every update.
9. Reduced motion: skeletons are static, spinners become a static icon with visible "Loading…" text.

#### ProgressBar

```text
ProgressBar
  purpose   Shows how far a task has got (determinate) or that it is running (indeterminate), with the value also
            in words.
  anatomy   Label row (label at the left, value text at the right) > track > indicator > optional helper line
            (time left, current step).
  variants  determinate; indeterminate (no known total); route and region loading (sm, no label row, the
            label is the region's aria-busy status); within a toast (compact JobProgress).
  sizes     sm: h-1 (4 px). md: h-2 (8 px), the default with a label. Track rounded-pill full width. Label text-sm;
            value text-sm tabular-nums; helper text-xs.
  states    0%; in progress; complete (100%: the parent replaces it with the result within 1 s); indeterminate;
            paused (indicator stays; value text "Paused at 40%"); failed (indicator stays at its last value; the
            parent's StatusPill and message say it failed, the bar keeps the accent colour).
  tokens    track bg-surface-sunken rounded-pill overflow-hidden; indicator bg-accent rounded-pill,
            motion-safe:transition-transform duration-base (Radix sets transform from the value).
            Indeterminate: indicator w-1/3 motion-safe:animate-indeterminate; under reduced motion it is a static
            third of the track at the start, and the label carries the meaning ("Working…").
            Label text-fg; value and helper text-muted.
  content   "Importing rows" / "1,240 of 5,000"; helper "About 2 min left". "Sending" / "640 of 1,240".
            "Preparing export" (indeterminate) / helper "Large exports can take a few minutes."
  keyboard  Not focusable.
  a11y      Radix Progress: role="progressbar", aria-valuemin 0, aria-valuemax (the total), aria-valuenow (the
            count), aria-valuetext from getValueLabel ("1,240 of 5,000 rows, 25%"); indeterminate omits valuenow.
            Named by the label (aria-labelledby). The bar is not a live region; JobProgress announces milestones.
            The indicator against the track is the meaningful edge: accent on surface-sunken passes 3:1.
            Pairs: accent on surface-sunken; text on surface, surface-raised; text-muted on surface, surface-raised.
  base      Radix Progress (Root, Indicator).
  used on   S07, S13, S05 (bulk actions), S16 (broadcast sending), S22 and S25 (exports); AppShell route loading;
            JobProgress; Toast (job).
```

#### JobProgress

```text
JobProgress
  purpose   Shows a long-running import, bulk action or export from start to finish, with counts, errors and a way
            to stop it, and lets people keep working while it runs.
  anatomy   Header: kind icon > title > StatusPill (the job's status) > optional Cancel button.
            ProgressBar (determinate when the total is known: processed = created + updated + failed + skipped).
            Counts as a description list: Requested, Created, Updated, Failed, Skipped (only those that apply).
            Time line: "Started 2:30 pm" and, once 10% is done and 5 s have passed, "About 2 min left".
            Result actions: "Download error report" (when there are errors), "View these leads" (opens S05 filtered
            to the job), "Download file" (exports), "Try again" (failed), "Close" or "Hide".
            JobTray: the bottom-right stack of jobs that are running or finished in this session.
  variants  - inline: the body of the S13 result dialog and ImportWizard step 4 (S07 page, group 3).
            - tray item: compact (title, pill, bar, one line of counts); up to 3 shown, then "2 more".
            - toast: when a job finishes while its dialog is closed (Toast with "View report").
            Titles per jobs.kind: lead_import "Importing leads"; opportunity_import "Importing opportunities";
            bulk_update "Updating 240 leads"; bulk_stage_change "Changing stage for 240 leads"; bulk_message
            "Sending to 240 leads"; bulk_reassign "Reassigning 240 leads"; bulk_unassign "Removing owners from 240
            leads"; bulk_delete "Deleting 240 leads"; bulk_webhook "Sending 240 leads to a webhook"; export
            "Preparing lead export"; report_export "Preparing report export"; erasure "Erasing personal data".
  sizes     Inline: full dialog width, gap-4. Tray: fixed right-4 bottom-[calc(var(--bottom-sticky,0px)+1rem)],
            w-[min(360px,calc(100vw-2rem))]; collapsed line h-control-md (40 px); each item p-3, bg-surface-raised
            rounded-lg shadow-pop. Counts text-sm tabular-nums in a grid of 2 to 5 columns.
  states    queued; running; not responding (derived: running and no heartbeat for 2 minutes); done; done with
            errors (derived: done and failed > 0); failed; cancelled; cancelling (Cancel loading).
            - Polling: GET /jobs/:id every 2 s while visible and every 10 s while the tab is hidden; Realtime
              messages trigger an immediate refresh.
            - Closing the dialog doesn't stop the job; it moves to the tray. Reloading the page restores the tray
              from the person's running jobs.
            - Finish: the tray item updates, a Toast appears if the dialog is closed, and a bell notification
              (job_finished) records it.
            - Cancel asks first (ConfirmDialog "Stop this import? Rows already imported stay.").
            - Download links are signed and expire after 15 minutes; exports are written to the audit log.
            - Tray placement: it sits above any sticky bottom bar and adds its height plus the 1rem gap to
              --bottom-bar (AppShell), so the toast viewport, scroll padding and main's bottom padding clear it.
            - Tray collapsed: when the pointer is not over the tray and focus is not inside it, the tray shows one
              line ("2 tasks running") and a Disclosure "Show task details". Hover, focus inside or the Disclosure
              expands it; "Hide task details" or Esc collapses it.
            - Tray moved: on focusin anywhere in the page, if the focused element's rect overlaps the tray, the tray
              moves to top-[calc(var(--layout-header)+1rem)] right-4 until focus leaves that element.
  tokens    title text-fg font-semibold; count labels text-muted, numbers text-fg; Failed number text-danger when
            above 0; tray item bg-surface-raised border border-border rounded-lg shadow-pop.
  content   Status line examples: "Started 2:30 pm · About 2 min left", "No progress for 2 minutes. It may
            resume on its own; you can also stop it."
            Done: "1,180 created, 20 updated, 20 failed." Error report: "Download error report (20 rows)".
            Failed: "The import stopped because the file couldn't be read. Nothing was changed." + "Try again".
            Cancelled: "Stopped at 640 of 1,240. Rows already done stay done."
            Tray name: "Background tasks". Disclosure: "Show task details" and "Hide task details". Collapsed
            line: "2 tasks running", "1 task running, 1 finished", "Import finished".
  keyboard  Cancel, result actions and tray controls are buttons and links in normal order. The tray comes after
            main in the Tab order and is reachable from the skip link's target by Shift+Tab.
  a11y      A polite status region announces: start ("Import started"), every 25% ("Import 50% done"), and the end
            ("Import finished. 1,180 created, 20 failed."). A failure is also a Toast (background type).
            Counts use <dl> so each number has its label. Colour of the Failed number is backed by its label.
            Pairs: text on surface-raised, surface; text-muted on surface-raised, surface; danger on surface-raised,
            surface; accent on surface-sunken; accent on surface-raised (links); focus-ring on surface-raised.
  base      ProgressBar, StatusPill, Button and Disclosure (group 1), ConfirmDialog, Toast; native <dl>
            (DescriptionList counts); ResizeObserver for the tray height.
  used on   S05 (bulk actions), S07, S13, S16 (sending), S22 and S25 (exports), S38 (export); JobTray on all staff
            screens.
```

#### Spinner

```text
Spinner
  purpose   A small "working" sign for short waits inside a control or line: a button, an inline save, a switch, an
            org switch, a popover loading a few rows.
  anatomy   LoaderCircle icon that rotates; under reduced motion the static Loader icon instead. Optional visible
            label next to it. Standalone use wraps both in a status element.
  variants  inline (inside a Button or Switch: no label of its own, the control says what's happening); with label
            ("Saving…", "Checking payment status…"); standalone (centred in a small popover body).
  sizes     xs 16 px (size-icon-sm), sm 20 px (size-icon-md), md 24 px (size-icon-lg). Label text-sm, gap-2.
  states    hidden for the first 300 ms of a wait; spinning; reduced motion (static icon plus visible text).
  tokens    text-current inside controls (on-accent inside a primary Button); text-muted elsewhere;
            LoaderCircle motion-safe:animate-spin motion-reduce:hidden; Loader hidden motion-reduce:inline-block.
  content   "Loading…", "Saving…", "Checking…", "Switching…", "Checking payment status…" (S02 return page: with
            JavaScript it checks every 5 s for up to 2 minutes and announces the result once; without JavaScript it
            shows a "Check again" button. No meta refresh.)
  keyboard  Not focusable.
  a11y      Icons aria-hidden. Standalone: role="status" with the visible label, or sr-only "Loading" when there is
            no visible text. Inside a control, the control's own loading text is the announcement.
            Pairs: text-muted on surface, surface-raised; on-accent on accent; text on surface.
  base      lucide-react LoaderCircle and Loader.
  used on   S02 (return page), S03, S35 (verifying a domain), S36 (verifying keys); inside Button, Switch,
            CheckInToggle, OrgSwitcher and Popover on all staff screens.
```

### Display

#### Card

```text
Card
  purpose   A bordered box that groups one piece of a page: a table, a chart, a form or settings section, a set of
            facts, the sign-in panel.
  anatomy   <div> > optional header (title heading, optional description, optional actions at the right) > body >
            optional footer (actions or a link).
            Use <section aria-labelledby> only for the few main parts of a page (the main table card on S05, for
            example), so the landmark list stays short.
  variants  - plain (default): border, no shadow, on the page canvas (bg-bg). Tables, charts, KPI tiles, profile
              and settings sections.
            - standalone: adds shadow-card. One card alone on bg-bg (S03 sign-in, the S04 check-in card).
            - flush: the body has no padding, for a DataTable or a list that runs edge to edge.
            - interactive: the whole card opens one place (a dashboard tile that opens its report). Either the
              heading holds the only link and the link's ::after covers the card, or, for a tile with no heading
              (KpiTile), the whole card is one <a> with a written-out name. Either way it is one tab stop.
            Cards are never on surface-subtle and never inside another card: use a Separator or a DescriptionList
            instead.
  sizes     p-4 (16 px) by default. Larger cards set p-5 (20 px: the profile header, form sections from lg, the S02
            fee card) or p-6 (24 px: the S03 sign-in card). Header gap-2, then mb-3 before the body. Footer mt-4
            pt-3. Cards in a grid or a stack gap-4. Title text-md; description text-sm.
  states    default; loading (Skeleton of the same size in the body, header kept); empty (EmptyState in the body);
            error (Alert in the body).
            Interactive only: hover (border-strong); focus-visible. In the heading-link form the link takes
            focus-visible:outline-hidden and the card draws the ring with has-[a:focus-visible]:outline-2
            has-[a:focus-visible]:outline-focus-ring has-[a:focus-visible]:outline-offset-2. In the whole-card <a>
            form the global outline is on the card itself.
            A card never takes role="button". Apart from the interactive variant, the card is not clickable as a
            whole: its title link or a button inside is the action, so no control sits inside another.
  tokens    card         bg-surface border border-border rounded-lg
            standalone   adds shadow-card
            flush        overflow-hidden on the card, so the table keeps the rounded corners; header border-b
                         border-border
            interactive  hover:border-strong; focus as in states
            header       title text-md font-semibold text-fg; description text-sm text-muted
            footer       border-t border-border
  content   No text of its own. Titles are nouns: "Follow-ups due today", "Sending numbers", "Fees collected".
  keyboard  The card itself is not focusable, except the whole-card <a>. Its links and buttons are normal tab stops.
            An interactive card is one tab stop.
  a11y      The title is a real heading (h2, or h3 under a section heading), so heading navigation finds each card.
            An interactive card holds no other links or buttons, because the covering link would hide them.
            The border is decorative; the heading and the content carry the grouping.
            Targets: none of its own; an interactive card's target is the whole card.
            Pairs: text on surface; text-muted on surface; accent on surface; focus-ring on bg, surface.
  base      native <div>, <section> and <a>.
  used on   S03 and the S04 check-in card (standalone); S04, S20-S23 (tiles, chart and KPI cards); S05 and every
            other table (frame, flush); S08 (profile sections); S28-S38 (settings sections).
```

#### DescriptionList

```text
DescriptionList
  purpose   Read-only facts as label and value pairs: a lead's details, a payment's record, a job's counts, key
            details, an audit entry.
  anatomy   <dl> > one <div> per pair > <dt> label > <dd> value (text, Money, DateText, StatusPill, PhoneText,
            MaskedValue or a Link). A pair may have several <dd> values (alternate numbers).
  variants  - stacked grid (default): label above value, in 1 to 3 columns (grid-cols-1 md:grid-cols-2
              xl:grid-cols-3).
            - side by side: from md up the label column is w-kv-label (200 px), the same column as group 1 Field's
              key-value row, so read-only and editable rows line up on S08. Stacked below md. Used for S08 details
              and the S38 audit entry.
            - counts: JobProgress and import results; the value is a number in text-md tabular-nums.
  sizes     dt text-xs font-medium; dd text-sm, mt-0.5 when stacked. Grid gap-x-6 gap-y-3. Side-by-side rows
            min-h-kv-row (36 px) py-2.
  states    value; empty ("—" in text-muted with sr-only "Not given"); masked (MaskedValue); long value (wraps and is
            never truncated, because the value is the point; user-entered values get dir="auto"); loading (a
            Skeleton line per value; the labels stay real).
  tokens    dt                 text-xs font-medium text-muted
            dd                 text-sm text-fg; secondary text and the empty dash text-muted
            side-by-side rows  md:flex md:gap-4 border-b border-border last:border-b-0; dt md:w-kv-label
                               md:shrink-0
  content   Labels are nouns, sentence case, with no colon: "Mobile number", "Course", "Created", "Owner",
            "Amount".
  keyboard  Not focusable. Links and CopyButtons inside a value are normal tab stops.
  a11y      Native <dl>, <dt> and <dd>, so screen readers read each value with its label. A <div> around each pair
            is valid HTML. Labels are visible text, never placeholders.
            Values at text-sm (14/22) meet the 1.57 line-height rule for wrapped names.
            Targets: none of its own.
            Pairs: text on surface, surface-raised, surface-subtle; text-muted on surface, surface-raised,
            surface-subtle.
  base      native <dl>.
  used on   S08 (details in read mode, payments), S12 (event detail), S14 (merge summary), S25 (payment detail),
            S34, S36, S37 and S41 (key details), S38 (audit entry); ImportWizard results; JobProgress counts;
            SecretReveal key details.
```

#### Stepper

```text
Stepper
  purpose   Shows the steps of a task that takes several steps, where the person is, and which steps are done or
            have a problem. Lets people go back to steps they finished.
  anatomy   <ol aria-label="{Task} steps"> > one <li> per step: marker (number, CircleCheck or CircleAlert) > label >
            sr-only state word > connector to the next step. The current step has aria-current="step".
            A finished step that can be revisited holds a <button>. Other steps are plain text.
            JourneyBar (group 3) is not a Stepper: it is a read-only record of a lead's progress with its own form.
  variants  - horizontal (default): md and up (S07 and S26 imports, the S14 merge page).
            - vertical: below md and in narrow panels.
            - compact: text only, "Step 2 of 3 · Choose values" (the merge Dialog footer, narrow screens).
            - read-only: after the point of no return, such as an import that has started. Every step is text.
  sizes     Horizontal row h-14 (56 px). Markers size-6 (24 px) rounded-pill, text-xs font-semibold numbers; labels
            text-sm. Connectors h-px flex-1 mx-2 (vertical: w-px min-h-4 ml-3). Step buttons min-h-hit.
  states    Per step: done, current, upcoming, problem.
            - Done steps before the point of no return are buttons (hover underline, focus ring). Choosing one goes
              back and keeps every value.
            - Upcoming steps are never buttons. People move forward with the page's primary button, which checks
              the step first.
            - Problem marks a done step that now needs a change (column matches that no longer fit the file).
            - After the point of no return every step is locked: plain text.
  tokens    done         marker CircleCheck text-accent; label text-fg
            current      marker bg-accent text-on-accent; label text-fg font-semibold
            upcoming     marker border-2 border-input text-muted; label text-muted
            problem      marker CircleAlert text-danger; label text-fg
            connector    bg-strong; bg-accent once the step before it is done
            step button  rounded-md px-1 hover:underline underline-offset-2; the global focus ring
  content   Labels are short. Import: "Upload", "Match columns", "Preview", "Import", "Results". Merge: "Which record
            stays?", "Choose values", "Check and merge" (MergeDiffView's step titles).
            State words (sr-only): "done", "current", "not started", "has problems".
            Step button name: "Step 2, Match columns, done. Go back to this step."
  keyboard  Tab reaches the done-step buttons only; Enter or Space goes back to that step. Other steps are not
            focusable. When the step changes, the page or dialog moves focus to the new step's heading (h2,
            tabindex="-1").
  a11y      The <ol> gives the order and the count; the current <li> has aria-current="step".
            Each step's state is an sr-only word after its label, so it is never shape, fill or colour alone.
            Markers and connectors are aria-hidden.
            Targets: step buttons at least 24 px tall (min-h-hit).
            Pairs: text on surface, surface-raised; text-muted on surface, surface-raised; accent on surface,
            surface-raised; on-accent on accent; border-input on surface, surface-raised; danger on surface,
            surface-raised; focus-ring on surface, surface-raised.
  base      native <ol> and <button>.
  used on   S07 and S26 (ImportWizard, group 3); S14 (MergeDiffView, group 3; compact in the merge Dialog footer).
```

#### Avatar

```text
Avatar
  purpose   A small visual marker for a person (staff member) or an institution, next to or instead of their name.
  anatomy   Root (circle for people, rounded square for institutions) > Image (not used in v1: the schema stores no
            photos) > Fallback: initials, or the UserRound icon when there is no usable name > optional presence
            dot at the bottom-right.
  variants  - person: neutral colours.
            - you: the signed-in person, accent-subtle colours (UserMenu trigger, "Assigned to you").
            - inactive member: initials in text-muted and "(inactive)" in the name.
            - unassigned: a dashed outline with the UserRound icon, for leads with no owner.
            - institution: rounded-md square with initials (OrgSwitcher).
            Presence dot (optional): shown when the person is checked in, where check-in matters (S13 target list,
            S32, S34).
  sizes     sm size-avatar-sm (24 px): one initial, text-xs font-semibold.
            md size-avatar-md (32 px): two initials, text-xs font-semibold.
            lg size-avatar-lg (40 px): two initials, text-sm font-semibold.
            Presence dot size-2.5 (10 px) with ring-2.
  states    default; with presence; inactive; unassigned; as a button (UserMenu trigger, AvatarGroup overflow): hover
            and focus-visible come from the wrapping button.
  tokens    person      bg-surface-sunken text-fg rounded-pill
            you         bg-accent-subtle text-accent
            inactive    bg-surface-sunken text-muted
            unassigned  bg-transparent border border-dashed border-input text-muted
            institution rounded-md bg-surface-sunken text-fg
            presence    rounded-pill bg-success ring-2 ring-surface (the ring keeps the dot's neighbour colour fixed
                        on hovered and selected rows)
            There are no per-person colours: colour would need its own pairs and could look like a status.
  content   Initials: split the name into words; take the first grapheme (Intl.Segmenter) of the first word and of
            the last word for Latin script, and of the first word only for other scripts; skip words ending in "."
            (Dr., Prof.); uppercase Latin only. "Ananya Rao" gives "AR"; "ಶ್ರೀನಿವಾಸ್" gives its first grapheme. Empty
            name: the icon. Unassigned tooltip and label: "Unassigned".
  keyboard  Not focusable on its own. When it is the only content of a button, the button has the name.
  a11y      Next to a visible name: aria-hidden. Alone: role="img" with aria-label (the full name, plus ", checked
            in" when the dot shows) and a Tooltip with the same text. The dot is never the only signal: the name or
            tooltip says it.
            Pairs: text on surface-sunken; text-muted on surface-sunken; accent on accent-subtle; border-input on
            surface; success on surface (presence dot against its ring).
  base      Radix Avatar (Root, Image, Fallback).
  used on   AppHeader (UserMenu, OrgSwitcher); S05 and S08 (owners), S12, S13, S15 (assignee), S23, S32, S34, S38
            (actor), S40.
```

#### AvatarGroup

```text
AvatarGroup
  purpose   Shows several people at once in little space, mostly a lead's owners (a lead can have more than one),
            with the full list one click away.
  anatomy   Container (role="group") > up to N overlapping Avatars (primary owner first) > overflow button "+2" >
            Popover listing everyone: Avatar, name, "Primary owner" for the first, "Checked in" where relevant.
  variants  owners (S05 rows, S08 header); team members (S34); participants (S15 chat assignee history).
            Max visible: 3 (sm and md). When there are no people: one unassigned Avatar and the text "Unassigned".
  sizes     sm avatars with -space-x-1.5 (6 px overlap); md avatars with -space-x-2 (8 px). Overflow button the same
            size as the avatars, text-xs font-medium tabular-nums. Popover w-64.
  states    default; overflow; popover open; unassigned; hover on a row (ring colour follows the row).
  tokens    avatars ring-2 ring-surface; in a hovered row group-hover:ring-surface-hover; in a selected row
            ring-accent-subtle. Overflow button bg-surface-sunken text-fg rounded-pill hover:bg-surface-hover.
            Popover as Popover; names text-fg; "Primary owner" text-xs text-muted.
  content   Group name: "Owners: Priya Nair (primary), Vikram Shah and 2 more". Overflow button name: "Show all 4
            owners". Popover heading: "Owners". Unassigned: "Unassigned".
  keyboard  Only the overflow button is focusable; Enter or Space opens the Popover; Esc closes it.
  a11y      role="group" with an aria-label that lists the names (the avatars inside are aria-hidden), so the group
            is read once and in full. Each visible avatar also has a Tooltip with its name for pointer users.
            Target: the overflow button is 24 px (sm) or 32 px (md).
            Pairs: text on surface-sunken, surface-hover, surface-raised; text-muted on surface-raised; focus-ring
            on surface, surface-hover, accent-subtle.
  base      Avatar; Radix Popover; Radix Tooltip.
  used on   S05, S08, S13, S15, S26, S34.
```

#### Badge

```text
Badge
  purpose   A small label for a count or a fixed attribute (a template's nature, a gateway's test mode, a default
            item). Not for lifecycle state: that is StatusPill.
  anatomy   Count: a pill with a number. Tag: a small rectangle with a word or two. Dot: an 8 px circle.
  variants  - count neutral: nav counts, tab counts.
            - count accent: counts on an active tab or a selected filter.
            - count danger (solid): the bell's unread count (same as group 1 IconButton).
            - tag neutral: "Promotional", "Transactional", "Service", "Default", "Shared", "Primary", "Required",
              "Imported", "Under 18", "Personal data", "Health data", "API", call purposes.
            - tag outline: the same words where a filled tag would be too heavy (dense tables, selected rows).
            - tag warning: "Test mode" only.
            - dot: "has items" in the collapsed sidebar; never alone without a name or tooltip.
  sizes     h-5 (20 px), text-xs font-medium, px-1.5; counts min-w-5 tabular-nums, centred; tags rounded-sm, counts
            and dots rounded-pill. Dot size-2.
  states    static. Counts cap at "99+". A count of 0 is not shown.
  tokens    count neutral   bg-surface-sunken text-fg rounded-pill
            count accent    bg-accent-subtle text-accent rounded-pill
            count danger    bg-danger text-on-danger rounded-pill
            tag neutral     bg-surface-sunken text-fg rounded-sm
            tag outline     border border-strong text-muted rounded-sm
            tag warning     bg-warning-subtle text-warning rounded-sm
            dot             bg-accent rounded-pill
            All filled kinds add border border-transparent so they keep a shape in forced-colours mode.
  content   Our words: "Promotional", "Transactional", "Service", "Test mode", "Default", "Shared", "Primary",
            "Required", "Imported", "Under 18", "Personal data", "Health data", "API", "99+".
  keyboard  Not focusable.
  a11y      A count is part of its parent's accessible name ("Inbox, 4 chats waiting"); the badge itself is
            aria-hidden when the parent name already includes it. Tags are read as text. Meaning is always in the
            word, never in the fill.
            Pairs: text on surface-sunken, accent-subtle; accent on accent-subtle; on-danger on danger; text-muted
            on surface, surface-hover, accent-subtle, surface-raised; warning on warning-subtle; accent on surface
            (dot).
  base      native <span>.
  used on   Sidebar and Tabs (counts); NotificationBell; S05 (saved views "Shared"), S08 (call purpose, "Under
            18"), S16, S19 ("Promotional", "Transactional"), S28 ("Required", "Personal data"), S29 ("Default"),
            S36 ("Test mode", "Default"), S37 (key scopes, "API").
```

#### StatusPill

```text
StatusPill
  purpose   Shows the state of a record (a payment, message, chat, broadcast, template, job, channel, member...)
            with a label, an icon and a tone, from one shared vocabulary so the same state looks and reads the same
            everywhere.
  anatomy   <span> > icon (16 px, aria-hidden) > label. Optional detail text after the pill (outside it). Optional
            Tooltip with the time or reason.
            Props: domain and value (looked up in the Status vocabulary section), or tone, label and icon given directly.
  variants  - filled (default): tone fill. Use it in tables and lists, including hovered and selected rows.
            - plain: icon and label in the tone colour, no fill. Only on bg-surface, bg-surface-raised, bg-bg or a
              hovered fill (bg-surface-hover), never in rows that can be selected (accent-subtle has no tone-text
              pairs).
            - with detail: "Failed" pill then text-xs text-muted "Number isn't on WhatsApp".
            - with tooltip: the time or reason behind the state ("Delivered 06 Oct, 2:31 pm IST").
  sizes     h-chip (24 px), px-2, gap-1, rounded-pill, text-xs font-medium, icon size-icon-sm (16 px).
            whitespace-nowrap; labels are written to stay under 36 characters.
  states    static per value. When a status changes in place (a message going from Sending to Delivered), the pill
            updates; the region it belongs to decides whether to announce it.
            Unknown value (for example a new value from Meta): neutral, CircleQuestionMark, label "Unknown
            ({raw value})", and a warning in the logs. It never breaks the page.
  tokens    neutral  bg-surface-sunken text-fg; icon text-muted
            info     bg-info-subtle text-info
            success  bg-success-subtle text-success
            warning  bg-warning-subtle text-warning
            danger   bg-danger-subtle text-danger
            all      rounded-pill border border-transparent (visible in forced-colours mode)
            plain    text-info / text-success / text-warning / text-danger / text-fg with no fill
  content   Every label is in the Status vocabulary section. Labels are short, plain and ours.
  keyboard  Not focusable. If a status needs an action (retry, resend), the action is a separate Button next to it.
            A pill with a tooltip sits inside a focusable parent (the row link) or gets tabindex="0".
  a11y      Read as text: the label carries the meaning; the icon repeats it in shape; the tone is the third cue.
            No live region of its own.
            Pairs: text on surface-sunken; text-muted on surface-sunken; info on info-subtle, surface,
            surface-raised, bg, surface-hover; success on success-subtle, surface, surface-raised, bg,
            surface-hover; warning on warning-subtle, surface, surface-raised, bg, surface-hover; danger on
            danger-subtle, surface, surface-raised, bg, surface-hover; text on surface, surface-raised, bg.
  base      native <span>; lucide-react icons; Radix Tooltip.
  used on   S04, S05, S07, S08, S12, S13, S15, S16, S17, S18, S19, S24, S25, S26, S27, S32, S35, S36, S37, S38, S40,
            S41, S42 (privacy requests), S43 (incidents); JobProgress; OrgSwitcher.
```

#### MaskedValue

```text
MaskedValue
  purpose   Shows a lead's phone number or email when the person's role may not see it in full, and lets permitted
            roles reveal it on purpose, with the reveal recorded in the audit log.
  anatomy   Field label (from the parent) > masked text > lock icon with tooltip (no permission) or a "Show" button
            (permitted) > after reveal: the value (PhoneText or the email), "Hide" button and CopyButton (group 1).
            The server sends only the masked string unless the role may see the full value. Masking is never done in
            the browser.
  variants  phone; email; alternate mobiles (lead_phones) and guardian contacts (same rules).
            Places: profile (S08) and lead side panel (S15) may offer Show; table cells (S05) never do (the full
            value is never sent to a table); publisher portal (S39) never reveals.
  sizes     Inline text at its parent's size (text-sm in profiles, text-table in tables), tabular-nums. Show and
            Hide are Button link xs with an Eye or EyeOff icon (16 px), min-h-hit.
  states    masked, no permission (lock icon); masked, can reveal (Show); revealing (Show loading, "Showing…");
            revealed (value, Hide, Copy); reveal failed ("Couldn't show it. Try again." inline, text-xs text-danger);
            reveal denied (permission changed: "You no longer have access to this." and the button goes); empty
            ("Not given" in text-muted); re-masked (on navigation away, on Hide, and when the profile reloads).
            Calling and messaging still work while a value is masked (they go through the app).
  tokens    value and mask text-fg tabular-nums; lock icon text-muted; Show and Hide text-accent (Button link);
            error text-danger; empty text-muted.
  content   Phone mask: "+91 ••••• •3210" (country code and last four digits). Email mask: "pr•••@gmail.com" (first
            two characters and the domain). Mask character U+2022.
            Accessible text: "Mobile number hidden, ends in 3210"; "Email hidden, starts pr, at gmail.com".
            Show button: visible "Show", name "Show mobile number". Hide: "Hide mobile number".
            Tooltip on Show: "Showing it is recorded in the audit log." Lock tooltip: "Hidden for your role".
            Status after reveal (polite): "Mobile number shown".
  keyboard  Tab reaches Show (and then Hide and Copy after reveal). Enter or Space reveals; focus stays on the same
            button, which becomes Hide.
  a11y      The masked string is aria-hidden; an sr-only sentence gives the meaning instead of reading dots.
            The revealed number is wrapped in <bdi dir="ltr"> so it reads correctly next to right-to-left names.
            Reveal is a server action (POST, permission check, audit row with action "lead.contact_reveal", then the
            value); nothing is cached client-side after navigation.
            Targets: Show and Hide at least 24 px.
            Pairs: text on surface, surface-hover, accent-subtle; text-muted on surface; accent on surface, bg,
            surface-raised, surface-hover, accent-subtle; danger on surface; focus-ring on surface, surface-hover.
  base      native <span>, <bdi>; Button link and CopyButton (group 1); Radix Tooltip; Next.js server action.
  used on   S05, S08, S15, S39; M02, M03 (phase 2 pattern).
```

### Formatters as display components

All five come from one `format` module (decisions.md section 3) and always use `en-IN`, whatever the browser's
locale. Data stays raw: money as integer paise, times in UTC, phone numbers in E.164. Server Components format; the
client receives strings. Measured outputs (Node 22.22, ICU 77.1) are pinned in CI tests, because browsers ship their
own ICU data.

#### Money

```text
Money
  purpose   Shows an amount of money from integer paise, exactly, in Indian grouping, with no rounding through
            floating point.
  anatomy   <span> > formatted amount > optional text label (refund, discount) > for compact amounts, an sr-only
            exact amount and a Tooltip with it.
            Input: paise as a bigint or a decimal string, never a JS number. currency (default INR).
            Method: split rupees and paise with BigInt division, build the decimal string ("1234567.89"), and format
            that string with Intl.NumberFormat('en-IN', {style: 'currency', currency: 'INR'}), which formats decimal
            strings exactly.
  variants  - exact: always two decimals. Payment pages, receipts, S25, refunds, S08 Payments tab, S36 product
              amounts. "₹12,34,567.89", "₹1,000.00", "₹0.00".
            - compact: KPI tiles and chart axes only. notation 'compact' with the short display, one decimal at most:
              "₹1.5L", "₹1.2Cr", "₹12.3L". Never compactDisplay 'long'.
            - signed: refunds and reversals get a minus sign and a word: "−₹500.00 refund". Never a minus sign alone.
            - other currency: Intl formats the ISO code ("US$120.00") when a payment is not INR.
  sizes     Inherits its parent's size. In tables text-table, right-aligned (text-right), tabular-nums. On S02 the
            amount due is text-xl font-semibold; KPI values text-display (numbers only).
  states    value; zero ("₹0.00"); missing ("—" with sr-only "Not set"); negative (signed variant); compact with
            tooltip.
  tokens    text-fg tabular-nums; refund word text-muted; in KPI tiles font-bold.
  content   "₹12,34,567.89"; "₹1,000.00"; "₹1.5L" (tooltip "₹1,50,000.00"); "−₹500.00 refund"; "₹500.00 of
            ₹1,000.00 refunded"; "—".
  keyboard  Not focusable, except compact values, which take tabindex="0" when they are not inside another focusable
            element, so the tooltip can open on focus.
  a11y      The accessible text of a compact amount is the exact amount (the visible "₹1.5L" is aria-hidden and an
            sr-only "₹1,50,000.00" follows it). The rupee sign is in our Inter subset (decisions.md section 2), so it
            never triggers a font download.
            Pairs: text on surface, surface-raised, bg, surface-hover, accent-subtle; text-muted on surface,
            surface-hover; on-inverse on inverse (tooltip).
  base      native <span> and <data value="{paise}">; Intl.NumberFormat; Radix Tooltip for compact.
  used on   S02, S08, S20 (cost per lead), S21, S22, S23, S25, S36, S41 (cost inputs shown read-only); M01, M06.
```

#### NumberText

```text
NumberText
  purpose   Shows counts, percentages and changes in Indian grouping, with exact values behind any short form.
  anatomy   <span> > formatted number > optional unit word > for compact numbers, sr-only exact value and a Tooltip.
            Delta form: direction icon (TrendingUp, TrendingDown or Minus) > signed value > comparison word.
  variants  - count: Intl.NumberFormat('en-IN'): "1,23,45,678".
            - compact: KPI tiles and axes: "12L", "1.2Cr", with the exact count behind it.
            - percent: style 'percent', at most one decimal: "12.3%". A zero denominator shows "—" with sr-only "Not
              available".
            - delta: "+12.3%" or "−4 pts" with an icon and the words "from last period". Colour shows whether the
              change is good, set per metric (goodDirection: up or down), and only on bg-surface, bg-surface-raised
              or bg-bg; in table rows deltas are text-fg, and the icon and sign carry the direction.
            - score: lead score and percentile: "42 · top 12%". Hidden for leads under 18 (no scoring).
  sizes     Inherits size; tables right-aligned with tabular-nums; KPI values text-display font-bold; deltas text-xs.
  states    value; zero ("0"); missing ("—"); loading (parent Skeleton); compact with tooltip; delta up, down, flat.
  tokens    text-fg tabular-nums; good delta text-success; bad delta text-danger; flat or in-table text-fg;
            comparison word text-muted.
  content   "12,480 leads"; "12.3%"; "+12.3% from last period"; "−4 pts from last period"; "No change"; "42 · top
            12%"; "—".
  keyboard  Not focusable, except compact values outside a focusable parent (tabindex="0" for the tooltip).
  a11y      Deltas read as words: sr-only "up 12.3% from last period" (the arrow icon is aria-hidden). Compact numbers
            read the exact value. Percentages that come from a ratio say both parts nearby ("640 of 1,240").
            Pairs: text on surface, surface-raised, bg, surface-hover, accent-subtle; text-muted on surface,
            surface-raised, bg; success on surface, surface-raised, bg; danger on surface, surface-raised, bg;
            on-inverse on inverse.
  base      native <span> and <data>; Intl.NumberFormat; Radix Tooltip.
  used on   S04 (tiles), S05 (counts), S07 (results), S13, S16 (report counts), S20, S21, S22, S23, S25; M01, M06.
```

#### DateText

```text
DateText
  purpose   Shows a date, a time, or both, in the institution's time zone, with the zone named where a time drives an
            action.
  anatomy   <time dateTime="{ISO}"> > the formatted string. The server formats; the client receives the string.
  variants  - date: day '2-digit', month 'short', year 'numeric': "06 Oct 2026". September prints "Sept" (four
              letters), so leave room.
            - date-short: no year when the date is in the current year in the org's zone: "06 Oct". Feeds and
              cards only; tables and exports always show the year.
            - time: hour 'numeric', minute '2-digit', hour12: "2:30 pm".
            - date-time: "06 Oct 2026, 2:30 pm".
            - with zone: adds timeZoneName 'short': "06 Oct 2026, 2:30 pm IST". Used for follow-ups, scheduled sends,
              payment-link expiry, receipts and the audit log, and whenever the viewer's browser zone differs from
              the org's. "IST" appears only with en-IN; other zones print as "GMT+4".
            - range: Intl formatRange: "06–12 Oct 2026", "30 Sept – 04 Oct 2026".
            A follow-up shows in its own stored time zone, not the viewer's.
  sizes     Inherits its parent's size; tabular-nums in tables.
  states    value; missing ("—" with sr-only "No date"); past and future look the same (DueText meaning lives in
            RelativeTime's due variant).
  tokens    text-fg in content, text-muted in meta lines; tabular-nums in tables.
  content   "06 Oct 2026"; "06 Oct"; "2:30 pm"; "06 Oct 2026, 2:30 pm IST"; "06–12 Oct 2026".
  keyboard  Not focusable.
  a11y      <time> carries the machine value. Abbreviated months are read correctly by screen readers. The zone
            abbreviation is part of the text, not hidden.
            Pairs: text on surface, surface-raised, bg, surface-hover, accent-subtle; text-muted on surface,
            surface-raised, bg, surface-hover, accent-subtle.
  base      native <time>; Intl.DateTimeFormat('en-IN', {timeZone: org or follow-up zone}).
  used on   every staff screen; S02 (link expiry, receipt); S11, S12, S16, S25, S38 (with zone).
```

#### RelativeTime

```text
RelativeTime
  purpose   Shows how long ago something happened in feeds ("5 min ago"), with the exact date and time one hover or
            focus away; and shows due times in words that are never relative alone.
  anatomy   <time dateTime="{ISO}"> > relative text > Tooltip with the absolute date-time and zone. Due variant:
            state word > " · " > "due " + date-time.
            The server renders the absolute string; after mount the client swaps in the relative text, and one shared
            timer for the whole page refreshes every instance every 60 s (paused while the tab is hidden).
  variants  - past (feeds only: timeline, notifications, inbox, "last engaged"): Intl.RelativeTimeFormat('en-IN',
              {numeric: 'auto', style: 'short'}). Under 1 minute "just now"; then "5 min ago", "3 hr ago",
              "yesterday", "3 days ago"; from 7 days on, the absolute date ("29 Sept 2026").
            - due (follow-ups, payment-link expiry): "Overdue · due 05 Oct, 4:00 pm IST", "Due today · 4:00 pm IST",
              "Due tomorrow · 10:00 am IST", "Due 09 Oct, 10:00 am IST". The state word changes; the absolute time is
              always shown.
            Not used in tables other than "Last engaged", and never for future scheduled sends (those use DateText
            with zone).
  sizes     Inherits size; usually text-xs or text-sm in text-muted. In tables min-w-20 so the swap from absolute
            to relative doesn't move columns.
  states    server-rendered (absolute); live (relative, refreshing); crossed 7 days (switches to absolute); due:
            upcoming, due today, overdue; tooltip open (hover, focus, or tap on touch).
  tokens    text-muted (past); due upcoming text-fg; overdue text-danger with the AlarmClock icon, only on
            bg-surface, bg-surface-raised, bg-bg or a hovered row (bg-surface-hover). In selected rows and table
            cells, overdue uses StatusPill "Overdue" instead. Tooltip bg-inverse text-on-inverse.
  content   "just now", "5 min ago", "3 hr ago", "yesterday", "3 days ago", "29 Sept 2026".
            Tooltip: "06 Oct 2026, 2:30 pm IST".
            Due: "Overdue · due 05 Oct, 4:00 pm IST", "Due today · 4:00 pm IST".
  keyboard  Standalone it takes tabindex="0" so the tooltip opens on focus. Inside a focusable parent (a feed item
            link, a table row link) it is not a second tab stop: its tooltip opens while the parent has focus
            (controlled from :focus-within), and the absolute value is in the parent's accessible text.
  a11y      The accessible text includes both forms: "5 min ago, 06 Oct 2026, 2:30 pm IST" (the absolute part
            sr-only). Overdue is a word, not only a colour. The 60 s refresh never announces.
            On touch, a tap toggles the tooltip (Radix Tooltip in controlled mode, opened on pointerType touch).
            Pairs: text-muted on surface, surface-raised, bg, surface-hover, accent-subtle; text on surface,
            surface-raised, bg, surface-hover; danger on surface, surface-raised, bg, surface-hover; on-inverse on
            inverse.
  base      native <time>; Intl.RelativeTimeFormat; Radix Tooltip (controlled); a small client component.
  used on   S04, S05 ("Last engaged"), S08 (timeline, follow-ups), S12, S15, S24, S27, S40; NotificationFeed.
```

#### PhoneText

```text
PhoneText
  purpose   Shows a phone number stored in E.164 in the international format people read and dial, without guessing
            its type.
  anatomy   <bdi dir="ltr"> > formatted number. Optional tel: link only where the institution has turned on
            service-call links and the value is not masked.
  variants  - plain (default): text. Calls go through the app's click-to-call button, not this component.
            - link: <a href="tel:+919876543210"> behind the org setting for service calls; never when contacts are
              masked, and never in public pages.
            - WhatsApp id: a sender's wa_id shown the same way in S15. For roles that see contacts masked it goes
              through MaskedValue ("+91 ••••• •3210"), also for numbers not yet linked to a lead.
            Masked numbers use MaskedValue, which uses PhoneText for the revealed value.
  sizes     Inherits size; tabular-nums; whitespace-nowrap.
  states    value; unparseable (shows the stored string as it is, no formatting); missing ("—" with sr-only "No
            number").
  tokens    text-fg tabular-nums; link text-accent underline.
  content   "+91 98765 43210" (mobile); "+91 80 2612 3456" (Bengaluru landline); "+971 50 123 4567".
  keyboard  Not focusable unless it is the link variant (Tab, Enter).
  a11y      <bdi dir="ltr"> keeps the number in order inside right-to-left text (Urdu names). Screen readers read
            the groups as numbers; that is accepted.
            Pairs: text on surface, surface-raised, bg, surface-hover, accent-subtle; accent on surface,
            surface-hover.
  base      libphonenumber-js formatInternational on the server (max metadata stays on the server); native <bdi>
            and <a>.
  used on   S05, S08, S15, S32 (staff mobile), S35 (WhatsApp display number), S39 (masked through MaskedValue); M02,
            M03.
```

---

## Group 3: CRM data and domain

The components that carry the CRM's own data and rules, built from the parts in groups 1 and 2.

### Group 3 conventions

The shared [conventions](#conventions) apply unchanged. This group adds the rules below.

- **Built from.**
  - Group 1: Button, IconButton, TextInput, Textarea, Select, Combobox, Checkbox, RadioGroup, Switch, NumberStepper,
    PhoneInput, OtpInput, DatePicker, DateTimePicker, DateRangePicker, FileUpload, Field, FormLayout, ConsentCapture,
    SegmentedControl, ChannelTabs, SearchInput, CopyButton, CodeBlock, SecretReveal, Link, Kbd, Separator,
    Disclosure.
  - Group 2: AppShell, PageHeader, Breadcrumbs, Tabs, Pagination, Dialog, ConfirmDialog, Drawer, Popover,
    DropdownMenu, Tooltip, Toast, Alert (with its compliance catalogue), Banner, EmptyState (with its copy table),
    Skeleton, ProgressBar, JobProgress, Card, DescriptionList, Stepper, Avatar, Badge, StatusPill, MaskedValue,
    Money, NumberText, DateText, RelativeTime and PhoneText.
  - Status words, icons and tones come from the [Status vocabulary](#status-vocabulary). A block here never gives a
    state that the vocabulary lists a label or icon of its own.
- **Where tone colours go.** `danger`, `success`, `warning` and `info` text and icons sit only on their own `-subtle`
  fill, or on `surface`, `surface-raised`, `surface-hover` or `bg`. The pairs list has no tone-on-`accent-subtle`
  pair, and selected rows, chips and tree items use `accent-subtle`. So, inside rows, tables, tree items and calendar
  cells, a status always renders as a StatusPill (tone text on tone-subtle) or in `text-fg`, `text-muted` or
  `text-accent`, never as bare tone text.
- **Selected and focused are different.**
  - A selected row or item gets `bg-accent-subtle`. A focused one gets the outline. A background change alone never
    shows focus.
  - Fill alone never shows selection either. Add a 2 px accent edge (`border-l-2 border-accent`) or a checked control
    (a ticked checkbox, a checked radio, a Check icon).
  - Inside grids, cells, header buttons and name links take `focus-inset`. Checkboxes, radios, switches and
    IconButtons inside cells keep the default 2 px offset, so their ring sits on the row fill and never on their own
    accent fill (`focus-ring` on `accent` is under 3:1). An inset ring that has to sit on an accent fill uses
    `focus-visible:outline-on-accent`.
- **Clamped text.** Every `line-clamp-*` box has `pb-1` inside it, so the subscripts of the last line in Kannada and
  Telugu are not cut (decisions.md section 2). Multi-line user text uses `leading-prose`.
- **Lead identifiers.** People see the lead number (`leads.ref_no`, counted per institution) as "Lead #10234". The API
  ID is the lead's UUID (`leads.id`); it appears only where integrations need it ("Copy API ID", LeadSearch). "User"
  always means a staff member, never a student.
- **Permissions in the UI.** An action the person's role can never use is hidden. An action that a rule blocks for
  this record (a stage rule, consent, a minor, a merged record) stays visible with `aria-disabled="true"` and the
  reason, so people learn why. The server enforces both; the UI only explains.
- **Masked contacts.** Masking happens on the server (decisions.md section 3). Masked values render through
  MaskedValue (`+91 ••••• •3210`, `pr•••@gmail.com`). Tables never offer "Show"; only the lead profile does, and only
  for roles allowed to reveal. Unknown WhatsApp numbers in the inbox follow the same rule.
- **Minors (DPDP s.9).** A lead under 18 has no score and no percentile anywhere, gets no promotional message or
  call, and gets no message, call or assignment at all until a guardian is verified. Read receipts, opens and clicks
  are never shown for them. Components show this as a stated reason, not as a missing value.
- **Long jobs.** Bulk actions, imports and exports return a job. The UI polls `GET /jobs/:id` every 2 s, or listens on
  the member's Realtime channel when connected. Progress is announced at start, at each quarter and at the end, never
  for each row.
- **Paper frame.** Previews of what a recipient sees (email HTML, SMS text, WhatsApp templates) stay light in dark
  mode (decisions.md section 6). tokens.css scopes themes only on `:root`, so a preview renders inside an `<iframe>`
  whose own `<html>` carries `data-theme="light"` and loads tokens.css. Email HTML uses `srcdoc` with `sandbox` (no
  scripts, no same-origin). SMS and WhatsApp previews render React into a blank same-origin iframe through a portal,
  with `sandbox="allow-same-origin"` and no scripts inside the frame. The frame's height follows its content
  (ResizeObserver) and its `title` names it ("Preview of Fee reminder").
- **Formatting.** Every count, amount, date and phone number goes through the `format` module on `en-IN`
  (decisions.md section 3). Relative times appear only in feeds: the timeline, the inbox, notifications and
  "last active".
- **Every list and chart has** loading, empty, filtered-empty and error states. Their copy is in each block.
- **Table pager.** Group 2's Pagination is the only pager in the app. DataTable puts it in its footer slot.

### A. Lead list tools

#### DataTable

```text
DataTable
  purpose   Show many records as rows and columns. People sort, select, page through and act on them, and move
            between cells with the keyboard.
  anatomy   Card, flush variant (<section aria-labelledby> the page title):
            - selection banner (only after select-all on a page; see states);
            - marker legend in the table's toolbar line, while any row on the page has the New dot: the same dot
              followed by the words "New lead";
            - scroll container (overflow-auto, its own scrollbars) holding
              <table role="grid">:
              - <thead>, sticky: select-all cell (Checkbox, indeterminate), then one <th> per column. A sortable
                column's <th> holds a <button> with the label and a sort icon.
              - <tbody>: one <tr> per record. Cells in order:
                - select cell: Checkbox, table-row variant;
                - primary cell: the record's name as a link to its profile, with the New dot or the Merge icon
                  before it (sticky on the left together with the select cell);
                - data cells: text, number (right-aligned), date, StageBadge, owner (Avatar sm and name),
                  StatusPill, MaskedValue, JourneyBar compact;
                - optional last cell: row actions IconButton (Ellipsis) opening a DropdownMenu.
            - footer slot: BulkActionBar on the left and Pagination (group 2, combined variant) on the right, in one
              bar outside the scroll container, so it never covers a row;
            - a polite sr-only status region for sorting, paging, loading and selection.
  variants  - grid (S05, S26): role="grid" with the keyboard model below, selectable rows, sticky first column.
            - plain (S17, S32, S38, S40, S41 and other short lists): a native <table> without the grid role. Links
              and buttons stay in the normal tab order. Use it when people mostly read and open records.
            - embedded (S08 tabs such as payments and calls; S21 table widgets): no selection, no sticky column,
              at most 10 rows, a "View all" link instead of pagination.
            Density, a per-table member preference set in ColumnChooser:
            - comfortable (default): 48 px rows;
            - compact: 40 px rows.
            Row markers:
            - new (leads.untouched: nobody has worked on the lead yet): a dot before the name, explained by the
              visible legend, so nobody needs a hover tooltip to learn what it means;
            - merged: the whole row in text-muted, with the Merge icon and target;
            - on hold (DPDP retention hold): hidden by default; shown only through the filter "Show leads on hold",
              greyed like merged, with an "On hold" pill.
  sizes     header row h-row-header (40 px); body rows h-row (48 px) or h-row-compact (40 px); footer bar h-pagebar
            (56 px), or h-table-footer (48 px) in embedded tables.
            Cells px-3 text-table (13/20). The select cell is w-10 (40 px), with the 16 px box in a 24 px hit area.
            Primary column min-w-56 (224 px), max-w-80 (320 px). Other columns min-w-32 (128 px). Number and date
            columns min-w-24 (96 px).
            Icons 16 px. New dot size-2 (8 px). Row actions IconButton xs (24 px).
            Page size is at most 100 rows, so rows are never virtualised.
  states    Loading and errors:
            - first load: the header renders. The body shows Skeleton rows, as many as the page size up to 10, one
              bar per cell (h-3, widths 40 to 80%). The table has aria-busy="true"; the status says "Loading leads".
            - refreshing (sort, filter, page or size change): the current rows stay. A 2 px bar runs along the top
              of the body (an indeterminate progress line; under reduced motion a static line, and the footer says
              "Updating…"). aria-busy="true" until the new rows arrive.
            - error: if rows are already shown they stay, and a danger Alert sits above the table. On first load
              the body shows the error message and a "Try again" button.
            Empty (copy from group 2's empty-state table, S05 rows):
            - empty (no records at all): EmptyState inside the card; the admin and counsellor rows differ.
            - filtered-empty: the filter bar and search stay visible above the table, so the active filters are in
              view. The body shows the S05 filtered EmptyState.
            - search with no match: the S05 search EmptyState.
            Rows:
            - default; hover (bg-surface-hover); focus (the outline: inset on cells, header buttons and name links;
              the default 2 px offset on checkboxes and IconButtons).
            - selected: bg-accent-subtle and the checkbox ticked (the tick is the shape cue, not the fill alone),
              aria-selected="true". Hover does not change a selected row.
            - merged: every cell in text-muted. The primary cell shows the Merge icon and "Merged into {name}". The
              checkbox is aria-disabled with the reason. Select-all skips merged rows and the status says how many
              it skipped. The row's menu offers only "Open".
            - new: the dot plus sr-only "New, " before the name. The dot disappears on the next refresh after anyone
              acts on the lead.
            - masked cells: MaskedValue in text-fg tabular-nums. A masked column cannot be sorted by a role that
              sees it masked.
            Sorting:
            - default S05 sort: Created, newest first.
            - The sorted column shows ArrowUp or ArrowDown in text-fg. Other sortable columns show ArrowUpDown in
              text-muted. Columns that cannot be sorted have no icon and no button.
            - Clicking a sorted header flips the direction. Clicking another header sorts by it, descending for
              dates and numbers, ascending for text. One sort key at a time.
            - Sort, filters, search and page live in the URL, so Back and reload keep them.
            Selection:
            - The header checkbox selects every selectable row on this page. It is indeterminate when some are.
            - After it selects a full page, the selection banner offers to select every record that matches the
              filters. Bulk actions then run on the filter, not on a list of ids. The banner then offers "Clear
              selection".
            - Selection survives paging and sorting, and is cleared when filters change (the status says so).
            Truncation: text cells truncate with an ellipsis and keep pt-0.5 pb-1. The full value is in the DOM,
            in the title attribute and in the table view of exports.
  tokens    card          Card flush: bg-surface border border-border rounded-lg overflow-hidden
            header row    bg-surface-sunken text-fg text-table font-medium border-b border-strong; sticky top-0
                          z-(--z-sticky)
            sort icon     text-muted; on the sorted column text-fg
            body row      bg-surface border-b border-border hover:bg-surface-hover aria-selected:bg-accent-subtle
                          aria-selected:hover:bg-accent-subtle
            sticky cells  bg-inherit (they follow the row's fill); when the container is scrolled sideways
                          (data-scrolled) the last sticky cell gets border-r border-strong
            cell text     text-fg; secondary line text-muted; numbers tabular-nums text-right
            new dot       size-2 rounded-pill bg-accent; legend text-xs text-muted after the same dot
            merged row    text-muted, Merge icon text-muted
            skeleton      bg-surface-sunken rounded-sm motion-safe:animate-pulse
            refresh line  h-0.5 bg-accent
            banner        bg-accent-subtle text-fg text-sm px-4 py-2; its link button text-accent
            focus         focus-inset on cells, header buttons and the name link. Checkboxes and IconButtons inside
                          cells keep the default 2 px offset: the 24 px hit label and the 40 px cell leave room, so
                          the ring sits on the row fill, never on a ticked box's accent fill.
  content   S05 columns: "Name", "Lead no.", "Stage", "Owner", "Mobile", "Email", "Source", "Course", "City",
            "Created", "Last active", "Next follow-up", "Score", "Journey".
            Select names: "Select all 25 leads on this page"; "Select Meera Pillai".
            Banner: "All 25 leads on this page are selected." with "Select all 1,284 matching leads". After that:
            "All 1,284 matching leads are selected." with "Clear selection".
            Skipped on select-all: "24 selected. 1 merged lead can't be selected."
            Legend: "New lead". The dot also has a tooltip, as an extra and never the only explanation: "New: nobody
            has worked on this lead yet."
            Merged cell: "Merged into Meera Pillai". Merged checkbox reason: "Merged records can't be changed.
            Open the main record instead."
            Empty, filtered-empty and search texts: group 2's empty-state table, rows "S05 Leads", "S05 Leads,
            counsellor", "S05 Leads, filtered" and "S05 search".
            Error: "We couldn't load leads." with "Try again".
            Status texts: "Sorted by Created, newest first." "Showing leads 26 to 50 of 1,284." "3 leads selected."
            "Selection cleared because the filters changed."
            Row actions (group 2's DropdownMenu row menu): name "More actions for Meera Pillai"; items "Open", "Open
            in new tab", "Change stage", "Add follow-up", "Send message", "Reassign", "Copy lead link", separator,
            "Delete lead".
  keyboard  Grid variant (APG data grid):
            - Tab enters the grid once, on the last focused cell (first visit: the first header cell). The next
              Tab leaves the grid for the footer bar.
            - Arrow keys move one cell. Home and End go to the first and last cell of the row. Ctrl+Home and
              Ctrl+End go to the first and last cell of the grid. Page Up and Page Down move 10 rows.
            - A cell with one control focuses that control: the checkbox, the name link, the sort button or the
              row-actions button. Other cells take focus themselves.
            - Space on the checkbox toggles the row. Shift+Space toggles the row from any cell.
            - Enter on the name link opens the profile. Ctrl+Enter (Cmd+Enter) opens it in a new tab.
            - Enter or Space on a sort button sorts.
            - A cell with several controls: Enter or F2 moves into it, Tab cycles inside it, Esc goes back to cell
              navigation.
            Plain variant: the normal tab order through links and buttons.
  a11y      Grid: <table role="grid" aria-multiselectable="true">, labelled by the page title and described by the
            sort status. Rows carry aria-selected only when selection is on.
            When the total is known: aria-rowcount (total plus the header row) and aria-rowindex on each row, offset
            by the page start, so a screen reader says "row 27 of 1,285". When it is not known yet: aria-rowcount
            "-1".
            Headers: <th scope="col">. aria-sort only on the sorted column. The sort button's name is the column
            label.
            aria-busy="true" while loading or refreshing. The status region announces each completed change once.
            Markers are never colour alone: new and merged rows have sr-only text in the primary cell, and the New
            dot has a visible legend.
            The scroll container sets scroll-padding-top to the header height and scroll-padding-left to the sticky
            columns' width, so a focused cell is never under a sticky part (2.4.11). The footer bar sits outside the
            scroll container and never covers rows.
            Targets: checkboxes have 24 px hit areas, the row actions button is 24 px with no other target within
            24 px of it, sort buttons fill the 40 px header cell, and name links are full-height in the row.
            Pairs: text on surface, surface-hover, accent-subtle, surface-sunken; text-muted on surface,
            surface-hover, accent-subtle, surface-sunken; accent on surface, surface-hover, accent-subtle;
            border-input on surface, surface-hover, accent-subtle; on-accent on accent; danger on danger-subtle;
            focus-ring on surface, surface-hover, accent-subtle, surface-sunken.
  base      native <table>; a small roving-tabindex hook of our own for the grid; TanStack Table v8 (MIT, headless)
            for column, sort and selection state (new dependency, see Open questions); Card, Checkbox, IconButton,
            DropdownMenu, Pagination, StageBadge, StatusPill, MaskedValue, Avatar, Skeleton, EmptyState.
  used on   S05, S08 (embedded tabs), S16 (recipient report), S17, S21 (table widgets), S23, S25, S26, S32, S38,
            S39, S40, S41, M02.
```

#### ColumnChooser

```text
ColumnChooser
  purpose   Choose which columns a table shows, in what order, and how dense its rows are. Saved per person and per
            table.
  anatomy   Trigger: Button secondary sm with the Columns3 icon and the label "Columns".
            Popover (w-80, 320 px):
            - search field, when the table has more than 12 possible columns;
            - "Shown in table": a ReorderableList. Each row has a Checkbox with the column name, Move up and Move
              down IconButtons, and a pointer-only drag handle (GripVertical). A locked column shows a Lock icon in
              place of the checkbox and has no move buttons;
            - "Hidden": rows with a Checkbox and the column name. On S05 they are grouped as "Standard fields" and
              "Your fields" (custom fields);
            - "Row height": SegmentedControl sm with "Comfortable" and "Compact";
            - footer: the count "9 of 30 shown" and the link button "Reset to default".
            A polite status region announces moves.
  variants  lead list (S05, S26): search and the two field groups.
            short tables (S16, S25, S32, S38, S40): no search, one hidden list.
  sizes     popover w-80, max-h-96 (384 px) with overflow-auto in the list area. Rows h-menu-item (32 px) px-2.
            Move buttons xs (24 px). Handle 24 px. Section headings text-xs. The search field is SearchInput sm.
  states    default; searching (both lists filter; ticked rows always stay visible); no match; at the maximum of 20
            shown columns (unticked boxes get aria-disabled with the limit note); dragging (pointer only); moved;
            saving; save failed; locked column (Name: always shown and always first).
            Changes apply to the table at once. They are saved to member prefs (PATCH /me/prefs) 500 ms after the
            last change. If saving fails, a Toast says so and the table keeps the change until reload.
            Unticking a column moves it to "Hidden". Ticking a hidden column adds it at the end of "Shown".
  tokens    popover     bg-surface-raised border border-border rounded-lg shadow-pop z-(--z-popover)
            headings    text-xs font-medium text-muted
            row         rounded-sm hover:bg-surface-hover; label text-sm text-fg
            handle      text-muted cursor-grab
            dragging    bg-surface-raised shadow-pop; drop line h-0.5 bg-accent
            lock icon   text-muted
            count       text-xs text-muted tabular-nums
  content   Trigger "Columns". Headings "Shown in table", "Hidden", "Standard fields", "Your fields", "Row height".
            Search "Find a column". No match: "No column called "fee"." Count "9 of 30 shown".
            Limit: "You can show up to 20 columns. Hide one first."
            Lock tooltip and sr text: "Name is always shown first."
            Move names: "Move Course up", "Move Course down". Status: "Course moved to position 4 of 9."
            Reset: "Reset to default". Save failure toast: "Couldn't save your columns. They'll go back to the last
            saved set when you reload."
  keyboard  Enter, Space or Arrow Down on the trigger opens the popover, with focus on the search field or the first
            checkbox. Tab moves through each row's checkbox, Move up and Move down. The drag handle is not a tab stop.
            Alt+Arrow Up and Alt+Arrow Down on a row's checkbox move that row. Esc closes and returns focus to the
            trigger.
  a11y      The popover is role="dialog" labelled "Table columns". Both lists are <ul> with aria-labels.
            Move buttons use aria-disabled at the ends of the list, so focus stays on them after the last move.
            Every move is announced with the new position. The handle is aria-hidden; the buttons are the keyboard
            and single-pointer way to reorder (2.5.7).
            Targets: rows 32 px; move buttons 24 px, spaced 4 px apart inside 32 px rows.
            Pairs: text on surface-raised, surface-hover; text-muted on surface-raised, surface-hover; border-input
            on surface-raised, surface-hover; accent on surface-raised; on-accent on accent; text-muted on
            surface-sunken; focus-ring on surface-raised, surface-hover, surface-sunken.
  base      Radix Popover; ReorderableList (this group); Checkbox, SegmentedControl, SearchInput (group 1).
  used on   S05, S16, S25, S26, S32, S38, S40.
```

#### LeadSearch

```text
LeadSearch
  purpose   Find one lead fast by name, email, mobile, lead number or API ID. The person picks the key, or lets the
            field guess it.
  anatomy   SearchInput (group 1), "with scope picker" variant:
            - key picker on the left: a Select whose trigger shows the key in use;
            - <input type="search">; clear IconButton; the "/" hint;
            - a hint line under the field, shown only when the key needs more input.
            Results filter the table (S05, S26). There is no separate results popover.
  variants  S05 leads (all five keys); S26 opportunities (adds "Opportunity ID"); M02 (phase 2, full width).
            Keys and their matching:
            - Auto: guesses from the text. Contains "@": Email. Digits with an optional "#", 7 digits or fewer:
              Lead no. 8 to 15 digits, or starts with "+": Mobile. A UUID (36 characters with hyphens, or 32 hex
              characters without): API ID. Anything else: Name (from 2 characters). Group 1's SearchInput uses the
              same rule.
            - Name: 2 characters or more, any script, partial match through the trigram search. dir="auto".
            - Email: lower-cased; prefix match. inputmode="email".
            - Mobile: spaces, dashes, a leading 0 and "+91" are removed; prefix match on the national number.
              inputmode="tel".
            - Lead no.: the lead number (leads.ref_no, counted per institution); exact match; a leading "#" is
              ignored. inputmode="numeric".
            - API ID: the lead's UUID (leads.id), with or without hyphens; exact match; paste-friendly.
            Masked roles: Email and Mobile search need the full value and match exactly, so nobody can find hidden
            digits by trying prefixes. Results still show masked values.
  sizes     sm 32: picker w-32 (128 px) rounded-l-md, input w-72 (288 px) rounded-r-md. Under 640 px the field is
            full width and the picker shrinks to an icon-and-key label. Clear button xs (24 px). Hint text-xs.
  states    empty; typing; key guessed (the trigger reads "Auto: Mobile"); searching (spinner after 300 ms);
            results (the table shows them, the status says how many); one exact match (the single row shows; the
            status says "Lead #10234 found"); no match (the table's search EmptyState, with a suggestion to try
            another key); needs the full value (masked role, partial email or mobile: the hint explains and nothing
            is sent); not valid for the key (an API ID that is not a UUID); error.
            300 ms debounce; Enter searches at once. The query and the key are kept in the URL (?q=…&by=mobile).
            Esc clears the field.
  tokens    as SearchInput. Picker trigger text-sm text-fg; the guessed key in text-muted. Hint text-xs text-muted.
  content   Picker label (sr-only): "Search field". Options: "Auto (best guess)", "Name", "Email", "Mobile", "Lead
            no.", "API ID".
            Placeholders per key: "Search leads", "Name", "name@example.com", "Mobile number", "Lead no., like 10234",
            "API ID (UUID)".
            Hints:
            - "Enter the full mobile number. Contacts are hidden for your role, so partial matches are off."
            - "An API ID looks like 0192f3a1-7c2e-7b4d-9f10-2c5e8a1b3d4f. Check you copied all of it."
            - "Type at least 2 letters of the name."
            No-match suggestions: "No lead has this email. Try searching by mobile or name."
  keyboard  "/" focuses the input when single-key shortcuts are on (member preference, 2.1.4). Shift+Tab from the
            input reaches the picker. Enter, Space or Alt+Arrow Down opens the picker; arrows choose; Enter picks
            and returns focus to the input. Esc clears the input.
  a11y      Wrapped in <search>. The picker has the accessible name "Search field". The input's name changes with
            the key: "Search leads by mobile", "Search leads (best guess: mobile)".
            The hint is linked with aria-describedby and is shown, not announced. The result count goes through the
            table's status region.
            Targets: 32 px controls; the clear button is 24 px.
            Pairs: text on surface, surface-raised, surface-hover; text-muted on surface, surface-raised; border-input
            on surface; focus-ring on surface, surface-raised.
  base      SearchInput (group 1); Radix Select for the picker; server search through app.search_lead_ids for names
            and btree prefix matches for email and mobile (architecture).
  used on   S05, S26, M02.
```

#### QuickFilterBar

```text
QuickFilterBar
  purpose   One-click filters on the fields a person uses most, shown as chips above a list.
  anatomy   <div role="group" aria-label="Quick filters"> holding, in a wrapping row:
            - chips. Each chip is a Popover trigger button (field label, value summary, ChevronDown). An active chip
              adds a separate remove IconButton (X) joined to its right edge;
            - "More filters" Button (SlidersHorizontal icon, plus a count badge of advanced conditions). It opens
              the advanced filter panel: ConditionBuilder in a Drawer (S06);
            - "Manage" IconButton (Settings2), which opens QuickFilterManager;
            - "Clear all" link button, only while any filter is active.
            Chip popovers hold the value editor for the field's type:
            - picklists, stages, owners: a checkbox list with a search field, plus "Select all" and "Clear";
            - dates: DateRangePicker presets ("Today", "Last 7 days", "This month", "Custom");
            - yes or no fields: RadioGroup "Yes", "No", "Any";
            - numbers: two NumberSteppers, "from" and "to".
  variants  S05 leads. Default chips: Stage, Owner, Source, Created, Next follow-up, Verified, Course.
            S26 opportunities: List, Stage, Owner, Created. M02 (phase 2) as a horizontal scroller.
            Each person's chip set and order come from member prefs (QuickFilterManager).
  sizes     bar px-gutter py-3, gap-2, wraps to more lines. Chips h-control-sm (32 px) px-3 text-sm gap-1.5,
            rounded-md (an active chip: rounded-l-md, and its remove button rounded-r-md). Remove button 32 px
            square, icon 16 px. Popover w-72 (288 px), list max-h-72 with overflow-auto. Value summary max-w-48
            truncated.
            At most 8 chips (QuickFilterManager enforces it).
  states    inactive (label only); hover; focus-visible; open (aria-expanded="true"); active (value shown, remove
            button present); applying (the list shows its refresh line); invalid value (number "from" above "to":
            an inline error in the popover, and that range is not applied); field removed by an admin (the chip says
            "Field removed" and offers only remove); disabled (no permission for the field: hidden).
            Values apply as they change, 300 ms after the last change. The popover stays open while editing.
            Filters live in the URL, so Back undoes them and links can be shared.
            Changing a filter clears the table selection (DataTable says so).
  tokens    bar        bg-surface border-b border-border
            chip       bg-surface border border-input text-fg hover:bg-surface-hover
            active     bg-accent-subtle border-accent text-fg; value font-medium
            remove     text-muted hover:text-fg; same border and fill as its chip
            count badge  h-5 min-w-5 px-1.5 rounded-pill text-xs font-medium tabular-nums bg-accent text-on-accent
                       (the one count-badge size in the app)
            popover    bg-surface-raised border border-border rounded-lg shadow-pop
  content   Chip labels: "Stage", "Owner", "Source", "Created", "Next follow-up", "Verified", "Course".
            Active summaries: "Stage: Interested, Applied"; "Stage: Interested +2"; "Owner: Me"; "Created: Last 7
            days"; "Verified: Yes".
            Popover search placeholders: "Find a stage", "Find a person". Owner extras: "Me", "My team",
            "Unassigned". Buttons in popovers: "Select all", "Clear".
            Remove name: "Remove the Stage filter". Others: "More filters", "Manage quick filters", "Clear all
            filters".
            Range error: "The "from" number is bigger than the "to" number."
            Status (through the table): "Filters changed. 214 leads match."
  keyboard  Tab moves through chips and their remove buttons. Enter, Space or Arrow Down opens a chip's popover with
            focus on its first control. Tab moves inside; Esc closes and returns focus to the chip. Backspace or
            Delete on an active chip removes its filter.
  a11y      Chip: aria-haspopup="dialog" and aria-expanded. Its name starts with the visible text and then says what
            it is: "Stage: Interested, Applied. Filter" (2.5.3). The popover is role="dialog" labelled "Filter by
            stage".
            The remove button names the filter it removes.
            Result counts are announced once by the table's status region, after the debounce.
            Targets: chips and remove buttons 32 px.
            Pairs: text on surface, surface-hover, accent-subtle, surface-raised; text-muted on surface,
            accent-subtle, surface-raised; border-input on surface, surface-hover, accent-subtle, surface-raised;
            accent on accent-subtle; on-accent on accent; focus-ring on surface, accent-subtle, surface-raised.
  base      Radix Popover; Checkbox, RadioGroup, DateRangePicker, NumberStepper, SearchInput (group 1); Drawer
            (group 2) for "More filters".
  used on   S05, S06 (entry point), S26, M02.
```

#### QuickFilterManager

```text
QuickFilterManager
  purpose   Let each person choose which fields appear as quick filters, and in what order.
  anatomy   Dialog (dialog-md, 560 px):
            - title and one-line description;
            - "Shown" ReorderableList: each row has the field name, Move up, Move down and a Remove IconButton;
            - "Add a filter" Combobox with every filterable field, grouped "Standard fields", "Your fields",
              "Activity";
            - footer: "Reset to default" link button at the left, "Cancel" and "Save" at the right.
  variants  S05 leads; S26 opportunities (adds the opportunity list's fields).
  sizes     dialog-md. Rows h-menu-item (32 px). Move and Remove buttons xs (24 px). Combobox md (40 px). Footer
            buttons md (40 px).
  states    default; dirty; at the maximum of 8 (the Combobox is aria-disabled with the limit note); saving;
            saved (the dialog closes, the bar updates, and focus returns to the "Manage" button); save failed (an
            inline danger Alert; changes are kept); a field removed by an admin (its row says "Removed field" and
            offers only Remove).
            Esc or Cancel with changes asks "Discard your changes?" (FormLayout).
  tokens    dialog bg-surface-raised; rows as ReorderableList compact; limit note text-xs text-muted; error Alert
            danger (bg-danger-subtle text-fg).
  content   Title "Quick filters". Description "Pick up to 8 filters to keep above your list. Only you see this
            change."
            Add label "Add a filter"; placeholder "Choose a field". Limit "You have 8 quick filters. Remove one to
            add another."
            Row names "Move Stage up", "Move Stage down", "Remove Stage". Removed field "Removed field".
            Buttons "Reset to default", "Cancel", "Save". Error "Couldn't save your filters. Try again."
  keyboard  Focus starts on the first row's Move up button. Tab order: rows (Move up, Move down, Remove), the
            Combobox, the footer. Alt+Arrow Up and Alt+Arrow Down move the focused row. Enter in the Combobox adds
            the field to the end of the list. Esc closes (asks first if dirty).
  a11y      Radix Dialog with title and description. Moves, adds and removals are announced in a polite status
            ("Course added at position 8 of 8").
            Targets: 24 px buttons in 32 px rows; 40 px footer buttons.
            Pairs: text on surface-raised, surface-hover, danger-subtle; text-muted on surface-raised; border-input
            on surface-raised; danger on danger-subtle; on-accent on accent; focus-ring on surface-raised,
            danger-subtle.
  base      Dialog (group 2); ReorderableList (this group); Combobox, Button (group 1).
  used on   S05, S26.
```

#### SavedViewPicker

```text
SavedViewPicker
  purpose   Save the current filters, search, sort and columns as a named view, and switch between personal and
            shared views.
  anatomy   Trigger in the page title row: Button ghost sm with the view's name and ChevronDown. When the current
            state differs from the saved view, a dot and the word "Edited" follow the name.
            DropdownMenu:
            - label "Views";
            - radio group "Built in": "All leads", "My leads";
            - radio group "My views";
            - radio group "Shared": each item shows its owner's name under it;
            - separator, then actions: "Save as new view…", "Save changes to {view}" (only for the owner, and only
              when edited), "Reset changes" (only when edited), "Manage views…".
            Save dialog (dialog-sm): Name (TextInput, required, at most 60 characters) and "Who can use it"
            (RadioGroup: "Only me", "Everyone at {Institution}").
            Manage dialog (dialog-md): my views with Rename, Share or Stop sharing, Duplicate and Delete; shared
            views from others with Duplicate only.
  variants  list views (S05, S26, M02); audience picker (S16): a Combobox of saved filters with each one's match
            count, used to choose a broadcast audience. It does not save or edit views.
  sizes     trigger h-control-sm (32 px) text-sm font-medium, max-w-64 truncated. Menu min-w-64, items h-menu-item
            (32 px); shared items two lines (min-h-11). Menu max-h-96 with overflow-auto.
  states    default view selected; another view selected; edited (dot and "Edited"); saving; saved; name taken;
            not the owner (no "Save changes"; "Save as new view…" is offered instead); view deleted by its owner
            while open (falls back to "All leads" with a Toast); a filter in the view uses a removed field (the view
            loads, ConditionBuilder marks that condition invalid, and an Alert says so); delete confirm.
            A shared view shares the filters, not the data. Each person sees only the records their role and data
            scope allow.
            The view id lives in the URL (?view=…). Edits on top of a view live in the URL too.
  tokens    trigger     text-fg; edited dot size-2 rounded-pill bg-accent; "Edited" text-xs text-muted
            menu        bg-surface-raised border border-border rounded-lg shadow-pop
            group label text-xs font-medium text-muted px-2
            item        text-sm text-fg data-[highlighted]:bg-surface-hover rounded-sm; the checked item shows Check
                        in text-accent
            owner line  text-xs text-muted; shared icon Users text-muted
  content   Built-in views "All leads", "My leads". Examples: "Hot leads, October intake"; shared "Unassigned this
            week" with "Shared by Ravi Kumar".
            Actions "Save as new view…", "Save changes to Hot leads", "Reset changes", "Manage views…".
            Save dialog: title "Save view"; label "Name"; "Who can use it"; options "Only me" and "Everyone at
            {Institution}"; note "Everyone sees only the leads their role allows."; buttons "Cancel" and "Save
            view".
            Errors: "You already have a view called "Hot leads". Pick another name." "Give the view a name."
            Not owner: "Only Ravi Kumar can change this view. Save a copy instead."
            Deleted: Toast "This view was deleted by its owner. Showing All leads."
            Delete confirm: title "Delete "Hot leads"?"; body "People who use this shared view will lose it. Their
            own views aren't affected."; buttons "Cancel" and "Delete view".
  keyboard  Enter, Space or Arrow Down opens the menu. Arrows move, typing jumps to a view by name, Enter picks
            and closes. Esc closes and returns focus to the trigger.
  a11y      Radix DropdownMenu: views are menuitemradio with aria-checked inside labelled groups.
            Trigger name: "View: Hot leads, edited".
            Dialogs follow FormLayout (errors under fields, focus to the first invalid field).
            Targets: 32 px trigger and items.
            Pairs: text on surface, surface-raised, surface-hover; text-muted on surface, surface-raised,
            surface-hover; accent on surface, surface-raised, surface-hover; on-accent on accent; focus-ring on
            surface, surface-raised, surface-hover.
  base      Radix DropdownMenu; Dialog (group 2); TextInput, RadioGroup, Combobox (group 1).
  used on   S05, S16, S26, M02.
```

#### ConditionBuilder

```text
ConditionBuilder
  purpose   Build AND and OR rules on any field, with one level of nested groups. Used for advanced filters,
            broadcast audiences, automation conditions, report filters and stage-rule scope.
  anatomy   Root <fieldset> with <legend>Conditions</legend> (sr-only when a Drawer or panel title already says
            it). Its first child is a sentence row: <span id="cb-pre">Leads that match</span>, then the "all | any"
            control, then <span id="cb-post">of these conditions</span>. The control is SegmentedControl sm (options
            "all" and "any") rendered as <div role="radiogroup" aria-labelledby="cb-pre cb-post"> holding the native
            radios, with no inner fieldset. A legend holds plain text only.
            Condition rows, in order. Each row has:
            - a connector word ("and" or "or") before every row except the first;
            - Field: Combobox, grouped "Standard fields", "Your fields", "Activity";
            - Operator: Select, with the operators for the field's type;
            - Value: an editor that fits the field and operator;
            - Remove IconButton (X).
            Nested group: a bordered <fieldset> with <legend>Group 2</legend>, its own sentence row ("Match [any]
            of:", the same radiogroup pattern), its own rows, "Add condition" and "Remove group".
            Footer: "Add condition", "Add group" (root only), a plain-language summary, and in S06 and S16 a match
            count. Error summary on Apply (FormLayout).
            Value editors:
            - text: TextInput;
            - number: NumberStepper, or two for "is between";
            - date: DatePicker, DateRangePicker, or "in the last [N] days" and "in the next [N] days";
            - picklist, stage, course, campus: Combobox with several values;
            - owner: member Combobox with "Me", "My team", "Unassigned";
            - yes or no: Select "Yes", "No";
            - activity (calls, messages, follow-ups): a sub-row such as "Calls [connected] [at least] [1] in [the
              last 7 days]".
            Operators by type:
            - text: is, is not, contains, doesn't contain, starts with, is empty, isn't empty;
            - number: is, is not, is more than, is less than, is at least, is at most, is between, is empty;
            - date: is on, is before, is after, is between, in the last, in the next, is today, is empty;
            - picklist: is any of, is none of, is empty, isn't empty;
            - owner: is any of, is none of, is unassigned;
            - yes or no: is.
  variants  advanced filter (S06, inside a Drawer on S05, S16, S26): Apply, "Save as view", match count.
            audience (S16): live match count, saved as a saved filter.
            automation condition (S18, in the step's settings panel): adds trigger context fields such as
            "Previous stage" and "Changed field"; no count.
            report filter (S22).
            stage-rule scope (S29): one group, the field fixed to Stage, operator "is any of".
  sizes     controls h-control-sm (32 px). Field w-48 (192 px), Operator w-40 (160 px), Value flex-1 min-w-48.
            Remove button sm (32 px). Rows gap-2, rows apart by gap-3. Nested group p-3, mt-1.
            Limits: 30 conditions in total; groups nest one level only; a value list shows up to 3 values and then
            "+N".
  states    empty ("No conditions yet." and "Add condition"); valid; incomplete row (being edited, not yet an error);
            invalid row; invalid group (empty group); at the limit (Add buttons aria-disabled with the limit note);
            counting; count failed; read-only (a shared view you don't own, or a published automation version);
            masked contact fields; applying.
            Row errors:
            - no field, no operator or no value;
            - wrong type ("Enter a number");
            - "is between" with the first value above the second;
            - a removed field;
            - a removed picklist value.
            Errors show on Apply or Save, or when a filled row loses focus (FormLayout timing).
            Masked roles: email and mobile offer only "is empty", "isn't empty" and "is verified", so values cannot
            be probed.
            Removing a row moves focus to the next row's Field, or to "Add condition".
            The summary updates as rows change, for example: "Stage is Interested or Applied, and Source is Google
            Ads, and (City is Pune or City is Nashik)".
            The count runs 500 ms after the last valid change, through the server under the person's data scope.
  tokens    root        bg-surface
            connector   text-xs font-medium text-muted, w-10 text-right
            nested      bg-surface border border-strong rounded-lg p-3
            invalid     the control gets border-danger; the message under the row is text-xs text-danger with
                        CircleAlert
            summary     text-sm text-muted
            count       text-sm text-fg tabular-nums
            In the Drawer the same utilities sit on surface-raised.
  content   Legends "Conditions" and "Group 2". Sentence rows: "Leads that match [all] of these conditions" and
            "…[any] of these conditions"; nested "Match [any] of:".
            Buttons "Add condition", "Add group", "Remove group". Remove name: "Remove condition 2: Stage is
            Interested".
            Placeholders "Choose a field", "Choose how to compare", "Choose values".
            Errors: "Choose a field." "Choose how to compare." "Enter a value." "Enter a number." "The first number
            must be smaller than the second." "This field was removed. Pick another field or delete this
            condition." ""Hindi" is no longer on the list. Pick another value." "Add a condition to this group, or
            remove the group."
            Limit: "You can add up to 30 conditions."
            Empty: "No conditions yet. Every lead is included."
            Count: "About 1,240 leads match." Count failed: "Couldn't count the matches. Your conditions are kept."
            Drawer footer: "Clear all", "Save as view", "Apply".
  keyboard  Tab order follows the rows: Field, Operator, Value, Remove, then the group's add buttons. Arrow keys
            switch "all" and "any". Ctrl+Enter (Cmd+Enter) applies in the Drawer. Esc closes the Drawer (asks first
            if there are unapplied changes).
  a11y      The root and each nested group are <fieldset>s with a plain-text legend ("Conditions", "Group 2"). The
            "all | any" control is a role="radiogroup" named by the words around it, never placed inside a legend:
            a control in a legend is invalid HTML and spoils both the group's name and the control's (1.3.1, 4.1.2).
            Each row is role="group" with a name that includes its connector: "Condition 2 of 4, and".
            Each control has its own label (visible on the first row, sr-only on later rows: "Field", "Comparison",
            "Value"). Errors are linked to their control with aria-describedby.
            The match count is in a polite status region. The summary is plain text, not live.
            Targets: 32 px controls and remove buttons.
            Pairs: text on surface, surface-raised; text-muted on surface, surface-raised; border-input on surface,
            surface-raised; danger on surface, surface-raised; text-muted on surface-sunken; on-accent on accent;
            focus-ring on surface, surface-raised, surface-sunken.
  base      native <fieldset>; Combobox, Select, TextInput, NumberStepper, DatePicker, DateRangePicker,
            SegmentedControl (group 1); Drawer (group 2).
  used on   S06 (on S05, S16, S26), S16, S18, S22, S29.
```

#### BulkActionBar

```text
BulkActionBar
  purpose   Act on many selected records at once, and follow the job to its end.
  anatomy   The left part of the table's footer bar (group 2's Pagination is the right part). This bar is the one
            bulk-action pattern; group 2's DropdownMenu supplies only its More menu. Depending on state:
            - selection: the count, "Clear selection", then Radix Toolbar buttons: "Reassign" (Users), "Change
              stage" (ArrowRightLeft), "Send message" (Send), "Export" (Download), and "More" (Ellipsis) with
              "Update a field", "Unassign", "Send to a webhook", separator, "Delete";
            - running: the job label, a progress bar, "140 of 312 done", and "Cancel" when the job can stop;
            - result: a warning or danger segment with the outcome and its buttons.
            Each action opens its own dialog first: S13 reassign, S10 compose, S09 change stage, export columns,
            update a field, delete confirm. Confirming starts a job (POST /leads/bulk).
  variants  S05 leads (the actions above); S26 opportunities (Reassign, Change stage, Export, Delete); S25 payments
            (Export, Approve offline payments); S32 users (Change role, Turn off, Turn on).
  sizes     inside the footer bar h-pagebar (56 px), px-4, gap-2. Buttons sm (32 px) with 16 px icons; below the xl
            breakpoint (1280 px) the action buttons drop their labels into tooltips, keeping the names. Progress
            bar h-1.5 w-48. Result segment rounded-md px-3 py-1.5.
            Below lg (1024 px) the footer bar wraps: this part on the first line, pagination on the second.
  states    disabled (nothing selected): the hint text and the action buttons with aria-disabled and the hint as
            their reason.
            enabled: the count and the actions. Actions the role can never use are hidden.
            all matching selected: "All 1,284 matching leads selected". The job runs on the filter as it was when
            the job started.
            running: other actions aria-disabled ("Wait for the current job to finish."). People can keep
            browsing; the selection stays. Leaving the page does not stop the job; a Toast reports the end.
            cancelling: "Stopping…". Rows already done stay done.
            done: the bar returns to the disabled state, the selection clears, and a Toast reports the result.
            partial failure: the warning segment, with "Download report" (a CSV of rows and reasons), "Select
            skipped leads" (replaces the selection with them) and "Dismiss".
            failed: the danger segment with "Try again".
            connection lost while polling: the label says it is still working, and polling resumes on reconnect.
            Delete confirm is ConfirmDialog (group 2): the typed variant when more than 100 leads are selected ("Type
            312 to confirm"), the plain one otherwise. Deleted leads are hidden everywhere; payments and consent
            records are kept.
  tokens    count       text-sm font-medium text-fg tabular-nums; hint text-sm text-muted
            buttons     Button secondary sm; "Delete" is in the More menu with text-danger on its item
            progress    track bg-surface-sunken rounded-pill, bar bg-accent rounded-pill
                        (motion-safe:transition-[width] duration-base)
            warning     bg-warning-subtle text-fg rounded-md, TriangleAlert text-warning; buttons Button link
            danger      bg-danger-subtle text-fg rounded-md, CircleAlert text-danger
            The bar itself is the footer: bg-surface-subtle border-t border-border.
  content   Hint: "Select leads to act on them."
            Count: "25 selected", "All 1,284 matching leads selected". "Clear selection".
            Running: "Reassigning 312 leads…", "140 of 312 done", "Cancel", "Stopping…".
            Done toasts: "Reassigned 312 leads to Ravi Kumar and Sana Shaikh." "Stage changed for 312 leads to
            Applied." "Export ready." with "Download".
            Partial: "Changed 298 of 312 leads. 14 were skipped: 9 have a locked stage, 5 would move to an earlier
            stage."
            Buttons "Download report", "Select skipped leads", "Dismiss".
            Failed: "The job stopped before changing any leads." with "Try again".
            Lost connection: "Still working. We'll update this when the connection is back."
            More menu name: "More actions for selected leads".
            Delete dialog (the one copy for deleting leads, as in group 2's ConfirmDialog): title "Delete 312
            leads?"; body "They'll be hidden from every list and report. Their payments and consent records are
            kept. You can't undo this."; typed field "Type 312 to confirm" (over 100 leads); buttons "Cancel" and
            "Delete 312 leads".
  keyboard  The footer bar follows the table in tab order. The toolbar is one tab stop; Left and Right move between
            its buttons. Enter or Space activates. "Clear selection" returns focus to the table's select-all
            checkbox. After a dialog closes, focus returns to the button that opened it.
  a11y      Radix Toolbar, role="toolbar", aria-label="Actions for selected leads".
            Selecting the first row announces once: "1 selected. Actions are below the table."
            Progress: role="progressbar" with aria-valuenow, aria-valuemin 0, aria-valuemax (the total) and
            aria-valuetext "140 of 312 done". The polite status announces the start, each quarter and the end.
            The result is announced in the same status; focus does not move.
            aria-disabled buttons stay focusable and are described by the hint.
            Targets: 32 px buttons, at least 8 px apart.
            Pairs: text on surface-subtle, surface-hover, warning-subtle, danger-subtle, surface-raised; text-muted
            on surface-subtle; accent on surface-sunken, warning-subtle, danger-subtle; warning on warning-subtle;
            danger on danger-subtle, surface-raised; on-accent on accent; focus-ring on surface-subtle,
            warning-subtle, danger-subtle.
  base      Radix Toolbar and DropdownMenu; Dialog, ConfirmDialog (group 2); Button (group 1); job polling hook.
  used on   S05, S13 (progress), S25, S26, S32.
```

---

### B. Stages, journey and the lead profile

#### StageBadge

```text
StageBadge
  purpose   Show a lead's stage and sub-stage in one compact label, and whether a rule locks it for the viewer.
  anatomy   static: <span> pill holding the stage name, then an aria-hidden "·" and the sub-stage name. When a rule
            locks the stage for the viewer, a Lock icon comes first.
            interactive: <button> with the same content plus ChevronDown. It opens the Change stage dialog (S09).
            When locked, a separate "Why is this locked?" IconButton xs (Lock icon) follows it and opens a Popover
            with the reason.
  variants  static (tables, timeline, inbox side panel, M02); interactive (S08 header, S27); new (the built-in first
            stage, named "New": the same pill with the vocabulary's CircleDot icon); turned off (a stage disabled in
            settings that old leads still carry: the name plus "(turned off)" in text-muted).
            Stages have no colours. They are each institution's own words, so a colour would have no fixed meaning
            (see Open questions).
  sizes     static: h-chip (24 px) px-2 rounded-sm text-xs font-medium gap-1, icon 12 px (size-3). max-w-64 (256 px),
            truncated with pt-0.5 pb-1 kept.
            interactive: h-control-sm (32 px) px-3 rounded-md text-sm gap-1.5, icon 16 px. Lock button 24 px.
  states    default; with sub-stage; new; locked; turned off; hover and focus-visible (interactive); disabled
            (interactive, the role can view but not change stages: aria-disabled with the reason); saving (after a
            change, a spinner replaces the chevron until the server confirms; on failure the old value returns and
            a Toast explains).
            Locked means a stage rule blocks this viewer: "lock" (only listed people may change it) or
            "only_users". "No moving back" does not lock the badge; it limits the choices in StagePicker.
  tokens    static       bg-surface-sunken text-fg; sub-stage text-muted; icons text-muted
            interactive  bg-surface border border-input text-fg hover:bg-surface-hover
            turned off   "(turned off)" text-muted
            lock popover bg-surface-raised border border-border rounded-lg shadow-pop p-3 text-sm text-fg
  content   "New"; "Interested · Campus visit planned"; "Applied"; "Not interested · Fees too high";
            "Enrolled"; "Follow up later (turned off)".
            Interactive name: "Stage: Interested, Campus visit planned. Change stage".
            Lock reasons:
            - "Locked by a stage rule. Only Asha Nair and the Admissions heads team can change this stage."
            - "Only the Admissions heads team can move leads into Enrolled."
            Disabled reason: "Your role can see stages but not change them."
            Save failure toast: "Couldn't change the stage. It's back to Interested."
  keyboard  Static: not focusable. Interactive: Tab, then Enter or Space opens the dialog. The lock button: Enter
            opens the reason; Esc closes it and returns focus.
  a11y      The separator is aria-hidden and replaced by sr-only ", sub-stage ". Locked adds sr-only ", locked".
            A stage is never shown by colour or icon alone; the name is always text.
            The lock reason opens on click or Enter (a toggletip), not on hover only, so touch and keyboard users
            reach it.
            Targets: the interactive badge is 32 px; the lock button is 24 px. The static badge is not a target.
            Pairs: text on surface-sunken, surface, surface-hover, surface-raised; text-muted on surface-sunken,
            surface, surface-hover; border-input on surface, surface-hover; focus-ring on surface.
  base      native <span> and <button>; Radix Popover for the lock reason; Toast (group 2).
  used on   S04, S05, S08, S09, S15 (side panel), S26, S27, S29 (preview), M02, M03.
```

#### StagePicker

```text
StagePicker
  purpose   Choose a new stage and sub-stage. Show which moves the stage rules allow for this person and this
            lead, and why the others are blocked.
  anatomy   Field "Stage": Combobox (single choice). Options in the configured stage order. Each option has the
            stage name, "Current" on the lead's current stage, and on a blocked option a Ban icon and a one-line
            reason.
            Field "Sub-stage": Select. It shows only when the chosen stage has sub-stages. It is required when the
            stage says so.
            Rule hints under the fields ("Interested needs a sub-stage and a follow-up date").
            In S09 the picker drives the rest of the form: the follow-up DateTimePicker (required, read-only or
            optional) and the remark Textarea (required, hidden or optional).
            How each stage rule shows here:
            - lock: the whole picker is aria-disabled with the reason, for everyone not listed on the rule;
            - only_users: the stage is a blocked option for everyone not listed;
            - no_move_down: stages earlier in the order are blocked options;
            - lock_follow_up: the follow-up field is read-only with the reason;
            - no_remarks: the remark field is replaced by a line of text saying remarks are off;
            - remark_required: the remark field becomes required;
            - no_messages: not shown here; MessageComposer handles it.
            Stage flags: follow_up_required makes the follow-up date required; sub_stage_required makes the
            sub-stage required.
  variants  single lead (S09 from S08, S15, M03): rules checked for this lead and this person.
            bulk (S05 change stage, S13): no option is blocked up front, because rules differ per lead. A note says
            blocked leads are skipped and listed in the report.
            filter (QuickFilterBar, ConditionBuilder): several stages, no rules, no sub-stage field.
  sizes     triggers h-control-md (40 px) in dialogs. Listbox width matches the trigger, at least 280 px; max-h-80
            (320 px) with overflow-auto. Options min-h-menu-item (32 px) px-2; an option with a reason is two lines
            (py-1.5). Reason text-xs.
  states    closed; open; option highlighted; current stage (selectable: it lets the person change only the
            sub-stage); blocked option (aria-disabled, still reachable with the arrow keys so its reason is read;
            Enter does nothing); whole picker locked; sub-stage hidden (the stage has none); sub-stage required and
            missing (error on submit); loading stages (the Combobox's loading state); stages changed by an admin
            while open (the server rejects the save; the error asks the person to pick again); server rejection of a
            rule the UI did not know about (shown as the field error).
            The server checks every rule again on POST /leads/:id/stage. The picker only explains.
  tokens    option       text-sm text-fg data-[highlighted]:bg-surface-hover rounded-sm
            selected     Check icon text-accent
            current tag  text-xs text-muted
            blocked      label text-muted, Ban icon text-muted, reason text-xs text-muted
            hint         text-xs text-muted
            error        as Field (text-danger)
  content   Labels "Stage", "Sub-stage". Placeholders "Choose a stage", "Choose a sub-stage".
            Reasons:
            - "Stages here only move forward."
            - "Only the Admissions heads team can move leads here."
            - "This lead's stage is locked. Only Asha Nair can change it."
            Hints: "Interested needs a sub-stage and a follow-up date." "Applied needs a remark."
            "Remarks are turned off for Not interested." "The follow-up date is locked at this stage."
            No sub-stages: the field is hidden; nothing is said.
            Errors: "Choose a sub-stage for Interested." "This stage list changed while you were working. Choose the
            stage again."
            Bulk note: "Leads whose stage rules block this move are skipped. You'll get a list of them."
  keyboard  Combobox: Enter or Alt+Arrow Down opens; typing filters; arrows move, blocked options included; Enter
            picks an allowed option; Esc closes. Tab moves to the sub-stage field when it shows.
  a11y      role="combobox" with a listbox. A blocked option has aria-disabled="true"; its reason is part of the
            option's text, so it is read when highlighted. The current option ends with sr-only "(current)".
            When the chosen stage makes other fields required, the dialog's polite status says so once:
            "Interested needs a sub-stage and a follow-up date."
            Targets: 40 px triggers; 32 px options.
            Pairs: text on surface-raised, surface-hover; text-muted on surface-raised, surface-hover; accent on
            surface-raised, surface-hover; border-input on surface-raised; danger on surface-raised; focus-ring on
            surface-raised, surface-hover.
  base      Combobox (group 1, Downshift) and Select; Field and FormLayout for the S09 form.
  used on   S05 (bulk), S08, S09, S15, S26, S27, M03.
```

#### JourneyBar

```text
JourneyBar
  purpose   Show how far a lead has come through the six admission milestones, and when each one was reached.
  anatomy   <ol aria-label="Admission journey"> with six <li> steps. Each step has a marker (an icon in a 24 px
            circle), a label, the date reached or "Not yet", and a connector line to the next step.
            Steps and their data (the labels are ours; the data fields keep their names):
            1 "New enquiry": the lead's created time (the lead starts unverified);
            2 "Contact verified": the first of email_verified_at and mobile_verified_at;
            3 "Form started": application_started_at;
            4 "Form fee paid": payment_approved_at;
            5 "Form submitted": application_submitted_at;
            6 "Seat booked": token_fee_paid_at (the student is enrolled).
            The form is ours: round markers joined by thin lines, not chevron blocks, with no tinted current block
            and no count badges.
  variants  horizontal (md and up): steps share the width; labels under the markers.
            vertical (below md, and in the S15 side panel): one step per line; the connector runs down the left.
            compact (S05 "Journey" column): six size-2 dots plus text "3 of 6 · Form started".
  sizes     marker size-6 (24 px), icon 16 px. Connector h-0.5 (2 px; w-0.5 when vertical). Label text-sm; date
            text-xs. Steps min-w-28 (112 px). Horizontal bar about 72 px tall. Compact dots size-2 with gap-1.
  states    Per step:
            - reached: CircleCheck marker; label text-fg; the date.
            - current: the furthest step reached. Filled marker with the step number; label font-semibold;
              aria-current="step".
            - not reached: an empty ring; label text-muted; "Not yet".
            - not recorded: a step before the current one that has no date (for example a token fee paid with no
              submitted application on record). CircleDashed marker; label text-muted; "Not recorded".
            For the bar:
            - loading: Skeleton markers and labels;
            - read-only: the bar has no controls, so merged and on-hold leads look the same;
            - erased lead: the dates stay; they are not personal data.
            Connector: the segment before a reached step is accent; the others are border-strong.
  tokens    reached marker   CircleCheck text-accent
            current marker   bg-accent text-on-accent rounded-pill
            empty ring       border-2 border-input rounded-pill
            not recorded     CircleDashed text-muted
            connector        reached bg-accent; otherwise bg-strong
            labels           text-fg or text-muted; dates text-xs text-muted
            compact dots     reached bg-accent; others border border-input
  content   Labels: "New enquiry", "Contact verified", "Form started", "Form fee paid", "Form submitted", "Seat
            booked". The status vocabulary uses the same words ("Form started", "Form submitted").
            Dates "06 Oct 2026". Placeholders "Not yet", "Not recorded". Compact "3 of 6 · Form started".
            Where each date came from is shown in the Timeline, not here.
  keyboard  None. The bar holds no controls.
  a11y      An ordered list, so the step count and order are read. Each step starts with sr-only "Step 3 of 6: ".
            The marker icons are aria-hidden; the state is in words: the date, "Not yet" or "Not recorded".
            The current step has aria-current="step".
            The compact variant is one text string with the dots aria-hidden.
            Targets: none; the bar has no controls.
            Pairs: text on surface; text-muted on surface; accent on surface; on-accent on accent; border-input on
            surface.
  base      native <ol>; Skeleton (group 2).
  used on   S05 (compact column), S08, S15 (side panel), M03.
```

#### LeadProfileHeader

```text
LeadProfileHeader
  purpose   The top of a lead's profile: who the student is, how to reach them, where they are in admission, who
            owns them, what to do next, and the main actions.
  anatomy   One card. Our layout is a single header with a fact list, not a strip of separate summary cards.
            Alerts above the card (group 2's compliance catalogue), when they apply: lead_merged, minor_pending,
            minor_refused, minor_limits, lead_restricted.
            Row 1, identity:
            - Avatar lg (initials);
            - name as the page's <h1> (dir="auto");
            - "Lead #10234" with a CopyButton;
            - StageBadge (interactive);
            - badges, as StatusPills from the status vocabulary: "New" (info), the guardian-consent pill, "Merged"
              and "On hold" (neutral);
            - actions on the right: "Call" (Button secondary; opens CallAction, which asks for the call purpose
              first), "Message" (menu: Email, SMS, WhatsApp), "Change stage" (Button primary), "Add follow-up", and
              "More" (Add note, Log a call, Reassign, Payment link, Merge with another lead, Resend verification,
              Copy profile link, Copy API ID).
            Row 2, contacts:
            - Email: MaskedValue, then "Verified" (BadgeCheck) or "Not verified" with a "Send check" link button;
            - Mobile: the same, plus "+1 more" when alternate numbers exist;
            - "Open WhatsApp chat" link when a conversation exists.
            Row 3, facts as a DescriptionList (grid):
            - Owner: Avatar sm and name, "+1" for co-owners, and a "Reassign" link button;
            - Source: first and latest source;
            - Next follow-up: date, time and zone, with an "Overdue" pill when past;
            - Created; Last active (a relative time);
            - Score: the score and its percentile ("42 · top 12%", NumberText's score form), or for minors "Not
              scored";
            - Messages sent: counts per channel;
            - Last call: outcome, duration and time, or "No calls yet";
            - Enquiries: the number of enquiries and the latest date, shown when more than one.
            JourneyBar follows the card (its own component).
  variants  full (S08 at md and up): facts in 3 columns (md) or 4 (xl).
            stacked (below md): actions collapse into "Change stage" and "More"; facts in 2 columns.
            compact sticky: a h-pagebar bar with name, StageBadge, "Call", "Message" and "Change stage". It renders
            only while the full header is out of view (IntersectionObserver; the hidden attribute otherwise), so its
            buttons never double the tab order.
            side panel (S15): name, StageBadge, contacts, owner, next follow-up and an "Open profile" link.
            opportunity (S27): the opportunity name, its list, stage and owner, with a link to the lead. Saving key
            fields that match another opportunity of the same student is refused with a field error and an "Open
            it" link.
  sizes     card p-5 (20 px) gap-4 rounded-lg. Name text-xl leading-prose (24/39 px, so a wrapped name keeps room
            for deep Indic subscripts). Avatar lg 40 px. Action buttons sm (32 px).
            Facts grid gap-x-6 gap-y-3; dt text-xs font-medium, dd text-sm. Copy and info buttons xs (24 px).
            Banners take the card's width, mb-4.
  states    loading (Skeleton shaped like the card); default.
            Contacts:
            - masked (MaskedValue, with "Show" only for roles allowed to reveal);
            - revealed (writes an audit row; masked again on navigation);
            - unverified, verification sent ("Check sent 2 min ago").
            Under 18:
            - consent pending: Alert minor_pending (warning). "Call", "Message", "Change stage", "Payment link" and
              "Reassign" are aria-disabled with the reason. "Resend consent request" and "Add note" stay. The score
              fact reads "Not scored".
            - consent given: the pill "Guardian consent given" and Alert minor_limits (info). Messages and calls
              are allowed for service and transactional purposes only. Still no score.
            - consent refused: Alert minor_refused (danger); every action except "Add note" is aria-disabled.
            Record:
            - merged (this is the duplicate): Alert lead_merged (neutral); the record is read-only and every action
              is hidden except "Open main record";
            - on hold (DPDP retention hold): Alert lead_restricted (neutral); every action is aria-disabled;
            - erased: name and contacts read "Erased"; no actions;
            - no permission: the page shows "You don't have access to this lead." instead of the header.
            Other:
            - stage locked for this viewer (see StageBadge);
            - no owner ("Unassigned" and an "Assign" link button);
            - overdue follow-up;
            - channel opted out (the Message menu item shows "SMS (opted out)" and is aria-disabled);
            - call starting or blocked (CallAction's states);
            - opportunity key fields already used (S27: the field error);
            - view-only role (actions hidden).
  tokens    card          Card: bg-surface border border-border rounded-lg
            name          text-xl leading-prose text-fg; lead number text-sm text-muted tabular-nums
            dt and dd     text-muted and text-fg (DescriptionList)
            verified      BadgeCheck and "Verified" in text-success (vocabulary: Verified)
            not verified  CircleDashed and "Not verified" in text-muted (vocabulary: Not verified)
            overdue       StatusPill danger
            badges        StatusPill by vocabulary value: New info; guardian consent pending warning, given success,
                          refused danger; Merged and On hold neutral (bg-surface-sunken text-fg)
            alerts        Alert (group 2) per catalogue key: minor_pending warning, minor_refused danger,
                          minor_limits info, lead_merged and lead_restricted neutral
            sticky bar    bg-surface border-b border-border shadow-bar sticky top-[var(--layout-header)]
                          z-(--z-sticky). While shown it sets --sticky-extra: var(--layout-pagebar) on <html> and
                          clears it when hidden, so html's scroll padding keeps a focused field or tab clear of it
                          (AppShell, 2.4.11).
  content   Fact labels: "Owner", "Source", "Next follow-up", "Created", "Last active", "Score", "Messages sent",
            "Last call", "Enquiries".
            Values:
            - "Asha Nair +1"; "Unassigned".
            - "Instagram ad (first) · Website form (latest)".
            - "07 Oct 2026, 11:00 am IST", with the pill "Overdue".
            - "42 · top 12%"; "Not scored".
            - "Email 4 · SMS 2 · WhatsApp 7".
            - "Missed · 06 Oct, 2:30 pm"; "Connected · 4 min · yesterday"; "No calls yet".
            - "3 times · latest 05 Oct 2026".
            Badges: "New", "Guardian consent pending", "Guardian consent given", "Guardian refused", "Merged", "On
            hold".
            Alerts: the catalogue's title and body, with lead details filled in:
            - lead_merged: "This record was merged" / "It's now part of Meera Pillai (lead #10233) and can't be
              edited." with "Open Meera Pillai";
            - minor_pending: "Waiting for guardian consent" / "Meera is under 18. Until a parent or guardian agrees,
              you can't call, message or assign Meera." plus "We sent a request to +91 ••••• •3210 on 05 Oct." with
              "Resend consent request";
            - minor_refused: "Guardian refused consent" / "We've stopped using Meera's details. They're kept only as
              the law requires.";
            - lead_restricted: "This lead is on hold" / "After a request to erase or withdraw, the details are kept
              only as the law requires and can't be used."
            Disabled reasons: "Meera is under 18 and no guardian has agreed yet." "This lead is on hold."
            Score sr text for minors: "Not scored: scores are off for students under 18."
            Opportunity key fields: "This student already has an opportunity in MBA 2027 for Pune campus." with
            "Open it".
            Copy names: "Copy lead number", "Copy API ID". Action names as their labels.
  keyboard  Tab order: alert actions, copy lead number, StageBadge, the lock button if any, the actions left to right,
            the contact controls, the fact links. Enter or Space activates; the menus use arrow keys.
            No single-key shortcuts.
  a11y      The name is the page's only <h1>. Facts are a <dl>. Verified status is a word, not only an icon.
            Alerts are static on load; when an action changes them (consent request sent), the page's polite
            status announces it once.
            aria-disabled actions are described by the reason. MaskedValue gives the masked contact its own name
            ("Mobile number hidden, ends in 3210").
            The relative "Last active" time is a RelativeTime with the absolute time in its tooltip and name.
            The compact sticky bar never covers what has focus: it sits below the header and adds its height to the
            scroll padding while shown.
            Targets: action buttons 32 px; copy, Show and link buttons at least 24 px.
            Pairs: text on surface, surface-sunken, surface-subtle, warning-subtle, info-subtle, danger-subtle,
            success-subtle; text-muted on surface, surface-sunken, surface-subtle; success on surface,
            success-subtle; warning on warning-subtle; danger on danger-subtle; info on info-subtle; accent on
            surface; on-accent on accent, accent-hover; focus-ring on surface, surface-subtle, warning-subtle,
            info-subtle, danger-subtle.
  base      native <header> and <h1>; Card, DescriptionList, Avatar, MaskedValue, StatusPill, Alert, RelativeTime,
            DateText, NumberText, Toast (group 2); Button, IconButton, CopyButton (group 1); Radix DropdownMenu;
            StageBadge, JourneyBar, CallAction, PaymentLinkDialog (this group).
  used on   S08, S15 (side panel), S27 (opportunity variant), M03.
```

#### Timeline

```text
Timeline
  purpose   Everything that happened to a lead, newest first, with who did it and when.
  anatomy   Heading "Timeline" (h2). Toolbar: a "Show" filter (multi-select: All, Messages, Calls, Notes, Stage
            changes, Payments, Follow-ups, Other activity) and an "Add note" button.
            A "3 new updates" button at the top, only when live events have arrived.
            Feed (role="feed"), grouped under day headings ("Today", "Yesterday", "03 Oct 2026").
            Each item is an <article> with:
            - a type icon in a 32 px circle;
            - a title line: actor and action;
            - the time (RelativeTime; relative under 7 days);
            - a type-specific body;
            - an actions menu (Ellipsis) when the item has actions.
            Item types:
            - activity: Activity icon; a custom or system activity with its fields;
            - message: Mail, MessageSquare or MessageCircle; direction, template name, a two-line preview that
              expands, and a delivery StatusPill. Email shows opens and clicks, never for minors;
            - call: PhoneOutgoing, PhoneIncoming or PhoneMissed; outcome, duration, purpose (every call has one), a
              recording player (native <audio controls>, loaded on demand) and the call note; a call logged by hand
              (CallAction's LogCallForm) says "logged a call";
            - note: StickyNote; author and body (line breaks kept); "Edited" when changed;
            - stage change: ArrowRightLeft; from and to stage, sub-stage and remark;
            - payment: IndianRupee; product, Money, a status StatusPill, method and the receipt link; link
              created, sent and expired events too;
            - follow-up: CalendarClock; scheduled, done, cancelled, reopened;
            - assignment: UserPlus; new owner and how (by hand, round robin, rule);
            - consent and verification: ShieldCheck; what was given, withdrawn or verified, and by whom.
            Actors: a member (name), an automation (Workflow icon and its name as a link), the student (inbound
            messages, payments), the system, an API key (its name).
            Footer: "Show older" button, or at the end the item "Lead created 01 Oct 2026, 9:14 am IST from Website
            form".
  variants  lead (S08); opportunity (S27); compact (S15 side panel: last 10 items, no filter, "Open full
            timeline").
  sizes     items gap-3, py-3; icon circle size-8 (32 px) with a 16 px icon. Title text-sm. Body text-sm with
            leading-prose for user text (notes, messages, remarks). Time text-xs. Day headings text-xs
            font-semibold, sticky top-0 within the feed's scroll area. Previews clamp to 2 lines (line-clamp-2,
            with pb-1 inside the clamp box).
            Pages of 25 items (cursor).
  states    loading (3 Skeleton items); empty; filtered-empty; filled; loading older ("Show older" in its loading
            state); end reached (the "Lead created" item); load error; new updates available; item expanded or
            collapsed; message failed (StatusPill danger with the reason, and "Try again" in its menu for the
            sender); note saving (an optimistic item with "Saving…"; on failure "Not saved" and "Try again", with the
            text kept); read-only (merged or erased lead: "Add note" hidden).
            Live events never insert themselves above what the person is reading. They wait behind the "new
            updates" button; pressing it adds them and moves focus to the first new item.
            Notes: the author can edit their own note; each edit is kept in the audit log and the item shows
            "Edited".
  tokens    icon circle   bg-surface-sunken text-muted rounded-pill
            title         actor text-fg font-medium; the rest text-fg
            time          text-xs text-muted
            body          text-fg; quoted remark or preview bg-surface-subtle rounded-md p-3 with text-fg, its labels
                          text-muted
            day heading   bg-surface text-muted
            rail          a border-l border-border line joins the icon circles (decorative)
            new updates   Button secondary sm
  content   Filter label "Show". Buttons "Add note", "Show older", "3 new updates", "Open full timeline".
            Titles:
            - "Asha Nair sent an email: Fee reminder"; "Meera replied on WhatsApp";
            - "Asha Nair called · Connected · 4 min 12 s · Promotional call"; "Asha Nair logged a call · No
              answer · Promotional call"; "Missed call from Meera";
            - "Asha Nair moved the stage from Interested to Applied"; "Automation New lead routing assigned Asha
              Nair (round robin)";
            - "Application fee ₹1,000.00 paid by UPI"; "Payment link sent by WhatsApp";
            - "Guardian agreed (checked by SMS code)".
            Empty: "Nothing has happened yet. Notes, messages, calls and stage changes will show up here."
            Filtered-empty: "No calls yet." with "Show everything".
            Load error: "Couldn't load the timeline." with "Try again".
            Note failure: "Not saved. Check your connection and try again."
            Recording: "Play recording (4 min 12 s)". Expand: "Show full message", "Show less".
  keyboard  Tab reaches the toolbar, then the feed. In the feed (APG feed pattern): each article is focusable;
            Page Down and Page Up move to the next and previous article; Ctrl+End moves past the feed and Ctrl+Home
            before it. Tab inside an article reaches its controls. "Show older" follows the feed.
  a11y      role="feed" with aria-labelledby the heading and aria-busy="true" while a page loads. Each article has
            aria-posinset and aria-setsize="-1" (the total is unknown), aria-labelledby its title and
            aria-describedby its body.
            Each article's description includes the absolute date and time; the visible relative time also shows
            a tooltip with it on hover and while the article has focus.
            New live items are announced politely as a count ("3 new updates"), never one by one.
            Icons are aria-hidden; the type is in the title words. Delivery states are words in a StatusPill.
            Audio uses native controls.
            Targets: item menu buttons 24 px; "Show older" and "Add note" 32 px.
            Pairs: text on surface, surface-subtle, surface-sunken; text-muted on surface, surface-subtle,
            surface-sunken; accent on surface; danger on danger-subtle; success on success-subtle; focus-ring on
            surface, surface-subtle.
  base      native <section>, <article> and role="feed"; StatusPill, RelativeTime, DateText, Money, Skeleton
            (group 2); Button, Combobox (group 1); native <audio>.
  used on   S08, S15 (side panel), S27, M03.
```

---

### C. Calls, messaging and the inbox

#### CallAction

```text
CallAction
  purpose   Call a lead through the institution's telephony provider, or log a call made another way. Every call
            records why it was made, and every rule that blocks a call is explained before anyone dials.
  anatomy   Trigger: "Call" (Button secondary sm, Phone icon) in LeadProfileHeader, its compact bar and the S15 side
            panel. It opens a Popover (role="dialog"):
            - RadioGroup "Why are you calling?" (required): "Promotional", "Service", "Transactional", each with a
              one-line description. Preselected: Promotional for leads not yet enrolled, Service for enrolled
              students. When that purpose is blocked (for example Promotional for a student under 18), nothing is
              preselected and the person chooses one. The person can always change it; the server stores the
              chosen purpose with the call and has no default of its own.
            - a read-only line with the caller ID for that purpose: "Calls from 140 000 1234 (promotional line)".
              Promotional calls always go out from the 140-series number.
            - a read-only line "Your phone rings first: +91 ••••• •4821";
            - "Call now" (Button primary sm);
            - the link button "Log a call instead", which opens the LogCallForm variant.
            A blocked purpose stays in the list, with its reason printed under its label.
            Never offered: a tel: link for a promotional or transactional call, or a call from a personal mobile.
  variants  click-to-call (default): the provider rings the counsellor first, then the lead, from the caller ID set
            for the chosen purpose.
            LogCallForm (Dialog dialog-sm): for calls made outside the app. Fields: "Why did you call?" (RadioGroup,
            required, the same default), "Direction" (RadioGroup "Outgoing", "Incoming"), "Outcome" (Select
            "Connected", "No answer", "Busy", "Missed"), "Duration" (NumberStepper in minutes, shown for Connected),
            "When" (DateTimePicker, default now), "Note" (Textarea). Saving adds a call item to the Timeline with
            its purpose.
            phone link (service only): when the org setting "Allow phone links for service calls" is on, contacts are
            not masked for this person, and the purpose is Service, a "Call from my phone" link (tel:) shows under
            "Call now".
            side panel (S15) and phone (M03, phase 2): the same content.
  sizes     Popover w-80 (320 px) p-3 gap-3. Radio rows at staff size (16 px circle in a 24 px label); descriptions
            text-xs. Buttons sm (32 px). LogCallForm: dialog-sm (400 px), controls md (40 px).
  states    checking (when the Popover opens the server checks DND, consent and the calling window; the purposes
            show a Skeleton line until it answers); ready; purpose changed.
            Blocked. The affected purpose is a disabled radio with its reason; when no purpose is left, "Call now"
            is aria-disabled and described by the reason:
            - no telephony provider connected: every purpose;
            - no caller ID set up for a purpose: that purpose;
            - the lead is on DND and no consent to calls is recorded: Promotional;
            - outside the promotional calling window (default 9:00 am to 9:00 pm IST): Promotional;
            - under 18 with no guardian consent: every purpose;
            - under 18 with guardian consent: Promotional, always;
            - consent for calls withdrawn: the purposes it covered (a withdrawn "Updates and offers" consent blocks
              Promotional);
            - no mobile number on the lead, or none on the person's own profile (the provider rings them first):
              every purpose.
            Running (said in the Popover's polite status, and shown on the trigger):
            - "Your phone rings first…" until the person answers;
            - "Calling Meera…" until the lead answers;
            - connected: the Popover closes and the trigger reads "On call";
            - ended: a Toast "Call ended · 4 min 12 s" with "Add a note";
            - failed: a danger Alert in the Popover with the provider's error in our words, and "Try again".
            The server checks every rule again before it asks the provider to dial.
  tokens    popover       bg-surface-raised border border-border rounded-lg shadow-pop z-(--z-popover)
            descriptions  text-xs text-muted; blocked reason text-xs text-muted after a Ban icon in text-muted
            caller ID     text-xs text-muted; the number text-fg tabular-nums
            running       text-sm text-fg; the trigger shows Button's loading state, then PhoneCall and "On call"
            failed        Alert danger, compact
  content   Trigger "Call". Popover name "Call Meera Pillai". Legend "Why are you calling?".
            Options and descriptions:
            - "Promotional": "Any call about admission to someone who hasn't enrolled yet."
            - "Service": "A call to an enrolled student about their studies or their account."
            - "Transactional": "A call about a payment or a confirmation the student asked for."
            Lines: "Calls from 140 000 1234 (promotional line)". "Your phone rings first: +91 ••••• •4821".
            Buttons "Call now", "Log a call instead", "Call from my phone".
            Blocked reasons:
            - "Calling isn't set up. An admin can connect a telephony provider in Settings > Channels."
            - "There's no promotional caller ID yet. An admin can add one in Settings > Channels."
            - "Meera is on DND and hasn't agreed to calls. Only service and transactional calls are allowed."
            - "Promotional calls can be made between 9:00 am and 9:00 pm IST."
            - "Meera is under 18 and no guardian has agreed yet."
            - "Promotional calls are never made to students under 18."
            - "Meera withdrew consent for promotional calls on 02 Oct 2026."
            - "There's no mobile number on this lead."
            - "Add your mobile number to your profile. The provider rings you first."
            Running: "Your phone rings first…", "Calling Meera…", "On call". Toast "Call ended · 4 min 12 s." with
            "Add a note".
            Failures: "The call didn't connect: your phone wasn't answered." "Meera's number was busy." "The
            telephony provider isn't responding. Try again in a minute."
            LogCallForm: title "Log a call with Meera Pillai"; labels "Why did you call?", "Direction", "Outcome",
            "Duration (minutes)", "When", "Note"; button "Save call".
  keyboard  Enter or Space on "Call" opens the Popover with focus on the checked purpose, or on the first allowed
            one when none is checked. Arrow keys change the purpose and skip blocked ones. Tab reaches "Call now",
            then "Log a call instead". Esc closes and returns focus to "Call". LogCallForm follows FormLayout.
  a11y      The Popover is role="dialog" named "Call Meera Pillai". The purposes are a <fieldset> with the legend
            "Why are you calling?". A blocked purpose is a native disabled radio, so arrow keys skip it. Its reason
            is visible text under its label, and the fieldset's aria-describedby repeats every reason, so a screen
            reader hears them when focus enters the group.
            Call progress goes to the Popover's polite status, then to the page status once the Popover closes. No
            running timer is shown or announced.
            Targets: 24 px radio rows; 32 px buttons; the link button at least 24 px tall.
            Pairs: text on surface-raised, danger-subtle; text-muted on surface-raised; border-input on
            surface-raised; accent on surface-raised, danger-subtle; on-accent on accent, accent-hover; danger on
            danger-subtle; focus-ring on surface-raised, danger-subtle.
  base      Radix Popover; RadioGroup, Button, Select, NumberStepper, DateTimePicker, Textarea, FormLayout (group 1);
            Dialog, Alert, Toast, Skeleton (group 2); POST /leads/:id/calls (purpose required, no server default).
  used on   S08, S15 (side panel), S27 (opportunity header), M03.
```

#### MessageComposer

```text
MessageComposer
  purpose   Write and send an email, SMS or WhatsApp message to one lead or many, from a template or as free text
            where the channel allows it, and see before sending who will get it.
  anatomy   - ChannelTabs (group 1): Email, SMS, WhatsApp, each with its unavailable state. Each tab keeps its own
              draft.
            - To: the lead's name and MaskedValue contact, or for many leads the count with RecipientCheck.
            - From:
              - Email: a Select of the institution's verified sender addresses;
              - SMS: read-only "Sender ID ABCCOL-S · Service, explicit consent · DLT template 1107…" (header,
                category and DLT template ID, from the chosen template);
              - WhatsApp: the connected number and its display name (a Select when there are several).
            - ServiceWindowIndicator (WhatsApp only).
            - TemplatePicker: required for SMS (every SMS must match a DLT-registered template) and for WhatsApp
              outside the reply window; optional for email.
            - Email: Subject (TextInput with MergeTokenInserter); body in a rich-text editor (bold, italic, link,
              bulleted list, numbered list, insert field) or the template's HTML (locked, with "Edit template" opening
              S19 in a new tab); Attachments (FileUpload, multiple, 5 MB in total). Promotional email gets an
              unsubscribe link and headers added at send time; the composer says so.
            - SMS: the template text, read-only, with each {#var#} slot shown as a field to fill or to map to a
              merge field; SmsSegmentCounter under it.
            - WhatsApp, template mode: header media (when the template has one: FileUpload or a saved file), one
              field per body variable ({{1}}, {{2}}…), each filled with text or a merge field; buttons listed
              read-only.
            - WhatsApp, free-text mode (reply window open, one lead): Textarea, attachment (FileUpload compact),
              quick replies (S15).
            - "Write" and "Preview" tabs. Preview renders for one sample recipient chosen with "Preview as" (a
              Select of up to 20 recipients): email in the paper frame, SMS as plain text in the paper frame,
              WhatsApp through WhatsAppTemplatePreview.
            - Blocking Alerts (group 2), when they apply.
            - Footer: "Send test to me" (email only) on the left; "Cancel", then the primary "Send" or "Send to 298
              leads"; for promotional SMS during quiet hours (outside the 9:00 am to 9:00 pm IST sending window), the
              primary reads "Schedule for 9:00 am".
  variants  single lead (S08 to S10, M03): free text where allowed; blocks explained for this lead.
            bulk (S05 bulk to S10): RecipientCheck counts; WhatsApp is templates only; sending starts a job and the
            BulkActionBar shows progress.
            inbox reply (S15): docked under ChatThread; WhatsApp only; no tabs, no To or From rows; Enter adds a line,
            Ctrl+Enter (Cmd+Enter) sends.
            broadcast step (S16): full page; audience from a saved filter; "Send now" or "Schedule"; retry settings
            "Retries" and "Retry every" (NumberStepper, group 1: 8 to 48 hours, and at least 24 hours for WhatsApp).
            automation action (S18, in the step's settings panel): channel, template and fields only; no
            recipients, no send.
  sizes     S10: Dialog dialog-lg (800 px), body scrolls, footer fixed. S16: max-w-form (720 px) page column.
            S15: docked, full width of the thread, textarea from 1 line up to 8 lines (auto-grow), then scrolls.
            Rows gap-4. Fields and selects md (40 px) in S10 and S16, sm (32 px) in S15. Email body min-h-48 (192 px),
            text-sm leading-prose.
            Editor toolbar h-control-sm (32 px) with IconButtons sm.
  states    composing (empty); template chosen; free text; required parts missing (on send: "Add a subject",
            "Fill in {{2}} or give it a fallback"); attachments uploading (send waits; the button says
            "Uploading…"); previewing; checking recipients; sending (the primary in loading, the form read-only);
            sent (single: the dialog closes, a Toast confirms and the message appears in the Timeline as Queued);
            scheduled (quiet hours or a chosen time; Toast says when); failed (a danger Alert with the provider's
            reason in our words; the draft is kept; "Try again"); discard check (closing with unsent text asks
            first).
            Blocked, for one lead (the primary is aria-disabled and described by the Alert):
            - channel not connected;
            - opted out of the channel;
            - under 18 with no guardian consent; or under 18 and the template is promotional;
            - stage rule no_messages;
            - WhatsApp reply window closed and no template chosen;
            - WhatsApp template not approved, paused or disabled by Meta;
            - SMS template lapsed at the operator;
            - promotional or explicit-consent service SMS with no consent registered with the telcos, and an enquiry
              more than 7 days old (transactional and implicit-consent service SMS are still allowed);
            - the lead has no email address or mobile number.
            For many leads the same reasons become RecipientCheck counts, and sending goes ahead for the rest.
            The server checks everything again at send time (outbox and send_message job).
  tokens    container     Dialog bg-surface-raised
            row labels    text-sm text-muted; values text-fg
            editor box    bg-surface border border-input rounded-md; focus-within uses the global outline on the
                          editable area
            toolbar       bg-surface-subtle border-b border-border; formatting buttons use IconButton's toggle style
                          (group 1): border border-transparent, pressed aria-pressed:bg-accent-subtle
                          aria-pressed:text-accent aria-pressed:border-accent and
                          forced-colors:aria-pressed:border-[Highlight], so pressed is never fill alone
            alerts        Alert warning (blocked), danger (failed), info (quiet hours, unsubscribe note)
            footer        bg-surface-raised border-t border-border
            preview       the paper frame inside border border-border rounded-lg
  content   Dialog titles: "New message", "Message 312 leads". Labels: "To", "From", "Template", "Subject",
            "Message", "Attachments", "Preview as". Tabs: "Write", "Preview".
            Buttons: "Send", "Send to 298 leads", "Schedule for 9:00 am", "Send test to me", "Cancel", "Try again".
            Blocked texts:
            - "WhatsApp isn't connected. An admin can connect it in Settings > Channels."
            - "Meera opted out of SMS on 02 Oct 2026."
            - "Meera is under 18 and no guardian has agreed yet, so she can't be messaged."
            - "Promotional messages are never sent to students under 18. Choose a service template."
            - "The stage Not interested doesn't allow messages."
            - "This template is still in review. You can send it once Meta approves it."
            - "The operators turned off this SMS template because it wasn't used for 90 days. Ask an admin to
              register it again."
            - "Meera's enquiry is more than 7 days old and she hasn't given consent through her mobile network, so
              promotional and explicit-consent SMS can't go to her. Use a transactional or implicit-consent
              template, or another channel."
            - "There's no mobile number on this lead."
            Info (the window comes from the institution's quiet-hours setting): "Promotional SMS go out between
            9:00 am and 9:00 pm. This one will be sent at 9:00 am IST."
            "Promotional emails get an unsubscribe link at the bottom. You can't remove it."
            Sent toasts: "Email sent to Meera Pillai." "Scheduled for 07 Oct, 9:00 am IST."
            Failure: "Not sent. The SMS provider rejected it because the text doesn't match the registered
            template. Nothing was charged."
            Discard: title "Discard this message?"; body "You'll lose what you've typed."; buttons "Keep editing" and
            "Discard" (the shared discard prompt, with this composer's own title).
  keyboard  Tab order: channel tabs, To, From, Template, Subject, toolbar (one tab stop; arrows between buttons),
            body, attachments, Write and Preview tabs, footer. Ctrl+Enter (Cmd+Enter) sends from the body. Typing
            "{{" in a body or subject opens MergeTokenInserter. Esc closes the dialog (asks first when there is
            unsent text).
  a11y      Dialog titled and described by the To line.
            The email body is a contenteditable with role="textbox", aria-multiline="true" and aria-label "Message".
            SMS and WhatsApp use a native Textarea.
            When the primary is aria-disabled, aria-describedby points at the blocking Alert. Recipient counts and
            send results go to the dialog's polite status.
            The preview iframe has a title ("Preview for Meera Pillai").
            Targets: 40 px controls and buttons (32 px in S15); toolbar buttons 32 px.
            Pairs: text on surface-raised, surface, surface-subtle, warning-subtle, danger-subtle, info-subtle;
            text-muted on surface-raised, surface, surface-subtle; accent on surface-raised, accent-subtle;
            border-input on surface, surface-raised; warning on warning-subtle; danger on danger-subtle; info on
            info-subtle; on-accent on accent, accent-hover; focus-ring on surface, surface-raised, surface-subtle,
            accent-subtle, warning-subtle, danger-subtle, info-subtle.
  base      Dialog, Alert, Toast, MaskedValue (group 2); ChannelTabs, TextInput, Textarea, Select, FileUpload,
            Button (group 1); TemplatePicker, MergeTokenInserter, SmsSegmentCounter, ServiceWindowIndicator,
            RecipientCheck, WhatsAppTemplatePreview (this group); TipTap (MIT) for the email editor (new dependency,
            see Open questions).
  used on   S05 (bulk), S08, S10, S15, S16, S18, M03.
```

#### TemplatePicker

```text
TemplatePicker
  purpose   Find and choose a message template for one channel, and see at a glance whether it can be sent now.
  anatomy   Combobox. The trigger shows the chosen template's name and one meta line.
            Listbox, grouped:
            - WhatsApp: by category ("Marketing", "Utility", "Authentication");
            - SMS: by DLT category ("Promotional", "Service, implicit consent", "Service, explicit consent",
              "Transactional");
            - email: by nature ("Transactional", "Promotional").
            Each option has the name, a one-line preview (merge fields shown as [Full name]), and a meta line:
            - WhatsApp: language and approval StatusPill, plus quality;
            - SMS: sender ID and DLT category;
            - email: subject.
            An option that can't be sent now is aria-disabled, with the reason as its meta line.
            Footer: "Manage templates" link (S19, new tab). For admins on WhatsApp: "Synced 5 min ago" and "Sync
            now".
            For email and for WhatsApp inside the reply window, the first option is "No template (write your own)".
  variants  composer (S10, S15, S16); automation action (S18: only templates that could ever be approved, with
            their current state); duplicate from (S19 "Start from a copy").
  sizes     trigger h-control-md (40 px), or sm (32 px) in S15. Listbox max-h-96, options two or three lines
            (py-2), w at least 360 px. Meta pills: StatusPill (h-chip, 24 px).
  states    loading; empty for the channel; no match; chosen; option unavailable:
            - WhatsApp: in review, rejected, paused by Meta, disabled by Meta;
            - SMS: lapsed at the operator; sender ID inactive; promotional or explicit-consent service when the lead
              has no consent registered with the telcos and the enquiry is more than 7 days old;
            - any: limited to other people (allowed_member_ids), promotional for a minor, turned off by an admin.
            syncing (admins); sync failed.
  tokens    as Combobox; option preview text-xs text-muted line-clamp-1 with pb-1 inside the clamp box; meta pills
            StatusPill by vocabulary value; unavailable reason
            text-xs text-muted; footer bg-surface-raised border-t border-border.
  content   Placeholder "Choose a template". Search "Find a template". Option example: "Fee reminder" / "Hi [Full
            name], your application fee is due on [Due date]…" / "English · Approved · High quality".
            Reasons: "In review at Meta." "Rejected by Meta: the sample values were missing." "Paused by Meta after
            recipients reported it." "Disabled by Meta." "Lapsed at the operator after 90 days without use."
            "Needs SMS consent registered with the telcos, or an enquiry from the last 7 days." "Only the Finance
            team can use this template." "Promotional: can't be sent to students under 18."
            Empty: "No WhatsApp templates yet." with "Create a template". No match: "No template called "visa"."
            "No template (write your own)". "Manage templates". "Synced with WhatsApp 5 min ago". "Sync now".
            Sync failed: "Couldn't reach WhatsApp. Showing templates from the last sync."
  keyboard  Combobox: Enter or Alt+Arrow Down opens; type to filter; arrows move (unavailable options included, so
            their reason is heard); Enter picks; Esc closes.
  a11y      Options are labelled by the name and described by the preview and meta lines. Unavailable options have
            aria-disabled="true". Approval and quality are words, not colours alone.
            Targets: 40 px trigger; options at least 48 px tall.
            Pairs: text on surface-raised, surface-hover; text-muted on surface-raised, surface-hover; success on
            success-subtle; warning on warning-subtle; danger on danger-subtle; info on info-subtle; text on
            surface-sunken; accent on surface-raised; border-input on surface-raised; focus-ring on surface-raised,
            surface-hover.
  base      Combobox (group 1, Downshift); StatusPill (group 2).
  used on   S10, S15, S16, S18, S19.
```

#### TemplateEditor

```text
TemplateEditor
  purpose   Create or edit a message template for email, SMS or WhatsApp, with what each channel needs: the DLT
            registration details for SMS, the fields Meta reviews for WhatsApp, and a promotional-or-not answer for
            every template. Problems show before the template is used.
  anatomy   Page (S19 "New template", "Edit template"): a form column (max-w-form) and, from xl, a preview column
            (w-96, 384 px) beside it.
            - ChannelTabs (group 1) when creating; an existing template keeps its channel.
            - Shared: "Name" (TextInput, required); "Is this message promotional?" (RadioGroup, required, nothing
              preselected: "Transactional or service", "Promotional"); the template's StatusPill (status vocabulary).
            - SMS:
              - "DLT category" (RadioGroup, required, nothing preselected): "Promotional", "Service (implicit
                consent)", "Service (explicit consent)", "Transactional". It also answers the shared question,
                which then shows read-only.
              - "Sender ID (header)": Select of active sender IDs whose category fits the DLT category: Promotional
                takes -P headers, both Service categories take -S, Transactional takes -T, government senders -G.
                Headers that don't fit stay listed, aria-disabled, with the reason in the option text.
              - "DLT template ID": TextInput, inputmode="numeric", digits only, required.
              - "Message": Textarea with {#var#} slots, SmsSegmentCounter under it, then the checks.
              - a "Lapses soon" Alert when the template has not been used for 80 days or more.
            - WhatsApp:
              - "Template name" (lowercase letters, digits and underscores), "Language" (Select), "Category"
                (RadioGroup, required, nothing preselected: "Marketing", "Utility", "Authentication").
              - "Header": SegmentedControl "None", "Text", "Image", "Video", "Document", then a text field or a
                sample file (FileUpload compact).
              - "Body": Textarea with {{1}}, {{2}}…, and one required "Sample for {{n}}" TextInput per variable.
              - "Footer" (optional, at most 60 characters) and "Buttons": up to 3 rows, each "Quick reply", "Link"
                (a URL) or "Phone number".
              - WhatsAppTemplatePreview in the preview column (under the form below xl).
            - Email: "Subject" (TextInput with MergeTokenInserter); the body in the TipTap editor, as in
              MessageComposer; a note that promotional emails get the unsubscribe link automatically.
            - Footer bar (sticky, h-pagebar): "Cancel", "Save draft", and the primary: "Save template" (email and
              SMS) or "Submit for review" (WhatsApp).
  variants  new; edit (a draft, or an active template: email and SMS changes save at once; changing an approved
            WhatsApp template sends it back to review); duplicate ("Start from a copy": a new draft named "Copy of
            …"); read-only (in review at Meta, or no right to manage templates).
  sizes     Form max-w-form (720 px), fields gap-6, controls md (40 px). Message and body Textareas min-h-32
            (128 px), text-sm leading-prose. Button rows h-control-md. Preview column w-96 from xl.
            The sticky footer adds var(--layout-pagebar) to --bottom-bar while it shows (AppShell, group 2).
  states    new (empty); dirty; saving; saved (Toast); draft; invalid (errors under the fields, and FormLayout's
            error summary on save or submit); submitting; in review (WhatsApp: fields read-only, "In review" pill);
            approved; rejected (Alert wa_template_rejected with Meta's reason, and "Edit and resubmit"); paused or
            disabled by Meta (the catalogue's Alerts); lapsed (SMS: the operators turned it off after 90 days
            unused); sender ID inactive; name and language already used (WhatsApp).
            Checks on the SMS text run 500 ms after typing stops. They warn and never block, because the DLT portal
            has the final say:
            - more than 3 variables;
            - fixed text under 30% of the message;
            - the reminder that the text must match the registered template exactly.
            Rules the server enforces, shown as field errors: every SMS template has a DLT template ID, one sender ID
            and a DLT category that fits it; every template answers the promotional question; one WhatsApp template
            per account, name and language.
  tokens    form          FormLayout (group 1): Card, fields gap-6
            checks        text-xs text-fg after TriangleAlert in text-warning, under the message; the fixed-text
                          share in text-muted tabular-nums
            note          text-xs text-muted
            footer        bg-surface border-t border-border shadow-bar z-(--z-sticky)
            alerts        Alert warning (lapses soon, paused), danger (rejected, disabled), info (in review)
  content   Labels: "Name", "Is this message promotional?", "Transactional or service", "Promotional", "DLT
            category", "Service (implicit consent)", "Service (explicit consent)", "Transactional", "Sender ID
            (header)", "DLT template ID", "Message", "Template name", "Language", "Category", "Header", "Body",
            "Sample for {{1}}", "Footer", "Buttons", "Subject".
            Hints:
            - DLT template ID: "Copy it exactly from your DLT portal."
            - Sender ID: "Only sender IDs that fit the DLT category can be picked. ABCCOL-S is for service
              messages."
            - Template name: "Lowercase letters, numbers and underscores, like fee_reminder."
            - Sample: "Meta's reviewers see this. Use a realistic value, like Meera."
            Checks: "DLT allows at most 3 variables unless you justified more when registering." "At least 30% of
            the text must be fixed. Now: 22%." "The text must match the registered template exactly, or operators
            reject it."
            Errors: "Choose whether this message is promotional." "Choose a DLT category." "Choose a sender ID."
            "Enter the DLT template ID." "The DLT template ID has digits only." "ABCCOL-S is a service sender ID.
            Pick a promotional (-P) one, or change the category." "Add a sample for {{2}}." "Use lowercase letters,
            numbers and underscores only." "There's already a template called fee_reminder in English."
            "Marketing templates are promotional. Change the category or the answer above."
            Email note: "Promotional emails get an unsubscribe link automatically. You can't remove it."
            Lapsed: "Operators turned this template off because it wasn't used for 90 days. Register it again on
            your DLT portal, then enter the new template ID here."
            Buttons: "Cancel", "Save draft", "Save template", "Submit for review", "Edit and resubmit".
            Toasts: "Template saved." "Sent to Meta for review. The result shows here."
  keyboard  Normal tab order, top to bottom, then the footer. Typing "{{" in a subject or body opens
            MergeTokenInserter. Leaving with changes asks "Discard your changes?" (FormLayout).
  a11y      FormLayout rules: labels above fields, errors under them, the error summary focused after a failed save.
            Each RadioGroup is a <fieldset> with its question as the legend; nothing is preselected where the answer
            has consequences.
            The SMS checks are linked to the message field with aria-describedby. When the set of warnings changes,
            the form's polite status says so once ("2 warnings on the message"), never on each keystroke.
            Disabled sender IDs keep their reason in the option text. The preview iframe has a title.
            Targets: 40 px controls and footer buttons; 24 px radio rows.
            Pairs: text on surface, surface-raised, warning-subtle, danger-subtle, info-subtle; text-muted on
            surface, surface-raised; border-input on surface, surface-raised; accent on surface; on-accent on
            accent, accent-hover; warning on surface, warning-subtle; danger on surface, danger-subtle; info on
            info-subtle; focus-ring on surface, surface-raised, warning-subtle, danger-subtle, info-subtle.
  base      FormLayout, Field, TextInput, Textarea, Select, RadioGroup, SegmentedControl, ChannelTabs, FileUpload,
            Button (group 1); Card, Alert, StatusPill, Toast (group 2); SmsSegmentCounter, MergeTokenInserter,
            WhatsAppTemplatePreview (this group); TipTap; CRUD /templates.
  used on   S19.
```

#### MergeTokenInserter

```text
MergeTokenInserter
  purpose   Put a field from the lead, course, stage, owner or a link into a message, with a fallback for when the
            field is empty.
  anatomy   Trigger: Button ghost sm with the Braces icon and "Insert field", in the editor toolbar and beside the
            subject.
            Popover: a search input and a listbox grouped as:
            - "Student": Full name, Email, Mobile, City, Lead number;
            - "Course": Course, Campus, Intake;
            - "Stage": Stage, Sub-stage;
            - "Owner": Owner name, Owner mobile, Owner email;
            - "Links": Payment link, Enquiry form link, Guardian consent link;
            - "Institution": Name, Phone, Address;
            - "Your fields": custom fields.
            Each option shows the field name and, in text-muted, its value for the preview recipient.
            After choosing: an inline step with "If empty, use" (TextInput, optional) and the "Insert" button.
            Inserted token:
            - rich editor (email body): an atomic chip with the Braces icon and the field name;
            - plain text (subject, SMS slots, WhatsApp variables): the text {{student.full_name|Student}}.
  variants  rich editor (email); plain text (subjects, WhatsApp free text, quick replies); slot mapping (SMS {#var#}
            slots and WhatsApp {{n}} variables: the inserter sets what fills the slot instead of adding text).
  sizes     popover w-80 (320 px), list max-h-80. Options min-h-menu-item (32 px), two lines when they show a
            value. Chip inline-flex h-5 px-1 rounded-xs gap-0.5 with a 12 px icon.
  states    closed; open; searching; no match; option needs a choice at send time (Payment link: the person picks a
            payment product when sending); value missing for the preview recipient ("Not set for Meera"); fallback
            set; token broken (its field was removed: the chip shows the danger style and the send is blocked until
            it is fixed); SMS slot length (a slot shows its maximum length and SmsSegmentCounter counts it).
            Masked fields can be inserted by masked roles. The server fills the real value; previews show the masked
            one.
            "Unsubscribe link" is not in the list: promotional emails always get one.
  tokens    popover     bg-surface-raised border border-border rounded-lg shadow-pop
            option      text-sm text-fg data-[highlighted]:bg-surface-hover; value text-xs text-muted
            chip        bg-accent-subtle text-fg rounded-xs; icon text-muted
            broken chip bg-danger-subtle text-fg; CircleAlert text-danger
  content   Trigger "Insert field". Search "Find a field". Group labels as above.
            Fallback label "If empty, use"; hint "Used when this lead has no value. Leave blank to show nothing.";
            button "Insert".
            Values "Meera Pillai", "Not set for Meera".
            Payment link note: "You'll choose the fee when you send."
            Broken token: "This field was removed. Pick another or delete it."
            Chip name: "Field: Full name, if empty: Student".
  keyboard  Trigger: Enter or Space opens with focus in the search. Type to filter; arrows move; Enter picks and
            moves focus to "If empty, use"; Enter inserts and returns focus to the editor, after the token.
            Esc closes and returns focus to where it was.
            In the editor, typing "{{" opens the same popover at the caret; Esc leaves the typed "{{" as text.
            A chip is one unit: Backspace deletes it whole and the arrow keys step over it.
  a11y      The popover is role="dialog" labelled "Insert field", with a combobox and listbox inside.
            A chip's visible text is the field name; it carries sr-only "field: " before it, so it is not read as
            plain words.
            Insertions are announced ("Full name inserted").
            Targets: 32 px trigger and options.
            Pairs: text on surface-raised, surface-hover, accent-subtle, danger-subtle; text-muted on surface-raised,
            surface-hover, accent-subtle; border-input on surface-raised; danger on danger-subtle; on-accent on
            accent; focus-ring on surface-raised, accent-subtle.
  base      Radix Popover; Downshift useCombobox (as group 1's Combobox); a TipTap node for chips; TextInput, Button
            (group 1).
  used on   S10, S15, S16, S18, S19.
```

#### SmsSegmentCounter

```text
SmsSegmentCounter
  purpose   Show how many SMS parts a message will use and why, so senders avoid surprise costs and cut-off text.
  anatomy   One line under the SMS text: an encoding pill ("GSM-7" or "Unicode"), the character count against the
            current part's limit, and the number of parts. A "Details" Disclosure explains the count: which
            characters made it Unicode (each with a "Replace" suggestion where a plain one exists), which characters
            count twice, and how merge fields were counted.
            Counting rules (a pure function with unit tests, run on every change):
            - GSM-7: basic characters count 1; the extension characters (^ { } [ ] ~ | € \ and form feed) count 2.
            - Any character outside GSM-7 makes the whole message Unicode (UCS-2). Each UTF-16 unit counts 1, so an
              emoji outside the basic plane counts 2.
            - One part: 160 GSM-7 or 70 Unicode. Longer messages are split into parts of 153 GSM-7 or 67 Unicode.
              A two-unit GSM-7 character is never split across parts.
            - Merge fields count at their maximum length (see open question 10), and at the preview
              recipient's length; when the two give different part counts the line shows a range.
            - For DLT templates only the variable slots change; the fixed text is counted as registered.
  variants  inline (S10, S18, S19 editors); summary (S16: "2 SMS each × 298 leads = 596 SMS").
  sizes     text-xs, h-5 pill, gap-2. Details list text-xs, max 10 characters listed then "and 4 more".
  states    empty ("0 / 160 · 1 SMS"); GSM-7, one part; GSM-7, several parts; Unicode, one part; Unicode, several
            parts; near a boundary (within 10 units: the count turns text-fg font-medium and says how many are
            left); long (4 parts or more: a warning line); estimated (a merge field with no maximum: counted as 30
            and marked "estimated"); range ("1 to 2 SMS").
  tokens    pill          GSM-7 bg-surface-sunken text-fg; Unicode bg-info-subtle text-info
            counts        text-muted tabular-nums; near boundary text-fg font-medium
            long warning  TriangleAlert and text in text-warning
            details       text-xs text-fg; characters in font-mono with their names in text-muted
  content   "GSM-7 · 142 / 160 · 1 SMS". "Unicode · 98 / 134 · 2 SMS". "8 characters left in this SMS."
            "1 to 2 SMS, depending on name length (counted up to 30 characters)."
            Details: "Unicode because of ’ (curly apostrophe) in "Meera’s". Replace it with ' to fit 160 characters
            per SMS." Button "Replace all". "Hindi text always uses Unicode, so each SMS holds 70 characters."
            "{ and } count as 2 characters each."
            Long: "This message uses 5 SMS. Each part is charged."
            Summary: "2 SMS each × 298 leads = 596 SMS."
  keyboard  "Details" is a disclosure button (Enter or Space). "Replace all" is a button inside it. Nothing else is
            focusable.
  a11y      The counter line is linked to the text field with aria-describedby, so focusing the field reads the
            current count. A separate sr-only polite region speaks only when the encoding or the number of parts
            changes ("Now 2 SMS, Unicode"), never on every keystroke.
            The encoding is a word in the pill, not a colour.
            Targets: "Details" and "Replace all" are at least 24 px tall.
            Pairs: text on surface, surface-raised, surface-sunken; text-muted on surface, surface-raised; info on
            info-subtle; warning on surface, surface-raised; focus-ring on surface, surface-raised.
  base      our own countSms(text, fieldMaxLengths) function (GSM 03.38 tables) with unit tests; native <details>
            and <summary>; Button (group 1).
  used on   S10, S16, S18, S19.
```

#### ServiceWindowIndicator

```text
ServiceWindowIndicator
  purpose   Say whether free-text WhatsApp is allowed right now, and until when.
  anatomy   Banner form (composer): an icon, one sentence, and the closing time. When closed, a "Choose a template"
            link button that focuses TemplatePicker.
            Pill form (ChatThread header, ConversationList rows): a Clock icon and a short label.
            The window is the 24 hours after the student's last WhatsApp message (conversations.
            service_window_ends_at). The time refreshes every 60 s.
  variants  banner (S10, S08 messages tab); pill (S15 thread header and list rows).
  sizes     banner min-h-control-md (40 px) px-3 py-2 rounded-md text-sm, icon 16 px. Pill h-5 px-1.5 text-xs.
  states    open (more than 1 hour left); closing soon (1 hour or less); closed; never opened (the student has
            never messaged); no number connected (not shown: ChannelTabs explains).
            When the window closes while someone is typing, the composer switches to template mode. Their text is
            kept in the box with a note, and Send is blocked until a template is chosen.
  tokens    open         bg-success-subtle text-fg; Clock text-success
            closing soon bg-warning-subtle text-fg; Clock text-warning
            closed       bg-info-subtle text-fg; Info text-info; link text-accent
            never        bg-info-subtle text-fg; Info text-info
            pill         the same fills, text-xs text-fg
  content   Open: "Reply window open. Free-text replies allowed until 07 Oct, 11:20 am IST (6 hr left)."
            Closing soon: "Reply window closes at 11:20 am IST (40 min left)."
            Closed: "Reply window closed. Meera last wrote on 05 Oct. Send an approved template to start again."
            Never: "Meera hasn't messaged you on WhatsApp yet. Start with an approved template."
            Typing when it closed: "The reply window closed. Your text is kept below. Choose a template to send."
            Pills: "Open · 6 hr left", "Closes in 40 min", "Closed".
            Link: "Choose a template".
  keyboard  Only the link is focusable (Enter).
  a11y      Not a live region on load. When the state changes (to closing soon, or to closed) the composer's
            polite status announces it once.
            The time is written out; the state is a sentence, not a colour.
            Targets: the link button is at least 24 px tall.
            Pairs: text on success-subtle, warning-subtle, info-subtle; success on success-subtle; warning on
            warning-subtle; info on info-subtle; accent on info-subtle; focus-ring on info-subtle.
  base      native <div>; RelativeTime and DateText (group 2); Button link (group 1).
  used on   S08, S10, S15.
```

#### RecipientCheck

```text
RecipientCheck
  purpose   Before sending, show who will get the message and who will be skipped and why, for one lead or many.
  anatomy   Summary line: "298 of 312 will get this" and a "14 skipped" disclosure button.
            Expanded: one row per reason with its count, an icon, and a "See leads" button that opens a Popover with
            up to 50 names (MaskedValue contacts) and "Download list" (CSV) for more.
            Reasons, in this order:
            - opted out of this channel;
            - unsubscribed or bounced (suppression list);
            - under 18 with no guardian consent;
            - under 18 and the template is promotional;
            - no telco-registered consent (promotional or explicit-consent service SMS, enquiry more than 7 days
              old);
            - reply window closed (free-text WhatsApp);
            - a US number (+1), for WhatsApp marketing templates only: Meta doesn't deliver them there;
            - stage doesn't allow messages;
            - no mobile number, or no email address.
            Deferred, not skipped: "will be sent at 9:00 am" for promotional SMS sent during quiet hours.
            Counts come from a dry run on the server, under the sender's data scope. The browser never decides
            consent or suppression. At send time the server checks again, and the job report has the final numbers.
  variants  single lead: one sentence that says why this lead is blocked, or nothing when clear.
            many leads (S05 bulk, S10): summary and reasons.
            broadcast (S16): same, for a saved-filter audience; counts can be large.
            automation action (S18): no counts; a static list of the rules that will apply.
  sizes     summary text-sm; reason rows min-h-control-sm (32 px) with counts tabular-nums w-16 text-right.
            Popover w-80, list max-h-72.
  states    checking ("Checking 312 leads…" with a spinner); all clear; some skipped; all skipped (Send is
            aria-disabled); check failed (Send is aria-disabled until a check succeeds; "Try again"); out of date
            (the channel, template or mode changed: it checks again at once); deferred.
  tokens    summary     text-fg; skipped button Button link
            reasons     text-sm text-fg; icons text-muted; counts text-fg
            all skipped Alert warning (bg-warning-subtle text-fg, TriangleAlert text-warning)
            failed      Alert danger (bg-danger-subtle text-fg, CircleAlert text-danger)
  content   "298 of 312 will get this." "14 skipped". "All 312 will get this."
            Reasons: "Opted out of SMS" · "Unsubscribed or bounced" · "Under 18, no guardian consent yet" ·
            "Under 18: promotional messages are never sent" · "No telco-registered consent (promotional or
            explicit-consent SMS, enquiry more than 7 days old)" · "Reply window closed" · "US number: WhatsApp
            doesn't deliver marketing templates to +1 numbers" · "Stage doesn't allow messages" · "No mobile number"
            · "No email address".
            Deferred: "41 will get it at 9:00 am IST (quiet hours)."
            Note: "Skipped leads aren't messaged and nothing is charged for them. Counts can change if someone opts
            out before sending."
            All skipped: "None of the 312 leads can get this SMS. See the reasons below."
            Failed: "Couldn't check the recipients." with "Try again".
            Buttons "See leads", "Download list".
  keyboard  The disclosure button toggles the list. Each "See leads" opens its Popover (Esc closes and returns
            focus).
  a11y      Disclosure with aria-expanded and aria-controls. The reasons are a <ul>. The summary and counts are in
            the composer's polite status when they change. The Send button is described by the summary.
            Targets: buttons at least 24 px tall; reason rows 32 px.
            Pairs: text on surface-raised, warning-subtle, danger-subtle; text-muted on surface-raised; accent on
            surface-raised; warning on warning-subtle; danger on danger-subtle; focus-ring on surface-raised,
            warning-subtle, danger-subtle.
  base      Radix Collapsible (Disclosure, group 1) and Popover; Alert, MaskedValue (group 2); Button (group 1).
  used on   S05 (bulk message), S10, S16, S18.
```

#### ConversationList

```text
ConversationList
  purpose   The inbox list of WhatsApp chats by status, so counsellors can pick one and work it.
  anatomy   Header: status tabs ("Waiting", "Mine", "All open" for managers, "Resolved", each with a count),
            SearchInput, and a filter menu (number, assignee).
            <nav aria-label="Conversations"> with a <ul> of links. Each row has:
            - Avatar (initials, or a phone icon for an unknown number);
            - the lead's name; for a number not linked to a lead, PhoneText (group 2), or MaskedValue
              ("+91 ••••• •3210") for roles that see contacts masked;
            - the last message preview ("You: " for outbound; "Template: Fee reminder"; "Photo"; "Document");
            - the time (RelativeTime);
            - an unread count;
            - ServiceWindowIndicator pill;
            - the assignee (Avatar sm) in "All open";
            - in "Waiting", how long the chat has waited, and "Reopened" when it came back.
            A "2 new chats" button at the top while new activity waits (see states).
            An info Alert (compact) when live updates are paused.
  variants  full (S15 left column); compact (S08 messages tab: this lead's chats only, no tabs).
  sizes     column w-80 (320 px) at lg; full width below md (the thread opens as its own view). Rows min-h-16
            (64 px) px-3 py-2 gap-3. Avatar md (32 px). Name text-sm; preview text-sm line-clamp-1 with pb-1 inside
            the clamp box; time text-xs. Unread badge h-5 min-w-5 px-1.5.
  states    loading (Skeleton rows); filled; empty per tab; no WhatsApp number connected; search with no match;
            unread (name font-semibold, count shown); open in the thread (aria-current="page"); waiting long (more
            than 30 minutes: a warning pill with the wait); reopened; new activity waiting; live updates paused
            (Realtime disconnected; the list refreshes every 30 s until it reconnects).
            New activity: while focus or the pointer is in the list, or the list is scrolled, new messages don't
            reorder rows. A "2 new chats" button appears at the top; pressing it reorders the list and moves focus
            to the first new row. When nobody is using the list, the row moves to the top and focus never moves.
  tokens    list        bg-surface border-r border-border
            row         border-l-2 border-transparent hover:bg-surface-hover; current
                        aria-[current=page]:bg-accent-subtle aria-[current=page]:border-accent (a 2 px accent edge,
                        the same pattern as WorkflowOutline, so the open chat is never shown by fill alone)
            name        text-fg font-medium (unread font-semibold); preview text-muted; time text-xs text-muted
            unread      h-5 min-w-5 px-1.5 rounded-pill text-xs font-medium tabular-nums bg-accent text-on-accent
            pills       StatusPill
            new button  Button secondary sm, full width
            paused      Alert info
  content   Tabs "Waiting", "Mine", "All open", "Resolved". Search "Search chats".
            Previews "You: Here's the fee structure for B.Tech…", "Template: Fee reminder", "Photo", "Document:
            marksheet.pdf".
            Pills "Waiting 42 min", "Reopened". Unknown contact "+91 98765 43210", or "+91 ••••• •3210" for roles that
            see contacts masked. New activity button "2 new chats".
            Empty: Waiting "No chats waiting. New WhatsApp messages land here."; Mine "You haven't picked any
            chats yet."; Resolved "No chats resolved in the last 30 days."
            Not connected: "Connect a WhatsApp number to receive chats here." with "Go to Channels" (admins).
            Paused: "Live updates paused. Reconnecting…"
  keyboard  Tabs: arrows switch. Tab to search, then into the list (one tab stop). Arrow Up and Arrow Down move
            between rows, Home and End jump, Enter opens the chat and moves focus to the thread's heading.
  a11y      A navigation list of links. Each link's name holds the essentials: "Meera Pillai, 2 unread, last
            message: Here's the fee structure, 5 min ago, waiting 12 minutes".
            New chats assigned to the person are announced politely ("New message from Meera Pillai"). Others only
            update counts.
            Targets: rows 64 px.
            Pairs: text on surface, surface-hover, accent-subtle, info-subtle; text-muted on surface, surface-hover,
            accent-subtle; accent on accent-subtle; on-accent on accent; warning on warning-subtle; text on
            surface-sunken; info on info-subtle; focus-ring on surface, surface-hover, accent-subtle.
  base      native <nav>, <ul> and <a> with a roving-tabindex hook; Radix Tabs; SearchInput, Button (group 1);
            Avatar, StatusPill, Alert, PhoneText, MaskedValue, RelativeTime (group 2).
  used on   S15, S08 (messages tab).
```

#### ChatThread

```text
ChatThread
  purpose   Read and reply to one WhatsApp conversation, and see what happened to each message.
  anatomy   Header: the lead's name as a link to the profile, or for an unknown number PhoneText (MaskedValue for
            roles that see contacts masked) with "Link to a lead" and "Create lead". Both send the conversation id,
            never the number. Then a status StatusPill, the ServiceWindowIndicator pill, and actions: "Pick" (when
            waiting), "Resolve", "Reopen" (when resolved), "Assign to…", More.
            Message log (role="log") with day separators. Each message is a bubble:
            - inbound on the left, outbound on the right;
            - body text (dir="auto", links made clickable), or media: an image thumbnail, a document card (name,
              size, "Download", "Save to lead field"), audio or video with native controls;
            - a template label line for template messages ("Template · Fee reminder");
            - the sender for outbound messages (a person, or "Automation: Welcome series");
            - the time, and for outbound the delivery state, with the status vocabulary's icons and words: Sending
              (LoaderCircle, static), Sent (Check), Delivered (CheckCheck), Read (Eye), Failed (a danger StatusPill,
              the reason as detail text, and "Try again"). For leads under 18, outbound messages stop at Delivered:
              Read is never shown.
            System lines in the middle: "Asha Nair picked this chat", "Resolved", "Reopened", "Reply window closed".
            A "Load earlier messages" button at the top of the log, and a "1 new message" jump button when the
            person has scrolled up.
            The composer docks at the bottom: MessageComposer, inbox reply variant.
  variants  S15 (full); S08 messages tab (history; replying opens S10); M03 (phase 2).
  sizes     header h-pagebar (56 px). Bubbles max-w-public (480 px) and at most 85% of the thread width, px-3 py-2
            rounded-lg, gap-1 between bubbles from the same side, gap-3 when the side changes. Body text-sm
            leading-prose; meta text-xs. Image thumbnails at most 240 px wide, with width and height set.
  states    loading (Skeleton bubbles); no messages yet (a chat started by a template); unknown number; waiting
            (the composer is replaced by the primary "Pick this chat", so two people don't reply at once); picked by
            someone else (the composer is replaced by a line naming them, and managers get "Take over"); resolved
            (the composer is replaced by "Reopen"; a new inbound message reopens the chat by itself); reply window
            closed (the composer is in template mode); sending; failed; media not saved (the copy from WhatsApp
            failed); loading earlier; scrolled up with new messages; lead under 18 (no Read state).
  tokens    log            bg-surface-subtle
            inbound bubble bg-surface border border-border text-fg
            outbound       bg-accent-subtle text-fg
            meta           text-xs text-muted; Read icon (Eye) text-accent; other delivery icons text-muted
            template label text-xs font-medium text-muted
            system line    text-xs text-muted, centred
            failed         StatusPill danger below the bubble
            header         bg-surface border-b border-border
  content   Actions "Pick this chat", "Resolve", "Reopen", "Assign to…", "Take over", "Link to a lead", "Create
            lead".
            Unknown number banner: "This number isn't linked to a lead yet." Picked by another: "Asha Nair is
            handling this chat." Resolved: "Resolved by Asha Nair on 06 Oct." with "Reopen".
            Delivery words (status vocabulary): "Sending", "Sent", "Delivered", "Read", "Failed".
            Failure details in our words, after the "Failed" pill: "This number isn't on WhatsApp." "WhatsApp limits
            messages to this person right now. Try again tomorrow."
            Media: "Photo from Meera, 2:30 pm" (default alt text when there is no caption). "Couldn't save this file
            from WhatsApp."
            Buttons "Load earlier messages", "1 new message", "Download", "Save to lead field", "Try again".
            Announcements: "New message from Meera Pillai: Is the hostel fee included in…"; "3 new messages from
            Meera Pillai"; "20 earlier messages loaded".
  keyboard  Tab order: header actions, the log (a focusable region, tabindex="0", that scrolls with the arrow keys
            and Page Up and Page Down), controls inside messages, then the composer. After "Pick this chat", focus
            moves to the composer's text box.
  a11y      role="log" with aria-live="off", so adding or prepending messages is never read out by itself. A separate
            sr-only role="status" region announces only new inbound messages ("New message from Meera Pillai:"
            and the first 80 characters), batched to one announcement per 5 s ("3 new messages from Meera Pillai").
            Outbound messages and system lines are not announced.
            While earlier messages load, the log has aria-busy="true". Then the status says "20 earlier messages
            loaded" and focus stays on "Load earlier messages".
            Each message starts with sr-only text naming the sender and time ("Meera Pillai, 2:30 pm:"). Delivery
            states are words (sr-only next to the icon, and a tooltip on hover).
            Images have alt text. Failed messages link their reason with aria-describedby.
            Targets: header buttons 32 px; buttons in bubbles at least 24 px.
            Pairs: text on surface, surface-subtle, accent-subtle; text-muted on surface, surface-subtle,
            accent-subtle; accent on accent-subtle, surface; danger on danger-subtle; on-accent on accent;
            focus-ring on surface, surface-subtle, accent-subtle.
  base      native <section> with role="log"; MessageComposer, ServiceWindowIndicator (this group); Avatar,
            StatusPill, Skeleton (group 2); Button, IconButton (group 1); native <img>, <audio> and <video>.
  used on   S15, S08 (messages tab), M03.
```

#### WhatsAppTemplatePreview

```text
WhatsAppTemplatePreview
  purpose   Show a WhatsApp template roughly as the recipient will see it, with its category, approval status and
            quality rating.
  anatomy   <figure>:
            - meta row: template name, language, category pill, and the approval and quality StatusPills from the
              status vocabulary (templates.wa_status, templates.wa_quality);
            - when rejected or re-categorised, an Alert with the reason;
            - the paper frame holding a plain message card: header (text, or a media placeholder with the file
              name), body (variables shown as sample values or as [1], [2]), footer line, and the buttons as
              outlined rows (quick reply; link with ExternalLink; phone with Phone);
            - figcaption "Preview of Fee reminder (English)";
            - a Switch "Show sample values".
            The card is neutral: no chat wallpaper, no green bubble and no WhatsApp marks. It shows content and
            layout, not WhatsApp's look.
  variants  full (S19 side panel, 360 px wide); inline (S10 and S16 preview tab); compact (S18 step settings:
            body only).
  sizes     card w-full max-w-sm (384 px) p-3 rounded-lg. Body text-sm leading-prose. Footer text-xs. Button rows
            h-control-md (40 px) border-t. Media placeholder aspect-video max-h-40.
  states    Approval (Meta's values, the vocabulary's words): draft (not submitted), in review, approved, rejected
            (with Meta's reason, and "Edit and resubmit"), paused by Meta, disabled by Meta, appeal in review, and
            the vocabulary's other values (at risk, locked, archived…).
            Quality: high, medium, low, not rated yet.
            Other:
            - re-categorised by Meta (an info Alert);
            - media missing in the sample (placeholder);
            - variable without a sample (shows [2] and a hint);
            - last synced time.
  tokens    meta pills   StatusPill by vocabulary value; category neutral (bg-surface-sunken text-fg)
            quality      the vocabulary's wa_quality pill (SignalHigh, SignalMedium, SignalLow, Signal)
            card         inside the paper frame: bg-surface border border-border rounded-lg shadow-card
            body         text-fg; variables bg-accent-subtle text-fg rounded-xs px-0.5
            footer       text-xs text-muted
            button rows  text-accent text-sm border-t border-border
  content   Category labels "Marketing", "Utility", "Authentication". Approval "Draft", "In review", "Approved",
            "Rejected", "Paused by Meta", "Disabled by Meta", "Appeal in review". Quality "High quality", "Medium
            quality", "Low quality", "Not rated yet".
            Example body: "Hi Meera Pillai, your application fee for B.Tech Computer Science is due on 10 Oct
            2026. Pay here: [link]". Buttons "Pay now", "Talk to a counsellor".
            Alerts: "Rejected by Meta: the sample for {{2}} was missing. Add a sample and resubmit." "Meta moved this
            template from Utility to Marketing on 03 Oct. Marketing messages cost more." "Paused by Meta after
            recipients reported or blocked it."
            Hint: "Add a sample value for [2] so reviewers can see what it holds."
            Switch "Show sample values". Sync "Synced with WhatsApp 5 min ago".
  keyboard  Only the Switch and any Alert buttons are focusable. The buttons drawn inside the card are not
            controls.
  a11y      <figure> with <figcaption>. The card's buttons are rendered as text (<span>), and an sr-only line lists
            them: "Buttons: Pay now (opens a link), Talk to a counsellor (quick reply)".
            Approval and quality are words. The paper frame has a title.
            Targets: the Switch is 24 px tall in a 32 px row; nothing else is a target.
            Pairs: text on surface, accent-subtle, surface-sunken, info-subtle; text-muted on surface,
            surface-sunken; accent on surface; success on success-subtle; warning on warning-subtle; danger on
            danger-subtle; info on info-subtle; focus-ring on surface.
  base      native <figure>; the paper frame (intro); StatusPill, Alert (group 2); Switch (group 1).
  used on   S10, S16, S18, S19.
```

---

### D. Automation builder and settings editors

#### WorkflowCanvas

```text
WorkflowCanvas
  purpose   Show and edit an automation as a flow of steps, laid out automatically, with a list view that does the
            same job by keyboard and screen reader.
  anatomy   Toolbar (Radix Toolbar):
            - "Canvas" and "List" SegmentedControl (the view is remembered per person);
            - Zoom out, a zoom Select (50%, 75%, 100%, 125%, 150%), Zoom in, "Fit to screen";
            - the problems button ("2 problems"), which opens a Popover listing each problem; choosing one selects
              that step;
            - "Settings" (name, trigger, and whether a lead can go through more than once);
            - status StatusPill from the status vocabulary ("Draft", "On", "Paused", "Needs fixing"), with the
              version as detail text ("Version 3");
            - "Save draft" and "Publish" (primary); "Pause" or "Turn on" when published.
            Canvas: a scroll area with real scrollbars. Inside, an SVG layer draws the edges (WorkflowEdge) and HTML
            nodes (WorkflowNode) sit at positions computed by the layout.
            Settings panel: a column beside the canvas (w-drawer-md, 560 px, not modal) for the selected step. The
            canvas narrows to make room; the panel never sits on top of it, so a focused step is never hidden under
            it (2.4.11).
            A "Switch to list view" link is the first thing in the canvas: sr-only until it has focus, then shown
            in the canvas's top left corner (2.4.7).
            Layout and editing rules (decisions.md 2.5.7):
            - positions are always computed top to bottom, so no step is ever placed by hand;
            - if / else splits into a "Yes" and a "No" branch; branches do not join again, and each ends on its own;
            - a step is added with the "+" on an edge, and moved with "Move step…" (a slot picker), never by dragging;
            - panning uses the scrollbars, the arrow keys or the zoom buttons; Space-and-drag is an extra for
              pointer users.
  variants  edit (a draft, or a published automation being changed: changes go into a new draft version);
            read-only (no permission, or viewing an old version);
            report (published: each step shows counts from automation_steps; a date range Select sits in the
            toolbar).
  sizes     toolbar h-pagebar (56 px) px-4 gap-2, buttons sm (32 px). Canvas fills the page height under the toolbar.
            Layout: nodes w-64 (256 px); 48 px between a node and the next; 32 px between branches.
            Zoom changes a CSS transform on the node layer; text never goes below 50% zoom, where labels hide and
            only type icons and numbers stay. The node layer sets --zoom, and a focused step's outline width is
            calc(2px / var(--zoom)), so the ring stays 2 CSS px at every zoom (2.4.13).
  states    empty (one placeholder trigger node: "Choose a trigger"); draft; invalid (problem count, nodes
            flagged); valid; saving draft (autosaves 2 s after a change; the status says "Saved"); publishing
            (a confirm Dialog); active; paused; report; zoomed; read-only; save failed (an Alert, changes kept).
            Publishing:
            - every problem must be fixed first; "Publish" stays enabled and, when pressed with problems, opens the
              problems list instead;
            - the confirm says that leads already inside keep running on their version.
  tokens    toolbar     bg-surface border-b border-border
            canvas      bg-bg
            panel       bg-surface border-l border-border
            list link   sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 z-(--z-raised)
                        bg-surface-raised text-fg px-3 py-2 rounded-md shadow-pop
            problems    Button secondary sm with CircleAlert text-danger and the count in text-fg
  content   Toolbar: "Canvas", "List", "Zoom out", "Zoom in", "Fit to screen", "2 problems", "Settings", "Save
            draft", "Publish", "Pause", "Turn on".
            Status pills: "Draft", "On", "Paused", "Needs fixing"; detail "Version 3". Save status: "Saved",
            "Saving…".
            Empty: "Start with a trigger: what should start this automation?"
            Publish confirm: title "Publish version 4?"; body "New leads will follow version 4. Leads already in this
            automation finish on version 3."; buttons "Cancel" and "Publish".
            Re-entry setting: "Can a lead go through this more than once?" with "Only once, ever", "Again after
            they finish", "Every time it's triggered".
            Save failure: "Couldn't save the draft. Your changes are still here. Try again."
            Hidden link: "Switch to list view".
  keyboard  Toolbar: one tab stop, arrows between controls.
            Canvas: the DOM order is the flow order (a step, then its Yes branch, then its No branch). Tab moves
            through steps and "+" buttons in that order. Enter on a step opens its panel; Esc closes the panel and
            returns focus to the step.
            Ctrl+= and Ctrl+- zoom; Ctrl+0 fits. When the scroll area itself has focus, the arrow keys pan.
  a11y      The canvas is role="region" labelled "Canvas for New lead routing". Edges are aria-hidden; the
            connections are in each step's name ("then", "if yes") and fully in the List view (WorkflowOutline).
            The status changes ("Saved", "Published version 4") are announced politely.
            Zoom never removes information that is not also in the panel and the List view.
            Targets: steps at least 64 px tall; "+" buttons 24 px, at least 24 px from any other target; toolbar
            32 px.
            React Flow's own keyboard handling, focusable wrappers and live text are off (see base), so each step
            is one tab stop and edges are never focusable.
            Pairs: text on bg, surface, surface-raised; text-muted on bg, surface; border-input on bg; accent on
            bg; on-accent on accent; danger on surface; focus-ring on bg, surface, surface-raised.
  base      @xyflow/react (React Flow, MIT) as <ReactFlow nodesDraggable={false} nodesConnectable={false}
            elementsSelectable={false} nodesFocusable={false} edgesFocusable={false} disableKeyboardA11y>, with
            the selection box off; only the step <button>s and the "+" IconButtons are tab stops. @dagrejs/dagre
            (MIT) for the layout (both new dependencies, see Open questions); Radix Toolbar; SegmentedControl,
            Select (group 1); Dialog, Popover, Alert, StatusPill (group 2).
  used on   S18.
```

#### WorkflowNode

```text
WorkflowNode
  purpose   One step of an automation on the canvas: trigger, condition, if / else, wait or action. It shows its
            settings in one line and any problem it has.
  anatomy   A <button> card:
            - top line: the type icon, the type label and the step number;
            - title: a summary of the settings;
            - a problem line (CircleAlert and text) when invalid;
            - in report mode, a counts line;
            - for if / else, two labelled exits at the bottom ("Yes", "No"), drawn by WorkflowEdge.
            Type icons:
            - trigger Zap; condition Funnel; if / else Split; wait Hourglass;
            - actions: assign UserPlus, assign to a team Users, unassign UserMinus, send message Send, change stage
              ArrowRightLeft, update a field PencilLine, notify a person Bell, create a follow-up CalendarPlus, call
              a webhook Webhook.
  variants  trigger (exactly one, always first): lead created, lead updated, stage changed, field changed,
            application status changed, payment succeeded, activity recorded, opportunity created, a date field, a
            repeating interval, message received.
            condition (a filter): leads that don't match leave the automation here.
            if / else: leads go down "Yes" or "No".
            wait: a duration, a time of day, or a date field with an offset.
            action: one of the action kinds above.
            placeholder: an empty trigger or a newly added step not yet set up.
  sizes     w-64 (256 px), min-h-16 (64 px), p-3 rounded-lg. Type line text-xs; title text-sm line-clamp-2 with pb-1
            inside the clamp box; problem and counts text-xs. Icon 16 px.
  states    configured; placeholder ("Choose…", dashed border); invalid; selected (its panel is open); hover;
            focus-visible; read-only; report counts.
            Problems found before publishing:
            - nothing chosen yet;
            - a template that isn't approved;
            - a removed field or picklist value;
            - a wait outside 1 minute to 90 days;
            - assigning to a team with no active members (leads would stay unassigned);
            - a condition on a field the trigger fires before it is filled (for example City on "lead created" when
              the form has no City field), so it can never match.
            Delete asks first. Deleting an if / else asks which branch to keep.
  tokens    card        bg-surface border border-strong rounded-lg shadow-card text-left hover:bg-surface-hover
            type line   text-xs font-medium text-muted; icon text-muted (trigger icon text-accent)
            title       text-sm text-fg
            placeholder border-dashed border-input bg-surface; title text-muted
            invalid     border-danger; problem text-xs text-danger with CircleAlert
            selected    border-2 border-accent (the fill stays bg-surface, so the problem text keeps its contrast)
            counts      text-xs text-muted tabular-nums
  content   Type labels "Trigger", "Condition", "If / else", "Wait", "Action". Step number "Step 3".
            Titles: "Lead created", "Verified is Yes and Source is in Paid ads", "Has an application started?",
            "Wait 1 hour", "Wait until 9:00 am", "Send WhatsApp: Welcome", "Assign by round robin: Pune
            counsellors", "Change stage to Interested", "Create a follow-up for the owner in 1 day".
            Placeholders "Choose a trigger", "Choose an action".
            Problems: "Choose a trigger." "Add at least one condition." "Choose a template." "This template isn't
            approved yet." "Set a wait between 1 minute and 90 days." "The field Intake was removed." "Pune
            counsellors has no active members, so leads would stay unassigned." "City is empty when a lead is
            created from your forms, so this condition never matches."
            Counts: "1,204 entered · 1,180 done · 24 failed".
            Delete confirm: "Delete this step? The steps after it move up." If / else: "Keep the Yes branch", "Keep
            the No branch", "Delete both".
  keyboard  Tab focuses; Enter or Space opens its settings panel. Delete or Backspace on a focused step asks to
            delete it. Esc in the panel returns focus here.
  a11y      Name: "Step 3, Action: Send WhatsApp template Welcome, then step 4." With a problem: "…, has a problem:
            This template isn't approved yet."
            aria-expanded and aria-controls point at the settings panel. The problem is an icon plus words, never a
            red border alone.
            Targets: the whole card, at least 256 by 64 px.
            Pairs: text on surface, surface-hover; text-muted on surface, surface-hover; accent on surface,
            surface-hover; danger on surface, surface-hover; border-input on bg, surface; focus-ring on bg, surface.
  base      native <button> rendered as a React Flow custom node; DropdownMenu and Dialog (group 2).
  used on   S18.
```

#### WorkflowEdge

```text
WorkflowEdge
  purpose   Connect steps on the canvas, label the branches of an if / else, and give a place to add a step.
  anatomy   An SVG path from the bottom of one step to the top of the next, with right angles and rounded corners,
            ending in an arrowhead.
            For an if / else: a "Yes" or "No" label at the start of each branch.
            A "+" IconButton at the edge's midpoint opens the "Add a step" menu (Condition, If / else, Wait, and
            the actions).
            At the end of a branch: an "End" marker.
            In report mode: the number of leads that passed along the edge.
  variants  default; Yes branch; No branch; end; report.
  sizes     stroke 2 px; arrowhead 8 px; corner radius 8 px. "+" button size-6 (24 px), round. Branch label h-5 px-2
            text-xs rounded-pill. End marker h-6 px-2 text-xs.
  states    default; highlighted (one of its steps is selected or focused); "+" hover and focus; menu open; report.
            After a step is added, the new step is selected, its panel opens and focus moves into the panel.
  tokens    path        stroke-input fill-none (border-input on bg, 3:1); highlighted stroke-accent
            arrowhead   fill-input; highlighted fill-accent
            label       bg-surface border border-border text-fg rounded-pill
            "+" button  bg-surface border border-input text-muted hover:text-fg hover:bg-surface-hover rounded-pill
            end marker  bg-surface-sunken text-muted rounded-pill
            report count text-xs text-muted tabular-nums
  content   Labels "Yes", "No", "End". "+" names: "Add a step after step 2, Wait 1 hour"; "Add a step at the start of
            the Yes branch of step 3".
            Menu items: "Condition", "If / else", "Wait", "Assign counsellor", "Assign to a team", "Unassign", "Send
            message", "Change stage", "Update a field", "Notify a person", "Create a follow-up", "Call a webhook".
  keyboard  The "+" buttons are in the flow order between steps. Enter or Space opens the menu; arrows move;
            Enter adds the step; Esc closes and returns focus.
  a11y      Paths, arrowheads and labels are aria-hidden: the same facts are in the steps' names and the List view.
            The "+" buttons have full names.
            Targets: "+" buttons are 24 px with at least 24 px clear of steps.
            Pairs: text on surface, surface-sunken, surface-hover; text-muted on surface, surface-hover,
            surface-sunken; border-input on bg, surface; accent on bg; focus-ring on bg, surface.
  base      SVG path (React Flow custom edge); IconButton (group 1); Radix DropdownMenu.
  used on   S18.
```

#### WorkflowOutline

```text
WorkflowOutline
  purpose   The same automation as an ordered, indented list that works fully by keyboard and screen reader: read,
            add, configure, move and delete steps without the canvas.
  anatomy   The canvas toolbar, with "List" selected.
            A nested <ol aria-label="Steps of New lead routing">. Each <li> has:
            - the step number;
            - a step button (type, summary, and the problem if any), which opens the same settings panel as the
              canvas;
            - an actions menu button (Ellipsis): "Edit", "Add a step after", "Move up", "Move down", "Move step…",
              "Duplicate", "Delete".
            An if / else step holds two sub-lists under the headings "If yes" and "If no". Each branch ends with an
            "End" line and an "Add a step to this branch" button.
            "Move step…" opens a Dialog with a RadioGroup of every valid slot.
  variants  edit; read-only (no menus, the step buttons still open a read-only panel); report (counts after each
            summary).
  sizes     rows min-h-control-md (40 px) py-2; the step button fills the row; the menu button sm (32 px).
            Indent pl-6 (24 px) per level, with a border-l border-border guide. Step numbers w-8.
  states    same validity as WorkflowNode; selected (its panel is open); moving; invalid move (aria-disabled with a
            reason); deleted (focus goes to the next step, or to the previous one at the end).
            Move rules:
            - nothing moves above the trigger;
            - moving an if / else moves its branches with it, and the confirm says how many steps that is;
            - "Move up" and "Move down" stay within the same branch; "Move step…" can go to another branch.
  tokens    list        bg-surface
            step button text-left text-sm text-fg rounded-md hover:bg-surface-hover; type label text-xs text-muted
            selected    border-l-2 border-accent font-medium (the fill does not change)
            problem     text-xs text-danger with CircleAlert
            headings    text-xs font-semibold text-muted
            guide       border-l border-border
  content   Headings "If yes", "If no". "End". Buttons "Add a step after", "Add a step to this branch".
            Menu items as above.
            Move dialog: title "Move "Wait 1 hour""; options such as "After step 1: Lead created", "At the start of
            the Yes branch of step 3"; note "This moves the step and the 4 steps in its branches."; buttons "Cancel"
            and "Move".
            Invalid move reason: "The trigger is always first."
            Status: "Wait 1 hour moved to step 4 of 7." "Step deleted. 6 steps left."
  keyboard  Tab moves through each step button and its menu button, in flow order. On a step button: Enter opens
            settings; Alt+Arrow Up and Alt+Arrow Down move the step within its branch; Delete asks to delete it.
            Menus use the arrow keys; Esc closes.
  a11y      Nested ordered lists carry the structure; branch headings are real headings (h3), so screen reader users
            can jump between branches.
            Each step button's name: "Step 3 of 7, Action, Send WhatsApp: Welcome". Problems are part of the name.
            Moves and deletes are announced in a polite status. Focus stays on the moved step's button.
            Targets: step buttons 40 px tall; menu buttons 32 px.
            Pairs: text on surface, surface-hover; text-muted on surface, surface-hover; danger on surface,
            surface-hover; accent on surface; focus-ring on surface, surface-hover.
  base      native nested <ol>; Button, IconButton, RadioGroup (group 1); DropdownMenu, Dialog (group 2).
  used on   S18.
```

#### ReorderableList

```text
ReorderableList
  purpose   Put items in order (stages, sub-stages, columns, quick filters, picklist values, form fields) by
            dragging, or with Move up and Move down buttons so nobody has to drag (2.5.7).
  anatomy   <ol>. Each row:
            - a drag handle (GripVertical), for pointers only;
            - the row content (name and any meta: flags, counts, a Switch);
            - Move up and Move down IconButtons (ArrowUp, ArrowDown);
            - a row menu (Ellipsis) with "Move to position…", "Move to top", "Move to bottom", then the row's own
              actions ("Edit", "Turn off").
            "Move to position…" opens a Popover with a NumberStepper (1 to the list length) and "Move".
            A polite status region announces every move.
  variants  settings (S29 stages): rows h-row (48 px) with the name, sub-stage count, "Follow-up needed" and
            "Sub-stage needed" flags, the score (−10 to +10, edited with a NumberStepper in the edit dialog, never a
            slider), an "On" Switch, and "Edit".
            nested (S29 sub-stages under their stage; S28 picklist values under a parent): moves stay inside the
            parent.
            compact (ColumnChooser, QuickFilterManager): rows h-menu-item (32 px), no row menu.
            form fields (S31): rows show the field label, type and "Required".
            lead fields (S28): rows show the label, type and flags. At the plan's custom-field limit, Alert
            field_limit (group 2) shows above the list and "Add field" is aria-disabled with the same reason.
  sizes     handle 24 px hit area, 16 px icon. Move buttons xs (24 px) in compact rows, sm (32 px) in settings rows.
            Rows px-3 gap-2.
  states    default; hover; dragging (the row lifts; a gap with a dashed edge shows where it was); drop indicator;
            moved (focus stays on the button that was pressed); first and last rows (Move up or Move down
            aria-disabled); saving the order (optimistic; the status says "Saving order…"); save failed (the order
            goes back, and a Toast says so); locked row (always first: no handle, a Lock icon, moves aria-disabled
            with the reason); turned-off row (text-muted plus an "Off" pill; it still moves); read-only (no
            handles, no move buttons).
  tokens    row         bg-surface border-b border-border
            handle      text-muted cursor-grab active:cursor-grabbing
            dragging    bg-surface-raised shadow-pop rounded-md
            gap         border border-dashed border-input rounded-md
            drop line   h-0.5 bg-accent
            off row     text-muted; pill StatusPill neutral
  content   Names: "Move Interested up", "Move Interested down", "Move to position…", "More actions for
            Interested".
            Position popover: label "New position (1 to 9)"; button "Move".
            Status: "Interested moved to position 3 of 9." "Saving order…" "Order saved."
            Locked reason: "New is always the first stage."
            Field limit (S28, group 2's field_limit): "You've used all 200 custom fields on your plan. Turn off a
            field you don't need, or contact us."
            Failure toast: "Couldn't save the new order. It's back to how it was."
            S29 flags: "Follow-up needed", "Sub-stage needed", "Score +5". Switch "On".
  keyboard  Tab reaches each row's controls: content controls, Move up, Move down, the menu. Alt+Arrow Up and
            Alt+Arrow Down move the row when focus is on any of its buttons. The handle is not focusable.
  a11y      The <ol> gives the order. Each row has sr-only "Position 3 of 9".
            The handle is aria-hidden. The buttons are the keyboard and single-pointer way to reorder (2.5.7).
            aria-disabled keeps focus on Move up or Move down at the ends.
            Targets: 24 px move buttons with 8 px between them (32 px in settings rows); handle 24 px.
            Pairs: text on surface, surface-raised, surface-hover, surface-sunken; text-muted on surface,
            surface-raised; border-input on surface; accent on surface; focus-ring on surface, surface-raised.
  base      native <ol>; @dnd-kit/core and @dnd-kit/sortable (MIT) with the pointer sensor only (new dependency, see
            Open questions); IconButton, NumberStepper, Switch (group 1); Popover, DropdownMenu, Toast, StatusPill
            (group 2).
  used on   S05, S26, S28, S29, S31.
```

#### TreeEditor

```text
TreeEditor
  purpose   Edit a hierarchy (teams and who manages them; nested picklists such as programme and specialisation).
            Expand and collapse it, and move nodes by dragging or with a "Move to…" dialog.
  anatomy   Toolbar above the tree: search ("Find a team"), "Expand all", "Collapse all", "Add team".
            Selection toolbar (Radix Toolbar), acting on the selected node. It starts with the node's name as visible
            text ("Pune campus"), then "Add sub-team", "Edit", "Move to…", "Move up", "Move down", "Remove". Its
            label names the node too.
            Tree (role="tree"). Each treeitem has:
            - a chevron (part of the item, not a separate control);
            - an icon (Users for a team, Tag for a picklist value);
            - the name;
            - meta: for teams the manager and the member count; for picklist values "Off" when turned off and how
              many leads use it;
            - a drag handle for pointers.
            Detail panel at the right (S34): members, manager, parent team.
            "Move to…" Dialog: a Combobox of possible parents (including "Top level"), a position Select ("First",
            "Last", "After {sibling}"), and "Move".
            Rows hold no tab stops of their own; every action lives in the selection toolbar, so the tree keeps the
            standard tree keyboard model.
  variants  teams (S34): parents, managers and members; cycles are blocked (also by the database).
            picklist (S28): values with parents, an on or off state and a sort order; the key is read-only.
  sizes     rows h-menu-item (32 px) for picklists, h-control-md (40 px) for teams. Indent pl-5 (20 px) per level,
            with border-l border-border guides. Chevron 16 px in a 24 px area. Toolbars h-control-sm (32 px)
            buttons. Up to 6 levels for teams, 3 for picklists.
  states    collapsed; expanded; selected; focused; hover; dragging (drop above, below or inside a node); invalid
            drop (into its own sub-tree: no indicator, and in "Move to…" those parents are aria-disabled with the
            reason); loading children (big picklists load children on expand); empty; search (matches stay with
            their ancestors; others hide; the match is font-semibold); turned-off node; saving a move (optimistic;
            reverts on failure); read-only (no manage permission: no handles; the toolbar offers only "View").
            Remove is blocked while a team has members or sub-teams, and while a picklist value is used by leads
            (it can be turned off instead).
  tokens    tree        bg-surface
            row         rounded-md border-l-2 border-transparent hover:bg-surface-hover aria-selected:bg-accent-subtle
                        aria-selected:border-accent text-fg (a 2 px accent edge, so selection is never fill alone)
            chevron     text-muted; meta text-xs text-muted
            guides      border-l border-border
            drop inside outline-2 outline-dashed outline-accent; drop line h-0.5 bg-accent
            match       font-semibold
            off         StatusPill neutral
  content   Teams: "Admissions", "Pune campus", "Engineering counsellors". Meta "Manager: Asha Nair · 12 people".
            Toolbar "Add team", "Add sub-team", "Edit", "Move to…", "Move up", "Move down", "Remove team",
            "Expand all", "Collapse all". Search "Find a team".
            Remove blocked: "Pune campus has 12 people and 2 sub-teams. Move them first."
            Picklist: "Add value", "Turn off". Turn-off hint: "Turned-off values stay on existing leads but can't be
            picked again." Remove blocked: "214 leads use B.Tech Civil. Turn it off instead."
            Move dialog: title "Move Pune campus"; label "New parent"; option "Top level"; label "Position";
            reason "A team can't move inside its own sub-team."
            Status: "Pune campus moved under Maharashtra region."
            Empty: "No teams yet. Add your first team to group your counsellors."
            Instructions (linked to the tree): "Arrow keys move through the tree. Alt+Arrow Up and Alt+Arrow Down
            reorder. Tab reaches the actions for the selected team."
  keyboard  Tab enters the tree on the selected node (one tab stop); the next Tab goes to the selection toolbar.
            In the tree (APG treeview): Arrow Up and Down move; Right expands or goes to the first child; Left
            collapses or goes to the parent; Home and End; typing a letter jumps by name; Enter opens the detail
            panel; * expands all siblings; Alt+Arrow Up and Alt+Arrow Down move the node among its siblings.
  a11y      role="tree" labelled "Teams". Treeitems carry aria-level, aria-setsize, aria-posinset,
            aria-expanded and aria-selected; children sit in role="group".
            The selection toolbar's label includes the node ("Actions for Pune campus"). The drag handle is
            aria-hidden; "Move to…", "Move up" and "Move down" are the non-drag way (2.5.7).
            Moves are announced in a polite status.
            Targets: rows 32 or 40 px; chevron area 24 px; toolbar buttons 32 px.
            Pairs: text on surface, surface-hover, accent-subtle, surface-raised, surface-sunken; text-muted on
            surface, surface-hover, accent-subtle; accent on surface, accent-subtle; border-input on surface-raised;
            focus-ring on surface, surface-hover, accent-subtle.
  base      our own tree with a roving tabindex (Radix has no tree); @dnd-kit (pointer sensor only); Radix Toolbar;
            Combobox, Select, SearchInput (group 1); Dialog, StatusPill (group 2).
  used on   S28, S34.
```

#### PermissionMatrix

```text
PermissionMatrix
  purpose   Set what a role can do in each module, how much lead data it can see (own, team or all), and whether
            contact details are hidden from it.
  anatomy   Role header: name, description, a "Built in" StatusPill for system roles, and "Used by 14 people".
            Section "Data access":
            - RadioGroup cards for the data scope: own, team, all;
            - Switch "Hide mobile numbers and email addresses" with its explanation.
            Section "What this role can do": a matrix table.
            - Rows are modules, in groups ("Leads and contact", "Messaging", "Money", "Reports", "Setup").
            - Columns are rights: View, Edit, Download, Manage.
            - Each cell is a Checkbox, or "—" when the right does not apply to that module.
            - Each module row starts with a row Checkbox (all its rights; indeterminate when some are on), and each
              right column has a header Checkbox (that right for every module).
            Alerts (info) for risky combinations. Footer: "Cancel" and "Save role", with the note on when changes
            apply.
            Dependencies: Edit, Download and Manage each need View. Turning one on turns View on; turning View off
            turns the others off. The status says what changed.
  variants  edit (custom roles); read-only (the built-in Admin role, or a person without the right to manage
            roles); built-in editable (Manager, Counsellor, Support: rights can change; the name cannot).
  sizes     rows h-row-compact (40 px); group rows h-control-sm (32 px). Module column w-64 (256 px); right
            columns w-24 (96 px), centred. Checkbox 16 px in a 24 px hit area. Header row sticky; module column
            sticky on narrow screens. Scope cards in a 3-column grid from md, stacked below.
  states    default; dirty ("Unsaved changes" next to Save); saving; saved (Toast); server refusal (for example
            removing the last admin's access to Users); locked cells (Admin: all on and aria-disabled with the
            reason); dependency change; risky combination (an info Alert); masking on with Download (a note that
            exports stay masked).
  tokens    table       as DataTable plain: header bg-surface-sunken text-fg font-medium
            group row   bg-surface-subtle text-xs font-semibold text-muted
            cells       text-center; "—" text-muted
            scope cards RadioGroup card styles (group 1)
            alert       Alert info (bg-info-subtle text-fg, Info text-info)
            focus       as DataTable: cell checkboxes keep the default 2 px offset ring, never focus-inset, so the
                        ring sits on the cell and not on a ticked box's accent fill
  content   Rights headers with tooltips: "View: see records and reports", "Edit: add and change records",
            "Download: export to CSV", "Manage: settings and bulk actions".
            Modules (examples): "Leads", "Follow-ups", "Notes", "Messages", "Calls", "Payments", "Refunds",
            "Reports", "Dashboards", "Automations", "Templates", "Broadcasts", "WhatsApp inbox", "Opportunities",
            "Fields and stages", "Enquiry forms", "Channels", "Users and roles", "Audit log", "Data requests".
            Scope cards: "Own leads: leads they own or added themselves"; "Team leads: their own, plus everyone who
            reports to them"; "All leads".
            Mask switch: "Hide mobile numbers and email addresses"; hint "They'll see +91 ••••• •3210. They can
            still call and message leads through {Product}."
            Checkbox names: "Leads: Edit". Row: "All rights for Leads". Column: "Edit for every module".
            Locked reason: "Admins always have full access."
            Dependency status: "View for Payments was turned on, because Download needs it."
            Risky: "This role can export the contact details of every lead."
            Masked export note: "Hidden contact details stay hidden in exports."
            Footer note: "Changes apply to the 14 people with this role the next time they open a page."
            Refusal: "At least one admin must be able to manage users and roles."
  keyboard  The matrix is a grid (one tab stop, like DataTable): arrows move between cells, Space toggles the
            focused checkbox, Home and End go along the row. The scope radios and the Switch come before it in the
            tab order; Save and Cancel after it.
  a11y      <table role="grid"> labelled "Permissions for Counsellor". Rights are <th scope="col">; modules are
            <th scope="row">; group rows are <th scope="rowgroup" colspan>. Each checkbox also has its own
            aria-label ("Leads: Edit").
            Locked checkboxes use aria-disabled with the reason linked.
            Dependency changes and saves are announced politely.
            Targets: 24 px checkbox hit areas; 40 px footer buttons.
            Pairs: text on surface, surface-sunken, surface-subtle, surface-hover, info-subtle; text-muted on
            surface, surface-subtle; border-input on surface, surface-hover; accent on surface; on-accent on accent;
            info on info-subtle; focus-ring on surface, surface-hover, surface-sunken.
  base      native <table> with the DataTable grid hook; Checkbox, RadioGroup (cards), Switch, Button (group 1);
            Alert, Toast, StatusPill (group 2).
  used on   S33.
```

#### NoticeEditor

```text
NoticeEditor
  purpose   Write, translate and publish the privacy notice that every enquiry form shows and every consent record
            points to. A published version never changes; a change publishes a new version.
  anatomy   Settings > Privacy notices (/settings/notices):
            - version list: DataTable plain with "Version", "Language", "Published" (DateText) and "Status" (a
              StatusPill from the status vocabulary: Draft, Published, Older version). A row opens that version.
            - "Start a new version" (Button primary sm), shown while no draft exists.
            Draft editor (a page, max-w-form):
            - Tabs (group 2, manual activation), one per language the institution's forms offer, each marked
              "Missing" while its text is empty;
            - "Purposes": one row per purpose, each with a key (read-only once published), a plain-language label
              for each channel (Email, SMS, WhatsApp, calls) and "Required" (Switch);
            - "What we collect", "How long we keep it" and "Who to contact": Textareas;
            - footer bar: "Preview", "Save draft", "Publish version 4".
            A published version opens read-only (DescriptionList and the text) with "Start a new version", which
            copies it into a new draft.
  variants  first notice (none published yet); draft; published (the latest, read-only); older version (read-only,
            still linked from the consents given under it).
  sizes     Page max-w-form (720 px); fields gap-6; Textareas min-h-32, text-sm leading-prose. Purpose rows p-3
            gap-3. Version list as DataTable plain.
  states    no published notice (Alert notice_missing, group 2, at the top of this page and on S31); draft saved;
            draft dirty; saving; a language missing (its tab says "Missing"; publishing is blocked until every
            offered language has its text); publishing (ConfirmDialog); published (Toast; the draft becomes the
            latest version and the one before it becomes "Older version"); read-only (no settings right).
  tokens    tabs          Tabs (group 2); "Missing" StatusPill warning
            purpose rows  bg-surface border border-border rounded-md p-3
            read-only     DescriptionList; the notice text text-sm leading-prose text-fg
  content   Page title "Privacy notices". Columns "Version", "Language", "Published", "Status".
            Buttons "Start a new version", "Preview", "Save draft", "Publish version 4".
            Purpose labels (examples, the same words as group 2's consent purposes): "Answering the enquiry",
            "Service messages", "Updates and offers".
            Fields "What we collect", "How long we keep it", "Who to contact".
            Missing: "Missing in Hindi". Publish blocked: "Add the Hindi text, or stop offering Hindi on your
            forms."
            Publish confirm: title "Publish version 4?"; body "Published notices can't be edited. New enquiries will
            see version 4. Consents already given stay linked to the version they saw."; buttons "Cancel" and
            "Publish version 4".
            Toast "Version 4 published."
  keyboard  Tabs: arrow keys move between languages; Enter or Space opens one. Normal tab order inside the editor.
            Leaving with changes asks "Discard your changes?" (FormLayout).
  a11y      Each purpose row is a <fieldset> named "Purpose 2: Service messages". Each language's fields carry lang
            for that language, so screen readers read Hindi with Hindi rules. The publish result is announced in the
            page's polite status.
            Targets: 40 px controls; Switch rows at least 24 px.
            Pairs: text on surface, surface-sunken, warning-subtle; text-muted on surface; border-input on surface;
            accent on surface; on-accent on accent; warning on warning-subtle; success on success-subtle;
            focus-ring on surface, warning-subtle.
  base      DataTable plain (this group); Tabs, ConfirmDialog, Alert, StatusPill, DescriptionList, DateText, Toast
            (group 2); TextInput, Textarea, Switch, FormLayout, Button (group 1); CRUD /settings/notices.
  used on   Settings > Privacy notices (/settings/notices, no screen ID yet; see Open questions); S31 (the
            notice_missing Alert links here); S01 (shows the latest published version).
```

---

### E. Calendar, reports and dashboards

#### Calendar

```text
Calendar
  purpose   See follow-ups and events by day, week or month, spot overdue ones, and act on them.
  anatomy   Toolbar:
            - "Today", Previous and Next IconButtons;
            - the period as an <h2> ("October 2026", "04 – 10 Oct 2026", "Tuesday, 06 Oct 2026");
            - view SegmentedControl: "Day", "Week", "Month", "List";
            - owner filter (Select: "Me", "My team", or a person; teams and people only for managers);
            - event type filter;
            - counts ("3 overdue · 8 upcoming this week");
            - "Times in IST" (the org's zone; also the viewer's zone when it differs);
            - "Add follow-up" (primary; opens S11).
            Month: a 7-column grid (Sunday first; see open question 6) of 5 or 6 weeks. Each day cell has
            the date number (a button that opens the day's list), up to 3 event chips, and "+4 more" (Button link
            xs, min-h-hit, the full cell width).
            Week and Day: an all-day row, then a time grid (7 am to 9 pm shown, scrolls to the full 24 hours), one
            column per day. Events sit at their start time; follow-ups without a duration get 30 minutes. A
            "Now" line marks the current time.
            List: events grouped by day, as rows. This is also the view below md (768 px).
            Event chip: start time, type icon, lead name, event type, and a status icon.
            Event popover (on click or Enter): title, lead link, due time with its zone, owner, status, notes, and
            actions "Open lead", "Mark done", "Reschedule", "Cancel follow-up", or "Reopen" for done and cancelled
            events.
  variants  full page (S12); agenda (S04 My day: overdue and today as a List, with "Open calendar"); mini month
            (S11: a small month of the owner's load next to the date field, read-only). When the owner already has
            a follow-up within 30 minutes of the chosen time, the mini month marks that day and the S11 form shows
            Alert follow_up_clash (group 2); saving is still allowed.
  sizes     toolbar h-pagebar (56 px), controls sm (32 px). Month cells min-h-28 (112 px) p-1.5; date number
            size-7 (28 px) button; chips h-6 (24 px) px-1.5 text-xs rounded-sm; "+4 more" min-h-hit (24 px), full
            cell width. Week: hour rows h-12 (48 px); time
            gutter w-16 (64 px); day headers h-row-header (40 px). List rows h-row (48 px). Popover w-80.
  states    loading (Skeleton chips); empty period; filled; today; outside-month days; selected day (keyboard);
            event states (below); "+N more"; dragging (pointer only); rescheduling (optimistic, with an Undo
            Toast; reverts on failure); error; viewing another person's calendar (actions follow permissions).
            Event states:
            - upcoming: accent-subtle chip;
            - overdue (upcoming and past due; derived, not stored): danger-subtle chip, AlarmClock, the word in its
              name;
            - done: success-subtle chip, CircleCheck;
            - cancelled: surface-sunken chip in text-muted with CircleSlash;
            - reopened: upcoming, plus "Reopened" in the popover.
            Dragging an event to a new time or day is a shortcut for pointer users. "Reschedule" (opens the S11
            form with the values filled) is the single-pointer and keyboard way (2.5.7).
  tokens    grid          bg-surface; cell lines border-r border-b border-border
            outside month bg-surface-subtle; date text-muted
            today number  bg-accent text-on-accent rounded-pill. If the date-number button takes focus, it uses the
                          default offset ring, never focus-inset, so the ring is not drawn on the accent fill
            chips         rounded-sm text-fg border border-border; upcoming bg-accent-subtle (icon text-accent);
                          overdue bg-danger-subtle (icon text-danger); done bg-success-subtle (icon text-success);
                          cancelled bg-surface-sunken text-muted
            now line      h-0.5 bg-accent; label text-xs text-accent
            popover       bg-surface-raised border border-border rounded-lg shadow-pop
            counts        text-sm text-muted; numbers text-fg tabular-nums
  content   Toolbar "Today", "Previous week", "Next week", "Day", "Week", "Month", "List", "Add follow-up",
            "Times in IST". Counts "3 overdue", "8 upcoming this week".
            Clash (S11, group 2's follow_up_clash): "Asha already has a follow-up at 4:30 pm IST on 07 Oct. You can
            still save."
            Chip "11:00 am · Call back · Meera Pillai".
            Popover: title "Call back: Meera Pillai"; "Due 05 Oct, 4:00 pm IST · Overdue"; "Owner: Asha Nair";
            buttons "Open lead", "Mark done", "Reschedule", "Cancel follow-up", "Reopen".
            "+4 more" name: "4 more follow-ups on 06 Oct".
            Empty: "No follow-ups this week." with "Add follow-up". Empty List: "Nothing scheduled from 06 to 12 Oct."
            Toasts: "Moved to 07 Oct, 11:00 am IST." with "Undo". "Marked done." with "Undo".
            Error: "Couldn't load the calendar." with "Try again".
  keyboard  Toolbar controls in order. Month view is a grid (one tab stop): arrows move by day, Page Up and Page
            Down by month, Home and End to the start and end of the week, Enter opens the day's list in a Popover
            whose events are buttons. Chips are pointer shortcuts (tabindex="-1"); the keyboard reaches the same
            events through the day's list.
            Week and Day views: events are buttons in time order (Tab moves through them); Enter opens the popover.
            List view: normal tab order.
            In a popover: Tab through actions; Esc closes and returns focus.
  a11y      Month grid: role="grid" with column headers (short day names, each with the full name as its
            accessible name). Each day cell's name: "Tuesday 06 October 2026, 3 follow-ups, 1 overdue".
            aria-current="date" on today; aria-selected on the selected day.
            Event names give the time span, type, lead and state: "11:00 to 11:30 am, Call back, Meera Pillai,
            overdue". State is always in words or an icon with sr text, never colour alone.
            Rescheduling is announced in a polite status.
            Targets: chips 24 px tall; date buttons 28 px; "+4 more" is a Button link xs, min-h-hit (24 px), the full
            cell width; toolbar 32 px; popover actions 32 px.
            Pairs: text on surface, surface-subtle, surface-raised, accent-subtle, danger-subtle, success-subtle,
            surface-sunken; text-muted on surface, surface-subtle, surface-raised, surface-sunken; accent on
            accent-subtle, surface; danger on danger-subtle; success on success-subtle; on-accent on accent;
            focus-ring on surface, surface-subtle, accent-subtle, danger-subtle, success-subtle.
  base      our own month, week and list views (see Open questions on FullCalendar); the `format` module for dates
            and zones; SegmentedControl, Select, Button, IconButton (group 1); Popover, Toast, Alert, Skeleton
            (group 2); @dnd-kit for the pointer drag.
  used on   S04, S11 (mini month), S12, M01.
```

#### ChartFrame

```text
ChartFrame
  purpose   The frame every chart sits in: a title that states the takeaway, the chart, its legend, a table view
            of the same numbers, and an accessible summary.
  anatomy   Card:
            - header: title (h3, the takeaway), subtitle (metric and period), a "Chart | Table" SegmentedControl,
              and a menu (Ellipsis: "Download CSV", "Open in report builder", "Edit widget" on dashboards, where
              DashboardGrid adds the move and size items);
            - body: the chart (an SVG inside a focusable wrapper; see a11y) or the table (a native <table> with a
              caption);
            - legend, when there are two or more series: a list of swatch, marker shape and name;
            - footnote: notes on the data.
            Plot behaviour shared by every chart:
            - the plot is one tab stop; the arrow keys move a highlight between data points and show the tooltip;
              the active mark gets a 2 px stroke-focus-ring outline (offset 2 px), so focus inside the plot is
              visible as well as the outline around the plot;
            - the tooltip also opens on hover; its text goes to a polite region while the plot has focus;
            - no entry animations; colour is never the only cue;
            - series follow the fixed slot order chart-1 to chart-8; a ninth series folds into "Other";
            - every mark is at least 3:1 against the plot (the chart tokens are checked pairs).
  variants  card (dashboards S21, attribution S20); full (S22 report, larger plot); small (M06, phase 2).
            drill-down (S20): the table view's rows are links one level down (Channel > Source > Campaign).
            Breadcrumbs (group 2) above the chart show the path ("All channels > Paid ads > Google"), and a
            SegmentedControl "First source" | "Any source" picks which touch counts.
  sizes     card p-4 rounded-lg gap-3. Title text-md; subtitle text-xs. Plot height 240 px (card) or 360 px
            (full). Legend text-xs, swatch size-3 (12 px). Tooltip max-w-64, text-xs.
  states    loading (Skeleton bars and title; aria-busy); empty period; no data yet (first use); error; filled;
            filtered (a note of what is hidden); folded ("Other" holds 9th and later series); stale ("Updated 10
            min ago" and "Refresh"); drilled (one level down: the Breadcrumbs gain a level and focus moves to the
            new title).
  tokens    card        bg-surface border border-border rounded-lg
            title       text-md text-fg; subtitle text-xs text-muted
            plot        bg-chart-surface; gridlines stroke-border; axis text fill-muted text-xs; value labels
                        fill-fg
            tooltip     bg-surface-raised border border-border shadow-pop rounded-md text-fg; series swatches in
                        tooltips and the legend are decorative (the name is printed next to them)
            footnote    text-xs text-muted
  content   Titles state the finding: "Paid ads brought 48% of enrolments in September". Subtitle "Enrolments by
            channel · 01 to 30 Sep 2026".
            Toggle "Chart", "Table". Menu "Download CSV", "Open in report builder", "Edit widget".
            Drill-down: Breadcrumbs "All channels", "Paid ads", "Google"; segments "First source", "Any source";
            row link names such as "Paid ads: 1,240 leads. Show its sources.".
            Empty: "No data for this period." with "Change dates". No data yet: "Numbers appear here once leads
            come in from your forms, imports or API."
            Error: "Couldn't load this chart." with "Try again". Stale: "Updated 10 min ago" and "Refresh".
            Footnotes: "Counts include only the leads you can see." "Cost per lead uses the costs entered for each
            publisher."
  keyboard  Tab: the toggle, the menu, then the plot. In the plot: Left and Right (and Up and Down for several
            series) move between points; Home and End jump to the ends; Esc hides the tooltip. The table view uses
            normal table reading.
  a11y      The focusable element is a <div role="application" aria-roledescription="chart" aria-label="{title}.
            Arrow keys move between points." tabindex="0"> wrapping the SVG; the SVG itself is aria-hidden. The
            wrapper's aria-describedby points at a one-sentence summary that the code writes from the data ("Paid
            ads 48%, Organic 22%, Referral 15%, Publisher 10%, Other 5%."). The application role lets the arrow
            keys reach the plot in NVDA and JAWS browse mode.
            The table view holds the same numbers and is the full alternative.
            Text inside the plot uses text tokens, never series colours.
            Targets: toggle segments 28 px; menu 32 px; the plot as one target.
            Pairs: text on surface, surface-raised, chart-surface; text-muted on surface, surface-raised,
            chart-surface; accent on surface; chart-1 on chart-surface; chart-2 on chart-surface; chart-3 on
            chart-surface; chart-4 on chart-surface; chart-5 on chart-surface; chart-6 on chart-surface; chart-7 on
            chart-surface; chart-8 on chart-surface; focus-ring on surface, chart-surface.
  base      SVG drawn with d3-scale and d3-shape (ISC, new dependencies, see Open questions); Card; SegmentedControl,
            Link (group 1); DropdownMenu, Breadcrumbs, Skeleton (group 2); native <table>.
  used on   S20, S21, S22, S23, M06.
```

#### KpiTile

```text
KpiTile
  purpose   One number that matters, with its change since the last period.
  anatomy   Card (an <a> when it drills down):
            - label;
            - value (counts in full; money compact, such as ₹12.4L, with the exact amount in its name and tooltip);
            - change row: an arrow icon (ArrowUpRight, ArrowDownRight or Minus), the change, and the comparison
              ("vs last 30 days");
            - optional sparkline (decorative: the change row carries the meaning).
            Each metric declares whether higher is better. The arrow follows the direction of change; the colour
            follows whether that is good.
  variants  count; percent; money; duration ("2 hr 10 min"); with drill-down link; manager tiles on S04 (one per
            team).
  sizes     min-w-48 (192 px) p-4 rounded-lg. Label text-sm. Value text-display (28/36, bold, tabular-nums). Change
            text-xs with a 16 px icon. Sparkline h-8 (32 px).
  states    loading (Skeleton label and value); empty ("—" and "No data yet"); filled; no comparison ("No earlier
            data to compare"); error ("Couldn't load"); link hover (border-strong and an underlined label; the
            fill does not change); focus-visible.
  tokens    tile        bg-surface border border-border rounded-lg; link hover:border-strong
            label       text-muted; underlined on hover for links
            value       text-fg
            change      good text-success; bad text-danger; no change text-muted
            sparkline   stroke-chart-1, aria-hidden
  content   "New leads" · "1,284" · "up 12.3% vs last 30 days".
            "Fees collected" · "₹12.4L" (name "₹12,40,500.00") · "up 8% vs last month".
            "Overdue follow-ups" · "37" · "up 5 since yesterday" (bad, because lower is better).
            "Cost per verified lead" · "₹214" · "down 6% vs last month" (good).
            Empty "—" with "No data yet". "No earlier data to compare". "Couldn't load".
  keyboard  A link tile is one tab stop (Enter opens the drill-down). A static tile is not focusable.
  a11y      Link name: "New leads: 1,284, up 12.3% compared with the last 30 days. View these leads."
            The arrow is aria-hidden; the direction is in words. Good or bad is in the colour and in the words, not
            colour alone.
            Targets: the whole tile.
            Pairs: text on surface; text-muted on surface; success on surface; danger on surface; focus-ring on
            surface, bg.
  base      native <a> or <div>; Card, Tooltip, Skeleton, Money, NumberText (group 2).
  used on   S04, S20, S21, S23, M01, M06.
```

#### FunnelChart

```text
FunnelChart
  purpose   Show how many leads reach each admission milestone, and how many drop off between them.
  anatomy   ChartFrame with horizontal bars, one per step in order, top to bottom:
            - the step label at the left (text);
            - the bar (length is the step's count over the first step's count);
            - direct labels to the right of the bar: the count and "% of first step";
            - between bars, the conversion from the step above ("62% moved on · 3,891 dropped").
            Table view columns: Step, Leads, % of first step, % of previous step, Dropped.
  variants  by milestone (the 6 JourneyBar steps; bars use chart-ordinal-1 to chart-ordinal-6, light to dark down
            the funnel);
            by stage (the institution's stages: more than 6 steps, so every bar uses chart-ordinal-4);
            compare (the previous period's count in text after each label, "last period 980");
            widget (S21, smaller).
  sizes     bars h-7 (28 px), 20 px apart with the conversion line between. Label column w-44 (176 px). Value
            labels min-w-28. A non-zero bar is at least 2 px long. Below 480 px wide, labels sit above their bars.
  states    loading; empty (every step zero); one step zero (no bar; "0" still shows); filled; filtered (campus,
            course, source); error; narrow.
  tokens    bars        fill-chart-ordinal-1 to fill-chart-ordinal-6 (or fill-chart-ordinal-4 for every bar)
            labels      step names text-fg; values fill-fg; conversion text-muted
            plot        bg-chart-surface
  content   Title: "1 in 9 enquiries booked a seat in September".
            Steps (JourneyBar's labels) "New enquiry", "Contact verified", "Form started", "Form fee paid", "Form
            submitted", "Seat booked".
            Labels "10,240 · 100%", "6,349 · 62%". Between: "62% moved on · 3,891 dropped".
            Empty: "No leads came in during this period."
  keyboard  Through ChartFrame: Up and Down move between steps; the tooltip shows count, % of first step and % of
            previous step.
  a11y      Summary: "Funnel for 01 to 30 Sep 2026: New enquiry 10,240; Contact verified 6,349 (62%); … Seat booked
            1,138 (11% of enquiries)." The table view holds every number. Labels are direct, so colour is never
            needed to read the chart.
            Targets: the plot is one target; no per-bar targets.
            Pairs: chart-ordinal-1 on chart-surface; chart-ordinal-2 on chart-surface; chart-ordinal-3 on
            chart-surface; chart-ordinal-4 on chart-surface; chart-ordinal-5 on chart-surface; chart-ordinal-6 on
            chart-surface; text on surface, chart-surface; text-muted on surface, chart-surface; focus-ring on
            surface, chart-surface.
  base      ChartFrame; SVG.
  used on   S20, S21, S22, M06.
```

#### BarChart

```text
BarChart
  purpose   Compare one measure, or a few, across named groups (sources, counsellors, campuses), or show counts per
            time bucket as columns.
  anatomy   ChartFrame with:
            - a category axis and a value axis (4 to 6 rounded ticks, faint gridlines);
            - bars: horizontal by default (long names fit); vertical columns for time buckets;
            - grouped bars for up to 3 series; stacked bars for parts of a whole, with a 2 px gap between segments;
            - direct labels: with 4 series or fewer, each bar or stacked segment carries its series name and value
              ("Paid ads 214"); from the 5th series on, slots 5 to 8 also carry an SVG pattern (tokens), and the
              legend shows the same pattern;
            - a legend for 2 or more series;
            - folding: past 12 categories, the rest become "Others (14)"; past 8 series, "Other".
            Period comparison is not drawn as bars; LineChart does that with a dashed line.
  variants  single measure (every bar chart-1); horizontal; vertical; grouped; stacked; with negative values
            (refunds go left of the zero line, with the word "Refunds" in the label, never only a minus sign).
  sizes     horizontal: 32 px per category row, bar thickness 20 px. Vertical: bars at 60% of the band. Axis labels
            text-xs, truncated at 24 characters (the full name is in the tooltip and table).
  states    loading; empty; filled; folded; long labels; zero bars ("0" label); negative values; error.
  tokens    bars        fill-chart-1 to fill-chart-8, in slot order
            patterns    slots 5 to 8 add an SVG pattern over the slot colour: 45° hatch, 135° hatch, dots,
                        cross-hatch, drawn with 1 px strokes in stroke-chart-surface. The legend swatch shows the
                        same pattern. This is the second cue decisions.md section 7 promises, so a segment is never
                        told apart by colour alone (1.4.1).
            segment gap stroke-chart-surface stroke-2
            gridlines   stroke-border; zero line stroke-strong
            axis text   fill-muted; values fill-fg
  content   Title: "Pune counsellors closed the most applications". Axis titles "Applications", "Counsellor".
            "Others (14)". Refund label "Refunds −₹45,000".
  keyboard  Through ChartFrame: arrows move between bars (category first, then series).
  a11y      Summary sentence with the top values; the table view has a column per series. The legend is a list.
            Series are told apart by their printed names (4 or fewer) or by pattern and legend (5 to 8), never by
            colour alone.
            Bars with printed values may fall under 3:1 only where 1.4.11 allows it; our slots pass anyway.
            Targets: the plot is one target.
            Pairs: chart-1 on chart-surface; chart-2 on chart-surface; chart-3 on chart-surface; chart-4 on
            chart-surface; chart-5 on chart-surface; chart-6 on chart-surface; chart-7 on chart-surface; chart-8 on
            chart-surface; text on surface, chart-surface; text-muted on surface, chart-surface; focus-ring on
            surface, chart-surface.
  base      ChartFrame; SVG with d3-scale; SVG <pattern> elements for slots 5 to 8.
  used on   S20, S21, S22, S23, M06.
```

#### LineChart

```text
LineChart
  purpose   Show how a measure changes over time, and compare it with the previous period.
  anatomy   ChartFrame with:
            - a time axis (day, week or month buckets, dates in en-IN) and a value axis;
            - one line per series, 2 px, with point markers that differ in shape (circle, square, triangle,
              diamond);
            - the previous period as a dashed line in the same slot colour, with "(last period)" in the legend;
            - direct labels at line ends when there are 4 series or fewer;
            - a crosshair and a tooltip that lists every series at that bucket.
  variants  single; several series (up to 8); compare with the previous period; cumulative.
  sizes     stroke 2 px; markers 8 px with a 2 px ring in the plot colour; plot 240 or 360 px tall.
  states    loading; empty; one point (a single marker with its label); gaps (missing buckets break the line;
            they are never drawn as zero); filled; current bucket incomplete (its marker is hollow and labelled "so
            far"); error.
  tokens    lines       stroke-chart-1 to stroke-chart-8 fill-none
            markers     the series' fill (fill-chart-1 to fill-chart-8) with a stroke-chart-surface ring
            last period the same stroke, dashed (SVG dasharray "4 4")
            crosshair   stroke-strong
            axis text   fill-muted
  content   Title: "Enquiries rose 18% after the scholarship campaign". Legend "This period", "Last period".
            Incomplete bucket "This week so far".
  keyboard  Through ChartFrame: Left and Right move across time; Up and Down move between series at the same time.
  a11y      Summary: "Enquiries per day, 01 to 30 Sep 2026: lowest 120 on 03 Sep, highest 410 on 21 Sep, up 18% on the
            previous 30 days." The table view has a row per bucket and a column per series.
            Series differ by colour, marker shape and direct label; the previous period also differs by dash.
            Targets: the plot is one target.
            Pairs: chart-1 on chart-surface; chart-2 on chart-surface; chart-3 on chart-surface; chart-4 on
            chart-surface; chart-5 on chart-surface; chart-6 on chart-surface; chart-7 on chart-surface; chart-8 on
            chart-surface; text on surface, chart-surface; text-muted on surface, chart-surface; focus-ring on
            surface, chart-surface.
  base      ChartFrame; SVG with d3-scale and d3-shape.
  used on   S20, S21, S22, S23, M06.
```

#### PivotTable

```text
PivotTable
  purpose   Show a metric grouped by up to three levels of rows and, optionally, by one column field, with
            subtotals and totals, on any field including custom fields.
  anatomy   Builder above the table (S22):
            - "Metric" Select ("Number of leads", "Applications started", "Token fees paid", "Amount collected",
              "Conversion to token fee");
            - "Rows": up to 3 fields as a ReorderableList (compact);
            - "Columns": 0 or 1 field;
            - filters (ConditionBuilder in a Drawer);
            - "Table | Chart" SegmentedControl, "Save", "Export CSV".
            Table (role="treegrid"):
            - column header rows (the column field's values, then "Total");
            - row headers with expand and collapse for each level;
            - value cells (right-aligned, tabular figures), each a link that opens the matching leads (S05,
              filtered) in a new tab;
            - subtotal rows per group; a grand total row and column.
            Chart mode hands the same data to BarChart (grouped or stacked).
  variants  table; chart; widget (S21: no builder, top 10 rows and a "View report" link).
  sizes     rows h-row-compact (40 px), text-table. Row header indent pl-5 (20 px) per level. Header row sticky; row
            header column sticky. At most 500 rows and 50 columns are drawn.
  states    no metric yet; no grouping (one total); running (Skeleton, "Running report…", "Cancel"); filled;
            empty result; too many groups (the first 500 rows show, with an Alert and "Export CSV" for the rest);
            error; saved; collapsed and expanded groups; sorted (by label or by value, from the column header).
            Contact fields (email, mobile) can't be used for grouping, for any role.
            Every query runs under the person's data scope; the footnote says so.
  tokens    header       bg-surface-sunken text-fg font-medium
            row headers  text-fg; chevrons text-muted
            values       text-fg tabular-nums text-right; as links text-accent underline decoration-1
                         hover:decoration-2
            subtotal row bg-surface-subtle font-medium
            total        bg-surface-sunken font-semibold
            empty cell   "—" text-muted
            alert        Alert warning
  content   Metric names as above. "Total", "Subtotal: Pune". "—".
            No metric: "Pick a metric to start." Empty: "No leads match these filters."
            Too many: "This report has 1,240 rows. The first 500 are shown. Narrow it with a filter, or export the
            full result as CSV."
            Contact fields note: "Email and mobile can't be used to group a report."
            Saved toast: "Saved as Applications by course." Footnote: "Counts include only the leads you can see."
  keyboard  As DataTable's grid, plus treegrid keys: on a row header, Right expands and Left collapses; Enter on a
            value opens its leads; Enter or Space on a column header sorts.
  a11y      role="treegrid"; group rows have aria-level and aria-expanded. Row headers are <th scope="row">; column
            headers <th scope="col">, with the column field's name as a <th scope="colgroup"> above them.
            Value link names give the context: "Pune, B.Tech, 214 leads. Open these leads."
            "Running report…" and results are announced politely.
            Targets: chevrons in 24 px areas; value links fill their 40 px cells.
            Pairs: text on surface, surface-subtle, surface-sunken, surface-hover; text-muted on surface,
            surface-subtle, surface-sunken; accent on surface, surface-subtle, surface-sunken, surface-hover; warning
            on warning-subtle; text on warning-subtle; focus-ring on surface, surface-subtle, surface-sunken.
  base      native <table> with role="treegrid" and the DataTable grid hook; Select, SegmentedControl (group 1);
            ReorderableList, ConditionBuilder, BarChart (this group); Alert, Skeleton (group 2).
  used on   S21 (widget), S22, M06.
```

#### DashboardGrid

```text
DashboardGrid
  purpose   Lay out a dashboard's widgets (KPI tiles, charts, tables) and let people move and resize them by dragging,
            or from each widget's menu, which works by keyboard and with a single pointer (2.5.7).
  anatomy   PageHeader (group 2) with the dashboard Select, a DateRangePicker, "Add widget" and "Edit layout"
            ("Done" while editing).
            Grid: <ol aria-label="Widgets on Admissions overview">, one <li> per widget in reading order: KpiTile,
            ChartFrame, or DataTable embedded.
            In edit mode each widget also shows a drag handle (GripVertical) and a resize corner, both for pointers
            only. Each widget's menu (ChartFrame's Ellipsis menu; KpiTiles and tables get the same menu) adds "Move
            left", "Move right", "Move up", "Move down", a radio group "Size" ("Small", "Medium", "Large") and
            "Remove widget".
            "Add widget" opens a Drawer with the widget library, grouped "Leads", "Enrolments", "Payments",
            "Campuses".
  variants  personal; shared (a team preset: its owner and admins edit it, others view it); built-in preset
            (read-only, with "Save a copy"); phone (M06, phase 2: one column, no editing).
  sizes     From xl: 12 columns, gap-4. Small spans 3 columns, Medium 6, Large 12. From md to xl: 6 columns (Small
            3, Medium and Large 6). Below md: one column, in list order.
            Widgets keep their own heights (KpiTile, ChartFrame card). Handles and resize corners 24 px.
  states    viewing; editing; dragging (pointer: a dashed placeholder shows where it will land); resizing
            (pointer); moved; size changed; at an edge ("Move left" on the first widget, "Move up" on the top row:
            aria-disabled with the reason); saving the layout (500 ms after the last change); saved; save failed (the
            layout goes back and a Toast says so); empty (EmptyState with "Add widget"); read-only (no handles, no
            move or size items).
            The list order is the reading order. "Move left" and "Move right" swap a widget with its neighbour;
            "Move up" and "Move down" move it to the same column in the row above or below.
  tokens    grid          grid gap-4 (12 columns from xl, 6 from md)
            edit mode     each widget border border-dashed border-input in place of its usual border
            handle        text-muted cursor-grab active:cursor-grabbing; resize corner text-muted cursor-se-resize
            placeholder   border-2 border-dashed border-accent rounded-lg
  content   Buttons "Edit layout", "Done", "Add widget", "Save a copy". Menu items "Move left", "Move right", "Move
            up", "Move down", "Size", "Small", "Medium", "Large", "Remove widget". Menu name "More actions for Fees
            collected".
            Status: "Fees collected moved to position 3 of 8." "Fees collected is now Large." "Layout saved."
            Edge reason: "Fees collected is already first."
            Failure toast: "Couldn't save the layout. It's back to how it was."
            Empty: title "No widgets yet"; body "Add a number or a chart to start this dashboard."; action "Add
            widget".
  keyboard  Tab moves through each widget's controls in list order. Menu: Enter, Space or Arrow Down opens; arrows
            move; Enter picks. After a move or a size change, focus stays on the widget's menu trigger, which has
            moved with its widget. Handles and resize corners are not focusable.
  a11y      The <ol> gives the order and the count; each widget starts with sr-only "Widget 3 of 8: ". Size items are
            menuitemradio with aria-checked.
            Every move and size change is announced once in a polite status.
            The handle and the resize corner are aria-hidden; the menu is the keyboard and single-pointer way
            (2.5.7).
            Targets: menu triggers 32 px; handles 24 px.
            Pairs: text on bg, surface; text-muted on bg, surface; border-input on bg, surface; accent on bg;
            focus-ring on bg, surface.
  base      CSS grid; @dnd-kit/core with the pointer sensor only (no keyboard sensor); KpiTile, ChartFrame,
            DataTable (this group); PageHeader, DropdownMenu, Drawer, EmptyState, Toast (group 2); DateRangePicker,
            Select, Button (group 1); CRUD /dashboards.
  used on   S21, M06.
```

---

### F. Import and merge

#### ImportWizard

```text
ImportWizard
  purpose   Bring leads in from a CSV or XLSX file in five clear steps, without creating duplicates, and show
            exactly what happened.
  anatomy   Page (S07 "Import leads"), max-w-content:
            - Stepper (group 2, horizontal): 1 "Upload", 2 "Match columns", 3 "Preview", 4 "Import", 5 "Results";
            - the current step's panel, with its h2;
            - footer bar: "Back", "Cancel", and the primary for the step.
            Step 1, Upload:
            - FileUpload single ("CSV or XLSX");
            - "Source of these leads" (Combobox of offline source tags, required; for example a fair);
            - "Owner" (RadioGroup: "Leave unassigned", "Use our assignment rules", "Assign to…" with a member
              Combobox);
            - "If a lead already exists" (RadioGroup: "Fill in only empty fields", "Overwrite with the file's
              values", "Skip it"). A lead matches on email, or on mobile when the institution keeps mobiles unique;
            - Alert consent_imported (group 2's catalogue, info) on consent from files;
            - "Download a sample file".
            Step 2, Match columns: ColumnMapper.
            Step 3, Preview: counts (New, Will update, Will skip, Has problems), the first 20 rows in a DataTable
            (plain) with problem cells marked, and a "Problems" tab listing row, column and problem, with
            "Download rows with problems".
            Step 4, Import: JobProgress (group 2, inline): a progress bar, counts that update, "You can leave this
            page. We'll notify you when it's done.", and "Stop import".
            Step 5, Results: the outcome counts, reasons for every failed and skipped row, and "Download report
            (CSV)", "View imported leads" (S05 filtered to this import) and "Import another file".
  variants  leads (S07); opportunities (S26: matches on the list's key fields).
  sizes     Stepper as group 2 (h-14, markers size-6, labels text-sm). Panels gap-6. Footer h-pagebar (56 px),
            buttons md (40 px). Preview table as DataTable plain.
  states    Step states: done, current, upcoming, problem. Steps 1 to 3 can be revisited until the import starts;
            after that the stepper is read-only.
            File problems: wrong type; empty; no header row; over the row limit (see Open questions); text that
            looks garbled (the person picks the file's encoding: UTF-8, Windows-1252 or UTF-16).
            Remembered mapping: when the headers match an earlier import, the mapping is filled in and a note says
            so (3.3.7).
            Running; stopping; done; partial failure; failed; no permission (the page says so).
            Under-18 rows (by date of birth) are imported as minors with guardian consent pending; the results say
            how many.
            Duplicates inside the file: the first row wins; later rows are reported.
  tokens    stepper     Stepper (group 2): done CircleCheck text-accent; current bg-accent text-on-accent
                        rounded-pill; upcoming border-2 border-input rounded-pill; problem CircleAlert text-danger;
                        connectors bg-strong, bg-accent once done
            counts      text-xl text-fg tabular-nums, labels text-sm text-muted
            problem cell bg-danger-subtle text-fg, with CircleAlert text-danger
            progress    JobProgress (group 2), as BulkActionBar
            alerts      Alert (group 2): info (consent), warning (partial), danger (failed), success (done)
  content   Step labels as above. Upload labels "Source of these leads", "Owner", "If a lead already exists".
            Consent Alert (group 2's consent_imported): "Imported consents can't be used for promotional or
            explicit-consent SMS yet" / "They must be registered on the telcos' consent platform first."
            File errors: "This file has no header row. Add column names in the first row." "This file has 120,000
            rows. Import up to 50,000 at a time." "Some text looks garbled. Choose the file's encoding."
            Remembered: "Columns matched the same way as your import on 02 Oct."
            Preview counts: "1,180 new", "64 will update", "6 will be skipped", "14 have problems".
            Problems: "Row 23: the mobile number has 9 digits." "Row 40: the email address has no @." "Row 88: same
            email as row 12, so row 12 is used."
            Running: "Importing 1,264 rows… 640 done." Button "Stop import".
            Results: "1,180 added · 64 updated · 6 skipped · 14 failed". "12 leads are under 18. Nobody can contact
            them until a guardian agrees." Buttons "Download report", "View imported leads", "Import another file".
            Failed: "The import stopped. Nothing after row 640 was imported." with "Try again".
  keyboard  Normal tab order. When the step changes, focus moves to the new step's h2. Enter in a field does not
            jump steps; the primary button does.
  a11y      The Stepper is an <ol aria-label="Import steps"> with aria-current="step"; each step's state is a word
            (sr-only "done", "current", "has problems").
            Progress follows BulkActionBar (announced at start, each quarter and the end).
            Problem cells are marked with an icon and text, and listed in the Problems tab.
            Targets: 40 px buttons; links at least 24 px.
            Pairs: text on surface, info-subtle, warning-subtle, danger-subtle, success-subtle; text-muted on
            surface; accent on surface, surface-sunken; on-accent on accent; border-input on surface; danger on
            surface, danger-subtle; success on success-subtle; warning on warning-subtle; info on info-subtle;
            focus-ring on surface, danger-subtle.
  base      FileUpload, Combobox, RadioGroup, Button (group 1); ColumnMapper, DataTable (this group); Stepper,
            JobProgress, Alert, Toast (group 2); jobs (POST /imports, GET /jobs/:id).
  used on   S07, S26.
```

#### ColumnMapper

```text
ColumnMapper
  purpose   Match each column of an uploaded file to a lead field, with suggestions and sample values.
  anatomy   Summary line ("12 of 15 columns matched · 3 not imported") and a required-fields Alert (group 2, danger)
            when needed.
            Native <table>, one row per file column:
            - "Column in your file": the header text;
            - "Sample values": the first 3 non-empty values;
            - "Lead field": a Combobox of fields grouped "Standard fields" and "Your fields", plus "Don't import"
              and, for admins, "Create a new field…";
            - "Status": a StatusPill.
            Extra settings under a row when its field needs them:
            - dates: "How are dates written?" (Select: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD);
            - mobile: "Country code when missing" (default +91);
            - picklists: unmatched values, each with a Select to map it to a list value, or "Leave empty"
              (admins can also "Add to the list");
            - multi-choice: the separator (comma or semicolon).
  variants  leads (S07); opportunities (S26).
  sizes     rows min-h-row (48 px), more with extra settings. Comboboxes sm (32 px) w-64. Samples text-xs, one line
            each, truncated.
  states    matched automatically (by header name and common variants, such as "Phone", "Mobile No" and
            "Contact" for Mobile); matched by hand; not imported; two columns on one field (both show the error);
            required field missing (email or mobile must be matched); samples don't fit the field (a warning, not
            an error); picklist values unmatched; sensitive field (a note that it is stored as sensitive).
  tokens    table       as DataTable plain
            samples     text-xs text-muted
            pills       matched success, by hand neutral, not imported neutral, check this warning, problem danger
            errors      text-xs text-danger under the row
  content   Headers "Column in your file", "Sample values", "Lead field", "Status". Options "Don't import",
            "Create a new field…".
            Pills "Matched", "Matched by you", "Not imported", "Check this", "Problem".
            Errors and warnings: "Mobile is already matched to "Phone 1". Pick another field or choose Don't
            import." "Match a column to Email or Mobile. Every lead needs one of them." "These samples don't look
            like dates."
            Picklist: "4 values in "Course" aren't on your list." Options "Leave empty", "Add to the list".
            Summary "12 of 15 columns matched · 3 not imported".
  keyboard  Normal tab order through each row's Combobox and its extra settings. No grid model: the table is short
            and every cell control is a tab stop.
  a11y      <table> with a caption ("Match the columns in leads-oct.csv"). Each Combobox is named "Lead field for
            the column Phone 1" and described by its sample values. Errors are linked with aria-describedby.
            Targets: 32 px controls.
            Pairs: text on surface, surface-sunken, warning-subtle, danger-subtle, success-subtle; text-muted on
            surface; border-input on surface; warning on warning-subtle; danger on surface, danger-subtle; success
            on success-subtle; focus-ring on surface.
  base      native <table>; Combobox, Select (group 1); StatusPill, Alert (group 2).
  used on   S07, S26.
```

#### MergeDiffView

```text
MergeDiffView
  purpose   Fold a duplicate lead into the main record, choose field by field which value to keep, and see what
            happens to the duplicate.
  anatomy   Page or Dialog dialog-lg (S14), in three steps, shown by a Stepper (group 2): horizontal on the page,
            compact in the Dialog footer ("Step 2 of 3 · Choose values"). The step labels are the step titles.
            1 "Which record stays?": two cards side by side (name, lead number, created, first source, stage,
              owner, counts of messages, calls and payments) and a RadioGroup "Keep as the main record".
            2 "Choose values": a native <table> of the fields that differ. Columns: Field, Main record, Duplicate.
              Each differing row has two radio cells; the chosen cell is highlighted. Fields that are the same are
              folded into one line with "Show them". Notes under the table say what is combined automatically.
            3 "Check and merge": a summary of what the main record keeps and what moves to it, and the confirm.
            Combined automatically, never chosen:
            - mobiles: the other number becomes an alternate number;
            - sources: first, second and third stay in time order (they can't be edited); latest is the newest;
            - timeline, notes, follow-ups, messages, calls, payments, consents and files move to the main record;
            - guardian consent: the stricter state wins;
            - owners: a choice of one owner or "Keep both owners".
  variants  page (from S08 "Merge with another lead"); dialog (from a duplicate warning).
  sizes     cards grid-cols-2 gap-4 p-4. Table rows min-h-row-compact (40 px); each radio cell is the whole cell
            (the label fills it). Field column w-48. Dialog dialog-lg (800 px).
  states    choosing the main record; choosing values; email conflict (both records have an email: one must be
            chosen; the other stays on the merged record, and an error shows until a choice is made); masked
            contacts (both columns masked; choices still work); minor on either side; merging (the confirm button
            loading); merged (a Toast, then the main record opens; the duplicate shows the merged banner); a
            record changed meanwhile (the server refuses; the page reloads the values and asks again); not allowed
            (one record is already merged, on hold, or erased).
  tokens    cards       bg-surface border border-border rounded-lg; chosen card border-2 border-accent
            table       header bg-surface-sunken text-fg font-medium; rows bg-surface border-b border-border
            chosen cell bg-accent-subtle text-fg, with its radio checked and a Check icon in text-accent (never
                        the fill alone); other cell text-muted
            same fields text-muted
            notes       Alert info (group 2)
            error       text-xs text-danger in the Field column
  content   Step titles "Which record stays?", "Choose values", "Check and merge".
            Radio labels "Keep as the main record". Cell labels "Keep Pune (main record)", "Keep Nashik
            (duplicate)".
            "14 fields are the same." with "Show them".
            Notes: "Both mobile numbers are kept. +91 ••••• •3210 becomes an alternate number." "First, second and
            third sources stay in the order they happened. They can't be changed." "Timeline, notes, follow-ups,
            messages, calls, payments and consents from Meera P. (lead #10240) move to Meera Pillai
            (lead #10233)." "Guardian consent: pending, the stricter of the two."
            Email conflict: "Both records have an email. Choose the one to keep. The other stays on the merged
            record."
            Confirm: title "Merge lead #10240 into lead #10233?"; body "Lead #10240 becomes read-only and points
            to lead #10233. You can't undo a merge."; buttons "Cancel" and "Merge records".
            Changed meanwhile: "One of these records changed while you were merging. Check the values again."
            Toast "Merged into Meera Pillai (lead #10233)."
  keyboard  Tab moves through the steps' controls. In the table, each row's two radios are one tab stop; Left and
            Right choose a side. "Show them" toggles the folded fields. Footer: "Back", "Cancel", and "Next" or
            "Merge records".
  a11y      The table has a caption. Field names are <th scope="row">. Each row's radios share a name and are
            labelled with the side and the value. The chosen side is shown by fill, by a Check icon and by the
            radio's checked state.
            Step changes move focus to the step's heading.
            Targets: radio cells at least 40 px tall; buttons 40 px.
            Pairs: text on surface, surface-raised, surface-sunken, accent-subtle, info-subtle; text-muted on
            surface, surface-raised, accent-subtle; border-input on surface, accent-subtle; accent on surface,
            accent-subtle; danger on surface; on-accent on accent; info on info-subtle; focus-ring on surface,
            accent-subtle.
  base      native <table> and radios (RadioGroup, group 1); Dialog, Stepper, Alert, Toast, MaskedValue (group 2);
            POST /leads/:id/merge.
  used on   S08, S14.
```

---

### G. Public and sign-in pages

#### PublicEnquiryForm

```text
PublicEnquiryForm
  purpose   The student-facing enquiry form (S01): mobile first, fast on slow networks, embeddable on the
            institution's site, with consent and OTP checks.
  anatomy   <html data-surface="public" data-theme="light" lang={form.language}> (the form's own language, see
            a11y). Page:
            - header: the institution's logo (SVG or WebP, under 20 KiB, width and height set) and name;
            - h1 (the form title) and an intro line;
            - error summary (after a failed submit);
            - fields in FormLayout public order: Full name; Email address (with "Verify email" when set); Mobile
              number (PhoneInput, with "Verify number" when set); the institution's dropdowns and choices (native
              selects, checkbox groups with a maximum); date of birth (three fields) or an age question; an optional
              file field;
            - ConsentCapture (with its minor mode);
            - hidden inputs: utm_* fields, gclid, fbclid, referrer, landing URL, form version and an
              Idempotency-Key (in minor mode the server discards the click IDs, the referrer and the query string;
              see states);
            - "Send enquiry" (lg, full width);
            - footer: the institution's phone, email and address, and "How {Institution} uses your data".
            OTP inline: after "Verify number", OtpInput appears under the field. Once verified the field is
            read-only, with "Verified" and a "Change" link button.
            Success: the success message replaces the form and takes focus, or the browser goes to the
            institution's redirect URL.
  variants  direct page (/f/:publicKey, also used for QR codes at fairs);
            iframe embed: <iframe src=".../f/{publicKey}?embed=1" title="Enquiry form for {Institution}"
            loading="lazy" allow="otp-credentials">. In embed mode the header is dropped; the footer stays (3.2.6);
            script embed: <script src=".../embed.js" data-form="{publicKey}" async>. It builds the iframe after
            itself, passes the parent page's URL, UTM parameters and referrer into the iframe URL, and resizes the
            iframe from height messages (it checks the message origin). It can also tell the host page that a
            form was sent, so the institution's own analytics can count it; no third-party script runs on our page.
            The script is under 2 KiB.
            preview (S31): the same page inside the settings screen, with "Preview" banner and no submit. S31 also
            sets the form's language ("Form language", default "English (India)", en-IN) and, for a label, option
            or message written in another language, its own "Written in" language.
  sizes     max-w-public (480 px), px-4 (16 px gutter), works at 320 px. Fields gap-6. Inputs and buttons
            h-control-lg (48 px) text-base. Checkbox and radio rows 44 px. h1 text-xl; intro text-base.
            Budget (decisions.md section 4): JS at most 150 KiB brotli, 0 font bytes, 250 KiB in all; LCP 2.0 s lab.
  states    empty; filling; field errors; choice limit reached; verifying (code sent, wrong, expired, too many
            tries: OtpInput states); verified; verify required (submit stops with an error on that field);
            submitting ("Sending…"); network failure (values kept; the retry reuses the Idempotency-Key); success;
            repeat enquiry (the same success message as a new one, so the page never reveals whether an email is
            already known); form turned off; rate limited; minor mode (below); no JavaScript (the form posts
            through the Server Action; verification happens on a second page after submit); embedded in a narrow
            column.
            Minor mode (DPDP s.9(1), Rule 10), when the date of birth or the age answer says under 18:
            - the page shows ConsentCapture's minor mode (group 1): no marketing items, the guardian fields and
              the minor alert;
            - "Verify number" and "Verify email" go away, so no code is sent to the child. The guardian is the one
              verified, on /consent/:token (GuardianConsentPage);
            - the server stores only the full name, the date of birth or age answer, the guardian's name and
              mobile, and the Rule 10 evidence. Other answers (course, city, files, free text) are dropped, or held
              in the capture payload in the restricted state until a guardian agrees (counsel to confirm which);
            - gclid, fbclid, the referrer and the landing URL's query string are discarded. The source touch keeps
              only the channel and the form.
  tokens    page        bg-bg; form card bg-surface rounded-lg p-4 (embed mode: bg-surface, no card edge)
            heading     text-xl text-fg; intro text-muted
            footer      text-sm text-muted border-t border-border; links text-accent underline
            controls    as group 1 public sizes
  content   Default title "Send an enquiry" (the institution can set its own, such as "Admissions 2027: ask us
            anything"). Intro "All fields are required unless marked optional."
            Labels "Full name", "Email address", "Mobile number", "Course you're interested in", "City".
            Buttons "Verify number", "Verify email", "Change", "Send enquiry", "Sending…".
            Success (default): "Thank you. {Institution} has your enquiry and will contact you soon."
            Verify required: "Verify your mobile number before sending."
            Turned off: "This form isn't taking enquiries right now. You can still reach {Institution} using the
            details below."
            Rate limited: "Too many tries from this network. Wait a few minutes, then try again."
            Network: "Not sent. Check your connection and try again."
            Minor alert (ConsentCapture, group 1): "You're under 18. Before {Institution} contacts you, a parent or
            guardian must agree. Add their details below and we'll send them a code. We'll keep only what we need
            to contact your parent or guardian."
            Success in minor mode: "Thank you. We've sent your parent or guardian a code. {Institution} will
            contact you once they agree."
            Footer: "Questions? Call {phone} or write to {email}." and "How {Institution} uses your data".
            Iframe title: "Enquiry form for {Institution}".
  keyboard  Natural order, top to bottom. After "Verify number", focus moves to the code field; after "Verified",
            to the next field. Enter submits. Error summary links move focus to their fields.
  a11y      Every group 1 public rule: labels above fields, autocomplete tokens (decisions.md field table), 16 px
            text, 44 px targets, error summary focused, success message focused, never pre-ticked consent, no
            CAPTCHA, no time limit except the code's stated expiry.
            Page title "Send an enquiry · {Institution}". The iframe has a title. The page reflows at 320 px.
            Language (3.1.1, 3.1.2): each form stores its language (BCP 47, default en-IN), and the page renders
            <html lang={form.language}>. A label, option or message written in another language stores its own
            lang, rendered on its <label>, <option> or <p>. ConsentCapture puts the notice's language as lang on
            its fieldset. So Hindi or Tamil text is read with the rules of its language.
            Targets: 48 px controls; 44 px rows and links.
            Pairs: text on surface, bg, danger-subtle, info-subtle; text-muted on surface, bg; accent on surface, bg;
            on-accent on accent, accent-hover; border-input on surface; danger on surface, danger-subtle; success on
            surface; info on info-subtle; focus-ring on surface, bg, danger-subtle, info-subtle.
  base      Next.js server-rendered page with a Server Action form (useActionState); Field, FormLayout, TextInput,
            PhoneInput, OtpInput, Checkbox, ConsentCapture, FileUpload, Button (group 1); native <select>; our own
            embed script.
  used on   S01, S31 (preview), M04 (QR self-registration).
```

#### PublicPaymentPage

```text
PublicPaymentPage
  purpose   Let a student pay an application or token fee from a link, and say clearly whether it is waiting,
            paid, failed, expired or already paid.
  anatomy   Public page (light, system fonts):
            - header with the logo and the institution's name;
            - h1 ("Pay your application fee");
            - fee summary card: fee name, programme, who it is for (first name and last initial), amount (Money,
              group 2, exact with paise), "Pay by" date and time with zone, and a short link reference;
            - a <form method="post" action="/pay/{shortCode}/attempts"> with a CSRF token and the primary button
              "Pay ₹1,000.00";
            - a note on where payment happens;
            - footer with the institution's contact details.
            Result page (/pay/return/{attemptRef}): a status panel with an icon, an h1, the details and the next
            step.
            Opening the link never creates anything. The summary page has no redirect and no script that posts on
            load, so link previews in WhatsApp or email are harmless. Only the button's POST creates a payment
            attempt, and the server locks the link while it does.
  variants  application fee; token fee; other fee; bank portal link (SBI Collect or ICICI Eazypay: the button opens
            the bank's page, with instructions to upload the receipt to the institution).
  sizes     max-w-public, px-4. Card p-5 rounded-lg gap-3. Amount text-display. Button lg (48 px) full width.
            Status icon size-icon-lg (24 px) inside a 48 px circle.
  states    ready to pay (active link; earlier attempts may have failed); checking (back from the gateway, while we
            confirm with the gateway's status API; JavaScript checks every 5 s for 2 minutes and announces the
            result; without JavaScript a "Check again" button); paid; pending at the bank (UPI pending); failed (with
            "Try again", which posts a new attempt); expired; already paid; cancelled by the institution; link not
            found; gateway not responding; paid after expiry (flagged for refund review).
            No page refreshes itself without the person's action except the 2-minute check, which stops by itself
            and says so.
  tokens    page        bg-bg; card bg-surface border border-border rounded-lg
            amount      text-fg tabular-nums; labels text-muted
            paid        CircleCheck text-success in a bg-success-subtle circle
            failed      CircleX text-danger in a bg-danger-subtle circle
            pending     Clock text-warning in a bg-warning-subtle circle
            expired     TimerOff text-muted in a bg-surface-sunken circle (the status vocabulary's icon)
            cancelled   CircleSlash text-muted in a bg-surface-sunken circle
            note        text-sm text-muted
  content   h1 "Pay your application fee". Labels "Fee", "Programme", "For", "Amount", "Pay by", "Reference".
            Values "Application fee 2027", "B.Tech Computer Science", "Meera P.", "₹1,000.00", "10 Oct 2026, 11:59 pm
            IST", "7HQ2X".
            Button "Pay ₹1,000.00". Note "You'll pay on {Gateway}'s secure page. {Institution} never sees your card
            details or UPI PIN."
            Checking: "Checking your payment with {Gateway}…" After 2 minutes: "Still checking. Please don't pay
            again. We'll send your receipt by SMS and email once it's confirmed." with "Check again".
            Paid: "Payment received" · "₹1,000.00 · Receipt 3021 · 04 Oct 2026, 2:30 pm IST" · "Download receipt".
            Pending: "Your bank hasn't confirmed this payment yet. Please don't pay again. This page will update."
            Failed: "Payment didn't go through." · "If money left your account, keep this reference and contact
            {Institution}: 7HQ2X-2." · "Try again".
            Expired: "This payment link has expired. Ask {Institution} for a new one."
            Already paid: "This fee is already paid." with "Download receipt".
            Cancelled: "{Institution} cancelled this payment link."
            Not found: "We can't find this payment link. Check the link in your message."
            Gateway down: "{Gateway} isn't responding. Try again in a few minutes."
            Paid after expiry: "We received your payment after the link expired. {Institution} will contact you."
  keyboard  Simple tab order: the summary has no controls except "Pay", the footer links and the receipt link.
            Result pages focus their h1 on load.
  a11y      Each status is an icon plus a heading in words. The final status of a check is announced in a polite
            region. The amount is text, read as written. The page works without JavaScript.
            Page titles name the state: "Payment received · {Institution}".
            Targets: 48 px button; 44 px links.
            Pairs: text on surface, bg, surface-sunken; text-muted on surface, bg, surface-sunken; success on
            success-subtle; danger on danger-subtle; warning on warning-subtle; on-accent on accent, accent-hover;
            accent on surface; focus-ring on surface, bg.
  base      Next.js server-rendered page; native <form method="post">; Button (group 1); Money (group 2);
            GET /pay/:shortCode, POST /pay/:shortCode/attempts, GET|POST /pay/return/:attemptRef.
  used on   S02.
```

#### GuardianConsentPage

```text
GuardianConsentPage
  purpose   Let a parent or guardian of an applicant under 18 confirm who they are, then give or refuse consent, on
            one short page.
  anatomy   Route /consent/:token. Public page:
            - header with the logo and the institution's name;
            - h1 naming the child by first name;
            - "What {Institution} is asking": what data, for what, for how long, and a link to the notice (version
              and date);
            - step 1, "Confirm it's you": "We'll send a code to +91 ••••• •3210." (the guardian's number from the
              enquiry, never asked again) and a "Send code" button (POST /consent/:token with action send_code).
              After it: OtpInput, guardian variant;
            - step 2, after the code: Relationship (native select: "Mother", "Father", "Legal guardian", "Other"),
              Guardian's full name (prefilled, editable, autocomplete="name": here the guardian is the person
              filling in the form), a required checkbox "I'm 18 or older and I'm Meera's parent or legal
              guardian", and the decision as RadioGroup cards ("I agree", "I don't agree"), each saying what
              follows;
            - "Send my answer" (lg, full width);
            - result panel;
            - footer with the institution's contact details.
            Recorded as evidence (DPDP Rule 10): how the guardian was checked (code to their mobile), time, IP,
            user agent, notice version, relationship and the adult declaration.
  variants  first answer; change of answer (a guardian who agreed can withdraw on /privacy/:orgSlug/withdraw; the
            result panel links there).
  sizes     public: max-w-public, px-4, controls 48 px, rows 44 px, gap-6.
  states    link valid (nothing sent yet); link expired; already answered; code sent; code states (OtpInput);
            verified (step 2 opens and focus moves to its heading); declaration not ticked; no decision; sending;
            agreed; refused; network failure; no JavaScript (each step posts to the server and the page returns
            with the next step).
            Opening the link sends nothing. Only "Send code" sends the SMS, so link previews in WhatsApp, SMS or
            email cost nothing and never use up the guardian's code.
            Even after consent, the institution won't track or profile the child or send promotional messages
            (DPDP s.9(3)). The page says so in plain words.
  tokens    public page as PublicEnquiryForm; decision cards as RadioGroup cards; result panel success or neutral
            (bg-success-subtle with CircleCheck text-success; bg-surface-sunken with Info text-muted).
  content   h1 "Consent for Meera's admission enquiry".
            Explanation: "Meera, who is under 18, asked {Institution} about admission. To reply and help with her
            application, {Institution} needs a parent or guardian to agree. They will use her name, contact details
            and course choices only for admission. They won't track her activity or send her promotional messages."
            Notice link "Read the full notice (version 3, 01 Oct 2026)".
            Step titles "Confirm it's you", "Your answer".
            Code lines: before sending "We'll send a code to +91 ••••• •3210." with the button "Send code"; after
            sending "We sent a code to +91 ••••• •3210."
            Declaration "I'm 18 or older and I'm Meera's parent or legal guardian."
            Cards: "I agree: {Institution} can contact Meera and help with her application." / "I don't agree:
            {Institution} will keep only what's needed to confirm her age."
            Errors "Tick this box to confirm you're her parent or guardian." "Choose an answer."
            Button "Send my answer".
            Agreed: "Thank you. {Institution} can now help Meera with her admission." Refused: "Thank you. We've
            told {Institution}. They won't use Meera's details for admission."
            Expired: "This link has expired. Ask {Institution} to send a new one." Already answered: "You already
            answered on 05 Oct 2026: you agreed. To change this, use the link below." with "Withdraw consent".
  keyboard  Natural order. After "Send code", focus moves to the code field. After the code is verified, focus
            moves to the "Your answer" heading. Radio cards use arrow keys. Enter submits.
  a11y      Group 1 public rules. Both steps are sections with h2s. The decision is a fieldset with a legend.
            The page uses the language of the enquiry form the child filled in (lang on <html>, as
            PublicEnquiryForm).
            The declaration checkbox is required and never pre-ticked. The result panel takes focus.
            Targets: 48 px controls; 44 px rows and links.
            Pairs: text on surface, bg, success-subtle, surface-sunken; text-muted on surface, bg, surface-sunken;
            accent on surface; border-input on surface; on-accent on accent, accent-hover; danger on surface;
            success on success-subtle; focus-ring on surface, bg.
  base      Next.js server-rendered page with Server Actions; OtpInput, RadioGroup (cards), Checkbox, TextInput,
            Field, FormLayout, Button (group 1); native <select>; GET|POST /consent/:token.
  used on   /consent/:token, linked from S08 (guardian consent request) and S01 (minor mode).
```

#### PrivacyRequestPage

```text
PrivacyRequestPage
  purpose   Let a student or guardian ask to see, correct or delete their data, withdraw consent, or complain,
            after showing it's them.
  anatomy   Routes /privacy/:orgSlug/requests and /privacy/:orgSlug/withdraw. Public page:
            - h1 "Your data at {Institution}";
            - "What would you like to do?" RadioGroup cards: see my data (access), correct my data (correction),
              delete my data (erasure), stop using my data (consent withdrawal, which leads to the withdraw page),
              make a complaint (grievance);
            - "Who are you?" RadioGroup: "I'm the student", "I'm a parent or guardian", "I'm acting for someone
              else";
            - "Confirm it's you": a RadioGroup (inline) "Email" | "Mobile number", then TextInput type="email"
              autocomplete="email", or PhoneInput (autocomplete tel-country-code and tel-national); then "Send
              code" and OtpInput;
            - "Details" Textarea (required for correction and complaints; optional otherwise) and "How should we
              reply?" (Email, SMS, Phone);
            - "Send request"; then a confirmation with the reference and the reply-by date.
            Withdraw page: after the code, ConsentCapture's withdraw variant lists each active consent with a
            checkbox, and "Withdraw" takes one step, as giving did.
            Every request lands in DataRequestDesk (S42) with its due date.
  variants  request; withdraw.
  sizes     public: max-w-public, px-4, 48 px controls, 44 px rows, gap-6.
  states    choosing; code sent (the message never says whether a record was found before the code is checked);
            wrong code; verified; details missing; sending; sent (reference shown); rate limited; network failure;
            no JavaScript; nothing found after verification ("We couldn't find details for this number. Try the
            email you used instead.").
            Deletion note: some records must be kept for at least a year, or longer when another law requires it;
            the reply will say what is kept and why.
  tokens    as PublicEnquiryForm; confirmation Alert success (group 2); deletion note Alert info (group 2).
  content   Options: "See the data {Institution} holds about me", "Correct something that's wrong", "Delete my
            data", "Stop {Institution} using my data", "Make a complaint".
            Identity hint: "We'll send a code to check it's you. If this number isn't in {Institution}'s records,
            no code will arrive; try your email instead."
            Deletion note: "Some records, such as fee receipts and consent records, must be kept for at least a
            year, or longer if the law requires. We'll tell you what we keep and why."
            Labels "Confirm it's you", "Email", "Mobile number", "Details", "How should we reply?". Buttons "Send
            code", "Send request".
            Sent: "Request sent. Your reference is DR-2026-0042. {Institution} will reply by 05 Nov 2026."
            Withdraw: "Choose what to stop" and "Withdraw"; done "Done. {Institution} will stop sending you
            WhatsApp updates."
  keyboard  Natural order; focus moves to each new section's heading as it opens; Enter submits.
  a11y      Group 1 public rules. Each question is a fieldset with a legend. The reference number is in text that
            can be copied. The reply-by date comes from the server (due_at).
            Targets: 48 px controls; 44 px rows and links.
            Pairs: text on surface, bg, success-subtle, info-subtle; text-muted on surface, bg; accent on surface;
            border-input on surface; on-accent on accent, accent-hover; danger on surface; success on
            success-subtle; info on info-subtle; focus-ring on surface, bg, info-subtle.
  base      Next.js server-rendered page with Server Actions; RadioGroup (cards and inline), TextInput, PhoneInput,
            OtpInput, Textarea, ConsentCapture (withdraw variant), Button (group 1); Alert (group 2).
  used on   /privacy/:orgSlug/requests and /privacy/:orgSlug/withdraw, linked from the footers of S01 and S02 and
            from every notice.
```

#### SignInPage

```text
SignInPage
  purpose   Staff sign in with a password, an emailed link or their organisation's single sign-on, then a second
            step when two-step sign-in is on, with clear errors.
  anatomy   Centred card on bg:
            - product name as text (no logo until /replica-brand);
            - h1 "Sign in" (or "Sign in to {Institution}" on an institution's SSO address);
            - an Alert area (group 2) for form-level errors;
            - "Email address" (autocomplete="username");
            - "Password" (autocomplete="current-password", show-password toggle) with "Forgot password?";
            - "Sign in" (primary, full width);
            - a divider "or";
            - "Email me a sign-in link" (secondary, full width);
            - "Sign in with single sign-on" (secondary, full width).
            When the email's domain uses SSO, the password field hides and the primary becomes "Continue with
            single sign-on".
            Other steps in the same card:
            - two-step code: OtpInput (totp), "Use a recovery code", "Back";
            - link sent: where it went, how long it works, "Resend link", "Use a password instead";
            - choose an institution (member of several): a list of buttons;
            - set up two-step sign-in (when an institution requires it): a QR code, the setup key (CodeBlock with
              CopyButton), the code field, then the recovery codes shown once (SecretReveal pattern);
            - reset password, request ("Forgot password?"): "Email address" (autocomplete="username") and "Email
              me a reset link";
            - set password (from an invitation) and reset password (from the reset link): one "New password" field
              (TextInput password variant: type="password", autocomplete="new-password", show-password toggle,
              paste allowed), the rules shown as a hint before typing, and no "Confirm password" field. "Set
              password" saves it and signs the person in.
  variants  password; magic link; SSO; two-step code; choose institution; two-step setup; reset password; set
            password (invitation); session expired (an info Alert, and the return address kept).
            AppShell (group 2) warns 2 minutes before the idle limit, with "Stay signed in" (2.2.1). Its
            session-expired dialog opens this page in a new tab, so what the person typed stays in the old tab.
  sizes     card max-w-dialog-sm (400 px) p-6 rounded-lg, vertically centred with at least 16 px around it on
            phones. Controls md (40 px). Buttons full width, md. h1 text-xl.
  states    default; submitting; wrong email or password (one message that doesn't say which was wrong); too many
            tries; account turned off; invitation not accepted yet; network not allowed (IP rules); SSO required;
            SSO failed; link expired or already used; two-step code wrong or expired; two-step required but not set
            up; session expired; reset link sent (the same message whether or not the email has an account); new
            password too short or too common; password set; network error.
            Password managers, paste and autofill all work. No CAPTCHA; repeated failures are slowed down by rate
            limits.
  tokens    page        bg-bg
            card        bg-surface border border-border rounded-lg shadow-card
            divider     text-xs text-muted between border-t border-border lines
            alerts      Alert (group 2): danger for errors, info for "link sent" and "session expired", warning for
                        "too many tries"
  content   Labels "Email address", "Password". Links "Forgot password?", "Use a recovery code", "Use a password
            instead", "Back".
            Buttons "Sign in", "Email me a sign-in link", "Sign in with single sign-on", "Continue with single
            sign-on", "Resend link", "Verify".
            Errors:
            - "That email and password don't match. Try again, or reset your password."
            - "Too many tries. Wait 15 minutes, or reset your password."
            - "Your account at {Institution} is turned off. Ask an admin to turn it back on."
            - "You haven't finished setting up your account. Use the invitation we emailed on 02 Oct."
            - "{Institution} only allows sign-in from its own network. Ask an admin if you need access from here."
            - "{Institution} uses single sign-on. Continue with single sign-on."
            - "Your organisation's sign-in didn't finish. Try again, or contact your IT team."
            - "This sign-in link has expired or was already used. Ask for a new one."
            - "We couldn't reach the server. Check your connection and try again."
            Link sent: "Check your email. We sent a sign-in link to priya@college.edu.in. It works for 15 minutes."
            Session expired: "You were signed out. Sign in again to carry on where you left off."
            Two-step: label "Code from your authenticator app".
            Reset request: title "Reset your password"; button "Email me a reset link"; sent "If
            priya@college.edu.in has an account, we've sent a reset link. It works for 15 minutes."
            Set or reset: title "Choose a password" (invitation) or "Choose a new password"; label "New password";
            hint "At least {min} characters. A few words together work well."; button "Set password"; errors "Use
            at least {min} characters." "This password is too common. Try a few words together."
            Choose institution: "Which institution do you want to open?"
  keyboard  Tab order: email, password, show password, "Forgot password?", "Sign in", the link button, SSO. Enter
            submits. When the step changes, focus moves to the step's heading or its first field. After a
            form-level error, focus moves to the error Alert.
  a11y      Accessible authentication (3.3.8): no memory or transcription test, paste allowed, autocomplete set
            (username, current-password, new-password), a show-password toggle, and magic link and SSO as
            alternatives. Setting a password asks for it once, with no "Confirm password" field.
            The error Alert has tabindex="-1" and no live role, and is focused, so it is read once. Field errors
            use Field.
            Page title "Sign in · {Product}". The only time limits are those of the link and the codes, and they are
            stated.
            Targets: 40 px controls; links at least 24 px.
            Pairs: text on surface, bg, danger-subtle, info-subtle, warning-subtle; text-muted on surface, bg;
            accent on surface; on-accent on accent, accent-hover; border-input on surface; danger on surface,
            danger-subtle; info on info-subtle; warning on warning-subtle; focus-ring on surface, danger-subtle,
            info-subtle, warning-subtle.
  base      Supabase Auth (password, magic link, TOTP, SAML) through Server Actions; Field, TextInput (password
            variant), OtpInput, CodeBlock, CopyButton, SecretReveal, Button (group 1); Alert (group 2).
  used on   S03.
```

---

### H. Payment and privacy desks

#### PaymentLinkDialog

```text
PaymentLinkDialog
  purpose   Create a payment link for one lead and send it by WhatsApp, SMS or email, with the fee, amount, gateway
            and expiry checked before anything is sent.
  anatomy   Dialog dialog-md (560 px), opened from LeadProfileHeader's More menu ("Payment link") and from the S08
            payments tab ("New payment link"). Body, top to bottom:
            - "Fee": Select of the institution's active fees (payment products), grouped "Application fee",
              "Token fee" and "Other", each option with its amount;
            - "Amount": read-only Money from the fee; for an "Other" fee, a TextInput with the "₹" prefix,
              inputmode="decimal" and two decimals;
            - "Gateway": Select of connected gateways, the default first. A test gateway carries the Badge "Test
              mode";
            - "Send by": ChannelTabs (group 1): WhatsApp, SMS, Email, each with its unavailable state and reason;
            - "Template": TemplatePicker for that channel, listing only templates that hold the Payment link field
              (MergeTokenInserter's "Links" group);
            - "Link expires": DateTimePicker with the zone, default 7 days from now;
            - "Preview": the message as the student will get it, in the paper frame, with the link filled in;
            - footer: "Cancel" and "Create and send link" (primary).
            The server creates the link and sends it through the outbox (POST /leads/:id/payment-links). The
            student pays on PublicPaymentPage (S02).
  variants  single lead (S08; M03 in phase 2). Only the fees and gateways the person's role may use are listed.
  sizes     dialog-md. Fields md (40 px), gap-6. Amount text-md tabular-nums. Preview max-h-64 (256 px), then it
            scrolls.
  states    loading (Skeleton fields); ready; changed (closing asks "Discard your changes?"); test mode (Alert
            gateway_test, warning; sending is allowed); an active link for the same fee already exists (an info
            Alert names it and its expiry, so nobody sends two by mistake; sending another is allowed); channel
            unavailable (ChannelTabs gives the reason); invalid amount; expiry in the past; creating; sent (the
            dialog closes, a Toast confirms, and the link shows in the payments tab as Active with its expiry);
            created but not sent (danger Alert: the link exists, so "Try again" only resends it).
            Blocked: "Create and send link" is aria-disabled and described by the reason:
            - no fee set up, or no gateway connected;
            - the gateway needs reconnecting (Alert gateway_reconnect, danger);
            - under 18 with no guardian consent (the same rule as LeadProfileHeader);
            - the lead is merged, on hold or erased.
  tokens    dialog        Dialog bg-surface-raised
            amount        text-md text-fg tabular-nums; amounts in the Fee options text-muted
            test mode     Badge tag warning (bg-warning-subtle text-warning)
            preview       the paper frame inside border border-border rounded-lg
            alerts        Alert (group 2): warning (test mode), info (an active link exists), danger (gateway,
                          not sent)
  content   Title "Payment link for Meera Pillai". Description "Meera pays on {Institution}'s payment page."
            Labels "Fee", "Amount", "Gateway", "Send by", "Template", "Link expires", "Preview".
            Buttons "Cancel", "Create and send link", "Try again".
            Expiry hint: "The link works until this time. After that, Meera needs a new one."
            Errors: "Choose a fee." "Enter an amount above ₹0." "Use at most 2 decimal places." "Choose a time in
            the future." "Choose a template."
            Blocked reasons: "No fees are set up yet. An admin can add them in Settings > Payments." "No payment
            gateway is connected. An admin can connect one in Settings > Payments." "Meera is under 18 and no
            guardian has agreed yet." "This lead is on hold."
            Active link: "Meera already has an active link for Application fee 2027, sent 03 Oct. It works until
            10 Oct, 11:59 pm IST."
            Sent toast: "Payment link sent to Meera by WhatsApp."
            Not sent: "The link was created, but the WhatsApp message failed: {reason}. Try again, or send it by
            SMS."
  keyboard  FormLayout order, top to bottom; focus starts on "Fee". Esc closes (asks first when something
            changed).
  a11y      Radix Dialog with title and description. Money is text, read as written ("₹1,000.00").
            When the primary is aria-disabled, aria-describedby points at the reason. The preview iframe has a
            title ("Preview of the payment message for Meera Pillai"). Results go to the dialog's polite status.
            Targets: 40 px controls and buttons.
            Pairs: text on surface-raised, surface, warning-subtle, danger-subtle, info-subtle; text-muted on
            surface-raised; border-input on surface-raised; accent on surface-raised; on-accent on accent,
            accent-hover; warning on warning-subtle; danger on danger-subtle; info on info-subtle; focus-ring on
            surface-raised, warning-subtle, danger-subtle, info-subtle.
  base      Dialog, Alert, Badge, Toast, Money, Skeleton (group 2); Select, TextInput, ChannelTabs, DateTimePicker,
            FormLayout, Button (group 1); TemplatePicker (this group); POST /leads/:id/payment-links.
  used on   S08, M03.
```

#### OfflinePaymentForm

```text
OfflinePaymentForm
  purpose   Record a fee paid outside the gateway (cash, cheque, demand draft or bank transfer) with its proof. It
            counts only after someone who can manage payments approves it.
  anatomy   Dialog dialog-md, opened from the S08 payments tab and from S25 ("Record offline payment"):
            - "Fee": Select of payment products; "Amount": TextInput with the "₹" prefix, filled from the fee and
              editable;
            - "How was it paid?": RadioGroup, required, nothing preselected: "Cash", "Cheque", "Demand draft",
              "NEFT or bank transfer", "Other" (group 2's labels for payments.offline_mode);
            - "Reference": TextInput for the cheque, draft or UTR number, required except for cash;
            - "Paid on": DatePicker, today or earlier;
            - "Proof": FileUpload compact (a photo or PDF of the receipt, cheque or bank slip);
            - "Note": Textarea, optional;
            - footer: "Cancel" and "Record payment".
            Approval: the payment is saved as pending, shown with the vocabulary's "Waiting for approval" pill.
            People who can manage payments see "Approve" on it (S08 payments tab, the S25 row menu, and S25's
            bulk "Approve offline payments"). "Approve" opens a ConfirmDialog that shows the details and the proof.
  variants  record (S08, S25); approve (one payment from S08 or S25, or several through S25's BulkActionBar).
  sizes     dialog-md. Fields md (40 px), gap-6. Radio rows 24 px. Proof thumbnail size-16 (64 px).
  states    empty; dirty (closing asks "Discard your changes?"); reference missing; date in the future; proof
            uploading (the primary waits and reads "Uploading…"); saving; recorded (Toast); waiting for approval;
            approving; approved (the pill turns "Paid", the payment gets its receipt number, and the journey and
            automations update as they do for an online payment); save failed (danger Alert, values kept); no
            right to approve ("Approve" is hidden).
  tokens    dialog        Dialog bg-surface-raised
            proof         border border-border rounded-md; file name text-sm text-fg; size text-xs text-muted
            pending pill  StatusPill by vocabulary value (payments.status pending, offline: "Waiting for approval")
            alerts        Alert danger (save failed)
  content   Title "Record an offline payment". Labels "Fee", "Amount", "How was it paid?", "Reference", "Paid on",
            "Proof", "Note". Hints: "Cheque, draft or UTR number"; "A photo or PDF of the receipt or bank slip."
            Buttons "Cancel", "Record payment", "Approve".
            Errors: "Choose how it was paid." "Enter the cheque, draft or UTR number." "The payment date can't be
            in the future." "Enter an amount above ₹0."
            Toast: "Offline payment recorded. It counts once someone approves it."
            Approve confirm: title "Approve ₹1,000.00 from Meera Pillai?"; body "Cheque 004512, paid 04 Oct 2026.
            Approving counts the payment, gives it a receipt number and updates Meera's journey."; buttons
            "Cancel" and "Approve payment".
  keyboard  FormLayout order; focus starts on "Fee". Radio rows use the arrow keys. Esc closes (asks first when
            something changed).
  a11y      The mode question is a <fieldset> with its legend. "Reference" shows "(optional)" only when cash is
            chosen, and aria-required changes with it. The proof thumbnail has alt text ("Proof: photo of the
            cheque").
            Targets: 40 px controls and buttons; 24 px radio rows.
            Pairs: text on surface-raised, danger-subtle; text-muted on surface-raised; border-input on
            surface-raised; accent on surface-raised; on-accent on accent, accent-hover; warning on warning-subtle;
            danger on surface-raised, danger-subtle; focus-ring on surface-raised, danger-subtle.
  base      Dialog, ConfirmDialog, Alert, StatusPill, Toast (group 2); Select, TextInput, RadioGroup, DatePicker,
            FileUpload, Textarea, FormLayout, Button (group 1); POST /payments/offline, POST /payments/:id/approve.
  used on   S08, S25.
```

#### RefundDialog

```text
RefundDialog
  purpose   Ask for a refund on a paid fee, and have a second person approve or reject it. Nobody approves their own
            request, and refunds never add up to more than was paid.
  anatomy   Request: Dialog dialog-sm (400 px), from a paid payment's row menu ("Refund…") on the S08 payments tab
            and on S25:
            - DescriptionList: fee, amount paid, already refunded, method, paid on, receipt number;
            - "Refund amount": TextInput with the "₹" prefix, default the amount still refundable;
            - "Reason": Textarea, required;
            - footer: "Cancel" and "Request refund".
            Approval: the refund shows under its payment (S08 payments tab, S25 row and detail) with the
            vocabulary's "Waiting for approval" pill, who asked, when and why, and the buttons "Approve" and
            "Reject". "Approve" opens a ConfirmDialog; "Reject" opens a small Dialog that asks for the reason.
            For the person who asked, "Approve" is aria-disabled with the reason.
  variants  online payment (the refund goes back through the gateway: Approved, then Processing, then Refunded or
            Failed); offline payment (approval records money returned by hand; nothing goes to a gateway).
  sizes     dialog-sm. Fields md (40 px), gap-4. "Approve" and "Reject" are Buttons sm (32 px) in rows, md (40 px)
            in dialogs.
  states    requesting; amount over the cap; reason missing; requested (Toast); waiting for approval; approving;
            approved; processing (sent to the gateway); refunded; failed at the gateway (danger Alert with the
            reason in our words, and "Try again" for an approver); rejected (the reason is shown to the person who
            asked); no right to request (no "Refund…" item).
            The server enforces both rules (an approver who isn't the requester; refunds capped at the payment).
            The UI states them before anyone presses a button.
  tokens    dialog        Dialog bg-surface-raised
            facts         DescriptionList (dt text-muted, dd text-fg; amounts tabular-nums)
            pills         StatusPill by vocabulary value (refunds.status)
            alerts        Alert danger (failed at the gateway)
  content   Title "Refund for Meera Pillai". Labels "Refund amount", "Reason". Buttons "Cancel", "Request refund",
            "Approve", "Reject", "Try again".
            Hint: "Up to ₹500.00 can still be refunded on this payment."
            Errors: "You can refund at most ₹500.00 more on this payment." "Enter an amount above ₹0." "Say why
            this refund is needed."
            Toast: "Refund requested. Someone else must approve it."
            Own request: "Someone else must approve this refund."
            Approve confirm: title "Approve a refund of ₹500.00 to Meera Pillai?"; body "Ravi Kumar asked on 05 Oct
            2026: Paid twice. The money goes back through {Gateway} to the account Meera paid from."; buttons
            "Cancel" and "Approve refund".
            Reject: title "Reject this refund?"; label "Reason (Ravi Kumar sees this)"; button "Reject refund".
            Failed: "{Gateway} couldn't make this refund: {reason}. Try again, or refund by bank transfer."
  keyboard  FormLayout order; focus starts on "Refund amount". Esc closes. In rows, "Approve" and "Reject" follow
            the refund's details in tab order.
  a11y      Dialogs have titles and descriptions. The cap and the second-person rule are visible text before any
            press, and the aria-disabled "Approve" is described by its reason. Status changes are announced in the
            page's polite status.
            Targets: 40 px controls in dialogs; 32 px buttons in rows.
            Pairs: text on surface-raised, surface, surface-sunken, danger-subtle; text-muted on surface-raised,
            surface; border-input on surface-raised; warning on warning-subtle; info on info-subtle; success on
            success-subtle; danger on danger-subtle; on-accent on accent, accent-hover; focus-ring on
            surface-raised, surface, danger-subtle.
  base      Dialog, ConfirmDialog, DescriptionList, Alert, StatusPill, Toast, Money (group 2); TextInput, Textarea,
            FormLayout, Button (group 1); POST /refunds, POST /refunds/:id/approve (and a reject action; see Open
            questions).
  used on   S08, S25.
```

#### DataRequestDesk

```text
DataRequestDesk
  purpose   The staff desk for privacy requests (see, correct, delete, stop using, complain): who asked, whether
            their identity was checked, when the reply is due, and what was done.
  anatomy   Page S42 "Privacy requests" (Settings > Privacy requests):
            - toolbar: Tabs "Open", "Overdue", "Completed", "Declined" (with counts), a "Kind" Select, SearchInput
              (reference or name), and "Log a request" (for requests that came by email, phone or in person);
            - DataTable plain. Columns "Reference", "Kind" (Badge), "Requested by", "Identity checked" (DateText,
              or "Not checked"), "Due" (RelativeTime due form; StatusPill "Overdue" when past), "Status"
              (StatusPill: New, In progress, Completed, Declined);
            - a row opens a Drawer (drawer-md, 560 px) with:
              - a DescriptionList: reference, kind, requested by, contact (MaskedValue for masked roles), channel,
                received, due, linked lead ("Open lead #10234", or "Link to a lead");
              - the requester's own words;
              - a history list (status changes, replies, notes), each with DateText;
              - a reply box (Textarea, sent by email or SMS to the contact on the request, through the outbox);
              - actions "Mark in progress", "Complete", "Decline", and "Check identity" (sends a code to the
                contact) while identity isn't checked.
            Erasure requests add "Schedule erasure", which opens ConfirmDialog (typed, with the lead number).
            Erasure runs only after the lead's retention hold ends (erase_not_before). Until then the lead is on
            hold.
  variants  open; overdue; completed; declined; logged by staff (channel Email, Phone or In person; identity starts
            unchecked).
  sizes     page max-w-content; table as DataTable plain; Drawer drawer-md; reply Textarea min-h-32 (128 px).
  states    loading; empty; filtered-empty; overdue (Banner requests_overdue, group 2, for admins with privacy
            rights); identity not checked ("Complete" is aria-disabled with the reason); no linked lead; sending a
            reply; reply failed (Alert, the text kept); completing (a required note says what was done, and goes
            into the reply); declining (a required reason, sent to the requester); erasure scheduled; no
            permission (group 2's no-permission EmptyState).
  tokens    table         DataTable plain; kind Badge tag neutral (bg-surface-sunken text-fg)
            due           RelativeTime due form; in rows StatusPill danger "Overdue"
            drawer        Drawer bg-surface-raised; facts DescriptionList; history text-sm text-fg, times text-xs
                          text-muted
            erasure       ConfirmDialog typed, with Button danger
  content   Title "Privacy requests". Tabs "Open", "Overdue", "Completed", "Declined". Columns "Reference", "Kind",
            "Requested by", "Identity checked", "Due", "Status". Kinds (group 2's labels): "Access", "Correction",
            "Erasure", "Consent withdrawal", "Grievance". Requested by: "Student", "Guardian", "Nominee".
            Buttons "Log a request", "Mark in progress", "Complete", "Decline", "Check identity", "Send reply",
            "Schedule erasure".
            Identity: "Not checked"; reason "Check the requester's identity first."
            Complete: label "What did you do?"; hint "This goes into the reply to the requester."
            Decline: label "Why are you declining?"; hint "The requester sees this."
            Erasure confirm: title "Erase the data of lead #10234?"; body "The lead is on hold from now and is
            erased after 04 Oct 2027, when its retention hold ends. Fee receipts and consent records are kept as
            the law requires. You can't undo this."; typed field "Type 10234 to confirm"; buttons "Cancel" and
            "Schedule erasure".
            Empty: "No privacy requests yet. Requests from your privacy page land here."
  keyboard  Tabs, then the toolbar, then the table (plain: normal tab order). Enter on a row's reference opens the
            Drawer; Esc closes it and returns focus to that reference.
  a11y      The table is labelled "Privacy requests". Due states are words ("Overdue", "Due today"), never colour
            alone. Status changes and sent replies are announced in the page's polite status.
            Targets: 32 px toolbar controls; reference links fill their 48 px rows; 40 px buttons in the Drawer.
            Pairs: text on surface, surface-hover, surface-sunken, surface-raised; text-muted on surface,
            surface-raised; accent on surface, surface-raised; border-input on surface, surface-raised; info on
            info-subtle; success on success-subtle; danger on danger-subtle; on-accent on accent; on-danger on
            danger, danger-hover; focus-ring on surface, surface-hover, surface-raised.
  base      DataTable plain (this group); Tabs, Drawer, DescriptionList, ConfirmDialog, Badge, StatusPill,
            RelativeTime, DateText, MaskedValue, Alert, EmptyState, Banner (group 2); SearchInput, Select,
            Textarea, Button (group 1); CRUD /data-requests.
  used on   S42.
```

#### IncidentRegister

```text
IncidentRegister
  purpose   Record a personal data breach and keep its reporting clocks: CERT-In within 6 hours of noticing, and
            the Board's detailed report within 72 hours of becoming aware, with every report time on record.
  anatomy   Page S43 "Incidents" (Settings > Incidents):
            - DataTable plain. Columns "Noticed" (DateText), "What happened" (one line), "People affected", "Next
              deadline" (RelativeTime due form), "Status" (StatusPill: Open, Contained, Closed, CERT-In report
              overdue);
            - "Record an incident" (Button primary sm) opens the form, a page (max-w-form) in FormLayout:
              - "When was it noticed?" (DateTimePicker, required) and "When did {Institution} become aware?"
                (DateTimePicker; it starts the 72-hour clock);
              - "What happened?" (Textarea, required); "Data affected" (checkbox group: names, contact details,
                dates of birth, documents, payment records, other); "People affected" (NumberStepper, with a
                "Not known yet" checkbox);
              - "Deadlines": a DescriptionList with two rows, each a due time and a StatusPill;
              - "Reports sent": a DateTimePicker for each report: "CERT-In report", "Institution told" (only on
                incidents we report to the institution), "Board told", "Board detailed report", "Affected people
                told";
              - "Status": RadioGroup "Open", "Contained", "Closed";
              - footer: "Cancel" and "Save".
  variants  the institution's own incident; a platform incident copied to each affected institution (the fields we
            filled are read-only, with the note "Reported by {Product}"); closed (read-only, with "Reopen").
  sizes     page max-w-form (720 px); fields gap-6, controls md (40 px); deadline rows min-h-kv-row (36 px).
  states    new; dirty; saving; saved (Toast); save failed (Alert, values kept); deadline running (a warning pill
            with the time left, as static text that refreshes each minute and is never announced); deadline met (a
            success pill with the report time); deadline missed (a danger pill, and Banner incident_deadline for
            admins); aware time not set (the Board row says its clock starts once it is set); closed; no
            permission.
  tokens    deadlines     DescriptionList; StatusPill warning (running), success (met), danger (missed)
            form          FormLayout (group 1) inside a Card
            alerts        Alert danger (save failed)
  content   Title "Incidents". Columns "Noticed", "What happened", "People affected", "Next deadline", "Status".
            Buttons "Record an incident", "Save", "Cancel", "Reopen".
            Labels "When was it noticed?", "When did {Institution} become aware?", "What happened?", "Data
            affected", "People affected", "Not known yet", "Deadlines", "Reports sent", "CERT-In report",
            "Institution told", "Board told", "Board detailed report", "Affected people told", "Status".
            Deadlines: "CERT-In report due by 07 Oct, 2:10 pm IST (6 hours after it was noticed)", with "4 hr 10
            min left", "Sent 07 Oct, 1:40 pm IST" or "Overdue"; "Board detailed report due by 10 Oct, 9:00 am IST
            (72 hours after becoming aware)". Before the aware time is set: "Starts when you add the time
            {Institution} became aware."
            Note under the Board rows: "The Board reports apply from 13 May 2027 (DPDP Rule 7)."
            Empty: "No incidents recorded. If you notice a breach, record it here straight away."
  keyboard  FormLayout order. The table is plain: Enter on a row's date link opens the incident.
  a11y      Deadlines are text with their dates and words ("Overdue"), never a colour or a timer alone. The time
            left is not a live region. Saves and status changes are announced politely.
            Targets: 40 px controls; 24 px checkbox rows; table links fill their rows.
            Pairs: text on surface, surface-sunken, warning-subtle, danger-subtle, success-subtle; text-muted on
            surface; border-input on surface; accent on surface; warning on warning-subtle; danger on
            danger-subtle; success on success-subtle; on-accent on accent, accent-hover; focus-ring on surface,
            danger-subtle.
  base      DataTable plain (this group); FormLayout, DateTimePicker, Textarea, Checkbox, NumberStepper,
            RadioGroup, Button (group 1); Card, DescriptionList, StatusPill, RelativeTime, DateText, Alert, Banner,
            Toast (group 2); CRUD /incidents.
  used on   S43.
```

#### RetentionSettings

```text
RetentionSettings
  purpose   Set how long each kind of personal data is kept after it was last used, never below the legal minimum
            of 365 days, and say plainly what happens when that time ends.
  anatomy   Page S44 "Retention" (Settings > Retention), max-w-form:
            - an intro paragraph on what happens at the end (see content);
            - a <table> with one row per data category. Columns "Data", "Keep for" (NumberStepper in days, at
              least 365, with the length in years beside it) and "Default";
            - categories: "Enquiries that didn't lead to admission", "Messages and call recordings", "Form uploads
              and documents", "Audit log";
            - an info Alert: fee receipts and consent records follow the law, not these settings;
            - footer: "Cancel" and "Save".
            The nightly retention job puts expired data on hold, tells the student 48 hours before erasure, then
            erases it (architecture: retention_purge).
  variants  edit (admins with the settings right); read-only (everyone else who can open settings).
  sizes     max-w-form (720 px). Rows min-h-row (48 px). NumberStepper md (40 px), w-40 (160 px).
  states    default; dirty; below 365 (field error; Save is blocked); saving; saved (Toast); save failed (Alert,
            values kept); read-only.
  tokens    table         as DataTable plain; defaults text-muted
            years         text-sm text-muted tabular-nums
            intro         text-sm text-fg; note Alert info (group 2)
  content   Title "Retention". Columns "Data", "Keep for", "Default". Unit "days". Years "about 1 year", "about 2
            years". Default "365 days".
            Intro: "When the time below ends, the data is put on hold: it's kept, but nobody can use it. 48 hours
            before it's erased, we tell the student. Then it's erased. Times count from the last time the data was
            used."
            Note: "Fee receipts and consent records are kept as long as the law requires, whatever you set here."
            Hint: "At least 365 days."
            Error: "Retention can't be shorter than 365 days (DPDP Rule 8(3))."
            Toast: "Retention saved. It applies from tonight's run."
  keyboard  Normal tab order through the steppers, then the footer.
  a11y      Each NumberStepper is named by its row ("Keep enquiries that didn't lead to admission for, in days").
            The minimum is in the hint before anyone types, and the error is linked with aria-describedby.
            Targets: 40 px steppers and buttons.
            Pairs: text on surface, surface-sunken, info-subtle; text-muted on surface, surface-sunken;
            border-input on surface; danger on surface; info on info-subtle; on-accent on accent, accent-hover;
            focus-ring on surface, info-subtle.
  base      native <table>; NumberStepper, FormLayout, Button (group 1); Alert, Toast (group 2); orgs.settings
            (retention days per category, see Open questions); the retention_purge job.
  used on   S44.
```

---

## Status vocabulary

The one list of status labels, tones and icons. StatusPill (group 2) reads it, and no block gives a state a label or
icon of its own. It holds every status enum in `replica/schema.sql` check constraints, the free-text Meta and
provider values the schema stores, and the derived states the UI shows, including the ones group 3's blocks add.

Tones: N neutral, I info, S success, W warning, D danger. Icons are lucide-react 1.52 names. "Derived" rows give the rule
the server uses; the UI never computes a status from colour.

### Leads

| source | value | label | tone | icon | note |
| --- | --- | --- | --- | --- | --- |
| leads.application_status | none | Not started | N | `CircleDashed` | Usually not shown as a pill; the journey shows the step as not reached. |
| leads.application_status | started | Form started | I | `FilePen` | |
| leads.application_status | submitted | Form submitted | S | `FileCheck` | |
| leads.parental_consent_status | not_required | (no pill) | N | none | Adults. In filters: "Not needed (18 or over)". |
| leads.parental_consent_status | pending | Guardian consent pending | W | `ShieldAlert` | Blocks calls, messages and assignment (Alert minor_pending). |
| leads.parental_consent_status | verified | Guardian consent given | S | `ShieldCheck` | |
| leads.parental_consent_status | refused | Guardian refused | D | `ShieldX` | Processing stops (Alert minor_refused). |
| leads.email_verified_at, mobile_verified_at (derived) | set | Verified | S | `BadgeCheck` | Shown next to the email or mobile. |
| leads.email_verified_at, mobile_verified_at (derived) | null | Not verified | N | `CircleDashed` | |
| leads.untouched | true | New | I | `CircleDot` | Nobody has worked on the lead yet. In tables: a size-2 bg-accent dot before the name, sr-only "New, ", and a visible legend in the table toolbar (the same dot and "New lead"), so keyboard users can learn it without hovering. Everywhere else: this pill. Replaces any row-edge colour marker. The field keeps its name; only the UI word changes. |
| leads.merged_into_id (derived) | set | Merged | N | `Merge` | Read-only; links to the primary lead. |
| leads.restricted_at (derived) | set | On hold | N | `Lock` | Kept under the retention hold; no business use. Filter: "Show leads on hold". Alert lead_restricted. |
| leads.erased_at (derived) | set | Erased | N | `ShieldOff` | Anonymised in place. |
| consents.status | granted | Consent given | S | `ShieldCheck` | Per channel and purpose. |
| consents.status | withdrawn | Consent withdrawn | N | `ShieldOff` | |
| consents.imported and tsp_registered_at (derived) | imported, not registered | Imported, not registered | W | `ShieldAlert` | Unusable for promotional SMS until registered with the telcos. |
| opportunities.status | open | Open | I | `CircleDot` | |
| opportunities.status | won | Won | S | `Trophy` | |
| opportunities.status | lost | Lost | N | `CircleSlash` | |
| capture_events.outcome | pending | Processing | N | `Clock` | S07 result rows, S31 submission log. |
| capture_events.outcome | created | Created | S | `UserRoundPlus` | |
| capture_events.outcome | updated | Updated existing lead | I | `RefreshCw` | A repeat enquiry updated a lead (F02). |
| capture_events.outcome | rejected | Rejected | W | `Ban` | Failed a rule (validation, publisher cap); the reason shows as detail. |
| capture_events.outcome | failed | Failed | D | `CircleX` | |

### Verification

| source | value | label | tone | icon | note |
| --- | --- | --- | --- | --- | --- |
| verification_challenges (derived) | not verified, not expired, attempts < 5 | Code sent | I | `Send` | Detail: "to an•••@gmail.com". |
| verification_challenges.verified_at | set | Verified | S | `BadgeCheck` | |
| verification_challenges (derived) | expires_at passed, not verified | Code expired | N | `TimerOff` | |
| verification_challenges.attempts (derived) | 5, not verified | Too many tries | D | `Lock` | A new code is needed. |
| verification_challenges.decision | granted | Guardian agreed | S | `ShieldCheck` | Guardian consent only. |
| verification_challenges.decision | refused | Guardian refused | D | `ShieldX` | |
| channel_accounts.domain_verified_at (derived) | set | Domain verified | S | `BadgeCheck` | Email sending domain (S35). |
| channel_accounts.domain_verified_at (derived) | null | DNS records not found yet | W | `Hourglass` | Checked hourly by email_domain_verify. |
| channel_accounts.dlt_chain_status (provider text) | ok or verified | DLT chain verified | S | `Link` | |
| channel_accounts.dlt_chain_status (provider text) | anything else | DLT chain broken | D | `Unlink` | Banner dlt_chain_broken. |
| channel_accounts.dlt_chain_status | null | Not checked yet | N | `CircleDashed` | |

### Follow-ups, calls, attendance

| source | value | label | tone | icon | note |
| --- | --- | --- | --- | --- | --- |
| follow_ups.status | upcoming | Upcoming | N | `CalendarClock` | |
| follow_ups (derived) | upcoming, due today, not yet due | Due today | I | `Clock` | Our design. "Today" is in the follow-up's own time zone. |
| follow_ups (derived) | upcoming and starts_at < now | Overdue | D | `AlarmClock` | Text form: "Overdue · due 05 Oct, 4:00 pm IST". |
| follow_ups.status | done | Done | S | `CircleCheck` | |
| follow_ups.status | cancelled | Cancelled | N | `CircleSlash` | Reopening sets it back to Upcoming. |
| calls.status | initiated | Calling | I | `PhoneOutgoing` | |
| calls.status | ringing | Ringing | I | `BellRing` | |
| calls.status | connected | On call | I | `PhoneCall` | |
| calls.status | completed | Completed | S | `CircleCheck` | Detail: duration "4 min 12 s". |
| calls.status | missed | Missed | W | `PhoneMissed` | Inbound call nobody answered. |
| calls.status | no_answer | No answer | W | `PhoneOff` | Outbound call the lead didn't pick up. |
| calls.status | busy | Busy | W | `CircleMinus` | |
| calls.status | failed | Failed | D | `CircleX` | |
| members.checked_in_at, checked_out_at (derived) | in | Checked in | S | `UserRoundCheck` | |
| members (derived) | out | Checked out | N | `UserRoundX` | |
| member_attendance.checkout_method | auto | Checked out automatically | N | `TimerOff` | |
| member_attendance.checkout_method | manual | Checked out | N | `UserRoundX` | |

### Messaging

| source | value | label | tone | icon | note |
| --- | --- | --- | --- | --- | --- |
| messages.status | queued | Queued | N | `Clock` | Includes sends held for quiet hours (detail "Sends at 9:00 am IST"). |
| messages.status | sending | Sending | I | `LoaderCircle` | Static icon in pills; it never spins in a list. |
| messages.status | sent | Sent | N | `Check` | |
| messages.status | delivered | Delivered | I | `CheckCheck` | |
| messages.status | read | Read | S | `Eye` | Not shown for leads under 18 (no tracking). |
| messages.status | failed | Failed | D | `CircleX` | Detail: the provider's reason in our words. |
| messages.status | bounced | Bounced | D | `MailX` | Email only; the address is suppressed. |
| messages.status | received | Received | N | `ArrowDownLeft` | Inbound. |
| messages.status | skipped_opt_out | Not sent: opted out | W | `BellOff` | |
| messages.status | skipped_suppressed | Not sent: blocked address | W | `Ban` | |
| messages.status | skipped_window_closed | Not sent: reply window closed | W | `TimerOff` | WhatsApp 24-hour window. |
| messages.status | skipped_minor | Not sent: guardian consent needed | W | `ShieldAlert` | |
| messages.status | skipped_no_consent | Not sent: no consent | W | `ShieldX` | Promotional or explicit-service SMS rule. |
| messages.status | unknown | Not sure it was sent | W | `CircleQuestionMark` | A stale send being reconciled; never re-sent blindly. |
| messages.opened_at (derived) | set | Opened | I | `MailOpen` | Email; approximate (mail apps preload images). Not tracked for minors. |
| messages.clicked_at (derived) | set | Clicked | S | `MousePointerClick` | Not tracked for minors. |
| conversations.status | queued | Waiting | W | `Inbox` | Waiting to be picked up. |
| conversations.status | picked | Assigned | I | `UserRoundCheck` | Detail: the assignee's name. |
| conversations.status | resolved | Resolved | S | `CircleCheck` | |
| conversations.reopened_count (derived) | > 0 and not resolved | Reopened | W | `RotateCcw` | |
| conversations.service_window_ends_at (derived) | in the future | Reply window open | S | `MessageSquareText` | Detail: "3 hr left". |
| conversations.service_window_ends_at (derived) | past or null | Templates only | W | `TimerOff` | |
| broadcasts.status | draft | Draft | N | `PencilLine` | |
| broadcasts.status | scheduled | Scheduled | I | `CalendarClock` | Detail: "07 Oct, 10:00 am IST". |
| broadcasts.status | sending | Sending | I | `LoaderCircle` | |
| broadcasts (derived) | sending or done, with recipients waiting for a retry | Retrying | I | `RefreshCw` | Detail: "Next try 08 Oct, 10:00 am IST". |
| broadcasts.status | paused | Paused | W | `CirclePause` | Detail: paused_reason in our words. |
| broadcasts.status | done | Done | S | `CircleCheck` | |
| broadcasts.status | failed | Failed | D | `CircleX` | |
| broadcasts.status | cancelled | Cancelled | N | `CircleSlash` | |
| broadcast_recipients.status | pending | Waiting | N | `Clock` | |
| broadcast_recipients.status | sent | Sent | I | `Check` | Delivery then follows messages.status. |
| broadcast_recipients.status | failed | Failed | D | `CircleX` | Detail "Will retry 08 Oct" while next_retry_at is set. |
| broadcast_recipients.status | skipped | Skipped | W | `CircleMinus` | Detail: the reason (opted out, no consent, minor). |
| templates.active | true | Active | S | `CircleCheck` | Email and SMS templates. |
| templates.active | false | Turned off | N | `CircleSlash` | |
| templates.wa_status | null (not submitted yet) | Draft | N | `PencilLine` | WhatsApp templates. This vocabulary is the one source for template pills; WhatsAppTemplatePreview (group 3) uses it. |
| templates.wa_status (Meta value) | PENDING | In review | W | `Hourglass` | |
| templates.wa_status | APPROVED | Approved | S | `CircleCheck` | REINSTATED and UNARCHIVED events also resolve here (or to the restored status). |
| templates.wa_status | REJECTED | Rejected | D | `CircleX` | Detail: wa_rejection_reason. |
| templates.wa_status | PAUSED | Paused by Meta | W | `CirclePause` | |
| templates.wa_status | DISABLED | Disabled by Meta | D | `Ban` | |
| templates.wa_status | FLAGGED | At risk | W | `Flag` | Negative feedback; may be disabled. |
| templates.wa_status | IN_APPEAL | Appeal in review | I | `Scale` | |
| templates.wa_status | LOCKED | Locked | N | `Lock` | Can't be edited. |
| templates.wa_status | LIMIT_EXCEEDED | Template limit reached | W | `OctagonAlert` | The account is at Meta's template limit. |
| templates.wa_status | ARCHIVED | Archived | N | `Archive` | Unused; deleted after 28 days unless restored. |
| templates.wa_status | PENDING_DELETION | Being deleted | N | `Trash` | |
| templates.wa_status | DELETED | Deleted | N | `Trash` | |
| templates.wa_quality (Meta value) | GREEN or HIGH | High quality | S | `SignalHigh` | |
| templates.wa_quality | YELLOW or MEDIUM | Medium quality | W | `SignalMedium` | |
| templates.wa_quality | RED or LOW | Low quality | D | `SignalLow` | Alert wa_template_low. |
| templates.wa_quality | UNKNOWN or null | Not rated yet | N | `Signal` | |
| templates.dlt_last_used_at (derived) | 80 days or more ago | Lapses soon | W | `Clock` | Operators deactivate at 90 days. |
| sms_headers.status | active | Active | S | `CircleCheck` | |
| sms_headers.status | inactive | Inactive | N | `CircleSlash` | |

### Channels and WhatsApp onboarding

| source | value | label | tone | icon | note |
| --- | --- | --- | --- | --- | --- |
| channel_accounts.status | pending | Setting up | I | `Hourglass` | |
| channel_accounts.status | connected | Connected | S | `CircleCheck` | |
| channel_accounts.status | restricted | Restricted | W | `TriangleAlert` | Detail: Meta's or the provider's reason. |
| channel_accounts.status | disconnected | Disconnected | N | `Unplug` | |
| channel_accounts.status | reconnect_required | Reconnect needed | D | `CircleAlert` | Banner wa_reconnect for WhatsApp. |
| channel_accounts.onboarding_state | linked | Number linked | I | `Link` | WhatsApp number steps, in this order. |
| channel_accounts.onboarding_state | region_set | Data stored in India | I | `MapPin` | Must happen before registration. |
| channel_accounts.onboarding_state | phone_registered | Number registered | I | `Phone` | |
| channel_accounts.onboarding_state | display_name_pending | Display name in review | W | `Hourglass` | |
| channel_accounts.onboarding_state | live | Live | S | `CircleCheck` | |
| channel_accounts.onboarding_state | deregistered | Deregistered | N | `Unplug` | |
| channel_accounts.wa_quality (Meta value) | GREEN | High quality | S | `SignalHigh` | Phone number quality rating. |
| channel_accounts.wa_quality | YELLOW | Medium quality | W | `SignalMedium` | |
| channel_accounts.wa_quality | RED | Low quality | D | `SignalLow` | |
| channel_accounts.wa_quality | UNKNOWN or null | Not rated yet | N | `Signal` | |
| wa_business_accounts.onboarding_state | code_received | Sign-up started | I | `Hourglass` | |
| wa_business_accounts.onboarding_state | token_exchanged | Account linked | I | `KeyRound` | |
| wa_business_accounts.onboarding_state | waba_subscribed | Receiving updates | I | `Webhook` | |
| wa_business_accounts.onboarding_state | payment_method_pending | Payment method needed | W | `CreditCard` | Banner wa_payment_method. |
| wa_business_accounts.onboarding_state | live | Live | S | `CircleCheck` | Requires INR billing. |
| wa_business_accounts.onboarding_state | offboarded | Disconnected | N | `Unplug` | |
| wa_business_accounts.currency (derived) | not INR | Billing not in INR | W | `IndianRupee` | Banner waba_currency until 31 Dec 2026, then D. |

### Payments

| source | value | label | tone | icon | note |
| --- | --- | --- | --- | --- | --- |
| payments.status | created | Not started | N | `CircleDashed` | Attempt created, student hasn't paid. |
| payments.status | pending | Pending | W | `Clock` | Online: waiting for the gateway. Offline: waiting for approval (label "Waiting for approval", `Hourglass`). |
| payments.status | success | Paid | S | `CircleCheck` | |
| payments.status | failed | Failed | D | `CircleX` | |
| payments.status | expired | Expired | N | `TimerOff` | |
| payments.status | cancelled | Cancelled | N | `CircleSlash` | |
| payments.status | unknown | Checking with gateway | W | `CircleQuestionMark` | payment_reconcile is confirming it. |
| payments.status | refunded | Refunded | N | `RotateCcw` | Amount shows with "refund" text (Money). |
| payments.status | partially_refunded | Partly refunded | N | `RotateCcw` | Detail: "₹500.00 of ₹1,000.00 refunded". |
| payment_links.status | active | Active | I | `Link` | Detail: "Expires 10 Oct, 11:59 pm IST". |
| payment_links (derived) | active and expires_at passed | Expired | N | `TimerOff` | Shown before payment_link_expire runs. |
| payment_links.status | paid | Paid | S | `CircleCheck` | |
| payment_links.status | expired | Expired | N | `TimerOff` | |
| payment_links.status | cancelled | Cancelled | N | `CircleSlash` | |
| refunds.status | requested | Waiting for approval | W | `Hourglass` | Maker-checker: someone else must approve. |
| refunds.status | approved | Approved | I | `BadgeCheck` | |
| refunds.status | pending | Processing | I | `LoaderCircle` | Sent to the gateway. |
| refunds.status | refunded | Refunded | S | `CircleCheck` | |
| refunds.status | failed | Failed | D | `CircleX` | |
| refunds.status | rejected | Rejected | N | `Ban` | |
| payment_gateways.status | pending | Not verified yet | W | `Hourglass` | |
| payment_gateways.status | connected | Connected | S | `CircleCheck` | |
| payment_gateways.status | disabled | Turned off | N | `CircleSlash` | |
| payment_gateways.status | reconnect_required | Reconnect needed | D | `CircleAlert` | Banner gateway_reconnect. |
| payment_gateways.mode | test | Test mode | W | `FlaskConical` | Shown as a Badge (tag warning), not a pill. |
| payment_gateways.mode | live | (no badge) | N | none | |

### People, operations and compliance

| source | value | label | tone | icon | note |
| --- | --- | --- | --- | --- | --- |
| orgs.status | active | (no pill) | N | none | |
| orgs.status | suspended | Suspended | W | `CirclePause` | Banner org_suspended. |
| orgs.status | closed | Closed | N | `Archive` | |
| orgs.plan | trial | Trial | I | `Clock` | Badge in OrgSwitcher; detail "12 days left". |
| publishers.active | true | Active | S | `CircleCheck` | S41. |
| publishers.active | false | Paused | W | `CirclePause` | |
| publishers (derived) | active and today's leads >= daily_cap | Daily cap reached | W | `OctagonAlert` | Detail: "New leads are rejected until midnight IST". |
| forms.active | true | Accepting enquiries | S | `CircleCheck` | S31. |
| forms.active | false | Not accepting enquiries | N | `CircleSlash` | |
| notices.published_at | null | Draft | N | `PencilLine` | Privacy notices, per language. |
| notices (derived) | the latest published version for its language | Published | S | `CircleCheck` | Frozen: changes publish a new version. |
| notices (derived) | an older published version | Older version | N | `Archive` | Consents keep pointing at the version they saw. |
| members.status | invited | Invited | I | `Mail` | |
| members.status | active | Active | S | `CircleCheck` | |
| members.status | inactive | Inactive | N | `CircleSlash` | |
| api_keys.revoked_at (derived) | null | Active | S | `KeyRound` | |
| api_keys.revoked_at (derived) | set | Revoked | N | `Ban` | |
| automations (derived from active and versions) | never published | Draft | N | `PencilLine` | |
| automations.active | true | On | S | `Play` | |
| automations.active | false, published before | Paused | W | `CirclePause` | |
| automations (derived from validation) | draft graph invalid | Needs fixing | D | `CircleAlert` | Example: a trigger on a field that is empty at creation. |
| automation_runs.status | running | Running | I | `LoaderCircle` | |
| automation_runs.status | waiting | Waiting | N | `Hourglass` | Detail: "Until 06 Oct, 4:00 pm IST". |
| automation_runs.status | done | Finished | S | `CircleCheck` | |
| automation_runs.status | failed | Failed | D | `CircleX` | |
| automation_runs.status | cancelled | Cancelled | N | `CircleSlash` | |
| automation_steps.status | done | Done | S | `CircleCheck` | Per-step counts on S18. |
| automation_steps.status | skipped | Skipped | N | `CircleMinus` | |
| automation_steps.status | failed | Failed | D | `CircleX` | |
| jobs.status | queued | Queued | N | `Clock` | |
| jobs.status | running | Running | I | `LoaderCircle` | |
| jobs (derived) | running, no heartbeat for 2 min | Not responding | W | `Hourglass` | |
| jobs.status | done | Done | S | `CircleCheck` | |
| jobs (derived) | done and totals.failed > 0 | Done with errors | W | `TriangleAlert` | |
| jobs.status | failed | Failed | D | `CircleX` | |
| jobs.status | cancelled | Stopped | N | `CircleSlash` | |
| tickets.status | open | Open | I | `CircleDot` | |
| tickets.status | in_progress | In progress | I | `LoaderCircle` | |
| tickets.status | closed | Closed | S | `CircleCheck` | |
| tickets.feedback | positive / negative | Helpful / Not helpful | N | `ThumbsUp` / `ThumbsDown` | A Badge, not a pill. |
| data_requests.status | open | New | I | `Inbox` | |
| data_requests.status | in_progress | In progress | I | `LoaderCircle` | |
| data_requests.status | done | Completed | S | `CircleCheck` | |
| data_requests.status | rejected | Declined | N | `Ban` | Detail: the reason given to the requester. |
| data_requests (derived) | open or in_progress and due_at passed | Overdue | D | `AlarmClock` | Banner requests_overdue. |
| incidents.status | open | Open | D | `Siren` | |
| incidents.status | contained | Contained | W | `ShieldAlert` | |
| incidents.status | closed | Closed | S | `ShieldCheck` | |
| incidents (derived) | cert_in_reported_at null and 6 h since detected_at | CERT-In report overdue | D | `AlarmClock` | Also: Board report overdue at 72 h after aware_at. |
| webhook_deliveries.status | pending | Pending | N | `Clock` | |
| webhook_deliveries.status | delivered | Delivered | S | `CircleCheck` | |
| webhook_deliveries.status | failed | Failed, will retry | W | `RefreshCw` | Retries back off over 24 h. |
| webhook_deliveries.status | dead | Stopped retrying | D | `CircleX` | |
| notifications (derived) | read_at null | Unread | I | `Dot` | Shown as a dot and bold title, not a pill. |
| notifications.acted_at | set | Done | S | `CircleCheck` | |
| notifications (derived) | acted_at null after the response window | Missed | W | `CircleAlert` | Window: 30 minutes by default (open question 15). |

### Settings, import and incident states

Derived states that group 3's settings editors, ColumnMapper and IncidentRegister show. None is stored as a status.

| source | value | label | tone | icon | note |
| --- | --- | --- | --- | --- | --- |
| stages.enabled, sub_stages.enabled, picklist_values.active | false | Off | N | `CircleSlash` | Settings lists (ReorderableList, TreeEditor). On a lead, a turned-off stage shows as its name plus "(turned off)" in text-muted (StageBadge), not as a pill. |
| roles.is_system | true | Built in | N | `Lock` | PermissionMatrix role header. The four roles seeded for every institution. |
| notices (derived, per language) | the draft's text is empty for a language the forms offer | Missing | W | `CircleAlert` | NoticeEditor tabs. Publishing is blocked until every offered language has its text. |
| column mapping (derived, not stored) | matched by header name | Matched | S | `CircleCheck` | ColumnMapper (S07, S26). |
| column mapping (derived) | matched by the person | Matched by you | N | `UserRoundPen` | |
| column mapping (derived) | "Don't import" chosen | Not imported | N | `CircleSlash` | |
| column mapping (derived) | sample values don't fit the field, or picklist values are not on the list | Check this | W | `TriangleAlert` | A warning: the import can still run. |
| column mapping (derived) | two columns on one field | Problem | D | `CircleX` | The import can't start until it is fixed. |
| incidents (derived, per report deadline) | not sent, due time ahead | the time left ("4 hr 10 min left") | W | `Clock` | CERT-In: 6 h after detected_at. Board detailed report: 72 h after aware_at. Static text, refreshed each minute, never announced. |
| incidents (derived, per report deadline) | report time recorded | Sent {time} ("Sent 07 Oct, 1:40 pm IST") | S | `CircleCheck` | cert_in_reported_at or board_detailed_report_at. |
| incidents (derived, per report deadline) | not sent, due time passed | Overdue | D | `AlarmClock` | Banner incident_deadline for admins. |

Not statuses, so not in these tables. Categories show as Badge tags with our labels:
- `templates.nature` and `calls.purpose`: "Promotional", "Transactional", "Service".
- `templates.dlt_category`: "Promotional", "Service (implicit)", "Service (explicit)", "Transactional";
  `sms_headers.category` adds "Government".
- `templates.wa_category`: "Marketing", "Utility", "Authentication" (Meta's categories).
- `data_requests.kind`: "Access", "Correction", "Erasure", "Consent withdrawal", "Grievance";
  `data_requests.requested_by`: "Student", "Guardian", "Nominee".
- `field_defs.sensitivity`: "Personal data", "Health data" (none shows nothing).

Shown as plain text, not pills: `channel` and `direction` fields, `calls.via`, and the enums in the next table.

### Labels for other enums

These print as plain text (timeline lines, attribution tables, form options, details), never as raw keys.

| source | value | label |
| --- | --- | --- |
| suppressions.reason | hard_bounce | Email bounced |
| suppressions.reason | complaint | Marked as spam |
| suppressions.reason | unsubscribe | Unsubscribed |
| suppressions.reason | stop_keyword | Replied STOP |
| suppressions.reason | manual | Blocked by staff |
| suppressions.reason | erasure | Data erased |
| source_touches.channel | direct | Direct |
| source_touches.channel | publisher | Publisher |
| source_touches.channel | social | Social |
| source_touches.channel | organic | Search (organic) |
| source_touches.channel | referral | Referral |
| source_touches.channel | other | Other |
| source_touches.channel | telephony | Phone call |
| source_touches.channel | offline | Offline |
| source_touches.channel | paid_ads | Paid ads |
| source_touches.channel | chat | Chat |
| source_touches.origin | offline, online, api, telephony, form, chat | Offline, Online, API, Phone call, Enquiry form, Chat |
| source_touches.position | first, second, third, latest | First, Second, Third, Latest |
| lead_assignments.action | assigned | Assigned |
| lead_assignments.action | added | Added as owner |
| lead_assignments.action | replaced | Replaced owners |
| lead_assignments.action | unassigned | Unassigned |
| lead_assignments.method | manual, automation, import, api | by hand, by automation, by import, by API |
| lead_assignments.method | telephony, round_robin, bulk | from a call, by round robin, in bulk |
| payments.offline_mode | cash, cheque, dd, neft, other | Cash, Cheque, Demand draft, NEFT or bank transfer, Other |
| data_requests.channel | portal, email, phone, in_person | Privacy page, Email, Phone, In person |
| consents.purpose | marketing | Updates and offers |
| consents.purpose | service | Service messages |
| consents.purpose | data_processing | Answering the enquiry |
| consents.given_by | self, guardian | Student, Guardian |
| field_defs.type | text, paragraph, number, email, mobile | Short text, Paragraph, Number, Email, Mobile number |
| field_defs.type | date, dropdown, multiselect, upload | Date, Dropdown, Multiple choice, File upload |
| field_defs.quick_add | show, hide, mandatory | Shown, Hidden, Required |
| stage_rules.effect | lock | Lock the stage |
| stage_rules.effect | only_users | Only these people can move leads here |
| stage_rules.effect | no_move_down | Moves forward only |
| stage_rules.effect | lock_follow_up | Lock the follow-up date |
| stage_rules.effect | no_remarks | No remarks |
| stage_rules.effect | remark_required | Remark required |
| stage_rules.effect | no_messages | No messages |
| lead_ad_connections.provider | google_ads, meta_lead_ads | Google Ads lead forms, Meta lead ads |
| follow_up_reminders.channel | in_app, email, push | In the app, Email, Phone notification |
| orgs.plan | starter, growth, enterprise | Starter, Growth, Enterprise (trial is a Badge, above) |

---

## Missing pairs

None. Every colour pair named under `a11y` in this file is in the `pairs` list of `tokens.json` and
`tokens.dark.json` (112 pairs each, identical lists). Both files pass `contrast.py` with 0 failures
(`contrast-report.txt`). The gaps the group drafts once listed are closed: the `danger-hover` role exists, and the
list holds `on-danger` on `danger-hover`, `text`, `text-muted` and `focus-ring` on `chart-surface`, and the
tone-on-`surface-hover` pairs.

Five rules in the blocks keep it at none. A builder who breaks one of them needs a new pair first, checked in both
themes:

1. Tone text never sits on a selected row (`accent-subtle`): no tone has an `accent-subtle` pair, so rows that can
   be selected use the filled StatusPill, whose text sits on its own tone fill. On a hovered row or tab
   (`surface-hover`), `danger`, `success`, `warning` and `info` may sit as text or icons; they have pairs (an
   overdue due time, the Tabs attention icon, the NotificationFeed done icon).
2. Deltas are coloured only on `surface`, `surface-raised` and `bg`; in tables they are `text-fg`.
3. The presence dot gets a `ring-surface` ring, so its neighbour is always `surface`.
4. Dialog and drawer footers use the panel fill (`surface-raised`), not `surface-subtle`.
5. Error text never sits in the table footer (`surface-subtle` has no danger pair); page-load errors show above the
   table as an Alert.

---

## Open questions

One numbered list for the whole file. Questions that two groups asked are merged. References elsewhere in this file
("open question 6") use these numbers. "architecture open question" and "decisions.md open question" point to those
files.

### Group 1 questions: foundations and forms

1. **New dependencies.** All are MIT or ISC and load only on staff screens, never on public routes. Group 1 needs
   Downshift (Combobox) and react-day-picker 9 (date pickers): `web/package.json` has radix-ui 1.7, which has no
   combobox or calendar. libphonenumber-js (MIT, chosen in decisions.md section 3) is not installed either; PhoneInput
   needs it on staff screens and the server needs it for validation. Group 3 needs `@tanstack/react-table` (DataTable
   state), `@dnd-kit/core` and `@dnd-kit/sortable` (pointer drag), `@xyflow/react` and `@dagrejs/dagre` (automation
   canvas and layout), `@tiptap/react` with its starter kit (email editor and merge-field chips), and `d3-scale` and
   `d3-shape` (charts). Can we add them?
2. **Consent for answering the enquiry.** The S01 spec uses a required "use my details to answer this enquiry" box.
   The institution may instead rely on DPDP s.7(a) (data given voluntarily for a stated purpose). The box would then
   become a notice acknowledgement, or go away. This needs counsel.
3. **Age on S01 when the form has no date-of-birth field.** Minor mode needs to know the age. Should every enquiry
   form carry a required "Are you 18 or older?" question, or a date of birth?
4. **File and import limits.** S07 imports and lead documents (S01, S08, S28) have no size limit yet, and ImportWizard
   uses 50,000 rows per file as a placeholder. Rows and file size per import still need deciding. Also, signed-URL
   uploads need JavaScript. Without it, should S01 file fields fall back to a multipart post capped below Vercel's 4.5
   MB body limit, or require JavaScript?
5. **WebOTP in the embedded S01.** If the script embed renders our form in a cross-origin iframe, SMS code autofill
   needs `allow="otp-credentials"` on that iframe (decisions.md open question 3). Confirm before relying on it.
6. **Week start.** The spec uses Sunday, the CLDR value for India. Should institutions be able to switch to Monday?
7. **Date range presets.** Should institutions define their own admission-cycle presets ("This intake") alongside the
   financial year?
8. **Times typed without am or pm.** The rule reads 1 to 7 as pm and 8 to 11 as am. Check with counsellors that this
   matches how they type follow-up times.
9. **Keyboard shortcuts preference.** The "/" search shortcut needs a setting that turns single-key shortcuts off
   (WCAG 2.1.4). decisions.md section 6 lists Theme and Reduce motion in the profile menu. Add "Keyboard shortcuts"
   there?
10. **SMS counter and merge fields.** SmsSegmentCounter needs a maximum length for each merge field and DLT variable
    slot from S19. Where does that live: on the token definition, or per template? Until it is decided, the counter
    counts unknown fields as 30 characters and marks the count as estimated.
11. **Pinned country codes.** Which countries should be pinned by default after India in PhoneInput (S30)? Suggestion:
    none, set per institution.
12. **Hint for saved secrets.** The `secrets` table has no column that the web role can read to tell two saved keys
    apart, so S35 and S36 show only "Saved · updated {date}". Should we add a non-secret `hint` column (the last 4
    characters, written at save time) so admins can check which gateway key is in use?
13. **Follow-up clash window.** DateTimePicker warns when the owner already has an open follow-up within 30 minutes of
    the chosen moment (S11, S12). Check with counsellors whether 30 minutes is right, or whether it should follow the
    event type's length.

### Group 2 questions: shell, feedback and display

14. **Reveal endpoint and permission.** MaskedValue needs a route (for example `POST /leads/:id/contacts/reveal`), a
    permission key (for example `leads.reveal_contacts`) and an audit action name (`lead.contact_reveal`). None is in
    architecture.md's API table yet.
15. **Missed notifications.** What window turns an unread alert into "Missed": one value per institution (we used 30
    minutes), or one per event type? Who sets it?
16. **Who sees the check-in toggle.** We show it only to members who can receive leads by assignment. Is that a role
    setting, membership in an assignment pool, or an institution-wide "use check-in" switch?
17. **Counts endpoint.** Sidebar counts (Inbox waiting, My day overdue) and the bell need a small counts request (for
    example `GET /me/counts`) plus Realtime ids. Not in the API table.
18. **Memberships list.** OrgSwitcher needs `GET /me/orgs` (the person's memberships). `app.memberships_for_user`
    exists in the schema; the route does not.
19. **Capped counts.** Pagination counts up to 10,001 rows and shows "10,000+" above 10,000, so count queries stay
    cheap under row level security. Confirm on a large tenant, after load tests, that the capped count stays fast with
    the scope policies and that the cap is right.
20. **Default rows per page.** We chose 25. The measured original defaults to 10. Confirm with pilot counsellors.
21. **Meta values.** Template status values were checked against Meta's `message_template_status_update` webhook
    reference (APPROVED, ARCHIVED, UNARCHIVED, DELETED, DISABLED, FLAGGED, IN_APPEAL, LIMIT_EXCEEDED, LOCKED, PAUSED,
    PENDING, REINSTATED, PENDING_DELETION, REJECTED). REINSTATED and UNARCHIVED are events, not states; the sync job
    should store the resulting state. Quality values (GREEN, YELLOW, RED, UNKNOWN for templates and phone numbers) are
    from memory of Meta's docs and need the same check before the mapping ships.
22. **DLT chain status words.** `channel_accounts.dlt_chain_status` is free text from each SMS provider. Which values
    mean "verified" for MSG91, Exotel and Kaleyra? The mapping above assumes "ok" or "verified".
23. **Screen IDs for the compliance screens.** This file uses S42 Privacy requests, S43 Incidents and S44 Retention (a
    review decision; group 3 section H). recon.md's screen list needs the three rows, and Settings > Privacy notices
    (NoticeEditor) needs an ID too.
24. **Read-out of new notifications.** The bell announces new alerts politely, at most every 10 seconds, with an
    option to turn it off. Should it be on by default? Ask screen-reader users in the pilot.
25. **Session timeout.** What is the idle limit (Supabase session length, idle limit), and does it differ for support
    staff? Unless it is 20 hours or more, the AppShell idle warning is required (2.2.1).
26. **Job notifications.** JobProgress adds a `job_finished` notification event, and the check-in flow an
    `auto_checkout` event. Add both to the documented `notifications.event` values.

### Group 3 questions: CRM data and domain

27. **Calendar.** We specify our own month, week and list views, so the keyboard model above holds. FullCalendar's
    standard plugins are MIT and would save time, but their grid keyboard and screen reader support would need testing
    against this spec. Build or adopt?
28. **Masked roles and search.** For roles that see contacts masked, email and mobile search need the full value
    (exact match), and filters offer only "is empty", "isn't empty" and "is verified" on those fields. This stops
    people finding hidden digits by trial. It also stops a counsellor finding a lead from part of a number. Confirm.
29. **Stage colours.** Stages have no colours in v1, because they are each institution's own words. If institutions
    ask for them, the safe form is a small fixed set of tones, always with the stage name in text.
30. **Branches that join again.** The canvas and the outline assume if / else branches never join again (a tree). If
    the automation engine's graph must allow joins, the layout and the outline need a "continue at step N" step.
31. **Merged emails and new enquiries.** After a merge, the duplicate keeps its own email. The unique index on
    `(org_id, email)` ignores merged leads, so a new enquiry from that email would create a fresh lead instead of
    updating the main record. The capture upsert should also look at merged records and follow `merged_into_id`. This
    is a schema and architecture change, not a design one.
32. **Name on the payment page.** S02 shows the student's first name and last initial, because payment links get
    forwarded. Some institutions may want the full name and an application number on the page. Confirm.
33. **Data request references.** `data_requests` has only a UUID. A readable reference such as "DR-2026-0042"
    (PrivacyRequestPage, DataRequestDesk) needs a per-institution counter in `org_counters`. The reply-by date
    (`due_at`) for each request kind also needs legal input.
34. **What a guardian can agree to.** The consent page offers only admission handling and service messages, because
    s.9(3) bars tracking, profiling and targeted advertising directed at children. Counsel should confirm the list
    (architecture open question 5).
35. **Sign-in settings.** The copy says a sign-in link and a reset link work for 15 minutes; the Supabase settings
    must match. The idle limit is open question 25. The password rules on set and reset ("At least {min} characters",
    and a check against common passwords) must match Supabase's password settings. Whether to offer "trust this
    device" for two-step sign-in is still open.
36. **Quick filters apply at once.** Chips apply 300 ms after the last change. On very large tenants an explicit
    "Apply" may be kinder to the database. Check after load tests.
37. **Paper frame.** Previews stay light in dark mode by rendering inside an iframe with its own `data-theme="light"`.
    The alternative is for build_tokens.py to also emit an element-level `[data-theme="light"]` scope. The iframe also
    isolates template HTML, which email needs anyway; the scope would be lighter for SMS and WhatsApp previews.
38. **Percentile wording.** The profile header shows "42 · top 12%" (NumberText's score form). Confirm that the
    percentile is within the institution, and over which period, once the nightly `score_percentiles` job is defined.
39. **Form language in the schema.** PublicEnquiryForm needs `forms.language` (BCP 47, default 'en-IN') and a lang for
    each field label, option and the success message (inside `forms.fields` and next to `success_message`). Neither is
    in schema.sql yet. decisions.md open question 4 should record the rule.
40. **Retention categories and defaults.** RetentionSettings lists four categories, each with a default of 365 days.
    The real categories and defaults depend on the legal retention periods for admission and fee records (architecture
    open question 13). `orgs.settings` holds one `retention_days` value today; it needs one per category.
41. **Refund rejection.** RefundDialog's "Reject" sets `refunds.status` to rejected. architecture.md's API table lists
    only `POST /refunds/:id/approve`; it needs a reject route, or a decision field on that one.
