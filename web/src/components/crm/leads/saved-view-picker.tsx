"use client";

import { Users } from "lucide-react";
import { DropdownMenu as RadixMenu } from "radix-ui";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/overlays/dropdown-menu";
import { SAVED_VIEW_TEXT, type SavedView } from "./saved-views";

export type SavedViewPickerProps = {
  views: SavedView[];
  currentId: string;
  /** The current filters, search, sort or columns differ from the saved view. */
  edited?: boolean;
  onSelect: (id: string) => void;
  onSaveAsNew: () => void;
  onSaveChanges: () => void;
  onReset: () => void;
  onManage: () => void;
  /** Gallery: start open. */
  defaultOpen?: boolean;
};

const GROUP_LABEL = "px-2 pt-2 pb-1 text-xs font-medium text-muted";

/**
 * Save the current filters, search, sort and columns as a named view, and switch between personal
 * and shared views (components.md, SavedViewPicker). Radix DropdownMenu: views are menuitemradio
 * with aria-checked inside labelled groups. Enter, Space or Arrow Down opens the menu; arrows move,
 * typing jumps to a view by name, Enter picks and closes; Esc closes and returns focus.
 */
export function SavedViewPicker({
  views,
  currentId,
  edited = false,
  onSelect,
  onSaveAsNew,
  onSaveChanges,
  onReset,
  onManage,
  defaultOpen,
}: SavedViewPickerProps) {
  const base = useId();
  const current = views.find((view) => view.id === currentId) ?? views[0];
  const owner = Boolean(current?.mine);
  const groups: Array<{ id: string; label: string; items: SavedView[] }> = [
    { id: `${base}-built`, label: "Built in", items: views.filter((view) => view.builtIn) },
    { id: `${base}-mine`, label: "My views", items: views.filter((view) => !view.builtIn && view.mine) },
    { id: `${base}-shared`, label: "Shared", items: views.filter((view) => !view.builtIn && !view.mine) },
  ];

  return (
    <DropdownMenu defaultOpen={defaultOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" menu aria-label={`View: ${current?.name ?? ""}${edited ? ", edited" : ""}`} className="max-w-64">
          <span className="truncate pt-0.5 pb-1">{current?.name}</span>
          {edited ? (
            <span className="inline-flex items-center gap-1">
              <span aria-hidden="true" className="size-2 rounded-pill bg-accent" />
              <span className="text-xs font-normal text-muted">Edited</span>
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-96 min-w-64 overflow-auto">
        <DropdownMenuLabel className="text-sm font-semibold text-fg">Views</DropdownMenuLabel>
        {groups.map((group) =>
          group.items.length === 0 ? null : (
            <DropdownMenuGroup key={group.id} aria-labelledby={group.id}>
              <RadixMenu.Label id={group.id} className={GROUP_LABEL}>
                {group.label}
              </RadixMenu.Label>
              <DropdownMenuRadioGroup value={currentId} onValueChange={onSelect}>
                {group.items.map((view) => (
                  <DropdownMenuRadioItem
                    key={view.id}
                    value={view.id}
                    textValue={view.name}
                    icon={group.label === "Shared" ? <Users /> : undefined}
                    description={view.ownerName && !view.mine ? `Shared by ${view.ownerName}` : view.shared ? "Shared with everyone" : undefined}
                    className={view.ownerName && !view.mine ? "min-h-11" : undefined}
                  >
                    {view.name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          ),
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={onSaveAsNew}
          description={edited && !owner && current?.ownerName ? SAVED_VIEW_TEXT.notOwner(current.ownerName) : undefined}
        >
          Save as new view…
        </DropdownMenuItem>
        {edited && owner ? <DropdownMenuItem onSelect={onSaveChanges}>{`Save changes to ${current?.name}`}</DropdownMenuItem> : null}
        {edited ? <DropdownMenuItem onSelect={onReset}>Reset changes</DropdownMenuItem> : null}
        <DropdownMenuItem onSelect={onManage}>Manage views…</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
