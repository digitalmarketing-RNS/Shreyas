"use client";

import { Play } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { readTokens, useThemeKey } from "./use-live-tokens";

/** "0.875rem" → "14 px" (the root font size is 16 px). */
function px(value: string | undefined): string {
  if (!value) return "…";
  if (value.endsWith("rem")) return `${Math.round(parseFloat(value) * 16 * 100) / 100} px`;
  return value.replace(/px$/, " px");
}

function useTokens(names: readonly string[]) {
  const themeKey = useThemeKey();
  return { values: themeKey ? readTokens(names) : null, pending: themeKey === null };
}

const Code = ({ children }: { children: ReactNode }) => <code className="font-mono text-xs text-muted">{children}</code>;

/* -- type ------------------------------------------------------------------------------------- */

const TYPE_STEPS = [
  { name: "xs", className: "text-xs", use: "Captions, meta lines, badges." },
  { name: "table", className: "text-table", use: "Table cells." },
  { name: "sm", className: "text-sm", use: "Staff body text and controls." },
  { name: "base", className: "text-base", use: "Public pages; long reading." },
  { name: "md", className: "text-md", use: "Card and dialog titles." },
  { name: "lg", className: "text-lg", use: "Section headings." },
  { name: "xl", className: "text-xl", use: "Page titles." },
  { name: "display", className: "text-display", use: "KPI numbers only." },
] as const;

/** The fixture from decisions.md section 2: names whose stacked consonants reach deepest. */
export const INDIC_NAMES = [
  { name: "हृषीकेश", lang: "hi", script: "Devanagari" },
  { name: "ঋতুপর্ণা", lang: "bn", script: "Bengali" },
  { name: "ਗੁਰਪ੍ਰੀਤ", lang: "pa", script: "Gurmukhi" },
  { name: "દ્રષ્ટિ", lang: "gu", script: "Gujarati" },
  { name: "ସ୍ୱାତୀ", lang: "or", script: "Odia" },
  { name: "ஸ்ரீநிதி", lang: "ta", script: "Tamil" },
  { name: "శ్రీలక్ష్మి", lang: "te", script: "Telugu" },
  { name: "ಶ್ರೀನಿವಾಸ್", lang: "kn", script: "Kannada" },
  { name: "ശ്രീക്കുട്ടി", lang: "ml", script: "Malayalam" },
  { name: "عائشہ", lang: "ur", script: "Urdu (Naskh)" },
] as const;

export function TypeScale() {
  const names = TYPE_STEPS.flatMap((s) => [`type-${s.name}-size`, `type-${s.name}-line`, `type-${s.name}-weight`]);
  const { values, pending } = useTokens(names);
  return (
    <div className="flex flex-col gap-6" data-gallery-pending={pending ? "" : undefined}>
      <ul className="m-0 flex list-none flex-col divide-y divide-border rounded-lg border border-border bg-surface p-0">
        {TYPE_STEPS.map((step) => (
          <li key={step.name} className="grid grid-cols-1 gap-1 px-4 py-3 md:grid-cols-[var(--layout-kv-label)_1fr] md:items-baseline md:gap-4">
            <div className="flex flex-col">
              <Code>{step.className}</Code>
              <span className="text-xs text-muted tabular-nums">
                {values
                  ? `${px(values[`type-${step.name}-size`])} / ${px(values[`type-${step.name}-line`])} · ${values[`type-${step.name}-weight`]}`
                  : "…"}
              </span>
            </div>
            <div className="flex min-w-0 flex-col">
              <span className={cn(step.className, "truncate pt-0.5 pb-1 text-fg")}>
                {step.name === "display" ? "₹1.2Cr · 12,480" : "Ananya Rao paid ₹12,500.00 on 06 Oct 2026"}
              </span>
              <span className="text-xs text-muted">{step.use}</span>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2">
        <h3 className="text-md text-fg">Names in Indian scripts</h3>
        <p className="max-w-form text-sm text-muted">
          Each script downloads its own Noto file only when a page shows it. Line heights of 1.5 and more keep the deepest
          stacked consonants clear of the next line.
        </p>
        <ul className="m-0 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2 lg:grid-cols-5">
          {INDIC_NAMES.map((item) => (
            <li key={item.lang} className="flex flex-col rounded-md border border-border bg-surface px-3 py-2">
              <span lang={item.lang} dir="auto" className="text-base text-fg">
                {item.name}
              </span>
              <span className="text-xs text-muted">{item.script}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-4">
          <h3 className="text-md text-fg">Weights</h3>
          <p className="text-sm font-normal text-fg">font-normal 400 · Follow-up due</p>
          <p className="text-sm font-medium text-fg">font-medium 500 · Follow-up due</p>
          <p className="text-sm font-semibold text-fg">font-semibold 600 · Follow-up due</p>
          <p className="text-sm font-bold text-fg">font-bold 700 · Follow-up due</p>
        </div>
        <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-4">
          <h3 className="text-md text-fg">Families</h3>
          <p className="font-sans text-sm text-fg">font-sans · Inter, staff screens</p>
          <p className="font-public text-sm text-fg">font-public · system fonts, public pages</p>
          <p className="font-mono text-sm text-fg">font-mono · sk_live_••••7f3a</p>
          <p className="text-sm text-fg tabular-nums">tabular-nums · 1,23,456 / 98,765</p>
        </div>
        <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-4">
          <h3 className="text-md text-fg">Line height</h3>
          <p className="text-sm leading-tight text-fg">leading-tight 1.25 · headings only</p>
          <p className="text-sm leading-normal text-fg">leading-normal 1.5 · any user text</p>
          <p className="text-sm leading-prose text-fg">leading-prose 1.625 · notes, messages, timelines</p>
        </div>
      </div>
    </div>
  );
}

/* -- spacing, radius, shadow, sizes --------------------------------------------------------------- */

const SPACE = ["0_5", "1", "2", "3", "4", "5", "6", "8", "10", "12", "16"] as const;

export function SpacingScale() {
  const { values, pending } = useTokens(SPACE.map((s) => `space-${s}`));
  return (
    <ul
      className="m-0 flex list-none flex-col gap-2 rounded-lg border border-border bg-surface p-4"
      data-gallery-pending={pending ? "" : undefined}
    >
      {SPACE.map((step) => (
        <li key={step} className="flex items-center gap-3">
          <span className="w-16 shrink-0">
            <Code>p-{step.replace("_", ".")}</Code>
          </span>
          <span className="w-16 shrink-0 text-xs text-muted tabular-nums">{values ? px(values[`space-${step}`]) : "…"}</span>
          <span className="h-4 rounded-xs bg-accent" style={{ width: `var(--space-${step})` }} />
        </li>
      ))}
    </ul>
  );
}

const RADII = [
  { name: "none", className: "rounded-none", use: "Drawers, full-bleed panes" },
  { name: "xs", className: "rounded-xs", use: "Checkboxes, kbd" },
  { name: "sm", className: "rounded-sm", use: "Chips, options, menu items, tooltips" },
  { name: "md", className: "rounded-md", use: "Buttons, inputs, selects" },
  { name: "lg", className: "rounded-lg", use: "Cards, popovers, dialogs, toasts" },
  { name: "xl", className: "rounded-xl", use: "Large media frames" },
  { name: "pill", className: "rounded-pill", use: "Radios, switches, avatars, pills" },
] as const;

export function RadiusScale() {
  const { values, pending } = useTokens(RADII.map((r) => `rounded-${r.name}`));
  return (
    <ul
      className="m-0 grid list-none grid-cols-2 gap-4 p-0 sm:grid-cols-4 lg:grid-cols-7"
      data-gallery-pending={pending ? "" : undefined}
    >
      {RADII.map((radius) => (
        <li key={radius.name} className="flex flex-col gap-2">
          <span className={cn("h-16 border-2 border-strong bg-surface-sunken", radius.className)} />
          <Code>{radius.className}</Code>
          <span className="text-xs text-muted">
            {values ? px(values[`rounded-${radius.name}`]) : "…"} · {radius.use}
          </span>
        </li>
      ))}
    </ul>
  );
}

const SHADOWS = [
  { name: "card", className: "shadow-card", use: "Cards on the page canvas" },
  { name: "bar", className: "shadow-bar", use: "Sticky header and bars" },
  { name: "pop", className: "shadow-pop", use: "Menus, popovers, toasts" },
  { name: "modal", className: "shadow-modal", use: "Dialogs and drawers" },
] as const;

export function ShadowScale() {
  return (
    <ul className="m-0 grid list-none grid-cols-1 gap-6 rounded-lg bg-bg p-0 sm:grid-cols-2 lg:grid-cols-4">
      {SHADOWS.map((shadow) => (
        <li key={shadow.name} className={cn("flex h-24 flex-col justify-end rounded-lg bg-surface-raised p-4", shadow.className)}>
          <Code>{shadow.className}</Code>
          <span className="text-xs text-muted">{shadow.use}</span>
        </li>
      ))}
    </ul>
  );
}

const SIZES = [
  { name: "control-xs", className: "h-control-xs", use: "Dense toolbars, chips, in-field buttons" },
  { name: "control-sm", className: "h-control-sm", use: "Toolbars and filters (staff default)" },
  { name: "control-md", className: "h-control-md", use: "Form fields and dialog footers" },
  { name: "control-lg", className: "h-control-lg", use: "Public pages" },
  { name: "hit", className: "h-hit", use: "Minimum target, staff (2.5.8)" },
  { name: "hit-public", className: "h-hit-public", use: "Minimum target, public (2.5.5)" },
] as const;

export function SizeScale() {
  const { values, pending } = useTokens(SIZES.map((s) => `size-${s.name}`));
  return (
    <ul
      className="m-0 grid list-none grid-cols-1 gap-3 rounded-lg border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-3"
      data-gallery-pending={pending ? "" : undefined}
    >
      {SIZES.map((size) => (
        <li key={size.name} className="flex items-center gap-3">
          <span className={cn("w-12 shrink-0 rounded-sm bg-accent-subtle", size.className)} />
          <span className="flex flex-col">
            <Code>{size.className}</Code>
            <span className="text-xs text-muted">
              {values ? px(values[`size-${size.name}`]) : "…"} · {size.use}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/* -- motion ------------------------------------------------------------------------------------ */

const DURATIONS = [
  { name: "fast", className: "duration-fast", use: "Hover, press, toggle; colour and opacity" },
  { name: "base", className: "duration-base", use: "Menus, popovers, tooltips, accordions" },
  { name: "slow", className: "duration-slow", use: "Dialogs, drawers and toasts entering" },
] as const;

export function MotionScale() {
  const { values, pending } = useTokens([...DURATIONS.map((d) => `motion-${d.name}`), "easing-standard", "easing-exit"]);
  const [full, setFull] = useState(true);
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4" data-gallery-pending={pending ? "" : undefined}>
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {DURATIONS.map((duration) => (
          <li key={duration.name} className="grid grid-cols-1 gap-1 md:grid-cols-[var(--layout-kv-label)_1fr] md:items-center md:gap-4">
            <span className="flex flex-col">
              <Code>
                {duration.className} · {values ? values[`motion-${duration.name}`] : "…"}
              </Code>
              <span className="text-xs text-muted">{duration.use}</span>
            </span>
            <span className="h-2 overflow-hidden rounded-pill bg-surface-sunken">
              <span
                className={cn(
                  "block h-full origin-left rounded-pill bg-accent ease-standard motion-safe:transition-transform",
                  duration.className,
                  full ? "scale-x-100" : "scale-x-0",
                )}
              />
            </span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" size="sm" leadingIcon={<Play />} onClick={() => setFull((value) => !value)}>
          Play durations
        </Button>
        <span className="text-xs text-muted">
          ease-standard {values ? values["easing-standard"] : "…"} · ease-exit {values ? values["easing-exit"] : "…"}. With
          reduced motion, every duration collapses to 0.01 ms.
        </span>
      </div>
    </div>
  );
}
