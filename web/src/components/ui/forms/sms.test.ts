import { describe, expect, it } from "vitest";
import { countCharacters, countSms, smsSummary } from "./sms";

describe("countSms", () => {
  it("counts GSM-7 parts at 160 and 153", () => {
    expect(countSms("a".repeat(160))).toMatchObject({ encoding: "gsm7", parts: 1 });
    expect(countSms("a".repeat(161))).toMatchObject({ encoding: "gsm7", parts: 2, perPart: 153 });
    expect(countSms("a".repeat(307))).toMatchObject({ parts: 3 });
  });
  it("counts extension characters as two", () => {
    expect(countSms("€{}").length).toBe(6);
  });
  it("switches to Unicode for Hindi and emoji, counting UTF-16 units", () => {
    const hindi = countSms("नमस्ते, आपका आवेदन मिल गया है।");
    expect(hindi.encoding).toBe("unicode");
    expect(countSms("Hi 🙂").length).toBe(5);
    expect(countSms("क".repeat(71))).toMatchObject({ parts: 2, perPart: 67 });
  });
  it("counts merge tokens at their maximum length and marks the count as about", () => {
    const info = countSms("Hi {{first_name}}", { first_name: 20 });
    expect(info.length).toBe(23);
    expect(info.estimated).toBe(true);
    expect(countSms("Hi {{course}}").length).toBe(33);
    expect(smsSummary(countSms("Hi {{course}}"))).toBe("about 33 characters · 1 SMS");
  });
  it("summarises", () => {
    expect(smsSummary(countSms("a".repeat(148)))).toBe("148 characters · 1 SMS");
    expect(smsSummary(countSms("a".repeat(172)))).toBe("172 characters · 2 SMS parts");
  });
  it("counts characters as code points", () => {
    expect(countCharacters("🙂a")).toBe(2);
  });
});
