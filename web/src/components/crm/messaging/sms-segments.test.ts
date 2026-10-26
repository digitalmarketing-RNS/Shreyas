import { describe, expect, it } from "vitest";
import { countSms, countSmsText, explainEncoding, isGsm7, partsLabel, replaceWithGsm } from "./sms-segments";

describe("countSmsText: GSM-7", () => {
  it("counts an empty message as 0 of 160 in 1 SMS", () => {
    expect(countSmsText("")).toMatchObject({ encoding: "gsm7", units: 0, parts: 1, capacity: 160, left: 160 });
  });

  it("fits 160 basic characters in one part and splits 161 into parts of 153", () => {
    expect(countSmsText("a".repeat(160))).toMatchObject({ parts: 1, perPart: 160, left: 0 });
    expect(countSmsText("a".repeat(161))).toMatchObject({ parts: 2, perPart: 153, capacity: 306, left: 145 });
    expect(countSmsText("a".repeat(306))).toMatchObject({ parts: 2, left: 0 });
    expect(countSmsText("a".repeat(307))).toMatchObject({ parts: 3 });
  });

  it("counts the extension characters as two each", () => {
    for (const char of ["^", "{", "}", "[", "]", "~", "|", "€", "\\", "\f"]) {
      expect(countSmsText(char)).toMatchObject({ encoding: "gsm7", units: 2 });
    }
    expect(countSmsText("Fee: €50 {due}").units).toBe(17);
  });

  it("keeps basic-table letters such as é, Ñ, £ and the newline in GSM-7", () => {
    expect(isGsm7("Café £5\nÑoño")).toBe(true);
    expect(isGsm7("ú")).toBe(false); // ù is in the table, ú is not
    expect(countSmsText("é£\n").units).toBe(3);
  });

  it("puts 80 extension characters (160 units) in one part", () => {
    expect(countSmsText("{".repeat(80))).toMatchObject({ units: 160, parts: 1 });
  });

  it("never splits a two-unit character across parts", () => {
    // 152 basic characters, then "€": 154 units. As 2 parts the € can't start at unit 153 of part 1,
    // so part 1 ends after 152 units and the € opens part 2.
    const text = "a".repeat(152) + "€" + "a".repeat(10);
    const count = countSmsText(text);
    expect(count.units).toBe(164);
    expect(count.parts).toBe(2);
    expect(count.left).toBe(153 - 12);
    // 306 units: naive maths says 2 parts (306 ≤ 306); the € pushed one unit into part 2, so a third starts.
    const straddle = "a".repeat(152) + "€" + "a".repeat(152);
    expect(straddle.length).toBe(305);
    expect(countSmsText(straddle)).toMatchObject({ units: 306, parts: 3 });
  });
});

describe("countSmsText: Unicode (UCS-2)", () => {
  it("switches the whole message to Unicode for one character outside GSM-7", () => {
    expect(countSmsText("Meera’s fee is due")).toMatchObject({ encoding: "ucs2", units: 18, capacity: 70 });
  });

  it("fits 70 units in one part and splits longer text into parts of 67", () => {
    expect(countSmsText("क".repeat(70))).toMatchObject({ encoding: "ucs2", parts: 1, left: 0 });
    expect(countSmsText("क".repeat(71))).toMatchObject({ parts: 2, perPart: 67, capacity: 134 });
    expect(countSmsText("क".repeat(134))).toMatchObject({ parts: 2, left: 0 });
    expect(countSmsText("क".repeat(135))).toMatchObject({ parts: 3 });
  });

  it("counts an emoji outside the basic plane as two UTF-16 units", () => {
    expect(countSmsText("Hi 🙂")).toMatchObject({ encoding: "ucs2", units: 5 });
    expect(countSmsText("🎓".repeat(35))).toMatchObject({ units: 70, parts: 1 });
  });

  it("does not split a surrogate pair across parts", () => {
    const text = "क".repeat(66) + "🙂" + "क".repeat(5);
    const count = countSmsText(text);
    expect(count.units).toBe(73);
    expect(count.parts).toBe(2);
    // Part 1 holds 66 units; the emoji (2 units) and 5 letters fill 7 of part 2.
    expect(count.left).toBe(67 - 7);
  });

  it("counts extension characters as one unit once the message is Unicode", () => {
    expect(countSmsText("{नमस्ते}").units).toBe(8);
  });
});

describe("countSms: merge fields and slots", () => {
  it("counts a field at its maximum length", () => {
    const result = countSms("Hi {{student.first_name|Student}}, your fee is due.", {
      fieldMaxLengths: { "student.first_name": 20 },
    });
    expect(result.units).toBe("Hi , your fee is due.".length + 20);
    expect(result.estimated).toBe(false);
  });

  it("counts a field with no maximum as 30 and marks the count estimated", () => {
    const result = countSms("Course: {{course.name}}");
    expect(result.units).toBe(8 + 30);
    expect(result.estimated).toBe(true);
    expect(result.fields).toEqual([{ name: "course.name", counted: 30, estimated: true }]);
  });

  it("shows a range when the preview recipient's value gives a different part count", () => {
    const text = "a".repeat(140) + " {{student.full_name}}";
    const result = countSms(text, {
      fieldMaxLengths: { "student.full_name": 40 },
      previewValues: { "student.full_name": "Meera Pillai" },
    });
    expect(result.parts).toBe(2);
    expect(result.range).toEqual({ min: 1, max: 2 });
    expect(partsLabel(result)).toBe("1 to 2 SMS");
  });

  it("counts a preview value in Unicode script as Unicode", () => {
    const result = countSms("Namaste {{student.full_name}}", {
      fieldMaxLengths: { "student.full_name": 20 },
      previewValues: { "student.full_name": "अदिति शर्मा" },
    });
    expect(result.encoding).toBe("ucs2");
    expect(result.unicodeScripts).toEqual(["Hindi"]);
  });

  it("counts DLT slots at their length, or 30 when unknown", () => {
    expect(countSms("Dear {#var#}, fee {#var#} due", { slotLengths: [10, 8] }).units).toBe("Dear , fee  due".length + 18);
    const unknown = countSms("Dear {#var#}");
    expect(unknown.units).toBe(5 + 30);
    expect(unknown.estimated).toBe(true);
  });
});

describe("explainEncoding and replacements", () => {
  it("names the characters that forced Unicode, with the word and a replacement", () => {
    const { unicodeCauses } = explainEncoding("Meera’s fee – due…");
    expect(unicodeCauses.map((cause) => [cause.char, cause.name, cause.replacement])).toEqual([
      ["’", "curly apostrophe", "'"],
      ["–", "en dash", "-"],
      ["…", "ellipsis", "..."],
    ]);
    expect(unicodeCauses[0].word).toBe("Meera’s");
  });

  it("lists characters that count twice", () => {
    expect(explainEncoding("{x} [y]").doubleChars).toEqual(["{", "}", "[", "]"]);
  });

  it("replaces every character that has a GSM-7 stand-in and keeps the rest", () => {
    const fixed = replaceWithGsm("Meera’s fee – ₹1,000 “due”…");
    expect(fixed).toBe("Meera's fee - Rs.1,000 \"due\"...");
    expect(isGsm7(fixed)).toBe(true);
    expect(replaceWithGsm("नमस्ते")).toBe("नमस्ते");
  });
});
