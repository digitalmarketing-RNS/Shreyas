"use client";

import { useEffect, useId, useState } from "react";
import { cn } from "@/lib/cn";
import { Link } from "../primitives/link";
import { announce } from "./announce";
import { Checkbox } from "./checkbox";
import { Field } from "./field";
import { FieldGroup } from "./field-group";
import { FileUpload } from "./file-upload";
import { InlineAlert } from "./inline-alert";
import { NativeSelect } from "./native-select";
import { PhoneInput } from "./phone-input";
import { TextInput } from "./text-input";

export type ConsentPurpose = "data_processing" | "marketing";
export type ConsentChannel = "all" | "whatsapp" | "sms" | "email" | "call";

/** One consent item, frozen with the published notice version (notices.purposes). */
export type ConsentItem = {
  key: string;
  purpose: ConsentPurpose;
  channel: ConsentChannel;
  /** The purpose in plain words: "Send me updates by SMS". */
  label: string;
  subText?: string;
  /** The item for answering the enquiry, when the institution relies on consent for it. */
  required?: boolean;
};

export type ConsentNotice = {
  id: string;
  version: number;
  /** "01 Oct 2026", formatted on the server. */
  publishedOn: string;
  /** BCP 47 tag of the language shown ("en-IN", "hi"). */
  language: string;
  href: string;
  /** Other languages, named in their own scripts: { lang: "hi", label: "हिन्दी", href }. */
  otherLanguages?: Array<{ lang: string; label: string; href: string }>;
  withdrawHref: string;
};

export type ConsentSummaryLine = {
  label: string;
  state: "given" | "withdrawn" | "not-asked";
  /** "06 Oct 2026". */
  date?: string;
  version?: number;
};

export const CONSENT_METHODS = [
  { value: "paper_form", label: "Paper form" },
  { value: "in_person", label: "In person" },
  { value: "phone_call", label: "On a phone call" },
  { value: "email_reply", label: "Email reply" },
];

export type ConsentCaptureProps = {
  institution: string;
  /** public enquiry (S01), staff record (S07, S08), read-only summary (S08) or withdraw. */
  variant?: "public" | "staff" | "summary" | "withdraw";
  /** The published notice; null means none is published yet. */
  notice: ConsentNotice | null;
  items: ConsentItem[];
  /** Under 18 (public): marketing items go, an info alert explains, guardian fields appear. */
  minor?: boolean;
  /** The person's own ticks, kept after a validation error. Never pre-ticked otherwise. */
  defaultTicked?: string[];
  /** The required item's error, linked to it. */
  error?: string;
  /** Staff: "Choose how they agreed." per ticked item without a method. */
  methodErrors?: Record<string, string>;
  /** Read-only summary lines (S08). */
  summary?: ConsentSummaryLine[];
  /** Field name prefix (consent): checkboxes are `{name}_{key}`. */
  name?: string;
  className?: string;
};

/**
 * Asks for consent one purpose at a time, in plain words, links the exact notice version, and
 * records what was shown and what was ticked (components.md ConsentCapture).
 *
 * - Native checkboxes in a fieldset whose lang is the notice's language; no "I agree to everything"
 *   box; nothing is ever pre-ticked. Optional items never block submission; the required item's
 *   error says why it is needed.
 * - Hidden inputs record notice_id, notice_version, notice_language and items_shown. The server
 *   does not trust them: it checks the notice and every ticked key, and writes one consents row per
 *   ticked item (unticked items write nothing).
 * - Minor mode: the marketing items are removed, an info alert says a guardian must agree first, and
 *   guardian fields appear (autocomplete="off": not the person's own details). The change is
 *   announced once.
 */
export function ConsentCapture({
  institution,
  variant = "public",
  notice,
  items,
  minor = false,
  defaultTicked = [],
  error,
  methodErrors = {},
  summary = [],
  name = "consent",
  className,
}: ConsentCaptureProps) {
  const base = useId();
  const isPublic = variant === "public";
  const surface = isPublic ? "public" : "staff";
  const [ticked, setTicked] = useState<string[]>(defaultTicked);

  // Minor mode turning on is announced once through the shared polite region.
  useEffect(() => {
    if (minor && isPublic) announce("You're under 18, so a parent or guardian must agree first. Guardian fields were added.");
  }, [minor, isPublic]);

  if (!notice) {
    return isPublic ? (
      <InlineAlert tone="warning" className={className}>
        This form isn&apos;t available right now.
      </InlineAlert>
    ) : (
      <InlineAlert tone="warning" className={className} actions={<Link href="/settings/privacy-notices">Go to Settings &gt; Privacy notices</Link>}>
        Forms can&apos;t go live until a notice is published.
      </InlineAlert>
    );
  }

  if (variant === "summary") {
    return (
      <dl className={cn("m-0 flex flex-col gap-2 text-sm", className)}>
        {summary.map((line) => (
          <div key={line.label} className="flex flex-wrap gap-x-2">
            <dt className="text-muted">{line.label}</dt>
            <dd className="m-0 text-fg">
              {line.state === "given"
                ? `Given ${line.date}, notice v${line.version}`
                : line.state === "withdrawn"
                  ? `Withdrawn ${line.date}`
                  : "Not asked"}
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  const shown = minor ? items.filter((item) => item.purpose !== "marketing") : items;
  const required = shown.filter((item) => item.required);
  const optional = shown.filter((item) => !item.required);
  const errorId = `${base}-required-error`;

  const toggle = (key: string, on: boolean) => setTicked((current) => (on ? [...current, key] : current.filter((k) => k !== key)));

  const row = (item: ConsentItem) => (
    <div key={item.key} className="flex flex-col gap-2">
      <Checkbox
        name={`${name}_${item.key}`}
        value="granted"
        surface={surface}
        label={item.label}
        description={item.subText}
        required={item.required}
        checked={ticked.includes(item.key)}
        invalid={item.required && Boolean(error)}
        aria-describedby={item.required && error ? errorId : undefined}
        onChange={(event) => toggle(item.key, event.currentTarget.checked)}
      />
      {variant === "staff" && ticked.includes(item.key) ? (
        <div className="flex flex-col gap-3 pl-6">
          <Field label="How did they agree?" required error={methodErrors[item.key]}>
            <NativeSelect size="md" name={`${name}_${item.key}_method`} placeholder="Choose a method" options={CONSENT_METHODS} className="max-w-64" />
          </Field>
          <Field label="Proof" hint="Optional. A photo of the signed form or the email.">
            <FileUpload name={`${name}_${item.key}_proof`} variant="compact" accept={[".pdf", ".jpg", ".jpeg", ".png"]} typeLabel="PDF or image" maxBytes={5 * 1024 * 1024} />
          </Field>
        </div>
      ) : null}
    </div>
  );

  const noticeLine = (
    <div className={cn("flex flex-col", isPublic ? "text-sm" : "text-xs")}>
      <Link href={notice.href} external variant="standalone" surface={surface} className={cn(isPublic ? "text-sm" : "text-xs")}>
        Read how {institution} uses your data (notice version {notice.version}, {notice.publishedOn})
      </Link>
      {notice.otherLanguages && notice.otherLanguages.length > 0 ? (
        <div className="flex flex-wrap items-center gap-x-3 text-muted">
          <span>Also in:</span>
          {notice.otherLanguages.map((language) => (
            <a
              key={language.lang}
              href={language.href}
              lang={language.lang}
              hrefLang={language.lang}
              className={cn("inline-flex items-center text-accent underline underline-offset-2 hover:decoration-2", isPublic ? "min-h-hit-public" : "min-h-hit")}
            >
              {language.label}
            </a>
          ))}
        </div>
      ) : null}
      <p className="m-0 mt-1 text-muted">
        You can change your mind at any time.{" "}
        <Link href={notice.withdrawHref} className={isPublic ? "text-sm" : "text-xs"}>
          How to withdraw
        </Link>
      </p>
    </div>
  );

  const hidden = (
    <>
      <input type="hidden" name="notice_id" value={notice.id} />
      <input type="hidden" name="notice_version" value={String(notice.version)} />
      <input type="hidden" name="notice_language" value={notice.language} />
      <input type="hidden" name="items_shown" value={shown.map((item) => item.key).join(",")} />
    </>
  );

  if (variant === "withdraw") {
    return (
      <FieldGroup legend="Choose what to stop" hint="Withdrawing takes one step. Anything you leave ticked stays as it is." surface={surface} lang={notice.language} className={className}>
        <div className="flex flex-col gap-1">{items.map(row)}</div>
        {hidden}
      </FieldGroup>
    );
  }

  return (
    <div className={cn("flex flex-col", isPublic ? "gap-6" : "gap-4", className)}>
      {minor && isPublic ? (
        <InlineAlert tone="info" srTone={false}>
          You&apos;re under 18. Before {institution} contacts you, a parent or guardian must agree. Add their details below and
          we&apos;ll send them a code. We&apos;ll keep only what we need to contact your parent or guardian.
        </InlineAlert>
      ) : null}
      {minor && isPublic ? (
        <div className="flex flex-col gap-6">
          <Field label="Guardian's full name" required surface="public">
            <TextInput size="lg" name="guardian_name" autoComplete="off" autoCapitalize="words" />
          </Field>
          <Field label="Guardian's mobile" required surface="public">
            <PhoneInput name="guardian_mobile" variant="public" />
          </Field>
        </div>
      ) : null}
      <FieldGroup legend={`How ${institution} may use your details`} surface={surface} lang={notice.language} required={required.length > 0}>
        <div className="flex flex-col gap-3">
          {variant === "staff" ? <p className="m-0 text-xs text-muted">Only tick what the student agreed to, and record how they agreed.</p> : null}
          {required.length > 0 ? <div className="flex flex-col gap-1">{required.map(row)}</div> : null}
          {error ? (
            <p id={errorId} className={cn("m-0 font-medium text-danger", isPublic ? "text-sm" : "text-xs")}>
              <span className="sr-only">Error: </span>
              {error}
            </p>
          ) : null}
          {optional.length > 0 ? (
            <fieldset className="m-0 min-w-0 border-0 p-0">
              <legend className={cn("p-0 font-medium text-fg", isPublic ? "text-base" : "text-sm")}>
                Updates about courses, fees and deadlines (optional)
              </legend>
              <div className="mt-1 flex flex-col gap-1">{optional.map(row)}</div>
            </fieldset>
          ) : null}
          {noticeLine}
        </div>
        {hidden}
      </FieldGroup>
    </div>
  );
}
