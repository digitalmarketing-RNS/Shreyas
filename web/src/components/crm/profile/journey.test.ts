import { describe, expect, it } from "vitest";
import { journeySteps, journeySummary } from "./journey";

describe("journeySteps", () => {
  it("marks steps up to the furthest date as reached and that step as current", () => {
    const steps = journeySteps({ newEnquiry: "01 Oct 2026", contactVerified: "02 Oct 2026", formStarted: "04 Oct 2026" });
    expect(steps.map((step) => step.state)).toEqual(["reached", "reached", "current", "not-reached", "not-reached", "not-reached"]);
    expect(steps[2].dateText).toBe("04 Oct 2026");
    expect(steps[3].dateText).toBe("Not yet");
    expect(journeySummary(steps)).toBe("3 of 6 · Form started");
  });

  it("marks earlier steps with no date as not recorded", () => {
    // A token fee paid with no submitted application on record.
    const steps = journeySteps({ newEnquiry: "01 Oct 2026", contactVerified: "01 Oct 2026", formFeePaid: "03 Oct 2026", seatBooked: "06 Oct 2026" });
    expect(steps.map((step) => step.state)).toEqual(["reached", "reached", "not-recorded", "reached", "not-recorded", "current"]);
    expect(steps[4].dateText).toBe("Not recorded");
    expect(journeySummary(steps)).toBe("6 of 6 · Seat booked");
  });

  it("starts at the new enquiry", () => {
    const steps = journeySteps({ newEnquiry: "06 Oct 2026" });
    expect(steps[0].state).toBe("current");
    expect(journeySummary(steps)).toBe("1 of 6 · New enquiry");
  });
});
