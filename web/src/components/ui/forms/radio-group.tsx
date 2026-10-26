"use client";

import { type ReactNode, useId } from "react";
import { cn } from "@/lib/cn";
import { useFieldContext } from "./field-context";
import { FieldGroup } from "./field-group";
import { useControllableState } from "./hooks";

export type RadioOption = {
  value: string;
  label: ReactNode;
  /** A second line; on a disabled option it is the reason. Linked with aria-describedby. */
  description?: ReactNode;
  disabled?: boolean;
  /** Cards: an icon before the title, or a badge after it. */
  icon?: ReactNode;
  badge?: ReactNode;
  /** Conditional reveal: one extra field shown right under this option while it is chosen. */
  reveal?: ReactNode;
};

export type RadioGroupProps = {
  legend: ReactNode;
  legendHidden?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  name: string;
  options: RadioOption[];
  value?: string;
  /** Settings show the saved value. Choices with consequences start with nothing chosen. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /**
   * list (vertical), inline (3 or fewer short labels), cards (stacked) or card-grid (2 or 3 columns
   * once the group is wide enough for 200 px cards).
   */
  variant?: "list" | "inline" | "cards" | "card-grid";
  columns?: 2 | 3;
  surface?: "staff" | "public";
  required?: boolean;
  disabled?: boolean;
  /** The chosen label shown as text. */
  readOnly?: boolean;
  className?: string;
};

/** The circle: a native radio drawn with appearance-none. `ownRing` false when a card draws the ring. */
export function radioCircleClassName(isPublic: boolean, ownRing = true) {
  return cn(
    "peer m-0 shrink-0 cursor-pointer appearance-none rounded-pill border border-input bg-surface transition-colors duration-fast",
    isPublic ? "size-5" : "size-checkbox",
    "hover:border-muted checked:border-accent data-invalid:border-danger",
    "disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-subtle",
    "forced-colors:appearance-auto",
    !ownRing && "focus-visible:outline-none",
  );
}

/**
 * Choose exactly one of a few visible options (components.md RadioGroup): native radios sharing
 * one name inside fieldset and legend, so they work without JavaScript and the group name is read
 * with each option. Tab enters on the chosen radio (or the first); arrow keys move and choose.
 *
 * Cards: the whole card is the <label>; a chosen card shows by its fill, its accent edge and the
 * dot, not by colour alone. The radio inside drops its own ring and the card draws one.
 * Conditional reveal: only the chosen option's field exists, right after its radio in DOM order.
 */
export function RadioGroup({
  legend,
  legendHidden,
  hint,
  error,
  name,
  options,
  value,
  defaultValue = "",
  onValueChange,
  variant = "list",
  columns = 2,
  surface,
  required = false,
  disabled = false,
  readOnly = false,
  className,
}: RadioGroupProps) {
  const [chosen, setChosen] = useControllableState(value, defaultValue, onValueChange);
  const base = useId();
  const isPublic = surface === "public";
  const isCards = variant === "cards" || variant === "card-grid";

  if (readOnly) {
    const option = options.find((o) => o.value === chosen);
    return (
      <div className={cn("flex flex-col gap-1", className)}>
        <span className={cn("font-medium text-fg", isPublic ? "text-base" : "text-sm")}>{legend}</span>
        <span className={cn("text-fg", isPublic ? "text-base" : "text-sm")}>{option?.label ?? "Not chosen"}</span>
      </div>
    );
  }

  return (
    <FieldGroup
      legend={legend}
      legendHidden={legendHidden}
      hint={hint}
      error={error}
      name={name}
      required={required}
      disabled={disabled}
      surface={surface}
      className={cn(variant === "card-grid" && "w-full", className)}
    >
      {/* Card grids add columns only when the group has room for 200 px cards (a container query),
          so a grid inside a narrow column or dialog never overflows. */}
      <div className={cn(variant === "card-grid" && "@container")}>
        <div
          className={cn(
            variant === "inline" && "flex flex-row flex-wrap gap-x-6 gap-y-1",
            variant === "list" && "flex flex-col gap-1",
            variant === "cards" && "flex flex-col gap-3",
            variant === "card-grid" &&
              cn("grid grid-cols-1 gap-3 @min-[26rem]:grid-cols-2", columns === 3 && "@min-[39rem]:grid-cols-3"),
          )}
        >
          {options.map((option, index) => {
            const id = `${base}-${index}`;
            const isChosen = chosen === option.value;
            return (
              <div key={option.value} className={cn("flex min-w-0 flex-col", isCards && "min-w-50")}>
                <RadioRow
                  id={id}
                  name={name}
                  option={option}
                  checked={isChosen}
                  onChoose={setChosen}
                  isPublic={isPublic}
                  card={isCards}
                  required={required}
                />
                {isChosen && option.reveal ? (
                  <div className={cn("pt-2", isCards ? "" : isPublic ? "pl-8" : "pl-6")}>{option.reveal}</div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </FieldGroup>
  );
}

function RadioRow({
  id,
  name,
  option,
  checked,
  onChoose,
  isPublic,
  card,
  required,
}: {
  id: string;
  name: string;
  option: RadioOption;
  checked: boolean;
  onChoose: (value: string) => void;
  isPublic: boolean;
  card: boolean;
  required: boolean;
}) {
  const group = useFieldContext();
  const descriptionId = option.description ? `${id}-description` : undefined;
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start text-fg has-[:disabled]:cursor-not-allowed has-[:disabled]:text-muted",
        card
          ? cn(
              "gap-3 rounded-lg border border-border bg-surface p-4 transition-colors duration-fast",
              "hover:bg-surface-hover has-[:checked]:border-accent has-[:checked]:bg-accent-subtle has-[:checked]:hover:bg-accent-subtle",
              "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus-ring has-[:focus-visible]:outline-solid",
            )
          : isPublic
            ? "min-h-hit-public gap-3 py-2.5 text-base"
            : "min-h-hit gap-2 py-px text-sm",
      )}
    >
      <span className={cn("relative inline-flex shrink-0 items-center justify-center", isPublic ? "h-6" : "h-5.5")}>
        <input
          id={id}
          type="radio"
          name={name}
          value={option.value}
          checked={checked}
          disabled={option.disabled}
          required={required}
          // Radios do not take aria-invalid (ARIA 1.2); the fieldset's aria-describedby carries the error.
          data-invalid={group?.invalid ? "" : undefined}
          aria-describedby={descriptionId}
          onChange={() => onChoose(option.value)}
          className={radioCircleClassName(isPublic, !card)}
        />
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute hidden rounded-pill bg-accent peer-checked:block peer-disabled:bg-muted forced-colors:hidden",
            isPublic ? "size-2.5" : "size-2",
          )}
        />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={cn("flex items-start justify-between gap-2", card && "text-sm font-medium")}>
          <span className="flex items-center gap-2">
            {option.icon ? (
              <span aria-hidden="true" className="inline-flex text-muted [&_svg]:size-icon-sm">
                {option.icon}
              </span>
            ) : null}
            {option.label}
          </span>
          {option.badge ?? null}
        </span>
        {option.description ? (
          <span id={descriptionId} className={cn("text-muted", isPublic ? "text-sm" : "text-xs")}>
            {option.description}
          </span>
        ) : null}
      </span>
    </label>
  );
}
