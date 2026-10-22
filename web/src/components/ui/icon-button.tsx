"use client";

import { Loader, LoaderCircle } from "lucide-react";
import { Slot, Tooltip } from "radix-ui";
import {
  type ButtonHTMLAttributes,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  useId,
} from "react";
import { cn } from "@/lib/cn";

/* -------------------------------------------------------------------------------------------------
 * Shared by Button and IconButton
 * -----------------------------------------------------------------------------------------------*/

/**
 * The "working" icon inside a control (components.md, Spinner, inline variant): LoaderCircle
 * spins; under reduced motion (OS setting or data-motion="reduce") the static Loader shows
 * instead. Both are aria-hidden; the control's own name and label say what is happening.
 */
export function ControlSpinner({ className }: { className?: string }) {
  return (
    <>
      <LoaderCircle aria-hidden="true" className={cn("shrink-0 motion-safe:animate-spin motion-reduce:hidden", className)} />
      <Loader aria-hidden="true" className={cn("hidden shrink-0 motion-reduce:inline-block", className)} />
    </>
  );
}

/** Tooltip look from components.md (Tooltip): inverse fill, text-xs, no arrow, sideOffset 6. */
export const tooltipContentClassName = cn(
  "z-(--z-tooltip) max-w-64 rounded-sm bg-inverse px-2 py-1 text-xs text-on-inverse shadow-pop",
  "data-[state=delayed-open]:animate-fade-in data-[state=instant-open]:animate-fade-in [animation-duration:var(--motion-fast)]",
);

/**
 * Wraps a control in a Radix Tooltip (needs the Tooltip.Provider in the root layout). Opens after
 * 400 ms on hover and at once on keyboard focus; Esc closes it and keeps focus on the control.
 */
export function ControlTooltip({ content, children }: { content: ReactNode; children: ReactElement }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content side="top" sideOffset={6} collisionPadding={8} className={tooltipContentClassName}>
          {content}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

/** Blocks clicks while a control is loading or aria-disabled; it stays focusable. */
export function blockWhenUnavailable<E extends HTMLElement>(
  unavailable: boolean,
  onClick: ((event: MouseEvent<E>) => void) | undefined,
) {
  return (event: MouseEvent<E>) => {
    if (unavailable) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };
}

/* -------------------------------------------------------------------------------------------------
 * IconButton
 * -----------------------------------------------------------------------------------------------*/

export type IconButtonVariant =
  | "ghost"
  | "secondary"
  | "danger-ghost"
  | "toggle"
  | "in-field"
  // Filled and outlined forms, used when Button renders an icon-only control (components.md:
  // "icon-only: any variant with no visible label. It renders through IconButton").
  | "primary"
  | "danger"
  | "danger-outline";

export type IconButtonSize = "xs" | "sm" | "md" | "md-bar" | "lg";

const SIZE: Record<IconButtonSize, string> = {
  xs: "size-control-xs rounded-sm [&_svg]:size-icon-sm",
  sm: "size-control-sm rounded-md [&_svg]:size-icon-sm",
  md: "size-control-md rounded-md [&_svg]:size-icon-md",
  "md-bar": "size-control-md rounded-md [&_svg]:size-icon-lg",
  lg: "size-control-lg rounded-md [&_svg]:size-icon-lg",
};

const VARIANT: Record<IconButtonVariant, string> = {
  ghost: "text-muted hover:bg-surface-hover hover:text-fg active:bg-surface-sunken",
  "in-field": "text-muted hover:bg-surface-hover hover:text-fg active:bg-surface-sunken",
  secondary: "border border-strong text-fg hover:bg-surface-hover active:bg-surface-sunken",
  "danger-ghost": "text-muted hover:bg-danger-subtle hover:text-danger",
  // A 1 px border in every state, so pressing never changes the size. Pressed adds an accent
  // edge as well as the fill, so the state is not shown by fill alone.
  toggle: cn(
    "border border-transparent text-muted hover:bg-surface-hover hover:text-fg active:bg-surface-sunken",
    "aria-pressed:border-accent aria-pressed:bg-accent-subtle aria-pressed:text-accent",
    "forced-colors:aria-pressed:border-[Highlight]",
  ),
  primary: "bg-accent text-on-accent hover:bg-accent-hover active:bg-accent-hover",
  danger: "bg-danger text-on-danger hover:bg-danger-hover active:bg-danger-hover",
  "danger-outline": "border border-danger text-danger hover:bg-danger-subtle active:bg-danger-subtle",
};

const DISABLED: Record<IconButtonVariant, string> = {
  ghost: "text-muted",
  "in-field": "text-muted",
  "danger-ghost": "text-muted",
  toggle: "border border-transparent text-muted",
  secondary: "border border-strong text-muted",
  primary: "bg-surface-sunken text-muted",
  danger: "bg-surface-sunken text-muted",
  "danger-outline": "border border-transparent bg-surface-sunken text-muted",
};

const BASE =
  "relative inline-flex shrink-0 items-center justify-center select-none transition-colors duration-fast ease-standard";

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label" | "children"> & {
  /** The Lucide icon, as an element: icon={<Trash2 />}. It is drawn aria-hidden at the size's icon size. */
  icon: ReactElement;
  /**
   * Required: the action and its object, e.g. "Remove Hindi", "More actions for Ravi Kumar",
   * never the icon's name. A badge count belongs in it too: "Notifications, 3 unread".
   */
  "aria-label": string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  /**
   * Tooltip text. Defaults to the aria-label; pass a string to add a shortcut ("Search (/)"),
   * or false where tooltips are not used (public pages).
   */
  tooltip?: string | false;
  /** Toggle variant: the pressed state (aria-pressed). The name stays the same in both states. */
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  /** A count badge (0 hides it) or "dot". Purely visual; put the count in aria-label. */
  badge?: number | "dot";
  /** Work in progress: the icon becomes a spinner, the name is unchanged, clicks are ignored. */
  loading?: boolean;
  /**
   * Why the action is unavailable. The button stays focusable with aria-disabled, the reason is
   * its description and appears in the tooltip. Use `disabled` when nothing needs explaining.
   */
  disabledReason?: string;
  /** Render the single child element (e.g. a Next <Link>) as the control, via Radix Slot. */
  asChild?: boolean;
  /** Only with asChild: the element to render. */
  children?: ReactElement;
  ref?: Ref<HTMLButtonElement>;
};

/**
 * An action shown only as an icon (components.md, IconButton). Square in every size; the tooltip
 * repeats the accessible name; xs only where no other target is within 24 px.
 */
export function IconButton({
  icon,
  "aria-label": label,
  variant = "ghost",
  size = "sm",
  tooltip,
  pressed,
  onPressedChange,
  badge,
  loading = false,
  disabledReason,
  asChild = false,
  children,
  className,
  disabled,
  type,
  onClick,
  ref,
  ...rest
}: IconButtonProps) {
  const reasonId = useId();
  const effectiveSize: IconButtonSize = variant === "in-field" ? "xs" : size;
  const isToggle = variant === "toggle" || pressed !== undefined;
  const unavailable = loading || Boolean(disabledReason) || rest["aria-disabled"] === true || rest["aria-disabled"] === "true";
  const looksDisabled = Boolean(disabled) || Boolean(disabledReason);
  const Comp = asChild ? Slot.Root : "button";

  const describedBy = [rest["aria-describedby"], disabledReason ? reasonId : undefined].filter(Boolean).join(" ");
  const a11y: Record<string, unknown> = { "aria-label": label };
  if (describedBy) a11y["aria-describedby"] = describedBy;
  if (unavailable) a11y["aria-disabled"] = true;
  if (loading) a11y["aria-busy"] = true;
  if (isToggle) a11y["aria-pressed"] = Boolean(pressed);

  const control = (
    <Comp
      {...rest}
      {...a11y}
      ref={ref}
      type={asChild ? undefined : (type ?? "button")}
      disabled={asChild ? undefined : disabled}
      data-loading={loading ? "" : undefined}
      className={cn(
        BASE,
        SIZE[effectiveSize],
        looksDisabled ? cn(DISABLED[variant], "cursor-not-allowed") : VARIANT[variant],
        loading && "cursor-progress",
        className,
      )}
      onClick={blockWhenUnavailable<HTMLButtonElement>(unavailable || Boolean(disabled), (event) => {
        if (isToggle) onPressedChange?.(!pressed);
        onClick?.(event);
      })}
    >
      {loading ? <ControlSpinner /> : <IconSlot icon={icon} />}
      {asChild ? <Slot.Slottable>{children}</Slot.Slottable> : null}
      {badge === "dot" ? (
        <span aria-hidden="true" className="pointer-events-none absolute top-1 right-1 size-2 rounded-pill bg-danger" />
      ) : typeof badge === "number" && badge > 0 ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-pill bg-danger px-1.5 text-xs font-medium text-on-danger tabular-nums"
        >
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </Comp>
  );

  const tooltipText = tooltip === false ? null : (tooltip ?? label);
  const content =
    tooltipText && disabledReason ? (
      <>
        <span className="block">{tooltipText}</span>
        <span className="block">{disabledReason}</span>
      </>
    ) : (
      (tooltipText ?? disabledReason)
    );

  return (
    <>
      {content ? <ControlTooltip content={content}>{control}</ControlTooltip> : control}
      {disabledReason ? (
        <span id={reasonId} hidden>
          {disabledReason}
        </span>
      ) : null}
    </>
  );
}

function IconSlot({ icon }: { icon: ReactElement }) {
  // The wrapper keeps the icon decorative even if the element passed in has no aria-hidden.
  return (
    <span aria-hidden="true" className="inline-flex shrink-0">
      {icon}
    </span>
  );
}
