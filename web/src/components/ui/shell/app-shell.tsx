"use client";

import { usePathname } from "next/navigation";
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Banner } from "@/components/ui/feedback/banner";
import { BannerStack } from "@/components/ui/feedback/banner-stack";
import { Toaster } from "@/components/ui/feedback/toaster";
import { Drawer } from "@/components/ui/overlays/drawer";
import { PortalContainerProvider } from "@/components/ui/overlays/portal-container";
import { cn } from "@/lib/cn";
import { AppHeader } from "./app-header";
import { IdleWarningDialog, type IdleWarningDialogProps } from "./idle-warning-dialog";
import type { NavItemId } from "./nav-items";
import { OrgChangedDialog } from "./org-changed-dialog";
import { SessionExpiredDialog } from "./session-expired-dialog";
import { SettingsSubnav } from "./settings-subnav";
import { ShellContextProvider, type ShellContextValue, useElementBreakpoint, useLayerRegistry } from "./shell-context";
import { Sidebar, type SidebarPreference } from "./sidebar";
import { SkipLink } from "./skip-link";

/**
 * - standard: list and detail pages. settings: adds the section subnav column at lg and up.
 * - full-bleed: main has no max width and no vertical padding; inner panes scroll, the page does
 *   not (S12 calendar, S15 inbox, S18 builder).
 * - partner: S39 publisher portal. Header with the publisher's name and Sign out only; no sidebar,
 *   no org switcher, no check-in, no bell.
 */
export type AppShellVariant = "standard" | "settings" | "full-bleed" | "partner";

export type AppShellProps = {
  variant?: AppShellVariant;
  /** main's width: content (max-w-content, 1440 px), form (max-w-form, 720 px), or full (tables, boards). */
  width?: "content" | "form" | "full";
  /** The current path; defaults to the router's. */
  pathname?: string;
  productName?: string;
  /** The institution's name (or, for partners, the publisher's). */
  orgName: string;
  /** Header slots. The narrow header (below md) hides the switcher, search and check-in. */
  orgSwitcher?: ReactNode;
  search?: ReactNode;
  checkIn?: ReactNode;
  notifications?: ReactNode;
  userMenu: ReactNode;
  /** The nav drawer's top: the OrgSwitcher (drawer form) and the CheckInToggle. */
  drawerTop?: ReactNode;
  /** The sidebar choice from member prefs (mirrored to a cookie, so the server renders the right width). */
  sidebarPreference?: SidebarPreference;
  onSidebarPreferenceChange?: (preference: SidebarPreference) => void;
  navCounts?: Partial<Record<NavItemId, number>>;
  can?: (permission: string) => boolean;
  /** Page-level Banners (BannerStack), above the PageHeader. */
  banners?: ReactNode;
  /** The JobTray. */
  jobTray?: ReactNode;
  children?: ReactNode;
  /** A client navigation pending for more than 300 ms (also reported by the sidebar's links). */
  routeLoading?: boolean;
  /** Overrides the browser's online state (documentation). */
  offline?: boolean;
  /** The institution is suspended: a danger Banner; every action that changes data is aria-disabled. */
  suspended?: boolean;
  /** The idle warning, opened 2 minutes before the idle limit. */
  idleWarning?: Omit<IdleWarningDialogProps, "open"> | null;
  sessionExpired?: boolean;
  /** Switched institution in another tab. */
  orgChanged?: { sessionOrg: string; onReload: () => void } | null;
  /**
   * A framed preview (the /design gallery): the shell scrolls inside the frame, overlays mount in
   * the frame, scroll padding and layer heights are written to the frame, landmark names carry the
   * label, and navigation is intercepted so the gallery page stays put.
   */
  preview?: { label: string; height: number; onNavigate?: (href: string) => void };
  className?: string;
};

function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

const SCROLL_PADDING = ["scroll-pt-[calc(var(--layout-header)+var(--sticky-extra,0px))]", "scroll-pb-[var(--bottom-bar,0px)]"];

/**
 * The frame of every signed-in staff screen (components.md, AppShell): SkipLink, header, sidebar,
 * banner slot, main, the background-task tray, the toast region and one sr-only polite status
 * region, with the same landmarks and focus rules everywhere. Tab order: SkipLink > header > sidebar
 * and the collapse button > banners > main > background tasks. F8 moves focus to the toast region.
 * On a client route change focus moves to the page's h1 (tabindex="-1"); on the first load the
 * browser default is kept.
 *
 * Layout follows the shell's own width through container queries (@container/shell), which is the
 * viewport width in the app: xl and up the sidebar is expanded unless collapsed; lg to xl collapsed
 * by default; md to lg the rail only, with "Expand menu" opening the drawer; below md no rail, the
 * header's menu button opens the drawer.
 */
export function AppShell({
  variant = "standard",
  width = "content",
  pathname: pathnameProp,
  productName,
  orgName,
  orgSwitcher,
  search,
  checkIn,
  notifications,
  userMenu,
  drawerTop,
  sidebarPreference: preferenceProp,
  onSidebarPreferenceChange,
  navCounts,
  can,
  banners,
  jobTray,
  children,
  routeLoading: routeLoadingProp = false,
  offline: offlineProp,
  suspended = false,
  idleWarning = null,
  sessionExpired = false,
  orgChanged = null,
  preview,
  className,
}: AppShellProps) {
  const routerPath = usePathname();
  const pathname = pathnameProp ?? routerPath ?? "/";
  const rootRef = useRef<HTMLDivElement>(null);
  const breakpoint = useElementBreakpoint(rootRef);
  const layers = useLayerRegistry(rootRef, Boolean(preview));
  const ids = useId();
  const mainId = preview ? `${ids}-main` : "main";
  const navId = `${ids}-nav`;
  const drawerNavId = `${ids}-drawer-nav`;
  const partner = variant === "partner";

  const [internalPreference, setInternalPreference] = useState<SidebarPreference>(preferenceProp ?? "auto");
  const preference = preferenceProp ?? internalPreference;
  const setPreference = (next: SidebarPreference) => {
    if (preferenceProp === undefined) setInternalPreference(next);
    onSidebarPreferenceChange?.(next);
  };

  // The rail's effective state, for tooltips and aria-expanded (CSS already decides the width).
  const collapsed =
    breakpoint === null || breakpoint === "base"
      ? null
      : breakpoint === "md"
        ? true
        : breakpoint === "lg"
          ? preference !== "expanded"
          : preference === "collapsed";

  const [navOpen, setNavOpen] = useState(false);
  const [navPath, setNavPath] = useState(pathname);
  if (navPath !== pathname) {
    // The drawer closes on navigation.
    setNavPath(pathname);
    setNavOpen(false);
  }

  const [navigating, setNavigatingState] = useState(false);
  const [showRouteBar, setShowRouteBar] = useState(false);
  useEffect(() => {
    if (!navigating && !routeLoadingProp) return;
    const timer = window.setTimeout(() => setShowRouteBar(true), 300);
    return () => {
      window.clearTimeout(timer);
      setShowRouteBar(false);
    };
  }, [navigating, routeLoadingProp]);

  const [announcement, setAnnouncement] = useState("");
  const [portal, setPortal] = useState<HTMLDivElement | null>(null);

  const browserOffline = useSyncExternalStore(
    subscribeOnline,
    () => !navigator.onLine,
    () => false,
  );
  const offline = offlineProp ?? browserOffline;

  const openNav = useCallback(() => setNavOpen(true), []);
  const setNavigating = useCallback((pending: boolean) => setNavigatingState(pending), []);
  const context = useMemo<ShellContextValue>(
    () => ({ breakpoint, preview: Boolean(preview), layers, announce: setAnnouncement, setNavigating, openNav }),
    [breakpoint, preview, layers, setNavigating, openNav],
  );

  // Focus moves to the page's h1 after a client route change; the first load keeps the browser default.
  const firstPath = useRef(pathname);
  useEffect(() => {
    if (pathname === firstPath.current) return;
    firstPath.current = pathname;
    document.getElementById(mainId)?.querySelector<HTMLElement>("h1, h2")?.focus();
  }, [pathname, mainId]);

  // Scroll padding keeps focused elements clear of the header and bottom bars (2.4.11).
  useEffect(() => {
    if (preview) return;
    const html = document.documentElement;
    html.classList.add(...SCROLL_PADDING);
    return () => html.classList.remove(...SCROLL_PADDING);
  }, [preview]);

  const onToggle = () => {
    if (breakpoint === "md") {
      setNavOpen(true);
      return;
    }
    setPreference(collapsed ? "expanded" : "collapsed");
  };

  const navLabel = preview ? `Main (${preview.label})` : "Main";
  const MainElement = preview ? "div" : "main";
  const style = preview ? ({ "--shell-vh": `${preview.height}px` } as CSSProperties) : undefined;

  const shellBanners = (
    <>
      {offline ? <Banner kind="session" messageKey="offline" announce /> : null}
      {suspended ? <Banner kind="blocking" messageKey="org_suspended" params={{ Institution: orgName }} /> : null}
      {banners}
    </>
  );

  return (
    <ShellContextProvider value={context}>
      <PortalContainerProvider container={preview ? portal : null}>
        <div
          ref={rootRef}
          data-shell=""
          style={style}
          className={cn(
            "@container/shell relative flex flex-col bg-bg font-sans text-fg",
            preview ? cn("h-full overflow-y-auto", SCROLL_PADDING) : "min-h-dvh",
            className,
          )}
        >
          <Toaster hotkey={preview ? [] : undefined} label={preview ? `Updates (${preview.label})` : undefined}>
            <SkipLink href={`#${mainId}`} />
            <AppHeader
              variant={partner ? "partner" : "standard"}
              productName={productName}
              orgName={orgName}
              orgSwitcher={orgSwitcher}
              search={search}
              checkIn={checkIn}
              notifications={notifications}
              userMenu={userMenu}
              onOpenMenu={partner ? undefined : () => setNavOpen(true)}
              menuOpen={navOpen}
              menuControls={drawerNavId}
              routeLoading={showRouteBar}
            />
            <div className="flex min-h-0 flex-1">
              {partner ? null : (
                <Sidebar
                  id={navId}
                  label={navLabel}
                  preference={preference}
                  currentPath={pathname}
                  counts={navCounts}
                  can={can}
                  collapsed={collapsed}
                  onToggle={onToggle}
                  onNavigate={preview?.onNavigate}
                  prefetch={preview ? false : undefined}
                />
              )}
              {variant === "settings" ? (
                <SettingsSubnav form="column" currentPath={pathname} onNavigate={preview?.onNavigate} prefetch={preview ? false : undefined} />
              ) : null}
              <div className="flex min-w-0 flex-1 flex-col">
                <BannerStack label={preview ? `Notices (${preview.label})` : "Notices"}>{shellBanners}</BannerStack>
                <MainElement
                  id={mainId}
                  tabIndex={-1}
                  className={cn(
                    "flex min-w-0 flex-1 flex-col",
                    variant === "full-bleed"
                      ? "h-[calc(var(--shell-vh,100dvh)-var(--layout-header))] overflow-hidden"
                      : "px-gutter-sm pt-4 pb-[calc(2rem+var(--bottom-bar,0px))] @3xl/shell:px-gutter",
                  )}
                >
                  <div
                    className={cn(
                      "flex w-full min-w-0 flex-col",
                      variant === "full-bleed" ? "h-full" : "gap-section-gap",
                      variant !== "full-bleed" && width === "content" && "mx-auto max-w-content",
                      variant !== "full-bleed" && width === "form" && "max-w-form",
                    )}
                  >
                    {variant === "settings" ? (
                      <SettingsSubnav form="popover" currentPath={pathname} onNavigate={preview?.onNavigate} prefetch={preview ? false : undefined} />
                    ) : null}
                    {children}
                  </div>
                </MainElement>
              </div>
            </div>
            {jobTray}
            <div role="status" className="sr-only">
              {announcement}
            </div>
            {partner ? null : (
              <Drawer
                open={navOpen}
                onOpenChange={setNavOpen}
                side="left"
                size="nav"
                title="Menu"
                closeLabel="Close menu"
                bodyClassName="p-0"
                initialFocus={() => document.getElementById(drawerNavId)?.querySelector<HTMLElement>("[aria-current]") ?? null}
              >
                <Sidebar
                  form="drawer"
                  id={drawerNavId}
                  label={navLabel}
                  currentPath={pathname}
                  counts={navCounts}
                  can={can}
                  top={drawerTop}
                  onNavigate={
                    preview?.onNavigate
                      ? (href) => {
                          preview.onNavigate?.(href);
                          setNavOpen(false);
                        }
                      : undefined
                  }
                  prefetch={preview ? false : undefined}
                />
              </Drawer>
            )}
            {idleWarning ? <IdleWarningDialog open {...idleWarning} /> : null}
            <SessionExpiredDialog open={sessionExpired} />
            {orgChanged ? <OrgChangedDialog open shownOrg={orgName} sessionOrg={orgChanged.sessionOrg} onReload={orgChanged.onReload} /> : null}
          </Toaster>
          {preview ? <div ref={setPortal} /> : null}
        </div>
      </PortalContainerProvider>
    </ShellContextProvider>
  );
}
