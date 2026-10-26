import AxeBuilder from "@axe-core/playwright";
import { type BrowserContext, type Page, expect } from "@playwright/test";

export type Theme = "light" | "dark";

/** WCAG 2.0, 2.1 and 2.2, levels A and AA (decisions.md section 1). */
export const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/** Saves the theme the way ThemeSwitch does (cookie) and matches the OS scheme to it. */
export async function useTheme(page: Page, context: BrowserContext, baseURL: string, theme: Theme) {
  await context.addCookies([{ name: "theme", value: theme, url: baseURL }]);
  await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
}

/** Waits until web fonts have loaded and every gallery specimen has measured its live values. */
export async function waitForGallery(page: Page) {
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await expect(page.locator("[data-gallery-pending]")).toHaveCount(0);
}

/** Runs axe and fails with each violation's id, targets and failure summary. */
export async function expectNoAxeViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  const report = results.violations
    .map((violation) => {
      const nodes = violation.nodes
        .map((node) => {
          const target = node.target.map((t) => (Array.isArray(t) ? t.join(" >> ") : String(t))).join(", ");
          const summary = (node.failureSummary ?? "").replace(/\n/g, "\n      ");
          return `    target: ${target}\n      ${summary}`;
        })
        .join("\n");
      return `  ${violation.id} (${violation.impact ?? "n/a"}): ${violation.help}\n${nodes}`;
    })
    .join("\n");
  if (results.violations.length > 0) {
    console.log(`axe violations on ${label}:\n${report}`);
  }
  expect(results.violations, `axe violations on ${label}:\n${report}`).toEqual([]);
}
