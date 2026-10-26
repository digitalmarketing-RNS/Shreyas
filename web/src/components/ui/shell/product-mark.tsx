import { cn } from "@/lib/cn";

/**
 * Our placeholder product mark until /replica-brand: our own 24 px SVG on Lucide's grid (two
 * offset rounded squares, an open book seen from above), drawn in currentColor. Never the
 * original's logo or an institution's logo.
 */
export function ProductMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-icon-lg shrink-0", className)}
    >
      <rect x="3" y="4" width="10" height="14" rx="2" />
      <path d="M13 7h6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-2" />
      <path d="M7 9h2" />
      <path d="M7 13h2" />
    </svg>
  );
}

/** The product name until /replica-brand picks ours. */
export const PRODUCT_NAME = "Admissions CRM";
