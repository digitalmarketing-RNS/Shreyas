import { describe, expect, it } from "vitest";
import { checkFile, formatFileSize, middleTruncate } from "./files";

describe("files", () => {
  it("formats sizes", () => {
    expect(formatFileSize(7.2 * 1024 * 1024)).toBe("7.2 MB");
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5 MB");
    expect(formatFileSize(2048)).toBe("2 KB");
  });
  it("shortens long names in the middle", () => {
    const short = middleTruncate("admission-fair-registrations-2026-oct.csv");
    expect(short.endsWith(".csv")).toBe(true);
    expect(short).toContain("…");
    expect([...short].length).toBeLessThanOrEqual(28);
  });
  it("names the file in every problem", () => {
    const accept = [".csv", ".xlsx"];
    expect(checkFile({ name: "leads-oct.pdf", type: "application/pdf", size: 10 }, { accept, typeLabel: "CSV or XLSX file" })?.message).toBe(
      "leads-oct.pdf isn't a CSV or XLSX file.",
    );
    expect(checkFile({ name: "notes.csv", type: "text/csv", size: 0 }, { accept })?.message).toBe("notes.csv is empty.");
    expect(checkFile({ name: "photo.jpg", type: "image/jpeg", size: 7.2 * 1024 * 1024 }, { maxBytes: 5 * 1024 * 1024 })?.message).toBe(
      "photo.jpg is 7.2 MB. The limit is 5 MB.",
    );
  });
});
