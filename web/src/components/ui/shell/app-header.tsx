"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ProgressBar } from "@/components/ui/feedback/progress-bar";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/cn";
import { PRODUCT_NAME, ProductMark } from "./product-mark";

export type AppHeaderProps = {
  /** standard: every control. partner (S39): product mark, publisher name, account menu with Sign out only. */
  variant?: "standard" | "partner";
  productName?: string;
  homeHref?: string;
  /** The OrgSwitcher (md and up). Below md the header shows `orgName` as text; switching moves into the drawer. */
  orgSwitcher?: ReactNode;
  /** The institution's (or, for partners, the publisher's) name as text. */
  orgName: string;
  /** The global search slot (SearchInput, group 1). Hidden below md. */
  search?: ReactNode;
  /** The CheckInToggle (header form). Below md it moves into the nav drawer and the account menu. */
  checkIn?: ReactNode;
  /** The NotificationBell. */
  notifications?: ReactNode;
  /** The UserMenu. */
  userMenu: ReactNode;
  /** The menu button (below lg) opens the navigation drawer. */
  onOpenMenu?: () => void;
  menuOpen?: boolean;
  /** The id of the navigation drawer, for the menu button's aria-controls. */
  menuControls?: string;
  /** A client navigation pending for more than 300 ms: the 2 px bar along the bottom edge. */
  routeLoading?: boolean;
  /** In a framed preview the header is not the page's banner landmark. */
  as?: "header" | "div";
  className?: string;
};

/**
 * The bar at the top of every staff screen (components.md, AppHeader): the institution context
 * and the person's own controls. Tab moves left to right through the controls. Header icon
 * controls are IconButton md-bar (40 px, 24 px icons), each with a tooltip and an aria-label. The
 * header never covers focused content: html's scroll-padding-top equals its height. Its widths
 * follow the shell container (@container/shell), so a framed preview shows each form.
 */
export function AppHeader({
  variant = "standard",
  productName = PRODUCT_NAME,
  homeHref = "/",
  orgSwitcher,
  orgName,
  search,
  checkIn,
  notifications,
  userMenu,
  onOpenMenu,
  menuOpen = false,
  menuControls,
  routeLoading = false,
  as: Root = "header",
  className,
}: AppHeaderProps) {
  const partner = variant === "partner";
  return (
    <Root
      className={cn(
        "sticky top-0 z-(--z-header) flex h-header shrink-0 items-center gap-2 border-b border-border bg-surface px-3",
        className,
      )}
    >
      {!partner && onOpenMenu ? (
        <IconButton
          icon={<Menu />}
          aria-label="Open menu"
          size="md-bar"
          aria-expanded={menuOpen}
          aria-controls={menuControls}
          onClick={onOpenMenu}
          className="@5xl/shell:hidden"
        />
      ) : null}
      <Link
        href={homeHref}
        aria-label={`${productName} home`}
        className="inline-flex h-control-md shrink-0 items-center gap-2 rounded-md px-1 text-fg"
      >
        <ProductMark />
        <span aria-hidden="true" className="hidden text-md whitespace-nowrap @5xl/shell:inline">
          {productName}
        </span>
      </Link>
      {partner ? (
        <span dir="auto" className="min-w-0 max-w-60 truncate pt-0.5 pb-1 text-sm font-medium text-fg">
          {orgName}
        </span>
      ) : (
        <>
          {orgSwitcher ? <div className="hidden min-w-0 @3xl/shell:flex">{orgSwitcher}</div> : null}
          <span
            dir="auto"
            className={cn("min-w-0 max-w-60 truncate pt-0.5 pb-1 text-sm font-medium text-fg", orgSwitcher && "@3xl/shell:hidden")}
          >
            {orgName}
          </span>
        </>
      )}
      <div className="min-w-0 flex-1" />
      {!partner && search ? <div className="hidden min-w-0 @3xl/shell:block">{search}</div> : null}
      {!partner && checkIn ? <div className="hidden @3xl/shell:flex">{checkIn}</div> : null}
      {!partner ? notifications : null}
      {userMenu}
      {routeLoading ? (
        <ProgressBar
          size="sm"
          hideLabel
          label="Loading page"
          value={null}
          className="absolute inset-x-0 -bottom-px"
          trackClassName="h-0.5 rounded-none bg-transparent"
        />
      ) : null}
    </Root>
  );
}
