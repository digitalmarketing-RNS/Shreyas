"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useId, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import type { ThemeChoice } from "@/lib/theme";
import { getThemeChoice, setThemeChoice, subscribePreferences } from "./theme-store";

const OPTIONS = [
  { value: "system", label: "System", Icon: Monitor },
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
] as const satisfies ReadonlyArray<{ value: ThemeChoice; label: string; Icon: typeof Sun }>;

export type ThemeSwitchProps = {
  /** The group's name. Visible unless hideLegend is set. */
  legend?: string;
  hideLegend?: boolean;
  /** Called after the theme is applied and saved in the cookie, e.g. to PATCH /me/prefs. */
  onChange?: (choice: ThemeChoice) => void;
  className?: string;
};

/**
 * System, Light or Dark, as a small segmented control (native radios in a fieldset, so arrow
 * keys move and select). The choice applies at once: data-theme on <html> changes, then the
 * cookie is written so the next page load paints in the same theme.
 */
export function ThemeSwitch({ legend = "Theme", hideLegend = false, onChange, className }: ThemeSwitchProps) {
  const name = useId();
  const choice = useSyncExternalStore(subscribePreferences, getThemeChoice, () => "system" as const);

  return (
    <fieldset className={cn("m-0 min-w-0 border-0 p-0", className)}>
      <legend className={hideLegend ? "sr-only" : "mb-1 text-xs font-medium text-muted"}>{legend}</legend>
      <div className="inline-flex h-control-sm items-center gap-0.5 rounded-md bg-surface-sunken p-0.5">
        {OPTIONS.map(({ value, label, Icon }) => (
          <label key={value} className="relative flex">
            <input
              type="radio"
              name={name}
              value={value}
              checked={choice === value}
              onChange={() => {
                setThemeChoice(value);
                onChange?.(value);
              }}
              className="peer sr-only"
            />
            <span
              className={cn(
                "flex h-7 min-w-12 cursor-pointer items-center justify-center gap-1 rounded-sm px-3 text-sm font-medium text-muted select-none",
                "transition-colors duration-fast ease-standard hover:bg-surface-hover hover:text-fg",
                "peer-checked:bg-accent peer-checked:text-on-accent peer-checked:hover:bg-accent-hover peer-checked:hover:text-on-accent",
                "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus-ring peer-focus-visible:outline-solid",
              )}
            >
              <Icon aria-hidden="true" className="size-icon-sm shrink-0" />
              {label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
