/**
 * One polite live region shared across the app (components.md CopyButton: "One polite live region
 * shared across the app"). Components that announce a result without a region of their own call
 * announce("Embed code copied"). The region is created on first use, at the end of <body>.
 */

let region: HTMLElement | null = null;
let clearTimer: number | null = null;

function getRegion(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  if (region && document.body.contains(region)) return region;
  region = document.createElement("div");
  region.setAttribute("role", "status");
  region.setAttribute("aria-live", "polite");
  region.setAttribute("aria-atomic", "true");
  region.setAttribute("data-app-announcer", "");
  // The sr-only utility, written out: this element lives outside React and Tailwind's class scan.
  Object.assign(region.style, {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: "0",
    margin: "-1px",
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    borderWidth: "0",
  });
  document.body.appendChild(region);
  return region;
}

/** Says `message` once through the shared polite region. Repeating the same words reads them again. */
export function announce(message: string): void {
  const node = getRegion();
  if (!node) return;
  node.textContent = "";
  if (clearTimer !== null) window.clearTimeout(clearTimer);
  // A fresh text node in the next frame makes screen readers read a repeated message again.
  window.requestAnimationFrame(() => {
    node.textContent = message;
    clearTimer = window.setTimeout(() => {
      node.textContent = "";
    }, 5000);
  });
}
