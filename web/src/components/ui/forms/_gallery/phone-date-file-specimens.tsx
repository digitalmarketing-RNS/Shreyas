"use client";

import { Check, CloudUpload } from "lucide-react";
import { Section, SIMULATED_NOTE, Specimen, StateGrid, simulatedFocus } from "@/app/design/_gallery";
import { cn } from "@/lib/cn";
import { buttonVariants } from "../../button";
import { Calendar, calendarDayClassName } from "../calendar";
import { POPOVER_PANEL } from "../control-styles";
import { DatePicker } from "../date-picker";
import { DATE_RANGE_PRESETS, DateRangePicker } from "../date-range-picker";
import { DateTimePicker } from "../date-time-picker";
import { fromIso } from "../dates";
import { Field } from "../field";
import { dropzoneClassName, FileUpload } from "../file-upload";
import { MemorableDate } from "../memorable-date";
import { OtpInput, type OtpVerifyResult } from "../otp-input";
import { PhoneInput } from "../phone-input";
import { UploadError, type FileUploader } from "../uploads";
import { KeyboardNote } from "./keyboard-note";
import { GALLERY_NOW, GALLERY_TODAY, wait } from "./sample-data";

const TODAY = fromIso(GALLERY_TODAY)!;
const MB = 1024 * 1024;

/* -------------------------------------------------------------------------------------------------
 * PhoneInput
 * -----------------------------------------------------------------------------------------------*/

export function PhoneInputSpecimens() {
  return (
    <Section
      id="phone-input"
      title="PhoneInput"
      description="A phone number with its country code; the value leaves as E.164 (+919876543210). India first, then pinned countries, then A to Z. The browser checks the digit count only; the server validates."
    >
      <Section id="phone-input-variants" title="Variants" level={3}>
        <StateGrid columns={3}>
          <Specimen label="public (48 px, the person's own number)" surface="bg">
            <Field label="Mobile number" hint="We'll send a code to check it's yours." surface="public" required className="w-full">
              <PhoneInput variant="public" ownNumber name="mobile" />
            </Field>
          </Specimen>
          <Specimen label="staff (40 px, a lead's number, autocomplete off)">
            <Field label="Mobile number" className="w-full">
              <PhoneInput variant="staff" name="lead_mobile" defaultValue="+919876543210" pinned={["AE", "SG"]} />
            </Field>
          </Specimen>
          <Specimen label="inline extra number (S08, 32 px)">
            <Field label="Alternate number" className="w-full">
              <PhoneInput variant="inline" name="alt_mobile" defaultValue="+918026123456" />
            </Field>
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="phone-input-states" title="States" level={3} description="Try it: paste “+971 50 123 4567” or “0091 98765 43210” into any number field.">
        <StateGrid columns={3}>
          <Specimen label="empty (+91 chosen)">
            <Field label="Mobile number" className="w-full">
              <PhoneInput />
            </Field>
          </Specimen>
          <Specimen label="typing">
            <Field label="Mobile number" className="w-full">
              <PhoneInput defaultValue="+9198765" />
            </Field>
          </Specimen>
          <Specimen label="filled (India: 98765 43210)">
            <Field label="Mobile number" className="w-full">
              <PhoneInput defaultValue="+919845012345" />
            </Field>
          </Specimen>
          <Specimen label="invalid (digit count)">
            <Field label="Mobile number" error="Enter a 10-digit mobile number." className="w-full">
              <PhoneInput defaultValue="+91984501" />
            </Field>
          </Specimen>
          <Specimen label="invalid from the server (both parts)">
            <Field label="Mobile number" error="This doesn't look like a valid number for the United Arab Emirates." className="w-full">
              <PhoneInput defaultValue="+97112345" invalidPart="both" />
            </Field>
          </Specimen>
          <Specimen label="pasted international number (country switched)">
            <Field label="Mobile number" className="w-full">
              <PhoneInput variant="staff" defaultValue="+971501234567" />
            </Field>
          </Specimen>
          <Specimen label="duplicate found, lead they can see (S07)">
            <Field label="Mobile number" className="w-full">
              <PhoneInput defaultValue="+919876543210" duplicate={{ visible: true, leadNumber: "10482", leadName: "Arjun Mehta", href: "/design/forms#phone-input" }} />
            </Field>
          </Specimen>
          <Specimen label="duplicate found, outside their scope">
            <Field label="Mobile number" className="w-full">
              <PhoneInput defaultValue="+917012345678" duplicate={{ visible: false }} />
            </Field>
          </Specimen>
          <Specimen label="disabled">
            <Field label="Mobile number" disabled className="w-full">
              <PhoneInput defaultValue="+919845012345" />
            </Field>
          </Specimen>
          <Specimen label="read-only">
            <Field label="Mobile number" readOnly className="w-full">
              <PhoneInput defaultValue="+919845012345" />
            </Field>
          </Specimen>
        </StateGrid>
      </Section>
      <KeyboardNote
        items={[
          { keys: ["Tab"], action: "Goes to the country code, then the number." },
          { keys: ["+", "9", "7"], action: "In the native select, typing “+97” jumps by code, because options start with it." },
        ]}
      />
    </Section>
  );
}

/* -------------------------------------------------------------------------------------------------
 * OtpInput
 * -----------------------------------------------------------------------------------------------*/

let otpTries = 3;
async function verifyDemo(code: string): Promise<OtpVerifyResult> {
  await wait(900);
  if (code === "482913") return { ok: true };
  otpTries = Math.max(0, otpTries - 1);
  return { ok: false, reason: "wrong", triesLeft: otpTries };
}

export function OtpInputSpecimens() {
  return (
    <Section
      id="otp-input"
      title="OtpInput"
      description="A 6-digit code from SMS, email or an authenticator app. One field, never one box per digit; paste always works; no auto-submit. The hint says where the code went."
    >
      <Section id="otp-input-variants" title="Variants" level={3}>
        <StateGrid columns={2}>
          <Specimen label="sms (public, WebOTP and one-time-code)" note="Try it: 482913 is right; anything else is wrong" surface="bg">
            <OtpInput
              channel="sms"
              surface="public"
              destination="+91 98765 43210"
              expiryNote="The code works for 10 minutes."
              onChangeDestination={() => undefined}
              onVerify={verifyDemo}
              onResend={() => wait(600).then(() => true)}
              className="w-full max-w-public"
            />
          </Specimen>
          <Specimen label="email (staff)">
            <OtpInput channel="email" destination="priya@example.com" onChangeDestination={() => undefined} initialResendIn={0} onVerify={verifyDemo} />
          </Specimen>
          <Specimen label="totp (S03: no resend, recovery code)" note="Try it: “Use a recovery code” swaps the field">
            <OtpInput channel="totp" onVerify={verifyDemo} onRecoveryCode={() => wait(600).then(() => false)} />
          </Specimen>
          <Specimen label="guardian (nothing sent until “Send code”)" surface="bg">
            <OtpInput
              channel="guardian"
              surface="public"
              destination="+91 98450 12345"
              expiryNote="The code works for 10 minutes."
              onSend={() => wait(800).then(() => true)}
              onVerify={verifyDemo}
              className="w-full max-w-public"
            />
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="otp-input-sizes" title="Sizes" level={3}>
        <StateGrid columns={2}>
          <Specimen label="public · 48 px field, w-44; Verify lg, full width" surface="bg">
            <OtpInput channel="sms" surface="public" destination="+91 98765 43210" initialCode="482913" initialResendIn={0} className="w-full max-w-public" />
          </Specimen>
          <Specimen label="staff (S03) · 40 px field, w-40; Verify md">
            <OtpInput channel="totp" initialCode="771204" />
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="otp-input-states" title="States" level={3}>
        <StateGrid columns={3}>
          <Specimen label="waiting (code sent, empty)">
            <OtpInput channel="sms" destination="+91 98765 43210" initialStatus="waiting" />
          </Specimen>
          <Specimen label="typing">
            <OtpInput channel="sms" destination="+91 98765 43210" initialCode="4829" />
          </Specimen>
          <Specimen label="filled (6 digits)">
            <OtpInput channel="sms" destination="+91 98765 43210" initialCode="482913" initialResendIn={0} />
          </Specimen>
          <Specimen label="verifying (field read-only)">
            <OtpInput channel="sms" destination="+91 98765 43210" initialCode="482913" initialStatus="verifying" onVerify={verifyDemo} initialResendIn={0} />
          </Specimen>
          <Specimen label="verified">
            <OtpInput channel="sms" destination="+91 98765 43210" initialCode="482913" initialStatus="verified" initialResendIn={0} />
          </Specimen>
          <Specimen label="wrong code (tries left)">
            <OtpInput channel="sms" destination="+91 98765 43210" initialCode="482931" initialStatus="wrong" initialTriesLeft={3} initialResendIn={0} />
          </Specimen>
          <Specimen label="expired">
            <OtpInput channel="email" destination="priya@example.com" initialCode="482913" initialStatus="expired" initialResendIn={0} />
          </Specimen>
          <Specimen label="too many tries (field disabled)">
            <OtpInput channel="sms" destination="+91 98765 43210" initialCode="111111" initialStatus="locked" initialLockedUntil="4:45 pm" initialResendIn={0} />
          </Specimen>
          <Specimen label="resend countdown" note="“Resend code” is aria-disabled; the countdown is aria-hidden">
            <OtpInput channel="sms" destination="+91 98765 43210" initialResendIn={24} />
          </Specimen>
          <Specimen label="resent" note="The polite status says “We sent a new code.”">
            <OtpInput channel="sms" destination="+91 98765 43210" initialResendIn={30} />
          </Specimen>
          <Specimen label="send failed">
            <OtpInput channel="sms" destination="+91 98765 4321" initialStatus="send-failed" initialResendIn={0} />
          </Specimen>
        </StateGrid>
      </Section>
      <KeyboardNote
        items={[
          { keys: ["Tab"], action: "Input, Verify, Resend code, Change number." },
          { keys: ["Enter"], action: "In the input: verifies (submits)." },
          { keys: ["Ctrl + V", "Cmd + V"], action: "Paste works; everything except the first 6 digits is dropped." },
        ]}
      />
    </Section>
  );
}

/* -------------------------------------------------------------------------------------------------
 * DatePicker
 * -----------------------------------------------------------------------------------------------*/

function DayPicture({ label, classes, day = 14, name }: { label: string; classes: string; day?: number; name: string }) {
  return (
    <figure className="m-0 flex flex-col items-center gap-1">
      <span role="img" aria-label={name} className={cn(calendarDayClassName.base, classes)}>
        <span aria-hidden="true">{day}</span>
      </span>
      <figcaption className="text-xs text-muted">{label}</figcaption>
    </figure>
  );
}

export function DatePickerSpecimens() {
  return (
    <Section
      id="date-picker"
      title="DatePicker"
      description="One calendar date, no time. Type it (day first: 06/10/2026, 6 Oct 2026, 2026-10-06) or pick it from the calendar; the input is always enough on its own. The value leaves as an ISO date."
    >
      <Section id="date-picker-variants" title="Variants" level={3}>
        <StateGrid columns={2}>
          <Specimen label="popover (staff default)" note="Try it: Alt + ArrowDown or the calendar button">
            <Field label="Follow-up date" hint="For example 06/10/2026" className="w-full">
              <DatePicker today={GALLERY_TODAY} defaultValue="2026-10-09" name="follow_up_date" />
            </Field>
          </Specimen>
          <Specimen label="memorable date (public date of birth)" surface="bg">
            <MemorableDate legend="Date of birth" name="dob" surface="public" ownDate />
          </Specimen>
          <Specimen label="memorable date (staff, S07 and S08)">
            <MemorableDate legend="Date of birth" name="lead_dob" surface="staff" defaultValue="2008-03-27" />
          </Specimen>
          <Specimen label="inline calendar (no input)" className="sm:col-span-2">
            <div className={cn(POPOVER_PANEL, "p-3")}>
              <Calendar today={TODAY} selected={fromIso("2026-10-09")} defaultMonth={{ year: 2026, month: 10 }} />
            </div>
          </Specimen>
          <Specimen label="with min and max (from today, within 60 days)">
            <Field label="Campus visit date" className="w-full">
              <DatePicker today={GALLERY_TODAY} min={GALLERY_TODAY} max="2026-12-05" />
            </Field>
          </Specimen>
          <Specimen label="with disabled dates (holidays), wide range with month and year selects">
            <Field label="Payment date" className="w-full">
              <DatePicker today={GALLERY_TODAY} disabledDates={["2026-10-20", "2026-10-21"]} captionLayout="dropdown" min="2024-04-01" />
            </Field>
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="date-picker-sizes" title="Sizes" level={3}>
        <StateGrid columns={3}>
          <Specimen label="sm · 32 px, w-40">
            <Field label="From">
              <DatePicker size="sm" today={GALLERY_TODAY} defaultValue="2026-09-01" />
            </Field>
          </Specimen>
          <Specimen label="md · 40 px, w-40">
            <Field label="Follow-up date">
              <DatePicker today={GALLERY_TODAY} defaultValue="2026-10-06" />
            </Field>
          </Specimen>
          <Specimen label="public · memorable date, 48 px" surface="bg">
            <MemorableDate legend="Date of birth" name="dob-size" surface="public" defaultValue="2009-11-14" />
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="date-picker-states" title="States" level={3}>
        <StateGrid columns={3}>
          <Specimen label="empty">
            <Field label="Follow-up date" hint="For example 06/10/2026">
              <DatePicker today={GALLERY_TODAY} />
            </Field>
          </Specimen>
          <Specimen label="typing" note="Read on blur or Enter; shown again as 06 Oct 2026">
            <Field label="Follow-up date">
              <DatePicker today={GALLERY_TODAY} defaultText="6/10/26" />
            </Field>
          </Specimen>
          <Specimen label="valid (canonical 06 Oct 2026)">
            <Field label="Follow-up date">
              <DatePicker today={GALLERY_TODAY} defaultValue="2026-10-06" />
            </Field>
          </Specimen>
          <Specimen label="invalid (cannot be read)">
            <Field label="Follow-up date" error="Enter a date like 06/10/2026.">
              <DatePicker today={GALLERY_TODAY} defaultText="next Tuesday" />
            </Field>
          </Specimen>
          <Specimen label="invalid (not a real date)">
            <Field label="Follow-up date" error="That date doesn't exist. Check the day and month.">
              <DatePicker today={GALLERY_TODAY} defaultText="31/09/2026" />
            </Field>
          </Specimen>
          <Specimen label="invalid (outside min)">
            <Field label="Campus visit date" error="Choose a date on or after 06 Oct 2026.">
              <DatePicker today={GALLERY_TODAY} min={GALLERY_TODAY} defaultText="02/10/2026" />
            </Field>
          </Specimen>
          <Specimen label="warning (a past date, allowed: S11)">
            <Field label="Follow-up date">
              <DatePicker today={GALLERY_TODAY} defaultValue="2026-10-01" pastWarning="This date has passed. The follow-up will show as overdue." />
            </Field>
          </Specimen>
          <Specimen label="disabled">
            <Field label="Follow-up date" disabled>
              <DatePicker today={GALLERY_TODAY} defaultValue="2026-10-06" />
            </Field>
          </Specimen>
          <Specimen label="read-only">
            <Field label="Follow-up date" readOnly>
              <DatePicker today={GALLERY_TODAY} defaultValue="2026-10-06" />
            </Field>
          </Specimen>
          <Specimen label="open (the popover is a dialog: “Choose a date”)" className="sm:col-span-2">
            <div className={cn(POPOVER_PANEL, "p-3")}>
              <Calendar today={TODAY} selected={fromIso("2026-10-14")} defaultMonth={{ year: 2026, month: 10 }} isDateDisabled={(d) => d.day === 20 && d.month === 10} />
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <span className={buttonVariants({ variant: "ghost", size: "sm" })}>Today</span>
                <span className={buttonVariants({ variant: "ghost", size: "sm" })}>Clear</span>
              </div>
            </div>
          </Specimen>
          <Specimen label="day states" note="Still pictures of single day cells" className="sm:col-span-2" stack>
            <div className="flex flex-wrap gap-4">
              <DayPicture label="default" classes="" name="Wednesday, 14 October 2026" />
              <DayPicture label="hover" classes="bg-surface-hover" name="Wednesday, 14 October 2026, hover" />
              <DayPicture label="focused" classes={cn(simulatedFocus, "outline-offset-(--focus-inset)")} name="Wednesday, 14 October 2026, focused" />
              <DayPicture label="chosen" classes={calendarDayClassName.chosen} name="Wednesday, 14 October 2026, chosen" />
              <DayPicture label="chosen, focused" classes={cn(calendarDayClassName.chosen, "outline-2 outline-offset-(--focus-inset) outline-on-accent outline-solid")} name="Wednesday, 14 October 2026, chosen and focused" />
              <DayPicture label="today" day={6} classes={calendarDayClassName.today} name="Tuesday, 6 October 2026, today" />
              <DayPicture label="today, chosen" day={6} classes={cn(calendarDayClassName.chosen, calendarDayClassName.today, calendarDayClassName.todayChosen)} name="Tuesday, 6 October 2026, today and chosen" />
              <DayPicture label="outside month" day={30} classes={calendarDayClassName.outside} name="Wednesday, 30 September 2026" />
              <DayPicture label="disabled" day={20} classes={calendarDayClassName.disabled} name="Tuesday, 20 October 2026, unavailable" />
            </div>
          </Specimen>
        </StateGrid>
      </Section>
      <KeyboardNote
        items={[
          { keys: ["Alt + ArrowDown"], action: "In the input: opens the calendar. Enter reads the typed date." },
          { keys: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"], action: "Move by a day or a week." },
          { keys: ["Home", "End"], action: "Start and end of the week." },
          { keys: ["PageUp", "PageDown"], action: "Previous and next month; with Shift, the year." },
          { keys: ["Enter", "Space"], action: "Choose the day; the popover closes and focus returns to the calendar button." },
          { keys: ["Esc"], action: "Closes and returns focus to the calendar button." },
          { keys: ["Tab"], action: "Moves through the caption, the grid and the footer; focus stays in the popover until it closes." },
        ]}
      />
    </Section>
  );
}

/* -------------------------------------------------------------------------------------------------
 * DateTimePicker
 * -----------------------------------------------------------------------------------------------*/

export function DateTimePickerSpecimens() {
  return (
    <Section
      id="date-time-picker"
      title="DateTimePicker"
      description="A moment: a date, a time (typed, or from a 15-minute list) and its time zone. The summary line says how it was read; a second line converts it when your own zone differs. Below 480 px the three parts stack."
    >
      <Section id="date-time-picker-variants" title="Variants" level={3}>
        <div className="grid grid-cols-1 gap-4">
          <Specimen label="with a zone picker (S11, S16)" note="Try it: type “430p”, or pick another zone">
            <DateTimePicker defaultDate="2026-10-06" defaultTime="16:30" now={GALLERY_NOW} recentZones={["Asia/Dubai", "Asia/Singapore"]} className="w-full" />
          </Specimen>
          <Specimen label="zone fixed to the institution's (“Times in IST”)">
            <DateTimePicker zonePicker={false} defaultDate="2026-10-09" defaultTime="11:00" now={GALLERY_NOW} className="w-full" />
          </Specimen>
          <Specimen label="with an end time (S11)" note="Try it: “Add end time”">
            <DateTimePicker withEndTime zonePicker={false} defaultDate="2026-10-09" defaultTime="15:00" now={GALLERY_NOW} className="w-full" />
          </Specimen>
        </div>
      </Section>

      <Section id="date-time-picker-sizes" title="Sizes" level={3}>
        <div className="grid grid-cols-1 gap-4">
          <Specimen label="sm · 32 px (compact rows)">
            <DateTimePicker size="sm" zonePicker={false} defaultDate="2026-10-12" defaultTime="10:15" now={GALLERY_NOW} className="w-full" />
          </Specimen>
        </div>
      </Section>

      <Section id="date-time-picker-states" title="States" level={3}>
        <StateGrid columns={2}>
          <Specimen label="empty">
            <DateTimePicker zonePicker={false} now={GALLERY_NOW} className="w-full" />
          </Specimen>
          <Specimen label="date only (error on submit)">
            <DateTimePicker zonePicker={false} defaultDate="2026-10-09" error="Choose a time." now={GALLERY_NOW} className="w-full" />
          </Specimen>
          <Specimen label="valid">
            <DateTimePicker zonePicker={false} defaultDate="2026-10-07" defaultTime="16:30" now={GALLERY_NOW} className="w-full" />
          </Specimen>
          <Specimen label="past (a warning, not an error)">
            <DateTimePicker zonePicker={false} defaultDate="2026-10-05" defaultTime="10:00" now={GALLERY_NOW} className="w-full" />
          </Specimen>
          <Specimen label="a time that does not exist (clocks go forward)">
            <DateTimePicker defaultZone="Europe/London" defaultDate="2026-03-29" defaultTime="01:30" now={GALLERY_NOW} className="w-full" />
          </Specimen>
          <Specimen label="a time that happens twice (first one, offset shown)">
            <DateTimePicker defaultZone="Europe/London" defaultDate="2026-10-25" defaultTime="01:30" now={GALLERY_NOW} className="w-full" />
          </Specimen>
          <Specimen label="time text that cannot be read">
            <DateTimePicker zonePicker={false} defaultDate="2026-10-09" error="Enter a time like 4:30 pm." now={GALLERY_NOW} className="w-full" />
          </Specimen>
          <Specimen label="viewer's zone differs (second line; info alert within 24 hours)">
            <DateTimePicker defaultZone="Asia/Dubai" defaultDate="2026-10-06" defaultTime="18:00" now={GALLERY_NOW} className="w-full" />
          </Specimen>
          <Specimen label="clash (a warning; saving still works)">
            <DateTimePicker
              zonePicker={false}
              defaultDate="2026-10-07"
              defaultTime="16:30"
              now={GALLERY_NOW}
              clash="Asha already has a follow-up at 4:30 pm IST on 07 Oct. You can still save."
              className="w-full"
            />
          </Specimen>
          <Specimen label="disabled">
            <DateTimePicker zonePicker={false} defaultDate="2026-10-07" defaultTime="16:30" now={GALLERY_NOW} disabled className="w-full" />
          </Specimen>
          <Specimen label="read-only">
            <DateTimePicker zonePicker={false} defaultDate="2026-10-07" defaultTime="16:30" now={GALLERY_NOW} readOnly className="w-full" />
          </Specimen>
        </StateGrid>
      </Section>
      <KeyboardNote
        items={[
          { keys: ["Tab"], action: "Date, calendar button, time, time zone." },
          { keys: ["ArrowDown", "ArrowUp"], action: "Time and zone: open the list and move (Combobox keys); Enter chooses, Esc closes." },
          { keys: ["PageUp", "PageDown"], action: "Time list: an hour up or down." },
        ]}
      />
    </Section>
  );
}

/* -------------------------------------------------------------------------------------------------
 * DateRangePicker
 * -----------------------------------------------------------------------------------------------*/

export function DateRangePickerSpecimens() {
  return (
    <Section
      id="date-range-picker"
      title="DateRangePicker"
      description="A start and an end date for reports and filters, with presets and an optional comparison period. Nothing changes until Apply, so reports query once."
    >
      <Section id="date-range-picker-variants" title="Variants" level={3}>
        <StateGrid columns={3}>
          <Specimen label="presets and calendar (reports)" note="Try it: Ctrl + Enter applies from anywhere inside">
            <DateRangePicker today={GALLERY_TODAY} defaultValue={{ from: "2026-09-01", to: "2026-09-30", compare: null }} />
          </Specimen>
          <Specimen label="calendar only (list filters)">
            <DateRangePicker presets={false} today={GALLERY_TODAY} />
          </Specimen>
          <Specimen label="with compare (S20)">
            <DateRangePicker compare today={GALLERY_TODAY} defaultValue={{ from: "2026-09-01", to: "2026-09-30", compare: "previous" }} />
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="date-range-picker-sizes" title="Sizes" level={3}>
        <StateGrid columns={2}>
          <Specimen label="sm · 32 px (page bar)">
            <DateRangePicker size="sm" today={GALLERY_TODAY} defaultValue={{ from: "2026-10-01", to: "2026-10-06", compare: null }} />
          </Specimen>
          <Specimen label="md · 40 px">
            <DateRangePicker size="md" today={GALLERY_TODAY} defaultValue={{ from: "2026-10-01", to: "2026-10-06", compare: null }} />
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="date-range-picker-states" title="States" level={3} description="States inside the popover are still pictures drawn with the component's own parts.">
        <StateGrid columns={2}>
          <Specimen label="empty (“Any date”)">
            <DateRangePicker today={GALLERY_TODAY} />
          </Specimen>
          <Specimen label="preset chosen (applied)">
            <DateRangePicker today={GALLERY_TODAY} defaultValue={{ from: "2026-09-07", to: "2026-10-06", compare: null }} />
          </Specimen>
          <Specimen label="custom range (applied)">
            <DateRangePicker today={GALLERY_TODAY} defaultValue={{ from: "2026-08-14", to: "2026-09-02", compare: null }} />
          </Specimen>
          <Specimen label="disabled">
            <DateRangePicker today={GALLERY_TODAY} disabled defaultValue={{ from: "2026-09-01", to: "2026-09-30", compare: null }} />
          </Specimen>
          <Specimen label="open: quick ranges (chosen preset has a Check)">
            <fieldset className={cn(POPOVER_PANEL, "m-0 w-full max-w-56 p-2")}>
              <legend className="sr-only">Quick ranges, still picture</legend>
              {DATE_RANGE_PRESETS.slice(0, 5).map((preset) => (
                <label
                  key={preset.value}
                  className="flex h-menu-item items-center justify-between gap-2 rounded-sm px-2 text-sm text-fg has-[:checked]:bg-accent-subtle has-[:checked]:font-medium"
                >
                  <input type="radio" name="preset-picture" defaultChecked={preset.value === "last_30_days"} className="peer sr-only" />
                  {preset.label}
                  <Check aria-hidden="true" className="hidden size-icon-sm text-accent peer-checked:block" />
                </label>
              ))}
            </fieldset>
          </Specimen>
          <Specimen label="start chosen (waiting for the end)" className="sm:col-span-2">
            <div className={cn(POPOVER_PANEL, "p-3")}>
              <Calendar mode="range" today={TODAY} range={{ from: fromIso("2026-10-12"), to: null }} defaultMonth={{ year: 2026, month: 10 }} />
            </div>
          </Specimen>
          <Specimen label="range chosen (ends filled, the days between tinted)" className="sm:col-span-2">
            <div className={cn(POPOVER_PANEL, "p-3")}>
              <Calendar mode="range" today={TODAY} range={{ from: fromIso("2026-10-05"), to: fromIso("2026-10-16") }} defaultMonth={{ year: 2026, month: 10 }} />
            </div>
          </Specimen>
          <Specimen label="hover previews the range" note={SIMULATED_NOTE} stack>
            <div className="flex">
              <span role="img" aria-label="12 October, start of range" className={cn(calendarDayClassName.base, calendarDayClassName.chosen)}>
                <span aria-hidden="true">12</span>
              </span>
              {[13, 14, 15].map((day) => (
                <span key={day} role="img" aria-label={`${day} October, in the preview`} className={cn(calendarDayClassName.base, calendarDayClassName.preview)}>
                  <span aria-hidden="true">{day}</span>
                </span>
              ))}
            </div>
          </Specimen>
          <Specimen label="invalid" stack>
            <p className="m-0 text-xs font-medium text-danger">The end date is before the start date.</p>
            <p className="m-0 text-xs font-medium text-danger">Choose a range of 366 days or less.</p>
          </Specimen>
          <Specimen label="two months (from 768 px)" className="sm:col-span-2">
            <div className={cn(POPOVER_PANEL, "max-w-full overflow-x-auto p-3")}>
              <Calendar mode="range" numberOfMonths={2} today={TODAY} range={{ from: fromIso("2026-09-21"), to: fromIso("2026-10-06") }} defaultMonth={{ year: 2026, month: 9 }} />
            </div>
          </Specimen>
        </StateGrid>
      </Section>
      <KeyboardNote
        items={[
          { keys: ["Enter", "Space"], action: "On the trigger: opens; focus goes to the chosen preset, or to “From”." },
          { keys: ["ArrowDown", "ArrowUp"], action: "Presets are a radio group: arrows move and choose." },
          { keys: ["Enter"], action: "In the grid: sets the start, then the end (DatePicker keys)." },
          { keys: ["Ctrl + Enter", "Cmd + Enter"], action: "Applies from anywhere inside." },
          { keys: ["Esc"], action: "Cancels and returns focus to the trigger." },
        ]}
      />
    </Section>
  );
}

/* -------------------------------------------------------------------------------------------------
 * FileUpload
 * -----------------------------------------------------------------------------------------------*/

/** Simulated uploads: about 2 s of progress; a name with "offline" fails, one with "corrupt" can't be read. */
const demoUploader: FileUploader = (file, { onProgress, signal }) =>
  new Promise((resolve, reject) => {
    let percent = 0;
    const timer = window.setInterval(() => {
      percent += 10;
      onProgress(Math.min(percent, 100));
      if (percent >= 100) {
        window.clearInterval(timer);
        if (/offline/i.test(file.name)) reject(new UploadError("network"));
        else if (/corrupt/i.test(file.name)) reject(new UploadError("unreadable"));
        else resolve({ id: `file_${file.name}` });
      }
    }, 200);
    signal.addEventListener("abort", () => {
      window.clearInterval(timer);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });

export function FileUploadSpecimens() {
  return (
    <Section
      id="file-upload"
      title="FileUpload"
      description="Choose files or drop them. “Choose file” is the label of a visually hidden native file input, so the keyboard path is the same as the mouse path and dragging is never the only way. Type and size are checked before upload; every error names the file."
    >
      <Section id="file-upload-variants" title="Variants" level={3} description="Live: files upload to a simulated server. A name with “offline” fails; one with “corrupt” can't be read.">
        <StateGrid columns={2}>
          <Specimen label="single (S07 import): its row replaces the dropzone">
            <Field label="Leads file" hint="CSV or XLSX, up to 10 MB." className="w-full">
              <FileUpload name="import" variant="single" accept={[".csv", ".xlsx"]} typeLabel="CSV or XLSX file" maxBytes={10 * MB} upload={demoUploader} />
            </Field>
          </Specimen>
          <Specimen label="multiple (S10 attachments, up to 5, 5 MB in total)">
            <Field label="Attachments" hint="Up to 5 files, 5 MB in total." className="w-full">
              <FileUpload
                name="attachments"
                variant="multiple"
                maxFiles={5}
                maxTotalBytes={5 * MB}
                totalLabel="Email attachments"
                upload={demoUploader}
                initialFiles={[{ key: "brochure", name: "fee-structure-2026.pdf", size: 820_000, status: "uploaded", id: "file_1" }]}
              />
            </Field>
          </Specimen>
          <Specimen label="compact (S15 reply): a Paperclip button">
            <Field label="Attachment" layout="hidden-label" className="w-full">
              <FileUpload name="reply_attachment" variant="compact" maxBytes={5 * MB} upload={demoUploader} />
            </Field>
          </Specimen>
          <Specimen label="public (S01): button only, 48 px" surface="bg">
            <Field label="Class 12 marksheet" hint="PDF or photo, up to 5 MB." surface="public" className="w-full">
              <FileUpload name="marksheet" variant="public" accept={[".pdf", ".jpg", ".jpeg", ".png"]} typeLabel="PDF or photo" maxBytes={5 * MB} upload={demoUploader} />
            </Field>
          </Specimen>
        </StateGrid>
      </Section>

      <Section id="file-upload-states" title="States" level={3}>
        <StateGrid columns={2}>
          <Specimen label="empty">
            <Field label="Bank statement" hint="CSV or PDF, up to 10 MB." className="w-full">
              <FileUpload name="statement" variant="single" accept={[".csv", ".pdf"]} upload={demoUploader} />
            </Field>
          </Specimen>
          <Specimen label="drag over" note={SIMULATED_NOTE}>
            <div className={cn(dropzoneClassName("over"), "w-full")}>
              <CloudUpload aria-hidden="true" className="size-icon-lg" />
              <p className="m-0 font-medium">Drop to add</p>
            </div>
          </Specimen>
          <Specimen label="drag over with too many files" note={SIMULATED_NOTE}>
            <div className={cn(dropzoneClassName("over"), "w-full")}>
              <CloudUpload aria-hidden="true" className="size-icon-lg" />
              <p className="m-0 font-medium">You can attach up to 5 files.</p>
            </div>
          </Specimen>
          <Specimen label="choosing (the system dialog is open; the label keeps its ring)" note={SIMULATED_NOTE}>
            <div className={cn(dropzoneClassName("idle"), simulatedFocus, "w-full")}>
              <CloudUpload aria-hidden="true" className="size-icon-lg" />
              <p className="m-0">Drag a file here, or</p>
              <span className={cn(buttonVariants({ variant: "secondary", size: "md" }), simulatedFocus)}>Choose file</span>
            </div>
          </Specimen>
          <Specimen label="checking, uploading and uploaded rows">
            <Field label="Documents" className="w-full">
              <FileUpload
                name="documents"
                variant="multiple"
                upload={demoUploader}
                initialFiles={[
                  { key: "a", name: "aadhaar-masked.pdf", size: 412_000, status: "checking" },
                  { key: "b", name: "class-12-marksheet-ananya-iyer.pdf", size: 1_900_000, status: "uploading", progress: 45 },
                  { key: "c", name: "transfer-certificate.jpg", size: 1_200_000, status: "uploaded", id: "file_c" },
                ]}
              />
            </Field>
          </Specimen>
          <Specimen label="wrong type, too large, empty file">
            <Field label="Leads file" hint="CSV or XLSX, up to 10 MB." className="w-full">
              <FileUpload
                name="import-errors"
                variant="multiple"
                upload={demoUploader}
                initialFiles={[
                  { key: "t", name: "leads-oct.pdf", size: 240_000, status: "invalid", message: "leads-oct.pdf isn't a CSV or XLSX file." },
                  { key: "s", name: "photo.jpg", size: 7.2 * MB, status: "invalid", message: "photo.jpg is 7.2 MB. The limit is 5 MB." },
                  { key: "e", name: "notes.txt", size: 0, status: "invalid", message: "notes.txt is empty." },
                ]}
              />
            </Field>
          </Specimen>
          <Specimen label="too many files">
            <Field label="Attachments" error="You can attach up to 5 files. Remove one first." className="w-full">
              <FileUpload name="too-many" variant="compact" upload={demoUploader} />
            </Field>
          </Specimen>
          <Specimen label="total too large">
            <Field label="Attachments" error="These files add up to 6.1 MB. Email attachments can total 5 MB." className="w-full">
              <FileUpload name="too-big" variant="compact" upload={demoUploader} />
            </Field>
          </Specimen>
          <Specimen label="upload failed, server could not read, cancelled">
            <Field label="Documents" className="w-full">
              <FileUpload
                name="documents-failed"
                variant="multiple"
                upload={demoUploader}
                initialFiles={[
                  { key: "f", name: "brochure.pdf", size: 2_400_000, status: "failed", message: "brochure.pdf didn't upload. Check your connection and try again." },
                  { key: "u", name: "leads-oct.xlsx", size: 640_000, status: "unreadable", message: "We couldn't read leads-oct.xlsx. Save it again and retry." },
                  { key: "x", name: "hostel-form.pdf", size: 300_000, status: "cancelled" },
                ]}
              />
            </Field>
          </Specimen>
          <Specimen label="disabled">
            <Field label="Leads file" disabled className="w-full">
              <FileUpload name="disabled" variant="single" upload={demoUploader} />
            </Field>
          </Specimen>
          <Specimen label="read-only (list with download links)">
            <Field label="Documents" readOnly className="w-full">
              <FileUpload
                name="readonly"
                readOnly
                initialFiles={[
                  { key: "r1", name: "class-12-marksheet.pdf", size: 1_900_000, status: "uploaded", href: "#file-upload" },
                  { key: "r2", name: "fee-receipt-SCE-2026-0412.pdf", size: 96_000, status: "uploaded", href: "#file-upload" },
                ]}
              />
            </Field>
          </Specimen>
        </StateGrid>
      </Section>
      <KeyboardNote
        items={[
          { keys: ["Tab"], action: "Reaches the native file input (drawn as the “Choose file” button), then each row's actions." },
          { keys: ["Enter", "Space"], action: "Opens the file dialog." },
          { keys: ["Tab"], action: "After Remove, focus moves to the next row's action, or back to “Choose file”." },
        ]}
      />
    </Section>
  );
}
