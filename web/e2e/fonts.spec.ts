import { type Page, expect, test } from "@playwright/test";

/**
 * Font loading (decisions.md section 2): Inter's subset is the only font a Latin page loads, ₹ and
 * emoji included; each Indian script downloads its own Noto file only when it appears.
 */

async function fontFiles(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .map((entry) => entry.name)
      .filter((name) => name.endsWith(".woff2"))
      // "/_next/static/media/NotoSansTamil_tamil.02vhix9bl52i8.woff2" → "NotoSansTamil_tamil"
      .map((name) => name.split("/").pop()!.replace(/[-.].*$/, "")),
  );
}

async function addText(page: Page, text: string, lang?: string) {
  await page.evaluate(
    async ([content, language]) => {
      const p = document.createElement("p");
      p.textContent = content;
      if (language) p.lang = language;
      document.querySelector("main")!.append(p);
      p.getBoundingClientRect(); // lay it out, so the browser picks the faces now
      await document.fonts.ready;
    },
    [text, lang ?? ""] as const,
  );
  // Give a font request started by the layout time to show in the resource timeline.
  await page.waitForTimeout(500);
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
}

test("a Latin page loads only the preloaded Inter subset, even with ₹ and emoji", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await addText(page, "Fee received: ₹2,50,000.00 from Ananya Rao 👩‍🎓🎉 · +91 98765 43210 · −₹500.00 refund");
  const files = await fontFiles(page);
  expect(files).toEqual(["InterVariable_latin_rupee"]);
});

test("a Tamil name downloads only the Tamil face", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await addText(page, "ஸ்ரீநிதி", "ta");
  const files = await fontFiles(page);
  expect(files.filter((f) => f.startsWith("Noto"))).toEqual(["NotoSansTamil_tamil"]);
});

test("an Urdu name downloads Noto Naskh Arabic", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await addText(page, "عائشہ", "ur");
  const files = await fontFiles(page);
  expect(files.filter((f) => f.startsWith("Noto"))).toEqual(["NotoNaskhArabic_arabic"]);
});

test("the type specimen with names in ten scripts loads every Indic face", async ({ page }) => {
  await page.goto("/design", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  const files = (await fontFiles(page)).filter((f) => f.startsWith("Noto")).sort();
  expect(files).toEqual([
    "NotoNaskhArabic_arabic",
    "NotoSansBengali_bengali",
    "NotoSansDevanagari_devanagari",
    "NotoSansGujarati_gujarati",
    "NotoSansGurmukhi_gurmukhi",
    "NotoSansKannada_kannada",
    "NotoSansMalayalam_malayalam",
    "NotoSansOriya_oriya",
    "NotoSansTamil_tamil",
    "NotoSansTelugu_telugu",
  ]);
});
