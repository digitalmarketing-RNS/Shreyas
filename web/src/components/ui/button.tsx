"use client";

import { ChevronDown, ExternalLink } from "lucide-react";
import { Slot } from "radix-ui";
import {
  type ButtonHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { cn } from "@/lib/cn";
import { mergeRefs } from "@/lib/merge-refs";
import {
  ControlSpinner,
  ControlTooltip,
  IconButton,
  type IconButtonSize,
  type IconButtonVariant,
  blockWhenUnavailable,
} from "./icon-button";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "danger-outline" | "link";
export type ButtonSize = "xs" | "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center rounded-md font-medium whitespace-nowrap select-none transition-colors duration-fast ease-standard [&_svg]:shrink-0";

/** Heights, padding, type and icon size (components.md, Button, sizes). */
const SIZE: Record<ButtonSize, string> = {
  xs: "h-control-xs gap-1 px-2 text-xs [&_svg]:size-icon-sm",
  sm: "h-control-sm gap-2 px-3 text-sm [&_svg]:size-icon-sm",
  md: "h-control-md gap-2 px-4 text-sm [&_svg]:size-icon-sm",
  lg: "h-control-lg gap-2 px-5 text-base [&_svg]:size-icon-md",
};

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent-hover active:bg-accent-hover",
  secondary: "border border-strong bg-transparent text-fg hover:bg-surface-hover active:bg-surface-sunken",
  ghost: "bg-transparent text-fg hover:bg-surface-hover active:bg-surface-sunken [&_svg]:text-muted hover:[&_svg]:text-fg",
  danger: "bg-danger text-on-danger hover:bg-danger-hover active:bg-danger-hover",
  "danger-outline": "border border-danger bg-transparent text-danger hover:bg-danger-subtle active:bg-danger-subtle",
  // The colour does not change on hover, so the link works on every surface.
  link: "text-accent underline decoration-1 underline-offset-2 hover:decoration-2",
};

const DISABLED: Record<ButtonVariant, string> = {
  primary: "bg-surface-sunken text-muted",
  secondary: "border border-transparent bg-surface-sunken text-muted",
  ghost: "bg-surface-sunken text-muted",
  danger: "bg-surface-sunken text-muted",
  "danger-outline": "border border-transparent bg-surface-sunken text-muted",
  link: "text-muted no-underline",
};

/**
 * The class string of a Button, for the rare element that cannot use <Button asChild>.
 * `inline` is for a link-variant button inside a sentence (no minimum height).
 */
export function buttonVariants({
  variant = "primary",
  size = "sm",
  fullWidth = false,
  inline = false,
  disabled = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  inline?: boolean;
  disabled?: boolean;
  className?: string;
} = {}): string {
  const isLink = variant === "link";
  return cn(
    BASE,
    // Link buttons have no height or padding. Standalone they keep a 24 px target (min-h-hit);
    // inside a sentence they are plain inline text (the 2.5.8 inline exception).
    isLink ? cn("gap-1 rounded-sm [&_svg]:size-icon-sm", inline ? "inline" : "min-h-hit") : SIZE[size],
    disabled ? cn(DISABLED[variant], "cursor-not-allowed") : VARIANT[variant],
    fullWidth && "w-full",
    className,
  );
}

type CommonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Public pages: the primary button is full width. */
  fullWidth?: boolean;
  /** Async work running: a spinner takes the leading-icon slot, clicks are ignored, the width holds. */
  loading?: boolean;
  /**
   * Why the action is unavailable ("Select at least one lead first."). The button stays focusable
   * with aria-disabled, the reason is its accessible description and shows in a tooltip. Use the
   * native `disabled` when nothing needs explaining. Never disable a submit button for invalid input.
   */
  disabledReason?: string;
  ref?: Ref<HTMLButtonElement>;
};

export type LabelledButtonProps = CommonProps & {
  /** The visible label: verb first, sentence case ("Add lead", "Delete 12 leads"). With asChild, the element to render. */
  children: ReactNode;
  /** A Lucide icon element before the label: leadingIcon={<Plus />}. Decorative (aria-hidden). */
  leadingIcon?: ReactElement;
  /** A Lucide icon element after the label. */
  trailingIcon?: ReactElement;
  /** Menu trigger: adds the trailing ChevronDown. aria-haspopup and aria-expanded come from Radix. */
  menu?: boolean;
  /** Opens in a new tab: adds the ExternalLink icon and sr-only " (opens in a new tab)". */
  external?: boolean;
  /**
   * Shown instead of the label while loading ("Saving…"). The label stays the accessible name,
   * so screen readers still hear "Save changes"; announce the loading text once in the form's
   * polite status region.
   */
  loadingLabel?: string;
  /** Link variant inside a sentence: plain inline, no minimum height. */
  inline?: boolean;
  /** Render the single child element (a Next <Link>, an <a>) with the button's look, via Radix Slot. */
  asChild?: boolean;
  icon?: never;
};

export type IconOnlyButtonProps = CommonProps & {
  /** Icon-only: renders through IconButton (square, same heights). */
  icon: ReactElement;
  /** Required for icon-only: the action and its object ("Delete Hindi"), never the icon's name. */
  "aria-label": string;
  /** Tooltip text; defaults to the aria-label. */
  tooltip?: string | false;
  children?: never;
  asChild?: never;
  leadingIcon?: never;
  trailingIcon?: never;
  loadingLabel?: never;
  menu?: never;
  external?: never;
  inline?: never;
};

export type ButtonProps = LabelledButtonProps | IconOnlyButtonProps;

const ICON_VARIANT: Record<ButtonVariant, IconButtonVariant> = {
  primary: "primary",
  secondary: "secondary",
  ghost: "ghost",
  danger: "danger",
  "danger-outline": "danger-outline",
  link: "ghost",
};

/**
 * Starts an action or submits a form (components.md, Button). type="button" unless you pass
 * type="submit" on purpose. A link that navigates uses <Button asChild><Link href=…>…</Link></Button>.
 */
export function Button(props: ButtonProps) {
  if ("icon" in props && props.icon) {
    const { icon, variant = "primary", size = "sm", tooltip, fullWidth: _fullWidth, ...rest } = props;
    void _fullWidth;
    return (
      <IconButton
        {...rest}
        icon={icon}
        tooltip={tooltip}
        variant={ICON_VARIANT[variant]}
        size={size satisfies IconButtonSize}
      />
    );
  }
  return <LabelledButton {...(props as LabelledButtonProps)} />;
}

function LabelledButton({
  variant = "primary",
  size = "sm",
  fullWidth = false,
  loading = false,
  loadingLabel,
  disabledReason,
  leadingIcon,
  trailingIcon,
  menu = false,
  external = false,
  inline = false,
  asChild = false,
  children,
  className,
  disabled,
  type,
  onClick,
  ref,
  ...rest
}: LabelledButtonProps) {
  const reasonId = useId();
  const ownRef = useRef<HTMLButtonElement | null>(null);
  const widthBeforeLoading = useRef<number | null>(null);
  const composedRef = useMemo(() => mergeRefs(ref, ownRef), [ref]);
  const unavailable = loading || Boolean(disabledReason) || rest["aria-disabled"] === true || rest["aria-disabled"] === "true";
  const Comp = asChild ? Slot.Root : "button";

  // Hold the width the button had before it started loading, so nothing shifts (min-width only;
  // the spinner may still widen a button that had no leading icon).
  useLayoutEffect(() => {
    const node = ownRef.current;
    if (!node) return;
    if (loading) {
      if (widthBeforeLoading.current) node.style.minWidth = `${widthBeforeLoading.current}px`;
    } else {
      node.style.minWidth = "";
      widthBeforeLoading.current = node.getBoundingClientRect().width;
    }
  });

  const describedBy = [rest["aria-describedby"], disabledReason ? reasonId : undefined].filter(Boolean).join(" ");
  const a11y: Record<string, unknown> = {};
  if (describedBy) a11y["aria-describedby"] = describedBy;
  if (unavailable) a11y["aria-disabled"] = true;
  if (loading) a11y["aria-busy"] = true;

  const leading = loading ? <ControlSpinner /> : leadingIcon ? <Decorative>{leadingIcon}</Decorative> : null;
  const trailing = (
    <>
      {trailingIcon ? <Decorative>{trailingIcon}</Decorative> : null}
      {menu ? (
        <Decorative>
          <ChevronDown />
        </Decorative>
      ) : null}
      {external ? (
        <>
          <Decorative>
            <ExternalLink />
          </Decorative>
          <span className="sr-only"> (opens in a new tab)</span>
        </>
      ) : null}
    </>
  );

  const label =
    loading && loadingLabel && !asChild ? (
      <>
        <span aria-hidden="true">{loadingLabel}</span>
        <span className="sr-only">{children}</span>
      </>
    ) : (
      children
    );

  const control = (
    <Comp
      {...rest}
      {...a11y}
      ref={composedRef}
      type={asChild ? undefined : (type ?? "button")}
      disabled={asChild ? undefined : disabled}
      data-loading={loading ? "" : undefined}
      className={cn(
        buttonVariants({ variant, size, fullWidth, inline, disabled: Boolean(disabled) || Boolean(disabledReason) }),
        loading && "cursor-progress",
        className,
      )}
      onClick={blockWhenUnavailable<HTMLButtonElement>(unavailable || Boolean(disabled), onClick)}
    >
      {leading}
      {asChild ? <Slot.Slottable>{children}</Slot.Slottable> : label}
      {trailing}
    </Comp>
  );

  if (!disabledReason) return control;
  return (
    <>
      <ControlTooltip content={disabledReason}>{control}</ControlTooltip>
      <span id={reasonId} hidden>
        {disabledReason}
      </span>
    </>
  );
}

function Decorative({ children }: { children: ReactElement }) {
  return (
    <span aria-hidden="true" className="inline-flex shrink-0">
      {children}
    </span>
  );
}
