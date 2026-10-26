"use client";

import { Check, FileText, Hash, ListChecks, MapPin, Pencil, Users } from "lucide-react";
import { useState } from "react";
import { Section, SIMULATED_NOTE, Specimen, StateGrid, simulatedFocus } from "@/app/design/_gallery";
import { cn } from "@/lib/cn";
import { Button } from "../../button";
import { Kbd } from "../../primitives/kbd";
import { Link } from "../../primitives/link";
import { Checkbox, checkboxBoxClassName } from "../checkbox";
import { CheckboxGroup } from "../checkbox-group";
import { Combobox } from "../combobox";
import { ComboboxOptionContent } from "../combobox-option";
import { comboboxPopoverClassName, comboboxStatusLineClassName } from "../combobox";
import { GROUP_HEADING, OPTION_ACTIVE, OPTION_ROW } from "../control-styles";
import { DateTimePicker } from "../date-time-picker";
import { Field } from "../field";
import { NativeSelect } from "../native-select";
import { DURATION_UNITS, NumberStepper } from "../number-stepper";
import { RadioGroup, radioCircleClassName } from "../radio-group";
import { Select, selectContentClassName, selectItemClassName } from "../select";
import { Switch } from "../switch";
import { TextInput } from "../text-input";
import { Textarea } from "../textarea";
import { KeyboardNote } from "./keyboard-note";
import { COUNSELLORS, GALLERY_NOW, PROGRAMMES, STAGES, remarkOfLength, searchLeads, wait } from "./sample-data";

/* -------------------------------------------------------------------------------------------------
 * TextInput
 * -----------------------------------------------------------------------------------------------*/

function InlineEditDemo() {
  const [value, setValue] = useState("Shivajinagar, Pune");
  const [editing, setEditing] = useState(false);
  return (
    <div className="w-full @container">
      <div className="flex w-full flex-col gap-2 @min-[26rem]:grid @min-[26rem]:grid-cols-[var(--layout-kv-label)_minmax(0,1fr)] @min-[26rem]:items-center @min-[26rem]:gap-x-4">
        <span id="kv-address-label" className="text-sm text-muted">
          Address
        </span>
        {editing ? (
          <TextInput
            size="sm"
            aria-labelledby="kv-address-label"
            defaultValue={value}
            autoFocus
            onSave={(next) => {
              setValue(next);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
            autoComplete="off"
          />
        ) : (
          <span className="flex items-center gap-2 text-sm text-fg">
            {value}
            <Button variant="ghost" size="xs" leadingIcon={<Pencil />} onClick={() => setEditing(true)}>
              Edit
            </Button>
          </span>
        )}
      </div>
    </div>
  );
}

export function TextInputSpecimens() {
  return (
    <Section
      id="text-input"
      title="TextInput"
      description="Single-line text: names, email addresses, URLs, codes, amounts, passwords. Always inside a Field (label, hint, error). Format is checked on blur; “required” only on submit."
    >
      <Section id="text-input-types" title="Types and options" level={3}>
        <StateGrid columns={3}>
          <Specimen label="text (a name, dir=auto)">
            <Field label="Full name" className="w-full">
              <TextInput defaultValue="अनन्या अय्यर" autoComplete="off" />
            </Field>
          </Specimen>
          <Specimen label="email (trimmed on blur, no spellcheck)">
            <Field label="Email address" hint="We'll send the fee receipt here." className="w-full">
              <TextInput type="email" defaultValue="ananya.iyer@example.com" autoComplete="off" />
            </Field>
          </Specimen>
          <Specimen label="url with prefix">
            <Field label="Website address" className="w-full">
              <TextInput type="url" prefix="https://" defaultValue="www.sahyadri.example.in" />
            </Field>
          </Specimen>
          <Specimen label="password with show/hide" note="The toggle keeps the name “Show password”">
            <Field label="Password" className="w-full">
              <TextInput type="password" defaultValue="Pune#Monsoon2026" autoComplete="current-password" />
            </Field>
          </Specimen>
          <Specimen label="prefix ₹ (amount, w-40)">
            <Field label="Amount (₹)">
              <TextInput prefix="₹" defaultValue="45,000" className="w-40" inputClassName="tabular-nums" />
            </Field>
          </Specimen>
          <Specimen label="suffix">
            <Field label="Fee due in">
              <TextInput suffix="days" defaultValue="15" className="w-40" inputMode="numeric" />
            </Field>
          </Specimen>
          <Specimen label="leading icon">
            <Field label="City" className="w-full">
              <TextInput leadingIcon={<MapPin />} defaultValue="Coimbatore" />
            </Field>
          </Specimen>
          <Specimen label="clearable" note="The clear button is the next tab stop; clearing returns focus">
            <Field label="Campus" className="w-full">
              <TextInput clearable clearLabel="Clear campus" defaultValue="Hinjawadi" />
            </Field>
          </Specimen>
          <Specimen label="fixed format (PIN code, maxlength 6, w-24)">
            <Field label="PIN code">
              <TextInput defaultValue="411057" maxLength={6} inputMode="numeric" className="w-24" />
            </Field>
          </Specimen>
          <Specimen label="inline edit (S08, sm)" note="Try it: Edit, then Enter saves and Esc cancels" className="sm:col-span-2 lg:col-span-3">
            <InlineEditDemo />
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="text-input-sizes" title="Sizes" level={3}>
        <StateGrid columns={3}>
          {(
            [
              ["sm", "sm · 32 px (filters, inline edit)"],
              ["md", "md · 40 px (staff forms, default)"],
              ["lg", "lg · 48 px (public pages, 16 px text)"],
            ] as const
          ).map(([size, label]) => (
            <Specimen key={size} label={label}>
              <Field label="Guardian's name" surface={size === "lg" ? "public" : "staff"} required className="w-full">
                <TextInput size={size} defaultValue="Ramesh Kulkarni" autoComplete="off" />
              </Field>
            </Specimen>
          ))}
        </StateGrid>
      </Section>

      <Section id="text-input-states" title="States" level={3}>
        <StateGrid columns={3}>
          <Specimen label="empty (placeholder is a format example)">
            <Field label="Email address" className="w-full">
              <TextInput type="email" placeholder="name@example.com" />
            </Field>
          </Specimen>
          <Specimen label="hover" note={SIMULATED_NOTE}>
            <Field label="Email address" className="w-full">
              <TextInput type="email" placeholder="name@example.com" className="border-muted" />
            </Field>
          </Specimen>
          <Specimen label="focus-visible" note={SIMULATED_NOTE}>
            <Field label="Email address" className="w-full">
              <TextInput type="email" defaultValue="rohan.deshmukh@" className={simulatedFocus} />
            </Field>
          </Specimen>
          <Specimen label="filled">
            <Field label="Email address" className="w-full">
              <TextInput type="email" defaultValue="rohan.deshmukh@example.com" />
            </Field>
          </Specimen>
          <Specimen label="invalid">
            <Field label="Email address" error="Enter an email address like name@example.com." className="w-full">
              <TextInput type="email" defaultValue="rohan.deshmukh@gmail" />
            </Field>
          </Specimen>
          <Specimen label="disabled">
            <Field label="Lead number" disabled className="w-full">
              <TextInput defaultValue="#10482" />
            </Field>
          </Specimen>
          <Specimen label="read-only">
            <Field label="API ID" readOnly className="w-full">
              <TextInput defaultValue="3f9a1c7e-5b2d-4086" />
            </Field>
          </Specimen>
          <Specimen label="checking (async)">
            <Field label="Email address" hint="Checking…" className="w-full">
              <TextInput type="email" status="checking" defaultValue="arjun.mehta@example.com" />
            </Field>
          </Specimen>
          <Specimen label="confirmed (verified email)">
            <Field label="Email address" hint="Verified" hintTone="success" className="w-full">
              <TextInput type="email" status="confirmed" defaultValue="priya.nair@example.com" />
            </Field>
          </Specimen>
          <Specimen label="autofilled" note="autofill: utilities keep our colours in both themes; autofill a field to see it">
            <Field label="Email address" className="w-full">
              <TextInput type="email" autoComplete="email" defaultValue="meera.pillai@example.com" />
            </Field>
          </Specimen>
          <Specimen label="duplicate, lead they can see (S07)" stack>
            <Field label="Email address" className="w-full">
              <TextInput type="email" defaultValue="arjun.mehta@example.com" autoComplete="off" />
            </Field>
            <p className="m-0 text-sm text-fg">
              This email already belongs to lead #10482, Arjun Mehta. <Link href="/design/forms#text-input">Open lead</Link>
            </p>
          </Specimen>
          <Specimen label="duplicate, outside their scope" stack>
            <Field label="Email address" className="w-full">
              <TextInput type="email" defaultValue="tara.menon@example.com" autoComplete="off" />
            </Field>
            <p className="m-0 text-sm text-fg">
              This email is already on a lead you can&apos;t see. Saving adds this enquiry to that lead; ask your manager if you need to work on it.
            </p>
          </Specimen>
        </StateGrid>
      </Section>
      <KeyboardNote
        items={[
          { keys: ["Enter"], action: "Submits the form (through its submit button). Inline edit: saves." },
          { keys: ["Esc"], action: "Inside a dialog, closes the dialog; it does not clear the field. Inline edit: cancels." },
          { keys: ["Tab"], action: "The clear and show-password buttons are the next tab stops after the input." },
        ]}
      />
    </Section>
  );
}

/* -------------------------------------------------------------------------------------------------
 * Textarea
 * -----------------------------------------------------------------------------------------------*/

const SMS_SHORT = "Hi Diya, thank you for your enquiry about B.Tech Computer Science. Our counsellor will call you today. Reply STOP to opt out. -Sahyadri";
const SMS_TWO = `${SMS_SHORT} Campus visits run Mon to Sat, 10 am to 4 pm.`;
const SMS_HINDI = "नमस्ते दिया, आपकी पूछताछ के लिए धन्यवाद। हमारे परामर्शदाता आज आपको कॉल करेंगे।";

export function TextareaSpecimens() {
  return (
    <Section
      id="textarea"
      title="Textarea"
      description="Multi-line text: remarks, notes, replies, SMS bodies. Grows from 3 rows to 10, then scrolls. Over the limit the text is never cut."
    >
      <Section id="textarea-variants" title="Variants" level={3}>
        <StateGrid columns={2}>
          <Specimen label="plain, auto-grow (default)">
            <Field label="Note" className="w-full">
              <Textarea defaultValue={"Parents prefer the Kothrud campus.\nAsked about bus routes from Baner."} />
            </Field>
          </Specimen>
          <Specimen label="with a character limit">
            <Field label="Remark" hint="Up to 500 characters." className="w-full">
              <Textarea limit={500} defaultValue={remarkOfLength(320)} />
            </Field>
          </Specimen>
          <Specimen label="sms, GSM-7, 1 part">
            <Field label="SMS text" className="w-full">
              <Textarea sms defaultValue={SMS_SHORT} />
            </Field>
          </Specimen>
          <Specimen label="sms, 2 parts">
            <Field label="SMS text" className="w-full">
              <Textarea sms defaultValue={SMS_TWO} />
            </Field>
          </Specimen>
          <Specimen label="sms, Unicode (Hindi)">
            <Field label="SMS text" className="w-full">
              <Textarea sms defaultValue={SMS_HINDI} lang="hi" />
            </Field>
          </Specimen>
          <Specimen label="sms, above 3 parts, with a merge field (about)">
            <Field label="SMS text" className="w-full">
              <Textarea sms tokenLengths={{ first_name: 20 }} defaultValue={`Hi {{first_name}}, ${remarkOfLength(470)}`} />
            </Field>
          </Specimen>
          <Specimen label="fixed rows (resize-y)">
            <Field label="Success message" className="w-full">
              <Textarea autoGrow={false} rows={4} defaultValue="Thank you. Our admissions team will call you within one working day." />
            </Field>
          </Specimen>
          <Specimen label="staff dialog: Ctrl + Enter submits" stack>
            <form
              className="flex w-full flex-col gap-2"
              onSubmit={(event) => {
                event.preventDefault();
              }}
            >
              <Field label="Reply" className="w-full">
                <Textarea submitOnModEnter defaultValue="We have shared the hostel fee structure on WhatsApp." />
              </Field>
              <p className="m-0 flex items-center gap-1 text-xs text-muted">
                <Kbd keys={["Ctrl", "Enter"]} /> to save
              </p>
            </form>
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="textarea-sizes" title="Sizes" level={3}>
        <StateGrid columns={2}>
          <Specimen label="staff (14/22, 3 rows = 84 px)">
            <Field label="Remark" className="w-full">
              <Textarea />
            </Field>
          </Specimen>
          <Specimen label="public (16/26, 3 rows = 104 px)" surface="bg">
            <Field label="Anything else you'd like to tell us?" surface="public" className="w-full">
              <Textarea surface="public" />
            </Field>
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="textarea-states" title="States" level={3}>
        <StateGrid columns={3}>
          <Specimen label="empty">
            <Field label="Remark" hint="Up to 500 characters." className="w-full">
              <Textarea limit={500} />
            </Field>
          </Specimen>
          <Specimen label="typing (counter shows what is left)">
            <Field label="Remark" hint="Up to 500 characters." className="w-full">
              <Textarea limit={500} defaultValue={remarkOfLength(320)} />
            </Field>
          </Specimen>
          <Specimen label="near the limit (10% or less left)">
            <Field label="Remark" hint="Up to 500 characters." className="w-full">
              <Textarea limit={500} defaultValue={remarkOfLength(482)} />
            </Field>
          </Specimen>
          <Specimen label="over the limit (border and aria-invalid at once)">
            <Field label="Remark" hint="Up to 500 characters." className="w-full">
              <Textarea limit={500} defaultValue={remarkOfLength(512)} />
            </Field>
          </Specimen>
          <Specimen label="invalid (after submit)">
            <Field label="Remark" hint="Up to 500 characters." error="Shorten this to 500 characters or fewer." className="w-full">
              <Textarea limit={500} defaultValue={remarkOfLength(512)} />
            </Field>
          </Specimen>
          <Specimen label="disabled">
            <Field label="Remark" disabled className="w-full">
              <Textarea defaultValue="Locked while the import runs." />
            </Field>
          </Specimen>
          <Specimen label="read-only">
            <Field label="Remark" readOnly className="w-full">
              <Textarea defaultValue="Visited the campus on 28 Sept with her brother." />
            </Field>
          </Specimen>
        </StateGrid>
      </Section>
      <KeyboardNote
        items={[
          { keys: ["Enter"], action: "Adds a new line." },
          { keys: ["Tab"], action: "Leaves the field; it is never captured." },
          { keys: ["Ctrl + Enter", "Cmd + Enter"], action: "In staff dialogs (S09, S15, S40), submits the form." },
        ]}
      />
    </Section>
  );
}

/* -------------------------------------------------------------------------------------------------
 * Select
 * -----------------------------------------------------------------------------------------------*/

function SelectListPicture({
  label,
  highlighted,
  chosen,
  withDisabled = false,
}: {
  label: string;
  highlighted?: string;
  chosen?: string;
  withDisabled?: boolean;
}) {
  const options = [
    ...STAGES.slice(0, 4),
    ...(withDisabled ? [{ value: "waitlist", label: "Waitlisted", dotClassName: "bg-chart-7", description: "Turned off in Settings", disabled: true }] : []),
  ];
  return (
    <div role="listbox" aria-label={label} className={cn(selectContentClassName, "w-full max-w-64 p-1")}>
      {options.map((option) => {
        const isChosen = option.value === chosen;
        const isDisabled = "disabled" in option && option.disabled;
        return (
          <div
            key={option.value}
            role="option"
            aria-selected={isChosen}
            aria-disabled={isDisabled || undefined}
            data-highlighted={option.value === highlighted ? "" : undefined}
            data-state={isChosen ? "checked" : "unchecked"}
            data-disabled={isDisabled ? "" : undefined}
            className={cn(selectItemClassName, "description" in option && "min-h-12 py-1.5", option.value === highlighted && simulatedFocus, option.value === highlighted && "outline-offset-(--focus-inset)")}
          >
            <span className="flex min-w-0 flex-col">
              <span className="flex items-center gap-2">
                <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-pill", option.dotClassName)} />
                {option.label}
              </span>
              {"description" in option ? <span className="text-xs font-normal text-muted">{option.description}</span> : null}
            </span>
            {isChosen ? <Check aria-hidden="true" className="absolute right-2 size-icon-sm text-accent" /> : null}
          </div>
        );
      })}
    </div>
  );
}

export function SelectSpecimens() {
  const stageOptions = STAGES.map(({ value, label, dotClassName }) => ({ value, label, dotClassName }));
  return (
    <Section
      id="select"
      title="Select"
      description="One value from a short fixed list (up to about 15) where search is not needed. Radix Select on staff screens; a native select on public pages. Longer or searchable lists use Combobox."
    >
      <Section id="select-variants" title="Variants" level={3}>
        <StateGrid columns={3}>
          <Specimen label="staff (Radix, popper below the trigger)">
            <Field label="Stage" className="w-full">
              <Select options={stageOptions} defaultValue="interested" />
            </Field>
          </Specimen>
          <Specimen label="public (native select)" surface="bg">
            <Field label="Course" surface="public" className="w-full">
              <NativeSelect
                placeholder="Choose a course"
                options={[
                  { label: "Engineering", options: PROGRAMMES.filter((p) => p.group === "Engineering").map((p) => ({ value: p.value, label: p.label })) },
                  { label: "Management", options: PROGRAMMES.filter((p) => p.group === "Management").map((p) => ({ value: p.value, label: p.label })) },
                ]}
              />
            </Field>
          </Specimen>
          <Specimen label="inline (rows per page, sm, aria-label)">
            <span className="flex items-center gap-2 text-sm text-muted">
              <span aria-hidden="true">Rows per page</span>
              <span className="w-20">
                <Select
                  size="sm"
                  aria-label="Rows per page"
                  defaultValue="25"
                  options={["10", "25", "50", "100"].map((value) => ({ value, label: value }))}
                />
              </span>
            </span>
          </Specimen>
          <Specimen label="with a leading colour dot (decorative)">
            <Field label="Stage" className="w-full">
              <Select options={stageOptions} defaultValue="campus-visit" />
            </Field>
          </Specimen>
          <Specimen label="groups with headings, two-line options">
            <Field label="Event type" className="w-full">
              <Select
                placeholder="Choose an event type"
                options={[
                  {
                    label: "Calls",
                    options: [
                      { value: "call-back", label: "Call back" },
                      { value: "counselling-call", label: "Counselling call", description: "30 minutes, with the parent" },
                    ],
                  },
                  {
                    label: "Visits",
                    options: [
                      { value: "campus-visit", label: "Campus visit" },
                      { value: "home-visit", label: "Home visit", description: "Turned off in Settings", disabled: true },
                    ],
                  },
                ]}
              />
            </Field>
          </Specimen>
          <Specimen label="optional, with “None” (value __none → null)">
            <Field label="Sub-stage" className="w-full">
              <Select
                none
                placeholder="Choose a sub-stage"
                options={[
                  { value: "fee-discussed", label: "Fee discussed" },
                  { value: "documents-pending", label: "Documents pending" },
                ]}
              />
            </Field>
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="select-sizes" title="Sizes" level={3}>
        <StateGrid columns={3}>
          {(["sm", "md", "lg"] as const).map((size) => (
            <Specimen key={size} label={`${size} · ${size === "sm" ? 32 : size === "md" ? 40 : 48} px`}>
              <Field label="Stage" className="w-full">
                <Select size={size} options={stageOptions} defaultValue="contacted" />
              </Field>
            </Specimen>
          ))}
        </StateGrid>
      </Section>

      <Section id="select-states" title="States" level={3}>
        <StateGrid columns={3}>
          <Specimen label="closed and empty (placeholder)">
            <Field label="Stage" className="w-full">
              <Select options={stageOptions} placeholder="Choose a stage" />
            </Field>
          </Specimen>
          <Specimen label="closed and filled">
            <Field label="Stage" className="w-full">
              <Select options={stageOptions} defaultValue="applied" />
            </Field>
          </Specimen>
          <Specimen label="hover" note={SIMULATED_NOTE}>
            <Field label="Stage" className="w-full">
              <Select options={stageOptions} placeholder="Choose a stage" className="border-muted" />
            </Field>
          </Specimen>
          <Specimen label="focus-visible" note={SIMULATED_NOTE}>
            <Field label="Stage" className="w-full">
              <Select options={stageOptions} defaultValue="new" className={simulatedFocus} />
            </Field>
          </Specimen>
          <Specimen label="open, option highlighted" note="Still picture of the list (focus-inset ring)">
            <SelectListPicture label="Stage, open" highlighted="contacted" chosen="new" />
          </Specimen>
          <Specimen label="option chosen (Check, font-medium) and option disabled" note="The reason is its second line">
            <SelectListPicture label="Stage, chosen option" chosen="interested" withDisabled />
          </Specimen>
          <Specimen label="invalid">
            <Field label="Stage" error="Choose a stage." required className="w-full">
              <Select options={stageOptions} placeholder="Choose a stage" />
            </Field>
          </Specimen>
          <Specimen label="disabled">
            <Field label="Stage" disabled className="w-full">
              <Select options={stageOptions} defaultValue="enrolled" />
            </Field>
          </Specimen>
          <Specimen label="read-only (text)">
            <Field label="Stage" readOnly className="w-full">
              <Select options={stageOptions} defaultValue="enrolled" />
            </Field>
          </Specimen>
          <Specimen label="loading options">
            <Field label="Sub-stage" className="w-full">
              <Select options={[]} loading />
            </Field>
          </Specimen>
          <Specimen label="no options" note="Open it: the list shows a sentence, not an option">
            <Field label="Sub-stage" className="w-full">
              <Select options={[]} placeholder="Choose a sub-stage" emptyText="This stage has no sub-stages." />
            </Field>
          </Specimen>
        </StateGrid>
      </Section>
      <KeyboardNote
        items={[
          { keys: ["Enter", "Space", "ArrowDown", "ArrowUp"], action: "Closed: opens the list. Typed letters jump to a match." },
          { keys: ["ArrowDown", "ArrowUp"], action: "Open: moves the highlight." },
          { keys: ["Home", "End"], action: "Open: first and last option." },
          { keys: ["Enter", "Space"], action: "Open: chooses and closes." },
          { keys: ["Esc"], action: "Closes without a change; focus returns to the trigger. Tab is blocked while open." },
        ]}
      />
    </Section>
  );
}

/* -------------------------------------------------------------------------------------------------
 * Combobox
 * -----------------------------------------------------------------------------------------------*/

function ComboboxListPicture({
  label,
  multiple,
  query = "",
  chosen = [],
  active,
  status,
  strongStatus = false,
  options = COUNSELLORS.slice(0, 5),
  blockedAll = false,
  error = false,
}: {
  label: string;
  multiple: boolean;
  query?: string;
  chosen?: string[];
  active?: string;
  status?: string;
  strongStatus?: boolean;
  options?: typeof COUNSELLORS;
  blockedAll?: boolean;
  error?: boolean;
}) {
  return (
    <div className={cn(comboboxPopoverClassName, "w-full max-w-80")}>
      {status ? (
        <div aria-hidden="true" className={cn(comboboxStatusLineClassName, strongStatus && "font-medium text-fg")}>
          {status}
        </div>
      ) : null}
      {error ? (
        <div className="flex flex-wrap items-center gap-x-2 border-b border-border px-2 py-1.5 text-xs text-fg">
          <span>Couldn&apos;t load the list.</span>
          <Button variant="link">Retry</Button>
        </div>
      ) : null}
      {options.length > 0 ? (
        <div role="listbox" aria-label={label} aria-multiselectable={multiple || undefined} className="p-1">
          {options.map((option) => {
            const isChosen = chosen.includes(option.value);
            const blocked = Boolean(option.disabled) || (blockedAll && !isChosen);
            return (
              <div
                key={option.value}
                role="option"
                aria-selected={option.value === active}
                aria-checked={multiple ? isChosen : undefined}
                aria-disabled={blocked || undefined}
                className={cn(OPTION_ROW, option.description && "min-h-12 py-1.5", option.value === active && OPTION_ACTIVE, blocked && "cursor-not-allowed text-muted")}
              >
                <ComboboxOptionContent option={option} query={query} multiple={multiple} chosen={isChosen} />
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function GroupedListPicture() {
  return (
    <div className={cn(comboboxPopoverClassName, "w-full max-w-80")}>
      <div role="listbox" aria-label="Programmes, grouped" aria-multiselectable="true" className="p-1">
        {["Engineering", "Management"].map((group) => (
          <div key={group} role="group" aria-labelledby={`picture-group-${group}`}>
            <div id={`picture-group-${group}`} role="presentation" className={GROUP_HEADING}>
              {group}
            </div>
            {PROGRAMMES.filter((p) => p.group === group)
              .slice(0, 2)
              .map((option) => (
                <div key={option.value} role="option" aria-selected={false} aria-checked={option.value === "mba"} className={OPTION_ROW}>
                  <ComboboxOptionContent option={option} multiple chosen={option.value === "mba"} />
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ComboboxSpecimens() {
  return (
    <Section
      id="combobox"
      title="Combobox"
      description="One or many values from a long or searchable list. Focus stays in the input (aria-activedescendant); typing filters with a case- and accent-insensitive contains match, the matched part in semibold. One sr-only status region carries every announcement."
    >
      <Section id="combobox-variants" title="Variants" level={3} description="Every specimen here is live: type, use the arrows, Enter, Esc, Backspace.">
        <StateGrid columns={2}>
          <Specimen label="single">
            <Field label="Owner" className="w-full">
              <Combobox options={COUNSELLORS} defaultValue="meera-pillai" placeholder="Search counsellors" noun={{ one: "counsellor", other: "counsellors" }} />
            </Field>
          </Specimen>
          <Specimen label="multi (chips plus the input)">
            <Field label="Target counsellors" className="w-full">
              <Combobox
                multiple
                options={COUNSELLORS}
                defaultValue={["anjali-rao", "neha-joshi", "lakshmi-s"]}
                placeholder="Search counsellors"
                noun={{ one: "counsellor", other: "counsellors" }}
              />
            </Field>
          </Specimen>
          <Specimen label="multi with max (5)">
            <Field label="Counsellors on the rota" hint="Choose up to 5." className="w-full">
              <Combobox
                multiple
                max={5}
                options={COUNSELLORS}
                defaultValue={["anjali-rao", "ravi-kumar", "priya-nair"]}
                placeholder="Search counsellors"
                noun={{ one: "counsellor", other: "counsellors" }}
              />
            </Field>
          </Specimen>
          <Specimen label="async (server search, 250 ms debounce, from 2 characters)">
            <Field label="Merge into lead" hint="Search 150 sample leads by name, or #number." className="w-full">
              <Combobox loadOptions={searchLeads} minQueryLength={2} placeholder="Search leads" noun={{ one: "lead", other: "leads" }} />
            </Field>
          </Specimen>
          <Specimen label="grouped options">
            <Field label="Programmes" className="w-full">
              <Combobox multiple options={PROGRAMMES} placeholder="Search programmes" noun={{ one: "programme", other: "programmes" }} />
            </Field>
          </Specimen>
          <Specimen label="dense filter (sm): first chip and a “+3” summary">
            <Field label="Owner" layout="hidden-label" className="w-72 max-w-full">
              <Combobox
                multiple
                dense
                size="sm"
                options={COUNSELLORS}
                defaultValue={["arjun-mehta", "priya-nair", "harpreet-kaur", "farhan-qureshi"]}
                placeholder="Owner"
                noun={{ one: "owner", other: "owners" }}
              />
            </Field>
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="combobox-sizes" title="Sizes" level={3}>
        <StateGrid columns={2}>
          <Specimen label="sm · 32 px (filter bars)">
            <Field label="Owner" className="w-full">
              <Combobox size="sm" options={COUNSELLORS} defaultValue="ravi-kumar" noun={{ one: "counsellor", other: "counsellors" }} />
            </Field>
          </Specimen>
          <Specimen label="md · 40 px (forms)">
            <Field label="Owner" className="w-full">
              <Combobox options={COUNSELLORS} defaultValue="ravi-kumar" noun={{ one: "counsellor", other: "counsellors" }} />
            </Field>
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="combobox-states" title="States" level={3} description="Open-list states are still pictures of the list, drawn with the component's own classes.">
        <StateGrid columns={3}>
          <Specimen label="empty">
            <Field label="Owner" className="w-full">
              <Combobox options={COUNSELLORS} placeholder="Search counsellors" noun={{ one: "counsellor", other: "counsellors" }} />
            </Field>
          </Specimen>
          <Specimen label="typing (filtering, match in semibold)">
            <ComboboxListPicture
              label="Counsellors matching anj"
              multiple={false}
              query="anj"
              options={COUNSELLORS.filter((c) => c.label.toLowerCase().includes("anj"))}
              active="anjali-rao"
            />
          </Specimen>
          <Specimen label="open, option highlighted">
            <ComboboxListPicture label="Counsellors, open" multiple={false} active="ravi-kumar" chosen={["meera-pillai"]} />
          </Specimen>
          <Specimen label="option chosen (multi: box and Check)">
            <ComboboxListPicture label="Counsellors, multi" multiple chosen={["anjali-rao", "meera-pillai"]} active="arjun-mehta" status="2 of 5 chosen" />
          </Specimen>
          <Specimen label="option disabled">
            <ComboboxListPicture label="Counsellors, one disabled" multiple={false} options={COUNSELLORS.slice(9, 12)} active="farhan-qureshi" />
          </Specimen>
          <Specimen label="limit reached">
            <ComboboxListPicture
              label="Counsellors at the limit"
              multiple
              chosen={["anjali-rao", "ravi-kumar", "meera-pillai", "arjun-mehta", "priya-nair"]}
              options={[...COUNSELLORS.slice(3, 5), ...COUNSELLORS.slice(5, 7)]}
              status="5 of 5 chosen. Remove one to add another."
              strongStatus
              blockedAll
            />
          </Specimen>
          <Specimen label="no matches">
            <ComboboxListPicture label="No matches" multiple={false} options={[]} status="No counsellor matches “xyz”." />
          </Specimen>
          <Specimen label="loading (async)">
            <ComboboxListPicture label="Searching" multiple={false} options={[]} status="Searching…" />
          </Specimen>
          <Specimen label="load error (Retry)">
            <ComboboxListPicture label="Load error" multiple={false} options={[]} error />
          </Specimen>
          <Specimen label="invalid">
            <Field label="Owner" error="Choose an owner." required className="w-full">
              <Combobox options={COUNSELLORS} placeholder="Search counsellors" noun={{ one: "counsellor", other: "counsellors" }} />
            </Field>
          </Specimen>
          <Specimen label="disabled">
            <Field label="Owner" disabled className="w-full">
              <Combobox multiple options={COUNSELLORS} defaultValue={["ravi-kumar"]} noun={{ one: "counsellor", other: "counsellors" }} />
            </Field>
          </Specimen>
          <Specimen label="read-only (chips, no remove buttons)">
            <Field label="Owners" readOnly className="w-full">
              <Combobox multiple options={COUNSELLORS} defaultValue={["ravi-kumar", "zoya-siddiqui"]} noun={{ one: "counsellor", other: "counsellors" }} />
            </Field>
          </Specimen>
        </StateGrid>
      </Section>
      <Section id="combobox-pictures" title="Grouped list" level={3}>
        <StateGrid columns={2}>
          <Specimen label="grouped options, open">
            <GroupedListPicture />
          </Specimen>
        </StateGrid>
      </Section>
      <KeyboardNote
        items={[
          { keys: ["ArrowDown", "ArrowUp"], action: "Open the list and move the active option." },
          { keys: ["Alt + ArrowDown"], action: "Opens the list without moving." },
          { keys: ["Enter"], action: "Chooses the active option (multi: toggles it; the list stays open and the query stays)." },
          { keys: ["Esc"], action: "Closes the list. A second Esc clears the query but keeps the choice." },
          { keys: ["Tab"], action: "Closes the list and moves on without choosing. Clear all is the next tab stop." },
          { keys: ["Backspace"], action: "In an empty input (multi), moves focus to the last chip." },
          { keys: ["ArrowLeft", "ArrowRight"], action: "Move between chips and back into the input." },
          { keys: ["Backspace", "Delete"], action: "On a chip: removes it, then focuses the next chip or the input." },
        ]}
      />
    </Section>
  );
}

/* -------------------------------------------------------------------------------------------------
 * Checkbox
 * -----------------------------------------------------------------------------------------------*/

const LONG_PROGRAMMES = PROGRAMMES.map((p) => ({ value: p.value, label: p.label, group: p.group }));

function SelectAllDemo() {
  const rows = ["Meera Pillai", "Kabir Gill", "Saanvi Patel"];
  const [chosen, setChosen] = useState<string[]>(["Meera Pillai"]);
  const all = chosen.length === rows.length;
  const some = chosen.length > 0 && !all;
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="h-row-header border-b border-border text-left text-xs text-muted">
          <th scope="col" className="w-10 px-2 font-medium">
            <Checkbox
              variant="table"
              aria-label="Select all 3 leads on this page"
              checked={all}
              indeterminate={some}
              onChange={(event) => setChosen(event.currentTarget.checked ? rows : [])}
            />
          </th>
          <th scope="col" className="px-2 font-medium">
            Lead
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((name) => (
          <tr key={name} className="h-row-compact border-b border-border last:border-b-0">
            <td className="px-2">
              <Checkbox
                variant="table"
                aria-label={`Select ${name}`}
                checked={chosen.includes(name)}
                onChange={(event) => setChosen((c) => (event.currentTarget.checked ? [...c, name] : c.filter((n) => n !== name)))}
              />
            </td>
            <td className="px-2 text-fg">{name}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function CheckboxSpecimens() {
  return (
    <Section
      id="checkbox"
      title="Checkbox"
      description="Native checkboxes (they submit before JavaScript loads): a 16 px box in a 24 px row on staff screens, 20 px in a 44 px row on public pages. Never pre-ticked for consent or marketing."
    >
      <Section id="checkbox-variants" title="Variants" level={3}>
        <StateGrid columns={2}>
          <Specimen label="single">
            <Checkbox label="Send a copy to my email" />
          </Specimen>
          <Specimen label="group, vertical, required">
            <CheckboxGroup
              legend="Documents received"
              name="documents"
              required
              defaultValue={["marksheet"]}
              options={[
                { value: "marksheet", label: "Class 12 marksheet" },
                { value: "transfer", label: "Transfer certificate" },
                { value: "aadhaar", label: "Aadhaar card", description: "Masked copy only" },
              ]}
            />
          </Specimen>
          <Specimen label="group, horizontal (3 or fewer short labels)">
            <CheckboxGroup
              legend="Channels"
              name="channels"
              orientation="horizontal"
              defaultValue={["sms"]}
              options={[
                { value: "email", label: "Email" },
                { value: "sms", label: "SMS" },
                { value: "whatsapp", label: "WhatsApp" },
              ]}
            />
          </Specimen>
          <Specimen label="group with max (public multi-choice, S01)" surface="bg">
            <CheckboxGroup
              legend="Programmes you're interested in"
              hint="Choose up to 3."
              name="interests"
              max={3}
              surface="public"
              defaultValue={["btech-cse"]}
              options={PROGRAMMES.slice(0, 5).map((p) => ({ value: p.value, label: p.label }))}
            />
          </Specimen>
          <Specimen label="indeterminate (select-all) and table row" note="Try it: the header box is mixed while some rows are chosen">
            <SelectAllDemo />
          </Specimen>
          <Specimen label="card (S37 scopes)">
            <div className="flex w-full flex-col gap-2">
              <Checkbox variant="card" label="Create and update leads" description="Websites and portals can add enquiries." defaultChecked />
              <Checkbox variant="card" label="Read payments" description="See payment links and receipts." />
            </div>
          </Specimen>
          <Specimen label="long group (more than 12): filter, grouped under headings" className="sm:col-span-2" note="Without JavaScript every row shows; ticked rows always stay visible">
            <CheckboxGroup
              legend="Programmes offered at this campus"
              name="campus-programmes"
              noun={{ one: "programme", other: "programmes" }}
              defaultValue={["mba"]}
              options={LONG_PROGRAMMES}
              className="w-full"
            />
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="checkbox-sizes" title="Sizes" level={3}>
        <StateGrid columns={2}>
          <Specimen label="staff · 16 px box, 24 px row">
            <Checkbox label="Make this field required" defaultChecked />
          </Specimen>
          <Specimen label="public · 20 px box, 44 px row, label is the target" surface="bg">
            <Checkbox surface="public" label="Send me updates by email" />
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="checkbox-states" title="States" level={3}>
        <StateGrid columns={4}>
          <Specimen label="unchecked">
            <Checkbox label="Hostel needed" />
          </Specimen>
          <Specimen label="hover" note={SIMULATED_NOTE}>
            <label className="flex min-h-hit items-center gap-2 text-sm text-fg">
              <input type="checkbox" className={cn(checkboxBoxClassName(), "border-muted")} />
              Hostel needed
            </label>
          </Specimen>
          <Specimen label="checked">
            <Checkbox label="Hostel needed" defaultChecked />
          </Specimen>
          <Specimen label="indeterminate">
            <Checkbox label="All programmes" indeterminate />
          </Specimen>
          <Specimen label="focus-visible" note={SIMULATED_NOTE}>
            <label className="flex min-h-hit items-center gap-2 text-sm text-fg">
              <input type="checkbox" className={cn(checkboxBoxClassName(), simulatedFocus)} />
              Hostel needed
            </label>
          </Specimen>
          <Specimen label="disabled">
            <Checkbox label="Transport needed" disabled />
          </Specimen>
          <Specimen label="disabled, checked">
            <Checkbox label="Transport needed" disabled defaultChecked />
          </Specimen>
          <Specimen label="read-only (text)">
            <Checkbox label="Hostel needed" readOnly defaultChecked />
          </Specimen>
          <Specimen label="invalid (group error)" className="sm:col-span-2">
            <CheckboxGroup
              legend="Programmes you're interested in"
              name="interests-invalid"
              required
              error="Choose at least one programme."
              options={PROGRAMMES.slice(0, 3).map((p) => ({ value: p.value, label: p.label }))}
            />
          </Specimen>
          <Specimen label="limit reached (unchecked boxes aria-disabled)" className="sm:col-span-2" note="Try ticking another: the status says why">
            <CheckboxGroup
              legend="Programmes you're interested in"
              hint="Choose up to 3."
              name="interests-full"
              max={3}
              defaultValue={["btech-cse", "btech-ece", "mba"]}
              options={[...PROGRAMMES.slice(0, 2), PROGRAMMES[5], PROGRAMMES[7]].map((p) => ({ value: p.value, label: p.label }))}
            />
          </Specimen>
        </StateGrid>
      </Section>
      <KeyboardNote
        items={[
          { keys: ["Tab"], action: "Each box is its own tab stop." },
          { keys: ["Space"], action: "Toggles. Clicking the label toggles too." },
        ]}
      />
    </Section>
  );
}

/* -------------------------------------------------------------------------------------------------
 * RadioGroup
 * -----------------------------------------------------------------------------------------------*/

const OWNER_MODES = [
  { value: "add", label: "Add to current owners", description: "The leads keep their owners and gain the people you pick." },
  { value: "replace", label: "Replace current owners", description: "Current owners are removed. The people you pick become the only owners." },
];
const DATA_SCOPES = [
  { value: "own", label: "Only their own leads" },
  { value: "team", label: "Their team's leads" },
  { value: "all", label: "All leads" },
];

export function RadioGroupSpecimens() {
  return (
    <Section
      id="radio-group"
      title="RadioGroup"
      description="Exactly one of 2 to 6 visible options. Native radios in a fieldset (they work without JavaScript); radio cards add a description to each option. Choices with consequences start with nothing chosen."
    >
      <Section id="radio-group-variants" title="Variants" level={3}>
        <StateGrid columns={2}>
          <Specimen label="list (S33 data scope)">
            <RadioGroup legend="Which leads can they see?" name="scope-list" options={DATA_SCOPES} defaultValue="team" />
          </Specimen>
          <Specimen label="inline (3 or fewer short labels)">
            <RadioGroup
              legend="Match"
              name="match-inline"
              variant="inline"
              options={[
                { value: "all", label: "All conditions" },
                { value: "any", label: "Any condition" },
              ]}
              defaultValue="all"
            />
          </Specimen>
          <Specimen label="cards (S13, nothing chosen at first)">
            <RadioGroup legend="How should we assign these leads?" name="owner-mode" variant="cards" options={OWNER_MODES} className="w-full" />
          </Specimen>
          <Specimen label="card grid (S28 field types, 2 columns from md)">
            <RadioGroup
              legend="Field type"
              name="field-type"
              variant="card-grid"
              defaultValue="picklist"
              className="w-full"
              options={[
                { value: "text", label: "Short text", description: "Names, codes, one line.", icon: <FileText /> },
                { value: "number", label: "Number", description: "Marks, ranks, counts.", icon: <Hash /> },
                { value: "picklist", label: "Picklist", description: "One choice from a list.", icon: <ListChecks />, badge: <span className="text-xs font-normal text-muted">Popular</span> },
                { value: "people", label: "Person", description: "A member of your team.", icon: <Users /> },
              ]}
            />
          </Specimen>
          <Specimen label="conditional reveal (only the chosen option's field exists)" className="sm:col-span-2" note="Try it: choose “Schedule for later”">
            <RadioGroup
              legend="When should it go?"
              name="send-when"
              options={[
                { value: "now", label: "Send now" },
                {
                  value: "later",
                  label: "Schedule for later",
                  reveal: <DateTimePicker legend="Send at" zonePicker={false} defaultDate="2026-10-08" defaultTime="10:00" now={GALLERY_NOW} />,
                },
              ]}
            />
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="radio-group-sizes" title="Sizes" level={3}>
        <StateGrid columns={2}>
          <Specimen label="staff · 16 px circle, 24 px row">
            <RadioGroup legend="Payment mode" name="mode-staff" options={[{ value: "upi", label: "UPI" }, { value: "cheque", label: "Cheque" }, { value: "cash", label: "Cash" }]} defaultValue="upi" />
          </Specimen>
          <Specimen label="public · 20 px circle, 44 px row" surface="bg">
            <RadioGroup
              legend="Are you 18 or older?"
              name="age-public"
              surface="public"
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No, I'm under 18" },
              ]}
            />
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="radio-group-states" title="States" level={3}>
        <StateGrid columns={3}>
          <Specimen label="none chosen">
            <RadioGroup legend="Which leads can they see?" name="scope-none" options={DATA_SCOPES} />
          </Specimen>
          <Specimen label="hover" note={SIMULATED_NOTE}>
            <label className="flex min-h-hit items-center gap-2 text-sm text-fg">
              <input type="radio" name="radio-hover-picture" className={cn(radioCircleClassName(false), "border-muted")} />
              Their team&apos;s leads
            </label>
          </Specimen>
          <Specimen label="chosen">
            <RadioGroup legend="Which leads can they see?" name="scope-chosen" options={DATA_SCOPES} defaultValue="all" />
          </Specimen>
          <Specimen label="focus-visible" note={SIMULATED_NOTE}>
            <span className="flex min-h-hit items-center gap-2 text-sm text-fg">
              <span aria-hidden="true" className={cn("inline-flex size-checkbox items-center justify-center rounded-pill border border-accent bg-surface", simulatedFocus)}>
                <span className="size-2 rounded-pill bg-accent" />
              </span>
              All leads
            </span>
          </Specimen>
          <Specimen label="card, chosen and focus-visible" note={SIMULATED_NOTE}>
            <div className={cn("flex w-full items-start gap-3 rounded-lg border border-accent bg-accent-subtle p-4 text-sm text-fg", simulatedFocus)}>
              <span aria-hidden="true" className="mt-0.5 inline-flex size-checkbox shrink-0 items-center justify-center rounded-pill border border-accent bg-surface">
                <span className="size-2 rounded-pill bg-accent" />
              </span>
              <span className="flex flex-col">
                <span className="font-medium">Replace current owners</span>
                <span className="text-xs text-muted">Current owners are removed.</span>
              </span>
            </div>
          </Specimen>
          <Specimen label="disabled option (its reason is the description)">
            <RadioGroup
              legend="Payment mode"
              name="mode-disabled-option"
              defaultValue="upi"
              options={[
                { value: "upi", label: "UPI" },
                { value: "card", label: "Card", disabled: true, description: "Connect a gateway in Settings first." },
              ]}
            />
          </Specimen>
          <Specimen label="disabled group">
            <RadioGroup legend="Which leads can they see?" name="scope-disabled" options={DATA_SCOPES} defaultValue="own" disabled />
          </Specimen>
          <Specimen label="invalid (required, none chosen)">
            <RadioGroup legend="How should we assign these leads?" name="owner-invalid" options={OWNER_MODES} required error="Choose how to assign these leads." />
          </Specimen>
          <Specimen label="read-only (the chosen label as text)">
            <RadioGroup legend="Which leads can they see?" name="scope-readonly" options={DATA_SCOPES} defaultValue="team" readOnly />
          </Specimen>
        </StateGrid>
      </Section>
      <KeyboardNote
        items={[
          { keys: ["Tab"], action: "Enters the group on the chosen radio, or the first when none is chosen. The next Tab leaves." },
          { keys: ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"], action: "Move and choose (native)." },
          { keys: ["Space"], action: "Chooses the focused radio when none is chosen." },
        ]}
      />
    </Section>
  );
}

/* -------------------------------------------------------------------------------------------------
 * Switch
 * -----------------------------------------------------------------------------------------------*/

export function SwitchSpecimens() {
  return (
    <Section
      id="switch"
      title="Switch"
      description="A setting with immediate effect, no Save button. It flips at once and saves; on failure it flips back and says so. Inside a form with a Save button, use Checkbox."
    >
      <Section id="switch-variants" title="Variants" level={3}>
        <StateGrid columns={2}>
          <Specimen label="settings row" note="Try it: saves in 1.2 s; the thumb spinner appears after 300 ms">
            <Switch
              className="w-full"
              label="Round-robin assignment"
              description="Spreads new leads evenly across the people you pick."
              defaultChecked
              onCheckedChange={() => wait(1200)}
            />
          </Specimen>
          <Specimen label="in a table (sr-only label)">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted">
                  <th scope="col" className="py-2 font-medium">
                    Automation
                  </th>
                  <th scope="col" className="py-2 text-right font-medium">
                    On
                  </th>
                </tr>
              </thead>
              <tbody>
                {["Welcome series", "Fee reminder"].map((name, i) => (
                  <tr key={name} className="border-b border-border last:border-b-0">
                    <td className="py-1 text-fg">{name}</td>
                    <td className="py-1">
                      <div className="flex justify-end">
                        <Switch layout="table" size="sm" label={`Automation: ${name}`} defaultChecked={i === 0} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Specimen>
          <Specimen label="with confirmation (turning off asks first)" note="Try it: turn it off">
            <Switch
              className="w-full"
              label="Form accepts enquiries"
              defaultChecked
              confirmOff={{
                title: "Stop accepting enquiries?",
                description: "The form will say it isn't available until you turn it back on. Enquiries already sent are kept.",
                confirmLabel: "Stop accepting",
              }}
            />
          </Specimen>
          <Specimen label="save fails (flips back)" note="Try it: the save is rejected after 1 s">
            <Switch
              className="w-full"
              label="Email me when a lead is assigned to me"
              onCheckedChange={() => wait(1000).then(() => Promise.reject(new Error("offline")))}
            />
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="switch-sizes" title="Sizes" level={3}>
        <StateGrid columns={2}>
          <Specimen label="sm · 36 × 20 track, 16 px thumb">
            <Switch className="w-full" size="sm" label="Remark required" defaultChecked />
          </Specimen>
          <Specimen label="md · 44 × 24 track, 20 px thumb">
            <Switch className="w-full" label="Remark required" defaultChecked />
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="switch-states" title="States" level={3}>
        <StateGrid columns={3}>
          <Specimen label="off">
            <Switch className="w-full" label="Stage is active" />
          </Specimen>
          <Specimen label="on">
            <Switch className="w-full" label="Stage is active" defaultChecked />
          </Specimen>
          <Specimen label="hover" note={SIMULATED_NOTE}>
            <Switch className="w-full [&_[data-track]]:bg-muted" label="Stage is active" />
          </Specimen>
          <Specimen label="focus-visible" note={SIMULATED_NOTE}>
            <Switch className={cn("w-full", "[&_[data-track]]:outline-2 [&_[data-track]]:outline-offset-2 [&_[data-track]]:outline-focus-ring [&_[data-track]]:outline-solid")} label="Stage is active" defaultChecked />
          </Specimen>
          <Specimen label="pending (saving)">
            <Switch className="w-full" label="Publisher active" defaultChecked status="pending" />
          </Specimen>
          <Specimen label="failed (flipped back)">
            <Switch className="w-full" label="Publisher active" status="failed" />
          </Specimen>
          <Specimen label="disabled, off">
            <Switch className="w-full" label="Webhook endpoint" disabled />
          </Specimen>
          <Specimen label="disabled, on">
            <Switch className="w-full" label="Webhook endpoint" disabled defaultChecked />
          </Specimen>
          <Specimen label="disabled with reason (no permission)" note="Focusable; the reason is its description and tooltip">
            <Switch className="w-full" label="Round-robin assignment" defaultChecked disabledReason="Only admins can change this." />
          </Specimen>
        </StateGrid>
      </Section>
      <KeyboardNote
        items={[
          { keys: ["Tab"], action: "Focuses the switch." },
          { keys: ["Space"], action: "Toggles (native checkbox). Enter does nothing." },
        ]}
      />
    </Section>
  );
}

/* -------------------------------------------------------------------------------------------------
 * NumberStepper
 * -----------------------------------------------------------------------------------------------*/

function ValidatedStepper() {
  const [error, setError] = useState<string | null>(null);
  return (
    <Field
      label="Retry every"
      hint="WhatsApp retries must be at least 24 hours apart."
      error={error ?? undefined}
      className="w-full"
    >
      <NumberStepper
        min={24}
        max={48}
        unit="hours"
        valueName="retry interval"
        defaultValue={24}
        rangeError="WhatsApp retries must be at least 24 hours apart."
        onValueChange={(value, { valid }) => setError(valid || value === null ? null : "WhatsApp retries must be at least 24 hours apart.")}
      />
    </Field>
  );
}

export function NumberStepperSpecimens() {
  return (
    <Section
      id="number-stepper"
      title="NumberStepper"
      description="A small whole number with buttons. type=text with role=spinbutton: no scroll-wheel changes and no “e”. A typed value outside the range stays as typed and the error states the range; the buttons and arrow keys clamp."
    >
      <Section id="number-stepper-variants" title="Variants" level={3}>
        <StateGrid columns={2}>
          <Specimen label="signed (score: +5, 0, −3)">
            <Field label="Score change" hint="From -10 to +10. Use a negative number when this stage means less interest." className="w-full">
              <NumberStepper min={-10} max={10} signed defaultValue={5} valueName="score change" rangeError="Enter a whole number from -10 to +10." />
            </Field>
          </Specimen>
          <Specimen label="count (minimum 0)">
            <Field label="Retries" className="w-full">
              <NumberStepper min={0} max={5} defaultValue={2} valueName="retries" />
            </Field>
          </Specimen>
          <Specimen label="with unit text (w-20)">
            <Field label="Daily lead limit" hint="Leave empty for no limit." className="w-full">
              <NumberStepper min={1} max={10000} unit="leads a day" inputWidth="w-20" defaultValue={250} valueName="daily lead limit" />
            </Field>
          </Specimen>
          <Specimen label="duration (unit Select, stored as minutes)">
            <Field label="Wait" className="w-full">
              <NumberStepper min={1} max={90} units={DURATION_UNITS} defaultValue={120} valueName="wait" name="wait_minutes" />
            </Field>
          </Specimen>
          <Specimen label="duration with unit text, live check" note="Try it: type 12 and leave the field">
            <ValidatedStepper />
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="number-stepper-sizes" title="Sizes" level={3}>
        <StateGrid columns={2}>
          <Specimen label="sm · 32 px, square buttons">
            <Field label="Quota">
              <NumberStepper size="sm" min={0} max={500} defaultValue={40} valueName="quota" />
            </Field>
          </Specimen>
          <Specimen label="md · 40 px, square buttons">
            <Field label="Quota">
              <NumberStepper min={0} max={500} defaultValue={40} valueName="quota" />
            </Field>
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="number-stepper-states" title="States" level={3}>
        <StateGrid columns={3}>
          <Specimen label="empty">
            <Field label="Daily lead limit">
              <NumberStepper min={1} max={10000} inputWidth="w-20" unit="leads a day" valueName="daily lead limit" />
            </Field>
          </Specimen>
          <Specimen label="valid">
            <Field label="Reminder before">
              <NumberStepper min={0} max={120} defaultValue={15} unit="minutes" valueName="reminder" />
            </Field>
          </Specimen>
          <Specimen label="hover (increase button)" note={SIMULATED_NOTE}>
            <Field label="Retries">
              <NumberStepper min={0} max={5} defaultValue={2} valueName="retries" className="[&_button:last-of-type]:bg-surface-hover [&_button:last-of-type]:text-fg" />
            </Field>
          </Specimen>
          <Specimen label="focus-visible (on the input)" note={SIMULATED_NOTE}>
            <Field label="Retries">
              <NumberStepper min={0} max={5} defaultValue={2} valueName="retries" className={cn("[&>div:first-child]:outline-2 [&>div:first-child]:outline-offset-2 [&>div:first-child]:outline-focus-ring [&>div:first-child]:outline-solid")} />
            </Field>
          </Specimen>
          <Specimen label="at minimum (decrease aria-disabled)">
            <Field label="Score change">
              <NumberStepper min={-10} max={10} signed defaultValue={-10} valueName="score change" />
            </Field>
          </Specimen>
          <Specimen label="at maximum (increase aria-disabled)">
            <Field label="Score change">
              <NumberStepper min={-10} max={10} signed defaultValue={10} valueName="score change" />
            </Field>
          </Specimen>
          <Specimen label="invalid (out of range, kept as typed)">
            <Field label="Score change" error="Enter a whole number from -10 to +10.">
              <NumberStepper min={-10} max={10} signed defaultValue={14} valueName="score change" />
            </Field>
          </Specimen>
          <Specimen label="invalid (empty, required)">
            <Field label="Retries" required error="Enter a number.">
              <NumberStepper min={0} max={5} valueName="retries" />
            </Field>
          </Specimen>
          <Specimen label="disabled">
            <Field label="Retries" disabled>
              <NumberStepper min={0} max={5} defaultValue={3} valueName="retries" />
            </Field>
          </Specimen>
          <Specimen label="read-only (text)">
            <Field label="Score change" readOnly>
              <NumberStepper min={-10} max={10} signed defaultValue={5} valueName="score change" readOnlyText={(v) => `${v !== null && v > 0 ? "+" : ""}${v ?? 0} points`} />
            </Field>
          </Specimen>
        </StateGrid>
      </Section>
      <KeyboardNote
        items={[
          { keys: ["ArrowUp", "ArrowDown"], action: "Change the value by 1 (clamped to the range)." },
          { keys: ["PageUp", "PageDown"], action: "Change the value by 5." },
          { keys: ["Enter"], action: "Submits the form." },
          { keys: ["Home", "End"], action: "Move the caret, as in any text field." },
          { keys: ["Tab"], action: "The buttons are not tab stops; holding one repeats after 400 ms, then every 80 ms." },
        ]}
      />
    </Section>
  );
}
