import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { GALLERY_SECTIONS } from "../src/app/design/_gallery/sections";
import { type Theme, expectNoAxeViolations, useTheme, waitForGallery } from "./helpers";

/**
 * Every /design route, in light and dark, at 1280 × 900 and 390 × 844:
 * - a full-page PNG in SCREENS_DIR (outside the repo): <route>-<theme>-<width>.png
 * - at 1280, a compact JPEG (quality 60) in replica/design/screens/<route>-<theme>.jpg for the repo
 * - axe with the WCAG 2.0/2.1/2.2 A and AA tags, zero violations allowed.
 */
const SCREENS_DIR =
  process.env.SCREENS_DIR ??
  "/tmp/claude-0/-home-user-Shreyas/8d6c1a0d-af34-5c03-a4bb-7e9a962280f7/scratchpad/design/screens";
const REPO_SCREENS_DIR = path.resolve(__dirname, "..", "..", "replica", "design", "screens");

const THEMES: Theme[] = ["light", "dark"];
const VIEWPORTS = [
  { width: 1280, height: 900 },
  { width: 390, height: 844 },
];

test.beforeAll(() => {
  fs.mkdirSync(SCREENS_DIR, { recursive: true });
  fs.mkdirSync(REPO_SCREENS_DIR, { recursive: true });
});

for (const section of GALLERY_SECTIONS) {
  for (const theme of THEMES) {
    for (const viewport of VIEWPORTS) {
      test(`${section.href} ${theme} ${viewport.width}`, async ({ page, context, baseURL }) => {
        await useTheme(page, context, baseURL!, theme);
        await page.setViewportSize(viewport);
        const response = await page.goto(section.href, { waitUntil: "networkidle" });
        expect(response?.status(), `${section.href} responds`).toBe(200);
        await waitForGallery(page);

        // The saved theme is on <html> before React runs; light-only pages lock it to light.
        const locked = await page.locator("html[data-theme-lock]").count();
        await expect(page.locator("html")).toHaveAttribute("data-theme", locked ? "light" : theme);
        await expect(page.locator("h1")).toHaveCount(1);

        // No horizontal page scroll at either width.
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, "horizontal overflow in px").toBeLessThanOrEqual(0);

        await page.screenshot({
          path: path.join(SCREENS_DIR, `${section.slug}-${theme}-${viewport.width}.png`),
          fullPage: true,
          animations: "disabled",
        });
        if (viewport.width === 1280) {
          await page.screenshot({
            path: path.join(REPO_SCREENS_DIR, `${section.slug}-${theme}.jpg`),
            type: "jpeg",
            quality: 60,
            fullPage: true,
            animations: "disabled",
          });
        }

        await expectNoAxeViolations(page, `${section.href} (${theme}, ${viewport.width}px)`);
      });
    }
  }
}
