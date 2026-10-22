import { expect, test } from "@playwright/test";

/** Theme: System by default, Light or Dark from the cookie, applied before the first paint. */

declare global {
  interface Window {
    __firstFrame?: { theme: string | null; background: string };
  }
}

test.beforeEach(async ({ page }) => {
  // Record the theme and canvas colour of the very first frame, before React hydrates.
  await page.addInitScript(() => {
    requestAnimationFrame(() => {
      window.__firstFrame = {
        theme: document.documentElement.getAttribute("data-theme"),
        background: getComputedStyle(document.documentElement).backgroundColor,
      };
    });
  });
});

test("a saved dark theme paints dark in the first frame (no flash)", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "theme", value: "dark", url: baseURL! }]);
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/design/forms");
  await page.waitForFunction(() => Boolean(window.__firstFrame));
  const first = await page.evaluate(() => window.__firstFrame!);
  expect(first.theme).toBe("dark");
  expect(first.background).toBe("rgb(14, 17, 20)"); // dark --bg
});

test("System follows the OS and leaves data-theme off", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/design");
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.+/);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)).toBe("rgb(14, 17, 20)");
  await page.emulateMedia({ colorScheme: "light" });
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)).toBe("rgb(242, 244, 245)");
});

test("ThemeSwitch applies at once, saves a cookie and survives a reload", async ({ page, context }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/design");
  const group = page.getByRole("group", { name: "Theme" });
  await expect(group.getByRole("radio", { name: "System" })).toBeChecked();

  await group.getByText("Dark", { exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(group.getByRole("radio", { name: "Dark" })).toBeChecked();
  const cookies = await context.cookies();
  expect(cookies.find((c) => c.name === "theme")?.value).toBe("dark");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("group", { name: "Theme" }).getByRole("radio", { name: "Dark" })).toBeChecked();

  // Arrow keys move and select, like any radio group.
  await page.getByRole("group", { name: "Theme" }).getByRole("radio", { name: "Dark" }).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  await page.getByRole("group", { name: "Theme" }).getByText("System", { exact: true }).click();
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.+/);
});

test("public routes stay light whatever the cookie says", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "theme", value: "dark", url: baseURL! }]);
  await page.emulateMedia({ colorScheme: "dark" });
  // No public page exists yet; the not-found page still runs the root layout's head script.
  await page.goto("/f/sample-enquiry-form");
  await page.waitForFunction(() => Boolean(window.__firstFrame));
  expect(await page.evaluate(() => window.__firstFrame!.theme)).toBe("light");
  await expect(page.locator("html")).toHaveAttribute("data-surface", "public");
});

test("ForceLightTheme holds a page light and restores the theme on the way out", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "theme", value: "dark", url: baseURL! }]);
  await page.goto("/design/public");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("html")).toHaveAttribute("data-theme-lock", "");

  await page.getByRole("navigation", { name: "Design system sections" }).getByRole("link", { name: "Tokens" }).click();
  await expect(page).toHaveURL(/\/design$/);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).not.toHaveAttribute("data-theme-lock", /.*/);
});
