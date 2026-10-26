import { themeInitScript } from "@/lib/theme";

/**
 * Put this inside <head> in the root layout. It applies the saved theme (and reduce-motion
 * setting) to <html> before the first paint, and keeps public routes light. <html> needs
 * suppressHydrationWarning, because the script changes its attributes before React hydrates.
 * A Content Security Policy without 'unsafe-inline' needs a nonce on this script.
 */
export function ThemeScript({ nonce }: { nonce?: string }) {
  return <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeInitScript() }} />;
}
