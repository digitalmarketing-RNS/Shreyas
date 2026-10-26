/**
 * Theme and motion preferences (decisions.md sections 6 and 8).
 *
 * - Theme: "system" (default, no attribute: the OS decides), "light" or "dark", written as
 *   data-theme on <html>. tokens.css holds the values for both.
 * - Reduce motion: data-motion="reduce" on <html>, on top of the OS setting.
 * - Both are kept in first-party cookies, so an inline script in <head> applies them before the
 *   first paint. The root layout stays statically renderable because the server never reads them.
 * - Public, student-facing routes are always light and use the public surface (system fonts,
 *   16 px text): data-theme="light" data-surface="public".
 *
 * This module has no React and no browser globals at import time, so the server, the client and
 * the unit tests can all use it.
 */

export const THEME_COOKIE = "theme";
export const MOTION_COOKIE = "motion";
/** One year. The member's saved preference (PATCH /me/prefs) is the long-term record. */
export const PREF_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const THEME_CHOICES = ["system", "light", "dark"] as const;
export type ThemeChoice = (typeof THEME_CHOICES)[number];
export type MotionChoice = "system" | "reduce";

/**
 * Route prefixes of the public pages (decisions.md section 4): S01 enquiry form, S02 payment and
 * return, guardian consent, privacy requests, verification links and unsubscribe. They stay light
 * whatever the visitor's cookie or OS says.
 */
export const PUBLIC_ROUTE_PREFIXES = ["/f/", "/pay/", "/consent/", "/privacy/", "/v/", "/unsubscribe/"] as const;

/** Attribute that marks a page whose theme is fixed (public pages, light-only previews). */
export const THEME_LOCK_ATTRIBUTE = "data-theme-lock";

export function isThemeChoice(value: unknown): value is ThemeChoice {
  return typeof value === "string" && (THEME_CHOICES as readonly string[]).includes(value);
}

export function parseThemeChoice(value: string | null | undefined): ThemeChoice {
  return isThemeChoice(value) ? value : "system";
}

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/** Reads one cookie from a document.cookie-style string. */
export function readCookie(cookieHeader: string, name: string): string | undefined {
  for (const part of cookieHeader.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index).trim() === name) {
      try {
        return decodeURIComponent(part.slice(index + 1).trim());
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}

export function readThemeCookie(cookieHeader: string): ThemeChoice {
  return parseThemeChoice(readCookie(cookieHeader, THEME_COOKIE));
}

export function readMotionCookie(cookieHeader: string): MotionChoice {
  return readCookie(cookieHeader, MOTION_COOKIE) === "reduce" ? "reduce" : "system";
}

function prefCookie(name: string, value: string, secure: boolean): string {
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${PREF_COOKIE_MAX_AGE}; SameSite=Lax${secure ? "; Secure" : ""}`;
}

/** The Set-Cookie / document.cookie string that saves a theme choice. */
export function themeCookie(choice: ThemeChoice, { secure = false } = {}): string {
  return prefCookie(THEME_COOKIE, choice, secure);
}

/** The Set-Cookie / document.cookie string that saves the reduce-motion choice. */
export function motionCookie(choice: MotionChoice, { secure = false } = {}): string {
  return prefCookie(MOTION_COOKIE, choice, secure);
}

/**
 * The script the root layout inlines in <head>. It runs while the browser parses the page, before
 * the first paint, so the saved theme never flashes. Kept small and dependency free; it must never
 * throw (a blocked cookie jar or an old browser leaves the System theme in place).
 */
export function themeInitScript(): string {
  const prefixes = JSON.stringify(PUBLIC_ROUTE_PREFIXES);
  return [
    "(function(){try{",
    "var d=document.documentElement,p=location.pathname,c=document.cookie,i;",
    `var pub=${prefixes};`,
    "for(i=0;i<pub.length;i++){if(p.indexOf(pub[i])===0){",
    `d.setAttribute("data-theme","light");d.setAttribute("data-surface","public");d.setAttribute("${THEME_LOCK_ATTRIBUTE}","");return}}`,
    `var t=c.match(/(?:^|;\\s*)${THEME_COOKIE}=(light|dark)(?:;|$)/);`,
    'if(t)d.setAttribute("data-theme",t[1]);',
    `if(/(?:^|;\\s*)${MOTION_COOKIE}=reduce(?:;|$)/.test(c))d.setAttribute("data-motion","reduce");`,
    "}catch(e){}})();",
  ].join("");
}
