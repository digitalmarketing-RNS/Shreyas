"use client";

import { Check, ChevronRight } from "lucide-react";
import { DropdownMenu as RadixMenu } from "radix-ui";
import { type ComponentProps, type ReactElement, type ReactNode, createContext, useContext } from "react";
import { cn } from "@/lib/cn";

/*
 * DropdownMenu (components.md): a short list of actions or choices opened from a button. Radix
 * DropdownMenu gives role="menu", menuitem, menuitemcheckbox, menuitemradio, aria-checked, and
 * aria-haspopup and aria-expanded on the trigger. Enter, Space or Down opens on the first item; Up
 * opens on the last; Up and Down move (wrapping), Home and End jump, typing jumps by label; Right
 * opens a submenu and Left closes it; Space toggles a checkbox item without closing; Esc closes
 * and returns focus to the trigger; Tab closes the menu and moves on.
 *
 * Rules: destructive items sit last, after a separator, and open a ConfirmDialog (they never act
 * directly). More than 12 options, or options that need search, use a Combobox. No forms inside.
 * A menu never shows a loading state.
 */

/** True inside DropdownMenuPreview: the parts render plain elements with the same classes. */
const StaticMenuContext = createContext<{ static: boolean; radioValue?: string }>({ static: false });

const PANEL = cn(
  "z-(--z-popover) min-w-48 max-w-80 rounded-lg border border-border bg-surface-raised p-1 text-fg shadow-pop",
  "data-[state=open]:motion-safe:animate-pop-in data-[state=open]:motion-reduce:animate-fade-in data-[state=closed]:animate-fade-out",
);

/** Items get the global focus outline, inset. No outline utilities here (outline-none would cancel it). */
const ITEM =
  "relative flex cursor-default items-center gap-2 rounded-sm px-2 text-sm text-fg select-none focus-inset data-[highlighted]:bg-surface-hover data-[highlighted]:text-fg";
const UNAVAILABLE = "aria-disabled:cursor-not-allowed aria-disabled:text-muted";
const DESTRUCTIVE = "text-danger data-[highlighted]:bg-danger-subtle data-[highlighted]:text-danger";

export const DropdownMenu = RadixMenu.Root;
export const DropdownMenuTrigger = RadixMenu.Trigger;
export const DropdownMenuGroup = RadixMenu.Group;
export const DropdownMenuSub = RadixMenu.Sub;

export function DropdownMenuContent({
  className,
  align = "start",
  sideOffset = 4,
  children,
  ...props
}: ComponentProps<typeof RadixMenu.Content>) {
  return (
    <RadixMenu.Portal>
      <RadixMenu.Content align={align} sideOffset={sideOffset} collisionPadding={8} className={cn(PANEL, className)} {...props}>
        {children}
      </RadixMenu.Content>
    </RadixMenu.Portal>
  );
}

type ItemContentProps = {
  /** A Lucide icon element (16 px, decorative). */
  icon?: ReactElement;
  /** The label. */
  children: ReactNode;
  /** A second line: detail, or the reason an item is unavailable. */
  description?: ReactNode;
  /** A shortcut hint at the right ("Ctrl+K"). */
  shortcut?: string;
  destructive?: boolean;
};

function ItemContent({ icon, children, description, shortcut, destructive, trailing }: ItemContentProps & { trailing?: ReactNode }) {
  return (
    <>
      {icon ? (
        <span aria-hidden="true" className={cn("inline-flex shrink-0 [&_svg]:size-icon-sm", destructive ? "text-danger" : "text-muted")}>
          {icon}
        </span>
      ) : null}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate pt-0.5 pb-1">{children}</span>
        {description ? <span className="-mt-1 pb-0.5 text-xs text-muted">{description}</span> : null}
      </span>
      {shortcut ? <span className="ml-auto pl-3 text-xs text-muted">{shortcut}</span> : null}
      {trailing}
    </>
  );
}

export type DropdownMenuItemProps = ItemContentProps & {
  onSelect?: (event: Event) => void;
  /**
   * Why the item can't be used now. The item stays reachable by arrow keys (not Radix's disabled,
   * which removes it from arrow-key focus): it sets aria-disabled, shows the reason as its second
   * line, and selecting it does nothing.
   */
  unavailableReason?: string;
  /** Render the child element (a Next <Link>, an <a>) as the item. */
  asChild?: boolean;
  /** Preview only: draw the highlighted (hover or keyboard) look. */
  highlighted?: boolean;
  className?: string;
  textValue?: string;
};

export function DropdownMenuItem({
  icon,
  children,
  description,
  shortcut,
  destructive = false,
  onSelect,
  unavailableReason,
  asChild = false,
  highlighted,
  className,
  textValue,
}: DropdownMenuItemProps) {
  const { static: isStatic } = useContext(StaticMenuContext);
  const twoLine = Boolean(description ?? unavailableReason);
  const classes = cn(
    ITEM,
    twoLine ? "min-h-menu-item py-1.5" : "h-menu-item",
    "[&_svg]:size-icon-sm",
    destructive && DESTRUCTIVE,
    UNAVAILABLE,
    className,
  );
  const content = (
    <ItemContent icon={icon} description={unavailableReason ?? description} shortcut={shortcut} destructive={destructive}>
      {children}
    </ItemContent>
  );

  if (isStatic) {
    return (
      <div className={classes} data-highlighted={highlighted ? "" : undefined} aria-disabled={unavailableReason ? true : undefined}>
        {asChild ? childLabel(children) : content}
      </div>
    );
  }

  if (asChild) {
    return (
      <RadixMenu.Item asChild className={classes} textValue={textValue} onSelect={onSelect}>
        {children}
      </RadixMenu.Item>
    );
  }

  return (
    <RadixMenu.Item
      className={classes}
      textValue={textValue}
      aria-disabled={unavailableReason ? true : undefined}
      onSelect={(event) => {
        if (unavailableReason) {
          event.preventDefault();
          return;
        }
        onSelect?.(event);
      }}
    >
      {content}
    </RadixMenu.Item>
  );
}

/** In a preview an asChild item (a link) is drawn from the link's own children. */
function childLabel(children: ReactNode): ReactNode {
  if (children && typeof children === "object" && "props" in (children as ReactElement)) {
    return (children as ReactElement<{ children?: ReactNode }>).props.children;
  }
  return children;
}

function Indicator({ show }: { show: boolean }) {
  return (
    <span aria-hidden="true" className="absolute left-2 inline-flex size-icon-sm items-center justify-center">
      {show ? <Check className="size-icon-sm text-accent" /> : null}
    </span>
  );
}

export type DropdownMenuCheckboxItemProps = Omit<ItemContentProps, "destructive"> & {
  checked: boolean;
  /** Space toggles without closing the menu; pass keepOpen to keep it open on Enter and click too. */
  onCheckedChange?: (checked: boolean) => void;
  keepOpen?: boolean;
  unavailableReason?: string;
  highlighted?: boolean;
  className?: string;
};

export function DropdownMenuCheckboxItem({
  checked,
  onCheckedChange,
  keepOpen = true,
  icon,
  children,
  description,
  shortcut,
  unavailableReason,
  highlighted,
  className,
}: DropdownMenuCheckboxItemProps) {
  const { static: isStatic } = useContext(StaticMenuContext);
  const twoLine = Boolean(description ?? unavailableReason);
  const classes = cn(ITEM, twoLine ? "min-h-menu-item py-1.5" : "h-menu-item", "pl-8", UNAVAILABLE, className);
  const content = (
    <ItemContent icon={icon} description={unavailableReason ?? description} shortcut={shortcut}>
      {children}
    </ItemContent>
  );
  if (isStatic) {
    return (
      <div className={classes} data-highlighted={highlighted ? "" : undefined}>
        <Indicator show={checked} />
        {content}
      </div>
    );
  }
  return (
    <RadixMenu.CheckboxItem
      className={classes}
      checked={checked}
      aria-disabled={unavailableReason ? true : undefined}
      onCheckedChange={(next) => {
        if (!unavailableReason) onCheckedChange?.(next === true);
      }}
      onSelect={(event) => {
        if (keepOpen || unavailableReason) event.preventDefault();
      }}
    >
      <span aria-hidden="true" className="absolute left-2 inline-flex size-icon-sm items-center justify-center">
        <RadixMenu.ItemIndicator>
          <Check className="size-icon-sm text-accent" />
        </RadixMenu.ItemIndicator>
      </span>
      {content}
    </RadixMenu.CheckboxItem>
  );
}

export function DropdownMenuRadioGroup({
  value,
  onValueChange,
  children,
}: {
  value: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
}) {
  const { static: isStatic } = useContext(StaticMenuContext);
  if (isStatic) {
    return (
      <StaticMenuContext.Provider value={{ static: true, radioValue: value }}>
        <div>{children}</div>
      </StaticMenuContext.Provider>
    );
  }
  return (
    <RadixMenu.RadioGroup value={value} onValueChange={onValueChange}>
      {children}
    </RadixMenu.RadioGroup>
  );
}

export type DropdownMenuRadioItemProps = Omit<ItemContentProps, "destructive"> & {
  value: string;
  /** Something after the label (a StatusPill "Suspended"). */
  badge?: ReactNode;
  unavailableReason?: string;
  highlighted?: boolean;
  className?: string;
  textValue?: string;
};

export function DropdownMenuRadioItem({
  value,
  badge,
  icon,
  children,
  description,
  shortcut,
  unavailableReason,
  highlighted,
  className,
  textValue,
}: DropdownMenuRadioItemProps) {
  const { static: isStatic, radioValue } = useContext(StaticMenuContext);
  const twoLine = Boolean(description ?? unavailableReason);
  const classes = cn(ITEM, twoLine ? "min-h-menu-item py-1.5" : "h-menu-item", "pl-8", UNAVAILABLE, className);
  const content = (
    <ItemContent icon={icon} description={unavailableReason ?? description} shortcut={shortcut} trailing={badge}>
      {children}
    </ItemContent>
  );
  if (isStatic) {
    return (
      <div className={classes} data-highlighted={highlighted ? "" : undefined} aria-disabled={unavailableReason ? true : undefined}>
        <Indicator show={radioValue === value} />
        {content}
      </div>
    );
  }
  return (
    <RadixMenu.RadioItem
      value={value}
      className={classes}
      textValue={textValue}
      aria-disabled={unavailableReason ? true : undefined}
      onSelect={(event) => {
        if (unavailableReason) event.preventDefault();
      }}
    >
      <span aria-hidden="true" className="absolute left-2 inline-flex size-icon-sm items-center justify-center">
        <RadixMenu.ItemIndicator>
          <Check className="size-icon-sm text-accent" />
        </RadixMenu.ItemIndicator>
      </span>
      {content}
    </RadixMenu.RadioItem>
  );
}

export function DropdownMenuLabel({ children, className }: { children: ReactNode; className?: string }) {
  const { static: isStatic } = useContext(StaticMenuContext);
  const classes = cn("px-2 py-1.5 text-xs font-medium text-muted", className);
  if (isStatic) return <div className={classes}>{children}</div>;
  return <RadixMenu.Label className={classes}>{children}</RadixMenu.Label>;
}

export function DropdownMenuSeparator() {
  const { static: isStatic } = useContext(StaticMenuContext);
  const classes = "-mx-1 my-1 h-px bg-border";
  if (isStatic) return <div aria-hidden="true" className={classes} />;
  return <RadixMenu.Separator className={classes} />;
}

export function DropdownMenuSubTrigger({
  icon,
  children,
  description,
  highlighted,
  className,
}: Omit<ItemContentProps, "destructive" | "shortcut"> & { highlighted?: boolean; className?: string }) {
  const { static: isStatic } = useContext(StaticMenuContext);
  const classes = cn(
    ITEM,
    description ? "min-h-menu-item py-1.5" : "h-menu-item",
    "data-[state=open]:bg-surface-hover",
    className,
  );
  const content = (
    <ItemContent
      icon={icon}
      description={description}
      trailing={<ChevronRight aria-hidden="true" className="ml-auto size-icon-sm shrink-0 text-muted" />}
    >
      {children}
    </ItemContent>
  );
  if (isStatic) {
    return (
      <div className={classes} data-highlighted={highlighted ? "" : undefined}>
        {content}
      </div>
    );
  }
  return <RadixMenu.SubTrigger className={classes}>{content}</RadixMenu.SubTrigger>;
}

export function DropdownMenuSubContent({ className, children, ...props }: ComponentProps<typeof RadixMenu.SubContent>) {
  return (
    <RadixMenu.Portal>
      <RadixMenu.SubContent sideOffset={4} collisionPadding={8} className={cn(PANEL, className)} {...props}>
        {children}
      </RadixMenu.SubContent>
    </RadixMenu.Portal>
  );
}

/**
 * A menu panel drawn in place, for documentation and screenshots only (the /design gallery). The
 * parts inside render plain elements with the same classes; pass `highlighted` to an item to draw
 * the hover and keyboard look. Wrap it in an inert container. Never use it in the app.
 */
export function DropdownMenuPreview({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <StaticMenuContext.Provider value={{ static: true }}>
      <div className={cn("w-fit min-w-48 max-w-80 rounded-lg border border-border bg-surface-raised p-1 text-fg shadow-pop", className)}>
        {children}
      </div>
    </StaticMenuContext.Provider>
  );
}
