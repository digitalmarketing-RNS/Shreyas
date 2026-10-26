"use client";

import { Ellipsis } from "lucide-react";
import type { ReactNode } from "react";
import { IconButton } from "@/components/ui/icon-button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/overlays/dropdown-menu";

/**
 * The row actions button (IconButton xs, Ellipsis) and its menu (group 2's DropdownMenu row menu).
 * Inside the grid it keeps the default 2 px focus offset; its name says whose row it is
 * ("More actions for Meera Pillai").
 */
export function RowActionsMenu({ label, children }: { label: string; children: ReactNode }) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <IconButton icon={<Ellipsis />} aria-label={label} size="xs" tooltip={false} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">{children}</DropdownMenuContent>
    </DropdownMenu>
  );
}
