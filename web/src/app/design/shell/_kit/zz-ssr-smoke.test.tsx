import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/design/shell",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: () => {}, push: () => {} }),
}));

describe("design pages render on the server", () => {
  for (const name of ["shell", "overlays", "feedback", "display"]) {
    it(name, async () => {
      const { renderToString } = await import("react-dom/server");
      const { Tooltip } = await import("radix-ui");
      const pages = {
        shell: () => import("../page"),
        overlays: () => import("../../overlays/page"),
        feedback: () => import("../../feedback/page"),
        display: () => import("../../display/page"),
      } as const;
      const mod = await pages[name as keyof typeof pages]();
      const errors: unknown[] = [];
      const original = console.error;
      console.error = (...args: unknown[]) => errors.push(args.map(String).join(" "));
      let html = "";
      try {
        html = renderToString(<Tooltip.Provider>{mod.default()}</Tooltip.Provider>);
      } finally {
        console.error = original;
      }
      expect(errors.filter((e) => !String(e).includes("useLayoutEffect"))).toEqual([]);
      expect((html.match(/<h1/g) ?? []).length).toBe(1);
      if (process.env.SSR_OUT) {
        const fs = await import("node:fs");
        fs.writeFileSync(`${process.env.SSR_OUT}/${name}.html`, `<!doctype html><html lang="en-IN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="app.css"></head><body><div class="min-h-dvh bg-bg md:flex"><main id="main" tabindex="-1" class="min-w-0 flex-1 px-gutter-sm py-6 md:px-gutter md:py-8"><div class="mx-auto flex max-w-content flex-col gap-8">${html}</div></main></div></body></html>`);
      }
      expect(html.length).toBeGreaterThan(1000);
    });
  }
});
