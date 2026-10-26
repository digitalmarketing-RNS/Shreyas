"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Section, Specimen, StateGrid } from "@/app/design/_gallery";
import { cn } from "@/lib/cn";
import { Button } from "../../button";
import { Checkbox, checkboxBoxClassName } from "../checkbox";
import { ConfirmPrompt } from "../confirm-prompt";
import { ConsentCapture, type ConsentItem, type ConsentNotice } from "../consent-capture";
import { ErrorSummary } from "../error-summary";
import { Field } from "../field";
import { useFieldControl } from "../field-context";
import { Form, type FormResult } from "../form";
import { FormActions } from "../form-actions";
import type { FormErrors } from "../form-context";
import { FormSection } from "../form-section";
import { FormSuccess } from "../form-success";
import { InlineAlert } from "../inline-alert";
import { NativeSelect } from "../native-select";
import { PhoneInput } from "../phone-input";
import { digitsOnly } from "../phone";
import { Select } from "../select";
import { SubmitButton } from "../submit-button";
import { TextInput } from "../text-input";
import { Textarea } from "../textarea";
import { KeyboardNote } from "./keyboard-note";
import { INSTITUTION, PROGRAMMES, STAGES, wait } from "./sample-data";

/* -------------------------------------------------------------------------------------------------
 * Field
 * -----------------------------------------------------------------------------------------------*/

/** A bare checkbox that takes its id and description from the Field around it (the inline layout). */
function FieldBox() {
  const control = useFieldControl({});
  return (
    <span className="inline-flex h-5.5 shrink-0 items-center">
      <input id={control.id} type="checkbox" aria-describedby={control.describedBy} className={checkboxBoxClassName()} />
    </span>
  );
}

export function FieldSpecimens() {
  return (
    <Section
      id="field"
      title="Field"
      description="Wraps one control with its label, required marker, hint and error, and the ids that link them. aria-describedby lists the error first, then the hint; aria-invalid is set only while an error shows. Ids come from useId; nobody passes them by hand."
    >
      <Section id="field-variants" title="Variants" level={3}>
        <StateGrid columns={2}>
          <Specimen label="stacked (default)">
            <Field label="Email address" hint="We'll use this to send the fee receipt." className="w-full">
              <TextInput type="email" defaultValue="saanvi.patel@example.com" autoComplete="off" />
            </Field>
          </Specimen>
          <Specimen label="inline (label beside the control)">
            <Field label="Make this field required" hint="People can't save the form without it." layout="inline">
              <FieldBox />
            </Field>
          </Specimen>
          <Specimen label="key-value row (S08: 200 px label column from md up)" className="sm:col-span-2">
            <div className="flex w-full flex-col gap-3">
              <Field label="City" layout="key-value">
                <TextInput size="sm" defaultValue="Thiruvananthapuram" autoComplete="off" />
              </Field>
              <Field label="Course" layout="key-value" hint="Shown on the application.">
                <Select size="sm" options={PROGRAMMES.slice(0, 4).map((p) => ({ value: p.value, label: p.label }))} defaultValue="btech-ece" />
              </Field>
            </div>
          </Specimen>
          <Specimen label="visually hidden label (toolbars, table cells)">
            <Field label="Stage" layout="hidden-label" className="w-56">
              <Select size="sm" options={STAGES.map(({ value, label, dotClassName }) => ({ value, label, dotClassName }))} defaultValue="contacted" />
            </Field>
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="field-sizes" title="Sizes" level={3}>
        <StateGrid columns={2}>
          <Specimen label="staff: label text-sm, hint and error text-xs">
            <Field label="Full name" required hint="As on the Class 12 marksheet." error="Enter the student's full name." className="w-full">
              <TextInput autoComplete="off" />
            </Field>
          </Specimen>
          <Specimen label="public: label text-base, hint and error text-sm" surface="bg">
            <Field label="Full name" surface="public" required hint="As on your Class 12 marksheet." error="Enter your full name." className="w-full">
              <TextInput size="lg" autoComplete="name" />
            </Field>
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="field-states" title="States" level={3}>
        <StateGrid columns={3}>
          <Specimen label="default">
            <Field label="Stage" className="w-full">
              <TextInput defaultValue="Interested" />
            </Field>
          </Specimen>
          <Specimen label="required (staff: * after the label)">
            <Field label="Stage" required className="w-full">
              <TextInput defaultValue="Interested" />
            </Field>
          </Specimen>
          <Specimen label="optional (public: “(optional)”)" surface="bg">
            <Field label="City" surface="public" className="w-full">
              <TextInput size="lg" defaultValue="Mysuru" autoComplete="address-level2" />
            </Field>
          </Specimen>
          <Specimen label="with hint">
            <Field label="Email address" hint="We'll use this to send the fee receipt." className="w-full">
              <TextInput type="email" />
            </Field>
          </Specimen>
          <Specimen label="invalid (error first in aria-describedby)">
            <Field label="Email address" hint="We'll use this to send the fee receipt." error="Enter an email address like name@example.com." className="w-full">
              <TextInput type="email" defaultValue="kabir.gill@" />
            </Field>
          </Specimen>
          <Specimen label="disabled (label and hint muted)">
            <Field label="Lead source" hint="Set by the import." disabled className="w-full">
              <TextInput defaultValue="Education fair, Bhopal" />
            </Field>
          </Specimen>
          <Specimen label="read-only">
            <Field label="Lead source" readOnly className="w-full">
              <TextInput defaultValue="Website form" />
            </Field>
          </Specimen>
        </StateGrid>
      </Section>
      <KeyboardNote items={[{ keys: ["Tab"], action: "Nothing of its own. Clicking the label focuses the control; tab order follows the DOM." }]} />
    </Section>
  );
}

/* -------------------------------------------------------------------------------------------------
 * FormLayout
 * -----------------------------------------------------------------------------------------------*/

function validateEnquiry(data: FormData): FormErrors {
  const errors: FormErrors = {};
  const name = String(data.get("full_name") ?? "").trim();
  const email = String(data.get("email") ?? "").trim();
  const mobile = digitsOnly(String(data.get("mobile_national") ?? ""));
  const programme = String(data.get("programme") ?? "");
  if (!name) errors.full_name = "Enter the student's full name.";
  if (!email) errors.email = "Enter an email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter an email address like name@example.com.";
  if (!mobile) errors.mobile = "Enter a mobile number.";
  else if (mobile.length !== 10) errors.mobile = "Enter a 10-digit mobile number.";
  if (!programme) errors.programme = "Choose a programme.";
  return errors;
}

let networkFailOnce = true;
async function saveEnquiry(): Promise<FormResult> {
  await wait(1200);
  if (networkFailOnce) {
    networkFailOnce = false;
    return { ok: false, network: true };
  }
  return { ok: true, message: "Saved" };
}

function StaffFormDemo() {
  const [asking, setAsking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  return (
    <Form validate={validateEnquiry} onSubmit={saveEnquiry} requiredNote guardUnsaved summaryHeadingLevel={4} className="w-full max-w-form">
      <FormSection title="Student" headingLevel={3}>
        <Field label="Full name" name="full_name" required>
          <TextInput name="full_name" autoComplete="off" />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Email address" name="email" required>
            <TextInput type="email" name="email" autoComplete="off" />
          </Field>
          <Field label="Mobile number" name="mobile" required>
            <PhoneInput name="mobile" />
          </Field>
        </div>
      </FormSection>
      <FormSection title="Interest" headingLevel={3}>
        <Field label="Programme" name="programme" required>
          <NativeSelect name="programme" size="md" placeholder="Choose a programme" options={PROGRAMMES.slice(0, 6).map((p) => ({ value: p.value, label: p.label }))} />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="City">
            <TextInput name="city" autoComplete="off" />
          </Field>
          <Field label="PIN code">
            <TextInput name="pin" inputMode="numeric" maxLength={6} className="w-24" autoComplete="off" />
          </Field>
        </div>
      </FormSection>
      <FormActions destructive={<Button variant="danger-outline" size="md" leadingIcon={<Trash2 />} onClick={() => setDeleting(true)}>Delete enquiry</Button>}>
        <Button variant="secondary" size="md" onClick={() => setAsking(true)}>
          Cancel
        </Button>
        <SubmitButton>Save enquiry</SubmitButton>
      </FormActions>
      <ConfirmPrompt
        open={asking}
        onOpenChange={setAsking}
        title="Discard your changes?"
        description="You'll lose what you've typed."
        cancelLabel="Keep editing"
        confirmLabel="Discard"
        destructive
        onConfirm={() => undefined}
      />
      <ConfirmPrompt
        open={deleting}
        onOpenChange={setDeleting}
        title="Delete this enquiry?"
        description="It will be hidden from every list and report. Its payments and consent records are kept. You can't undo this."
        confirmLabel="Delete enquiry"
        destructive
        onConfirm={() => undefined}
      />
    </Form>
  );
}

function ShortFormDemo() {
  return (
    <Form
      validate={(data): FormErrors => (String(data.get("remark") ?? "").trim() ? {} : { remark: "Add a remark for this stage." })}
      onSubmit={() => wait(800).then(() => ({ ok: true }) as FormResult)}
      className="w-full"
    >
      <Field label="Remark" name="remark" required hint="Required at this stage.">
        <Textarea name="remark" submitOnModEnter />
      </Field>
      <FormActions>
        <SubmitButton>Save stage</SubmitButton>
      </FormActions>
    </Form>
  );
}

function PublicFormDemo() {
  return (
    <Form
      surface="public"
      intro="All fields are required unless marked optional."
      validate={(data): FormErrors => (String(data.get("pub_name") ?? "").trim() ? {} : { pub_name: "Enter your full name." })}
      onSubmit={() => wait(900).then(() => ({ ok: true }) as FormResult)}
      successMessage={<FormSuccess institution={INSTITUTION} />}
      className="w-full max-w-public"
    >
      <Field label="Full name" name="pub_name" required>
        <TextInput size="lg" name="pub_name" autoComplete="name" autoCapitalize="words" />
      </Field>
      <Field label="City">
        <TextInput size="lg" name="pub_city" autoComplete="address-level2" />
      </Field>
      <FormActions layout="public">
        <SubmitButton loadingLabel="Sending…">Send enquiry</SubmitButton>
        <Button variant="link" className="min-h-hit-public self-center">
          Save and finish later
        </Button>
      </FormActions>
    </Form>
  );
}

function InlineEditGroupDemo() {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState({ city: "Guwahati", school: "Cotton Collegiate HS" });
  if (!editing) {
    return (
      <div className="flex w-full flex-col gap-1">
        <dl className="m-0 flex w-full flex-col gap-1 text-sm @container">
          {(
            [
              ["City", values.city],
              ["School", values.school],
            ] as const
          ).map(([key, value]) => (
            <div key={key} className="flex min-h-kv-row flex-col @min-[26rem]:grid @min-[26rem]:grid-cols-[var(--layout-kv-label)_minmax(0,1fr)] @min-[26rem]:items-center @min-[26rem]:gap-x-4">
              <dt className="text-muted">{key}</dt>
              <dd className="m-0 text-fg">{value}</dd>
            </div>
          ))}
        </dl>
        <div>
          <Button variant="ghost" size="sm" leadingIcon={<Pencil />} onClick={() => setEditing(true)}>
            Edit details
          </Button>
        </div>
      </div>
    );
  }
  return (
    <Form
      onSubmit={async (data) => {
        await wait(500);
        setValues({ city: String(data.get("kv_city")), school: String(data.get("kv_school")) });
        setEditing(false);
        return { ok: true };
      }}
      className="w-full"
    >
      <Field label="City" layout="key-value">
        <TextInput size="sm" name="kv_city" defaultValue={values.city} autoComplete="off" />
      </Field>
      <Field label="School" layout="key-value">
        <TextInput size="sm" name="kv_school" defaultValue={values.school} autoComplete="off" />
      </Field>
      <div className="flex gap-2">
        <SubmitButton size="sm">Save</SubmitButton>
        <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    </Form>
  );
}

function StickyFooterDemo() {
  return (
    <div className="h-80 w-full overflow-y-auto rounded-md border border-border bg-surface">
      <Form className="gap-4 pt-4" onSubmit={() => wait(800).then(() => ({ ok: true }) as FormResult)}>
        <div className="flex flex-col gap-4 px-4">
          {["Assignment rule name", "Applies to", "Campus", "Programme", "Owner pool", "Fallback owner"].map((label) => (
            <Field key={label} label={label}>
              <TextInput autoComplete="off" />
            </Field>
          ))}
        </div>
        <FormActions sticky>
          <Button variant="secondary" size="md">
            Cancel
          </Button>
          <SubmitButton>Save rule</SubmitButton>
        </FormActions>
      </Form>
    </div>
  );
}

export function FormLayoutSpecimens() {
  return (
    <Section
      id="form-layout"
      title="FormLayout"
      description="How fields, sections, errors and buttons are arranged, and how a form behaves on submit. Nothing is checked while a field is first typed in; format on blur; everything on submit; after an error, that field on every input. The submit button is never disabled to signal invalid fields."
    >
      <Section id="form-layout-variants" title="Variants" level={3}>
        <StateGrid columns={2}>
          <Specimen
            label="staff page form (max-w-form, sections, two columns only for short pairs)"
            note="Try it: Save with empty fields (error summary), then fill them (the first save fails the network once)"
            className="sm:col-span-2"
          >
            <StaffFormDemo />
          </Specimen>
          <Specimen label="staff dialog form (footer on the panel fill)" surface="surface-raised">
            <div className="flex w-full flex-col">
              <h4 className="m-0 px-5 pt-5 pb-3 text-md text-fg">Change stage for Ananya Rao</h4>
              <div className="px-5 py-4">
                <ShortFormDemo />
              </div>
            </div>
          </Specimen>
          <Specimen label="staff inline edit (S08 key-value rows)" note="Try it: Edit details">
            <InlineEditGroupDemo />
          </Specimen>
          <Specimen label="public form (max-w-public, full-width primary, a link under it)" surface="bg" note="Try it: Send enquiry">
            <PublicFormDemo />
          </Specimen>
          <Specimen label="sticky footer bar (taller than its scroll area)">
            <StickyFooterDemo />
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="form-layout-states" title="States" level={3}>
        <StateGrid columns={2}>
          <Specimen label="pristine and dirty" note="Typing marks the form dirty; leaving asks “Discard your changes?”">
            <div className="flex w-full flex-col gap-2">
              <Button variant="secondary" size="md" className="self-start">
                Cancel
              </Button>
              <p className="m-0 text-xs text-muted">The discard prompt: “Discard your changes?” · “You&apos;ll lose what you&apos;ve typed.” · Keep editing · Discard</p>
            </div>
          </Specimen>
          <Specimen label="submitting (the primary loads; fields stay editable)">
            <Button size="md" loading loadingLabel="Saving…">
              Save enquiry
            </Button>
          </Specimen>
          <Specimen label="client or server errors: the summary (3 or more fields)" className="sm:col-span-2">
            <ErrorSummary
              focusOnMount={false}
              headingLevel={4}
              className="w-full max-w-form"
              items={[
                { message: "Enter the student's full name.", targetId: "form-layout-variants" },
                { message: "Enter an email address like name@example.com.", targetId: "form-layout-variants" },
                { message: "Choose a programme.", targetId: "form-layout-variants" },
              ]}
            />
          </Specimen>
          <Specimen label="one field needs a change">
            <ErrorSummary focusOnMount={false} headingLevel={4} className="w-full" items={[{ message: "Remark is needed for this stage.", targetId: "form-layout-variants" }]} />
          </Specimen>
          <Specimen label="network failure (values kept)">
            <InlineAlert tone="danger" srTone={false} className="w-full" actions={<Button variant="secondary">Try again</Button>}>
              Not sent. Check your connection and try again.
            </InlineAlert>
          </Specimen>
          <Specimen label="success, public (replaces the form, takes focus)" surface="bg">
            <FormSuccess institution={INSTITUTION} focusOnMount={false} />
          </Specimen>
          <Specimen label="success, staff" note="A toast, or the dialog closes and focus returns to its trigger">
            <p className="m-0 text-sm text-muted">The form&apos;s polite status region says “Saved”.</p>
          </Specimen>
        </StateGrid>
      </Section>
      <KeyboardNote
        items={[
          { keys: ["Tab"], action: "Follows the visual order, row by row in two-column grids." },
          { keys: ["Enter"], action: "Submits from single-line fields. Ctrl + Enter submits from a textarea in staff dialogs." },
          { keys: ["Enter"], action: "On an error-summary link: focus moves to its field." },
          { keys: ["Esc"], action: "In a dialog form: closes it, or asks “Discard your changes?” when it is dirty." },
        ]}
      />
    </Section>
  );
}

/* -------------------------------------------------------------------------------------------------
 * ConsentCapture
 * -----------------------------------------------------------------------------------------------*/

const NOTICE: ConsentNotice = {
  id: "notice_7c2f",
  version: 3,
  publishedOn: "01 Oct 2026",
  language: "en-IN",
  href: "https://sahyadri.example.in/privacy/notice/v3",
  otherLanguages: [
    { lang: "hi", label: "हिन्दी", href: "https://sahyadri.example.in/privacy/notice/v3?lang=hi" },
    { lang: "mr", label: "मराठी", href: "https://sahyadri.example.in/privacy/notice/v3?lang=mr" },
  ],
  withdrawHref: "https://sahyadri.example.in/privacy/withdraw",
};

const ITEMS: ConsentItem[] = [
  { key: "answer", purpose: "data_processing", channel: "all", label: "Use my details to answer this enquiry and help me with admission.", required: true },
  { key: "whatsapp", purpose: "marketing", channel: "whatsapp", label: `Send me updates from ${INSTITUTION} on WhatsApp` },
  { key: "sms", purpose: "marketing", channel: "sms", label: "Send me updates by SMS" },
  { key: "email", purpose: "marketing", channel: "email", label: "Send me updates by email" },
  { key: "call", purpose: "marketing", channel: "call", label: "Call me about courses" },
];

const HINDI_NOTICE: ConsentNotice = {
  ...NOTICE,
  language: "hi",
  href: "https://sahyadri.example.in/privacy/notice/v3?lang=hi",
  otherLanguages: [{ lang: "en", label: "English", href: "https://sahyadri.example.in/privacy/notice/v3" }],
};

const HINDI_ITEMS: ConsentItem[] = [
  { key: "answer", purpose: "data_processing", channel: "all", label: "इस पूछताछ का जवाब देने और प्रवेश में मेरी मदद के लिए मेरी जानकारी का उपयोग करें।", required: true },
  { key: "whatsapp", purpose: "marketing", channel: "whatsapp", label: "मुझे WhatsApp पर अपडेट भेजें" },
  { key: "sms", purpose: "marketing", channel: "sms", label: "मुझे SMS से अपडेट भेजें" },
];

export function ConsentCaptureSpecimens() {
  return (
    <Section
      id="consent-capture"
      title="ConsentCapture"
      description="Consent one purpose at a time, in plain words, linked to the exact notice version, recording what was shown and what was ticked. Never pre-ticked; no “agree to everything” box; optional items never block submission."
    >
      <Section id="consent-capture-variants" title="Variants" level={3}>
        <StateGrid columns={2}>
          <Specimen label="public enquiry (S01)" surface="bg">
            <ConsentCapture institution={INSTITUTION} notice={NOTICE} items={ITEMS} className="w-full max-w-public" />
          </Specimen>
          <Specimen label="minor mode (marketing items removed, guardian fields)" surface="bg">
            <ConsentCapture institution={INSTITUTION} notice={NOTICE} items={ITEMS} minor className="w-full max-w-public" />
          </Specimen>
          <Specimen label="staff record (S07, S08): method and optional proof per ticked item" note="Try it: tick an item">
            <ConsentCapture institution={INSTITUTION} variant="staff" notice={NOTICE} items={ITEMS} name="staff_consent" className="w-full" />
          </Specimen>
          <Specimen label="read-only summary (S08)">
            <ConsentCapture
              institution={INSTITUTION}
              variant="summary"
              notice={NOTICE}
              items={ITEMS}
              summary={[
                { label: "Answer this enquiry", state: "given", date: "06 Oct 2026", version: 3 },
                { label: "WhatsApp updates", state: "given", date: "06 Oct 2026", version: 3 },
                { label: "SMS updates", state: "withdrawn", date: "12 Oct 2026" },
                { label: "Email updates", state: "not-asked" },
              ]}
            />
          </Specimen>
          <Specimen label="withdraw (one step, as giving was)" surface="bg">
            <ConsentCapture institution={INSTITUTION} variant="withdraw" notice={NOTICE} items={ITEMS.slice(1, 3)} name="withdraw" className="w-full max-w-public" />
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="consent-capture-sizes" title="Sizes" level={3} description="Public: 20 px boxes in 44 px rows, labels text-base, notice line text-sm. Staff: 16 px boxes in 24 px rows, text-sm (both shown above).">
        <StateGrid columns={2}>
          <Specimen label="public row" surface="bg">
            <Checkbox surface="public" label="Send me updates by SMS" />
          </Specimen>
          <Specimen label="staff row">
            <Checkbox label="Send me updates by SMS" />
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="consent-capture-states" title="States" level={3}>
        <StateGrid columns={2}>
          <Specimen label="unticked (always the starting state)" surface="bg">
            <ConsentCapture institution={INSTITUTION} notice={NOTICE} items={ITEMS.slice(0, 2)} name="c1" className="w-full max-w-public" />
          </Specimen>
          <Specimen label="ticked (the person's own ticks, kept after an error)" surface="bg">
            <ConsentCapture institution={INSTITUTION} notice={NOTICE} items={ITEMS.slice(0, 3)} defaultTicked={["answer", "sms"]} name="c2" className="w-full max-w-public" />
          </Specimen>
          <Specimen label="required item missing (error on submit)" surface="bg">
            <ConsentCapture
              institution={INSTITUTION}
              notice={NOTICE}
              items={ITEMS.slice(0, 2)}
              name="c3"
              error={`Tick this box so ${INSTITUTION} can reply to you. Your enquiry can't be sent without it.`}
              className="w-full max-w-public"
            />
          </Specimen>
          <Specimen label="language switched (Hindi notice; the fieldset carries lang)" surface="bg">
            <ConsentCapture institution={INSTITUTION} notice={HINDI_NOTICE} items={HINDI_ITEMS} name="c4" className="w-full max-w-public" />
          </Specimen>
          <Specimen label="staff method missing">
            <ConsentCapture
              institution={INSTITUTION}
              variant="staff"
              notice={NOTICE}
              items={ITEMS.slice(1, 2)}
              defaultTicked={["whatsapp"]}
              methodErrors={{ whatsapp: "Choose how they agreed." }}
              name="c5"
              className="w-full"
            />
          </Specimen>
          <Specimen label="withdrawn (summary line)">
            <ConsentCapture
              institution={INSTITUTION}
              variant="summary"
              notice={NOTICE}
              items={ITEMS}
              summary={[{ label: "WhatsApp updates", state: "withdrawn", date: "12 Oct 2026" }]}
            />
          </Specimen>
          <Specimen label="no published notice (staff, S31)">
            <ConsentCapture institution={INSTITUTION} variant="staff" notice={null} items={ITEMS} className="w-full" />
          </Specimen>
          <Specimen label="no published notice (public visitors)" surface="bg">
            <ConsentCapture institution={INSTITUTION} notice={null} items={ITEMS} className={cn("w-full max-w-public")} />
          </Specimen>
        </StateGrid>
      </Section>
      <KeyboardNote
        items={[
          { keys: ["Tab"], action: "Between boxes, then the notice link and the language links." },
          { keys: ["Space"], action: "Toggles a box." },
          { keys: ["Enter"], action: "Follows the notice link (it opens in a new tab, so the form keeps its values)." },
        ]}
      />
    </Section>
  );
}
