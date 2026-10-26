/**
 * The six admission milestones behind JourneyBar (components.md, JourneyBar). The labels are ours;
 * the data fields keep their schema names. Dates arrive formatted on the server ("06 Oct 2026").
 * Pure functions, unit tested in journey.test.ts.
 */

export type JourneyMilestones = {
  /** leads.created_at: always set. */
  newEnquiry: string;
  /** The first of email_verified_at and mobile_verified_at. */
  contactVerified?: string | null;
  /** application_started_at. */
  formStarted?: string | null;
  /** payment_approved_at. */
  formFeePaid?: string | null;
  /** application_submitted_at. */
  formSubmitted?: string | null;
  /** token_fee_paid_at: the student is enrolled. */
  seatBooked?: string | null;
};

export const JOURNEY_STEPS = [
  { key: "newEnquiry", label: "New enquiry" },
  { key: "contactVerified", label: "Contact verified" },
  { key: "formStarted", label: "Form started" },
  { key: "formFeePaid", label: "Form fee paid" },
  { key: "formSubmitted", label: "Form submitted" },
  { key: "seatBooked", label: "Seat booked" },
] as const satisfies ReadonlyArray<{ key: keyof JourneyMilestones; label: string }>;

/**
 * reached: done, with its date. current: the furthest step reached. not-reached: after the current
 * step. not-recorded: before the current step but with no date on record.
 */
export type JourneyStepState = "reached" | "current" | "not-reached" | "not-recorded";

export type JourneyStep = {
  index: number;
  label: string;
  state: JourneyStepState;
  /** The date reached, "Not yet" or "Not recorded". */
  dateText: string;
};

export function journeySteps(milestones: JourneyMilestones): JourneyStep[] {
  const dates = JOURNEY_STEPS.map((step) => milestones[step.key] ?? null);
  let current = 0;
  dates.forEach((date, index) => {
    if (date) current = index;
  });
  return JOURNEY_STEPS.map((step, index) => {
    const date = dates[index];
    let state: JourneyStepState;
    if (index === current) state = "current";
    else if (index > current) state = "not-reached";
    else state = date ? "reached" : "not-recorded";
    return {
      index,
      label: step.label,
      state,
      dateText: date ?? (state === "not-recorded" ? "Not recorded" : "Not yet"),
    };
  });
}

/** The compact column text: "3 of 6 · Form started". */
export function journeySummary(steps: readonly JourneyStep[]): string {
  const current = steps.find((step) => step.state === "current") ?? steps[0];
  return `${current.index + 1} of ${steps.length} · ${current.label}`;
}
