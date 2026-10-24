import type { Metadata, Viewport } from "next";
import { Tooltip } from "radix-ui";
import { ThemeScript } from "@/components/theme/theme-script";
import { fontVariables } from "@/fonts";
import "./globals.css";

export const metadata: Metadata = {
  // The product name is chosen in /replica-brand; until then pages carry a plain descriptor.
  title: { default: "Admissions CRM", template: "%s" },
  description: "Admissions and enquiry management for colleges and schools.",
};

export const viewport: Viewport = {
  // Native controls and scrollbars follow the theme. Zoom is never blocked.
  colorScheme: "light dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-theme, data-surface and data-motion are set by ThemeScript before the first paint, so
    // React must accept the attributes it finds on <html>.
    <html lang="en-IN" style={fontVariables} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        {/* Tooltip delays from components.md (Tooltip): 400 ms on hover, neighbours at once for 300 ms. */}
        <Tooltip.Provider delayDuration={400} skipDelayDuration={300}>
          {children}
        </Tooltip.Provider>
      </body>
    </html>
  );
}
