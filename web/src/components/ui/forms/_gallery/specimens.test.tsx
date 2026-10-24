import { Tooltip } from "radix-ui";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// next/link needs the app router at runtime; a plain anchor is enough for a render check.
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: unknown } & Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    return React.createElement("a", { href, ...rest }, children);
  },
}));

const sections = [
  ["text and choice inputs", () => import("./text-choice-specimens")],
  ["phone, code, date and file inputs", () => import("./phone-date-file-specimens")],
  ["form structure and consent", () => import("./form-structure-specimens")],
  ["switchers and search", () => import("./switcher-search-specimens")],
  ["copy and secrets", () => import("./copy-secret-specimens")],
  ["small primitives", () => import("./primitive-specimens")],
] as const;

/**
 * Server-renders every specimen of the /design/forms page, as the first page load does. It
 * catches render-time crashes and duplicate ids; the e2e suite checks the page in a browser.
 */
describe("forms gallery specimens", () => {
  for (const [name, load] of sections) {
    it(`renders ${name} on the server`, async () => {
      const specimens = (await load()) as Record<string, () => React.ReactElement>;
      const exported = Object.entries(specimens).filter(([key, value]) => key.endsWith("Specimens") && typeof value === "function");
      expect(exported.length).toBeGreaterThan(0);
      for (const [key, Component] of exported) {
        // The root layout provides the Tooltip provider in the app.
        const html = renderToString(
          <Tooltip.Provider>
            <Component />
          </Tooltip.Provider>,
        );
        expect(html, key).toContain("<section");
        const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
        const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
        expect(duplicates, `${key} duplicate ids`).toEqual([]);
      }
    });
  }
});
