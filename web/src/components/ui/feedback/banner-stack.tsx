"use client";

import { Children, type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * The banners above the PageHeader, in the content column (components.md, Banner). A region named
 * "Notices". More than 2 banners: the first 2 show, then "2 more notices" expands the stack. It
 * comes after the header and sidebar and before main in the Tab order; the SkipLink goes past it.
 */
export function BannerStack({ children, label = "Notices" }: { children?: ReactNode; label?: string }) {
  const [expanded, setExpanded] = useState(false);
  const banners = Children.toArray(children).filter(Boolean);
  if (banners.length === 0) return null;
  const hidden = expanded ? 0 : Math.max(0, banners.length - 2);
  const shown = hidden > 0 ? banners.slice(0, 2) : banners;

  return (
    <section aria-label={label} className="flex flex-col">
      {shown}
      {hidden > 0 ? (
        <div className="border-b border-border bg-surface px-gutter-sm py-1 @3xl/shell:px-gutter">
          <Button variant="link" onClick={() => setExpanded(true)}>
            {hidden === 1 ? "1 more notice" : `${hidden} more notices`}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
