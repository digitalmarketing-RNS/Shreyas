"use client";

import { Bell, CircleQuestionMark, ExternalLink, Keyboard, LogOut, Monitor, Moon, Sun, UserRound } from "lucide-react";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { getMotionChoice, getThemeChoice, setMotionChoice, setThemeChoice, subscribePreferences } from "@/components/theme/theme-store";
import { Avatar } from "@/components/ui/display/avatar";
import { Spinner } from "@/components/ui/feedback/spinner";
import { useToast } from "@/components/ui/feedback/toaster";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/overlays/dropdown-menu";
import { cn } from "@/lib/cn";
import { type ThemeChoice, isThemeChoice } from "@/lib/theme";
import { CheckInMenuItem, type CheckInValue } from "./check-in-toggle";

export type MenuUser = {
  name: string;
  email: string;
  /** The role at this institution: "Counsellor". */
  role: string;
};

export type PreferenceChange = { theme?: ThemeChoice; reduceMotion?: boolean; shortcuts?: boolean };

export type UserMenuProps = {
  user: MenuUser;
  /** partner (S39): the header block and "Sign out" only. */
  variant?: "standard" | "partner";
  profileHref?: string;
  notificationSettingsHref?: string;
  helpHref?: string;
  /** Single-key shortcuts ("/" focuses search), off when the person turns them off (WCAG 2.1.4). */
  shortcuts?: boolean;
  onShortcutsChange?: (on: boolean) => void;
  /** PATCH /me/prefs. A rejection keeps the choice for this session and shows the "wasn't saved" toast. */
  onSavePreference?: (change: PreferenceChange) => Promise<void>;
  /** Signs out, then the app navigates to /login. Needs no confirmation. */
  onSignOut?: () => Promise<void> | void;
  /** The narrow header (below md) moves check-in into this menu. */
  checkIn?: CheckInValue & { onChange?: (checkedIn: boolean) => Promise<void> };
  className?: string;
};

const THEME_OPTIONS = [
  { value: "system", label: "Match system", icon: <Monitor /> },
  { value: "light", label: "Light", icon: <Sun /> },
  { value: "dark", label: "Dark", icon: <Moon /> },
] as const;

/**
 * The person's own menu: who they are, their preferences and sign out (components.md, UserMenu).
 * As DropdownMenu: arrows, typeahead, Right opens the Theme submenu and Left closes it, Space
 * toggles checkbox items without closing the menu, Esc closes. Theme and Reduce motion apply at
 * once (data-theme and data-motion on <html>, then the cookie and PATCH /me/prefs).
 */
export function UserMenu({
  user,
  variant = "standard",
  profileHref = "/me",
  notificationSettingsHref = "/me/notifications",
  helpHref = "/help",
  shortcuts = true,
  onShortcutsChange,
  onSavePreference,
  onSignOut,
  checkIn,
  className,
}: UserMenuProps) {
  const theme = useSyncExternalStore(subscribePreferences, getThemeChoice, () => "system" as const);
  const motion = useSyncExternalStore(subscribePreferences, getMotionChoice, () => "system" as const);
  const [signingOut, setSigningOut] = useState(false);
  const { toast } = useToast();

  const save = async (change: PreferenceChange) => {
    try {
      await onSavePreference?.(change);
    } catch {
      toast({ tone: "error", title: "Couldn't save your preference. It applies until you sign out.", foreground: true });
    }
  };

  const header = (
    <div className="flex flex-col px-2 py-2">
      <span dir="auto" className="truncate pt-0.5 pb-1 text-sm font-semibold text-fg">
        {user.name}
      </span>
      <span className="-mt-1 truncate text-xs text-muted">{user.email}</span>
      <span className="text-xs text-muted">{user.role}</span>
    </div>
  );

  const signOut = (
    <DropdownMenuItem
      icon={signingOut ? <Spinner size="xs" delay={0} /> : <LogOut />}
      onSelect={(event) => {
        event.preventDefault();
        if (signingOut) return;
        setSigningOut(true);
        void Promise.resolve(onSignOut?.()).finally(() => setSigningOut(false));
      }}
    >
      {signingOut ? "Signing out…" : "Sign out"}
    </DropdownMenuItem>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex size-control-md shrink-0 items-center justify-center rounded-md transition-colors duration-fast hover:bg-surface-hover data-[state=open]:bg-surface-hover",
            className,
          )}
        >
          <Avatar name={user.name} size="md" variant="you" />
          <span className="sr-only">{`Account menu for ${user.name}`}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 max-w-[calc(100vw-2rem)]">
        {header}
        <DropdownMenuSeparator />
        {variant === "partner" ? (
          signOut
        ) : (
          <>
            <DropdownMenuItem asChild>
              <Link href={profileHref}>
                <UserRound aria-hidden="true" className="size-icon-sm shrink-0 text-muted" />
                <span className="truncate pt-0.5 pb-1">Your profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={notificationSettingsHref}>
                <Bell aria-hidden="true" className="size-icon-sm shrink-0 text-muted" />
                <span className="truncate pt-0.5 pb-1">Notification settings</span>
              </Link>
            </DropdownMenuItem>
            {checkIn ? <CheckInMenuItem {...checkIn} /> : null}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger icon={<Monitor />}>Theme</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-48">
                <DropdownMenuRadioGroup
                  value={theme}
                  onValueChange={(value) => {
                    if (!isThemeChoice(value)) return;
                    setThemeChoice(value);
                    void save({ theme: value });
                  }}
                >
                  {THEME_OPTIONS.map((option) => (
                    <DropdownMenuRadioItem key={option.value} value={option.value} icon={option.icon}>
                      {option.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuCheckboxItem
              checked={motion === "reduce"}
              onCheckedChange={(on) => {
                setMotionChoice(on ? "reduce" : "system");
                void save({ reduceMotion: on });
              }}
            >
              Reduce motion
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={shortcuts}
              icon={<Keyboard />}
              onCheckedChange={(on) => {
                onShortcutsChange?.(on);
                void save({ shortcuts: on });
              }}
            >
              Single-key shortcuts
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href={helpHref} target="_blank" rel="noreferrer">
                <CircleQuestionMark aria-hidden="true" className="size-icon-sm shrink-0 text-muted" />
                <span className="truncate pt-0.5 pb-1">Help and guides</span>
                <ExternalLink aria-hidden="true" className="ml-auto size-icon-sm shrink-0 text-muted" />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {signOut}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
