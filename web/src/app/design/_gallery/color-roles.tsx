"use client";

import { Check, X } from "lucide-react";
import { contrastRatio, formatRatio, parseColor } from "@/lib/contrast";
import { readTokens, resolvedTheme, useThemeKey } from "./use-live-tokens";

type ContrastCheck = { fg: string; bg: string; min: 3 | 4.5 };
type Role = {
  role: string;
  utility: string;
  use: string;
  /** What the swatch draws: a fill with sample text, or text on a surface. */
  sample: { fg: string; bg: string; kind?: "text" | "edge" | "ring" | "fill" };
  checks?: ContrastCheck[];
  note?: string;
};
type Group = { title: string; roles: Role[] };

const TONES = [
  { tone: "danger", use: "Errors, destructive actions, overdue." },
  { tone: "success", use: "Done, paid, enrolled." },
  { tone: "warning", use: "Needs attention soon, partial states." },
  { tone: "info", use: "Neutral news, in progress." },
] as const;

const surfaceRole = (role: string, use: string): Role => ({
  role,
  utility: `bg-${role}`,
  use,
  sample: { fg: "text", bg: role },
  checks: [
    { fg: "text", bg: role, min: 4.5 },
    { fg: "text-muted", bg: role, min: 4.5 },
  ],
});

export const COLOR_GROUPS: Group[] = [
  {
    title: "Surfaces",
    roles: [
      surfaceRole("bg", "Page canvas behind cards and between blocks."),
      surfaceRole("surface", "Cards, tables, app header, sidebar, inputs."),
      surfaceRole("surface-subtle", "Quiet bands: table footer, sticky toolbars, alternate form sections."),
      surfaceRole("surface-raised", "Menus, popovers, dialogs, drawers, toasts."),
      surfaceRole("surface-sunken", "Table header row, read-only fields, segmented tracks, skeletons."),
      surfaceRole("surface-hover", "Hover and keyboard highlight for rows, menu items, ghost buttons."),
    ],
  },
  {
    title: "Text",
    roles: [
      {
        role: "text",
        utility: "text-fg",
        use: "Primary text and icons.",
        sample: { fg: "text", bg: "surface", kind: "text" },
        checks: [
          { fg: "text", bg: "surface", min: 4.5 },
          { fg: "text", bg: "bg", min: 4.5 },
        ],
      },
      {
        role: "text-muted",
        utility: "text-muted",
        use: "Labels, placeholders, timestamps, help text, inactive tabs.",
        sample: { fg: "text-muted", bg: "surface", kind: "text" },
        checks: [
          { fg: "text-muted", bg: "surface", min: 4.5 },
          { fg: "text-muted", bg: "bg", min: 4.5 },
        ],
      },
    ],
  },
  {
    title: "Edges and focus",
    roles: [
      {
        role: "border",
        utility: "border, border-border",
        use: "Decorative dividers and card edges.",
        sample: { fg: "border", bg: "surface", kind: "edge" },
        note: "Decorative: no contrast rule.",
      },
      {
        role: "border-strong",
        utility: "border-strong",
        use: "Under the table header, between panels.",
        sample: { fg: "border-strong", bg: "surface", kind: "edge" },
        note: "Decorative: no contrast rule.",
      },
      {
        role: "border-input",
        utility: "border-input",
        use: "The edge that identifies a control: input, select, checkbox.",
        sample: { fg: "border-input", bg: "surface", kind: "edge" },
        checks: [
          { fg: "border-input", bg: "surface", min: 3 },
          { fg: "border-input", bg: "bg", min: 3 },
        ],
      },
      {
        role: "focus-ring",
        utility: "outline-focus-ring",
        use: "2 px outline on :focus-visible, 2 px offset.",
        sample: { fg: "focus-ring", bg: "surface", kind: "ring" },
        checks: [
          { fg: "focus-ring", bg: "surface", min: 3 },
          { fg: "focus-ring", bg: "bg", min: 3 },
        ],
      },
    ],
  },
  {
    title: "Accent (placeholder until our palette is chosen)",
    roles: [
      {
        role: "accent",
        utility: "bg-accent, text-accent",
        use: "Primary buttons, links, active nav, checked controls.",
        sample: { fg: "on-accent", bg: "accent" },
        checks: [
          { fg: "on-accent", bg: "accent", min: 4.5 },
          { fg: "accent", bg: "surface", min: 4.5 },
        ],
      },
      {
        role: "accent-hover",
        utility: "bg-accent-hover",
        use: "Hover and pressed accent fills.",
        sample: { fg: "on-accent", bg: "accent-hover" },
        checks: [{ fg: "on-accent", bg: "accent-hover", min: 4.5 }],
      },
      {
        role: "accent-subtle",
        utility: "bg-accent-subtle",
        use: "Selected rows, the active nav item, accent chips.",
        sample: { fg: "text", bg: "accent-subtle" },
        checks: [
          { fg: "text", bg: "accent-subtle", min: 4.5 },
          { fg: "accent", bg: "accent-subtle", min: 4.5 },
        ],
      },
      {
        role: "on-accent",
        utility: "text-on-accent",
        use: "Text and icons on accent fills.",
        sample: { fg: "on-accent", bg: "accent" },
        checks: [{ fg: "on-accent", bg: "accent", min: 4.5 }],
      },
    ],
  },
  ...TONES.map(({ tone, use }) => ({
    title: tone[0].toUpperCase() + tone.slice(1),
    roles: [
      {
        role: tone,
        utility: `text-${tone}, bg-${tone}`,
        use,
        sample: { fg: `on-${tone}`, bg: tone },
        checks: [
          { fg: tone, bg: "surface", min: 4.5 as const },
          { fg: `on-${tone}`, bg: tone, min: 4.5 as const },
        ],
      },
      ...(tone === "danger"
        ? [
            {
              role: "danger-hover",
              utility: "bg-danger-hover",
              use: "Hover and pressed fill of the danger button.",
              sample: { fg: "on-danger", bg: "danger-hover" },
              checks: [{ fg: "on-danger", bg: "danger-hover", min: 4.5 as const }],
            },
          ]
        : []),
      {
        role: `${tone}-subtle`,
        utility: `bg-${tone}-subtle`,
        use: "Status pill and callout backgrounds.",
        sample: { fg: tone, bg: `${tone}-subtle` },
        checks: [
          { fg: tone, bg: `${tone}-subtle`, min: 4.5 as const },
          { fg: "text", bg: `${tone}-subtle`, min: 4.5 as const },
        ],
      },
      {
        role: `on-${tone}`,
        utility: `text-on-${tone}`,
        use: `Text and icons on a solid ${tone} fill.`,
        sample: { fg: `on-${tone}`, bg: tone },
        checks: [{ fg: `on-${tone}`, bg: tone, min: 4.5 as const }],
      },
    ],
  })),
  {
    title: "Inverse and overlay",
    roles: [
      {
        role: "inverse",
        utility: "bg-inverse",
        use: "Tooltips only.",
        sample: { fg: "on-inverse", bg: "inverse" },
        checks: [{ fg: "on-inverse", bg: "inverse", min: 4.5 }],
      },
      {
        role: "on-inverse",
        utility: "text-on-inverse",
        use: "Text on inverse.",
        sample: { fg: "on-inverse", bg: "inverse" },
        checks: [{ fg: "on-inverse", bg: "inverse", min: 4.5 }],
      },
      {
        role: "overlay",
        utility: "bg-overlay",
        use: "Scrim behind dialogs and drawers.",
        sample: { fg: "text", bg: "overlay", kind: "fill" },
        note: "Never a text background: not checked.",
      },
    ],
  },
  {
    title: "Charts (placeholder palette)",
    roles: [
      {
        role: "chart-surface",
        utility: "bg-chart-surface",
        use: "Plot area of a chart card.",
        sample: { fg: "text", bg: "chart-surface" },
        checks: [{ fg: "text", bg: "chart-surface", min: 4.5 }],
      },
      ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
        role: `chart-${n}`,
        utility: `fill-chart-${n}`,
        use: `Series slot ${n}. Fixed order, never cycled.`,
        sample: { fg: "text", bg: `chart-${n}`, kind: "fill" as const },
        checks: [{ fg: `chart-${n}`, bg: "chart-surface", min: 3 as const }],
      })),
      ...[1, 2, 3, 4, 5, 6].map((n) => ({
        role: `chart-ordinal-${n}`,
        utility: `fill-chart-ordinal-${n}`,
        use: `Funnel step ${n} of 6.`,
        sample: { fg: "text", bg: `chart-ordinal-${n}`, kind: "fill" as const },
        checks: [{ fg: `chart-ordinal-${n}`, bg: "chart-surface", min: 3 as const }],
      })),
    ],
  },
];

const ALL_ROLES = Array.from(
  new Set(COLOR_GROUPS.flatMap((g) => g.roles.flatMap((r) => [r.role, r.sample.fg, r.sample.bg, ...(r.checks ?? []).flatMap((c) => [c.fg, c.bg])]))),
);

function Swatch({ role }: { role: Role }) {
  const { fg, bg, kind } = role.sample;
  if (kind === "text") {
    return (
      <div className="flex h-16 items-center rounded-md border border-border bg-surface px-3 text-lg" style={{ color: `var(--${fg})` }}>
        Ananya Rao
      </div>
    );
  }
  if (kind === "edge") {
    return (
      <div className="flex h-16 items-center rounded-md border border-border bg-surface px-3">
        <div className="h-8 w-full rounded-md border-2" style={{ borderColor: `var(--${fg})` }} />
      </div>
    );
  }
  if (kind === "fill") {
    // No text on these fills: the overlay is never a text background, chart marks carry no text.
    return (
      <div className="flex h-16 items-center rounded-md border border-border bg-surface px-3">
        <div className="h-8 w-full rounded-md" style={{ background: `var(--${bg})` }} />
      </div>
    );
  }
  if (kind === "ring") {
    return (
      <div className="flex h-16 items-center rounded-md border border-border bg-surface px-4">
        <span
          className="inline-flex h-control-sm items-center rounded-md border border-strong px-3 text-sm text-fg outline-2 outline-offset-2 outline-solid"
          style={{ outlineColor: `var(--${fg})` }}
        >
          Focused
        </span>
      </div>
    );
  }
  return (
    <div
      className="flex h-16 items-center rounded-md border border-border px-3 text-lg font-medium"
      style={{ background: `var(--${bg})`, color: `var(--${fg})` }}
    >
      Aa ₹1,250
    </div>
  );
}

function CheckLine({ check, values }: { check: ContrastCheck; values: Record<string, string> | null }) {
  const fg = values ? parseColor(values[check.fg]) : null;
  const bg = values ? parseColor(values[check.bg]) : null;
  const ratio = fg && bg ? contrastRatio(fg, bg) : null;
  const passes = ratio !== null && ratio >= check.min;
  return (
    <li className="flex items-center gap-1 text-xs text-muted">
      {ratio === null ? (
        <span>
          {check.fg} on {check.bg}: measuring
        </span>
      ) : (
        <>
          {passes ? (
            <Check aria-hidden="true" className="size-icon-sm shrink-0 text-success" />
          ) : (
            <X aria-hidden="true" className="size-icon-sm shrink-0 text-danger" />
          )}
          <span>
            <span className="font-medium text-fg tabular-nums">{formatRatio(ratio)}</span> {check.fg} on {check.bg} ·{" "}
            {passes ? `passes ${check.min}:1` : `below ${check.min}:1`}
          </span>
        </>
      )}
    </li>
  );
}

/** Every colour role with its utility, its live value and the contrast of its pairs, in the current theme. */
export function ColorRoles() {
  const themeKey = useThemeKey();
  const values = themeKey ? readTokens(ALL_ROLES) : null;
  const theme = resolvedTheme(themeKey);

  return (
    <div className="flex flex-col gap-8" data-gallery-pending={themeKey === null ? "" : undefined}>
      <p className="text-sm text-muted" aria-live="polite">
        {theme ? `Values and ratios measured in the ${theme} theme. Switch the theme to check the other.` : "Measuring the current theme."}
      </p>
      {COLOR_GROUPS.map((group) => (
        <div key={group.title} className="flex flex-col gap-3">
          <h3 className="text-md text-fg">{group.title}</h3>
          <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {group.roles.map((role) => (
              <li key={role.role} className="flex min-w-0 flex-col gap-2 rounded-lg border border-border bg-surface p-3">
                <Swatch role={role} />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-fg">{role.role}</span>
                  <code className="font-mono text-xs break-words text-muted">{role.utility}</code>
                  <code className="font-mono text-xs text-muted">{values ? values[role.role] : "…"}</code>
                </div>
                <p className="text-xs text-muted">{role.use}</p>
                {role.checks ? (
                  <ul className="m-0 flex list-none flex-col gap-1 p-0">
                    {role.checks.map((check) => (
                      <CheckLine key={`${check.fg}/${check.bg}`} check={check} values={values} />
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted">{role.note}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
