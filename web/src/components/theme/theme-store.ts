/**
 * Browser-side theme and motion state: reads and writes the preference cookies and the attributes
 * on <html>. The inline script from themeInitScript() does the same before the first paint; this
 * module keeps them in step afterwards. Call these only in the browser (event handlers, effects,
 * useSyncExternalStore).
 */
import {
  type MotionChoice,
  type ThemeChoice,
  THEME_LOCK_ATTRIBUTE,
  motionCookie,
  readMotionCookie,
  readThemeCookie,
  themeCookie,
} from "@/lib/theme";

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribePreferences(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function secure(): boolean {
  return typeof location !== "undefined" && location.protocol === "https:";
}

export function getThemeChoice(): ThemeChoice {
  return readThemeCookie(document.cookie);
}

export function getMotionChoice(): MotionChoice {
  return readMotionCookie(document.cookie);
}

/** Puts a theme choice on <html>, unless the page has a fixed theme (public pages, previews). */
export function applyTheme(choice: ThemeChoice): void {
  const root = document.documentElement;
  if (root.hasAttribute(THEME_LOCK_ATTRIBUTE)) return;
  if (choice === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", choice);
}

export function applyMotion(choice: MotionChoice): void {
  const root = document.documentElement;
  if (choice === "reduce") root.setAttribute("data-motion", "reduce");
  else root.removeAttribute("data-motion");
}

/**
 * Applies a theme at once and saves it in the cookie. Saving it to the member's prefs
 * (PATCH /me/prefs) is the caller's job; the cookie keeps the choice for this browser either way.
 */
export function setThemeChoice(choice: ThemeChoice): void {
  applyTheme(choice);
  document.cookie = themeCookie(choice, { secure: secure() });
  emit();
}

export function setMotionChoice(choice: MotionChoice): void {
  applyMotion(choice);
  document.cookie = motionCookie(choice, { secure: secure() });
  emit();
}
