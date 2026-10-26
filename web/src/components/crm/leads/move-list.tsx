"use client";

import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import { type DragEvent, type KeyboardEvent, type ReactNode, useState } from "react";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/cn";

export type MoveListItem = {
  id: string;
  /** The name in the move buttons' names: "Move Course up". */
  label: string;
  /** Stays where it is: no move buttons, no handle, not a drop target above it. */
  locked?: boolean;
};

export type MoveListProps<Item extends MoveListItem> = {
  /** The list's name: "Shown in table". */
  label: string;
  items: Item[];
  /** Move an item to a new index; the page announces "Course moved to position 4 of 9." */
  onMove: (id: string, toIndex: number) => void;
  /** Before the label: the row's Checkbox, or a Lock for a locked item. */
  renderStart?: (item: Item) => ReactNode;
  /** The row's main content (defaults to the label). */
  renderLabel?: (item: Item) => ReactNode;
  /** After the move buttons: a Remove button. */
  renderEnd?: (item: Item) => ReactNode;
  /** Mark the first row's Move up button with data-autofocus (a dialog focuses it on open). */
  autoFocusFirst?: boolean;
  className?: string;
};

/**
 * A short list people put in order: Move up and Move down buttons (24 px, 4 px apart in 32 px rows)
 * for keyboard and single-pointer use, Alt+Arrow Up and Alt+Arrow Down on the row's first control,
 * and a pointer-only drag handle (aria-hidden, not a tab stop; WCAG 2.5.7). The buttons at the ends
 * use aria-disabled, so focus stays on them after the last move.
 *
 * ColumnChooser and QuickFilterManager use it until group 3's ReorderableList (section D) is shared;
 * it follows the same keyboard and announcement rules.
 */
export function MoveList<Item extends MoveListItem>({
  label,
  items,
  onMove,
  renderStart,
  renderLabel,
  renderEnd,
  autoFocusFirst = false,
  className,
}: MoveListProps<Item>) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const firstMovable = items.findIndex((item) => !item.locked);

  const move = (item: Item, index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < firstMovable || target >= items.length) return;
    onMove(item.id, target);
  };

  const onRowKeyDown = (item: Item, index: number) => (event: KeyboardEvent<HTMLLIElement>) => {
    if (!event.altKey || item.locked) return;
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      move(item, index, event.key === "ArrowUp" ? -1 : 1);
    }
  };

  const onDragOver = (index: number) => (event: DragEvent<HTMLLIElement>) => {
    if (!dragging) return;
    event.preventDefault();
    const box = event.currentTarget.getBoundingClientRect();
    const after = event.clientY > box.top + box.height / 2;
    setDropIndex(Math.max(firstMovable, index + (after ? 1 : 0)));
  };

  const onDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    if (dragging && dropIndex !== null) {
      const from = items.findIndex((item) => item.id === dragging);
      const to = dropIndex > from ? dropIndex - 1 : dropIndex;
      if (to !== from) onMove(dragging, to);
    }
    setDragging(null);
    setDropIndex(null);
  };

  return (
    <ul aria-label={label} className={cn("m-0 flex list-none flex-col p-0", className)} onDrop={onDrop} onDragOver={(event) => dragging && event.preventDefault()}>
      {items.map((item, index) => {
        const atTop = index <= firstMovable;
        const atBottom = index === items.length - 1;
        return (
          <li
            key={item.id}
            onKeyDown={onRowKeyDown(item, index)}
            onDragOver={onDragOver(index)}
            className={cn(
              "relative flex h-menu-item items-center gap-2 rounded-sm px-2 text-sm text-fg hover:bg-surface-hover",
              dragging === item.id && "bg-surface-raised shadow-pop",
            )}
          >
            {dropIndex === index && dragging ? <span aria-hidden="true" className="absolute inset-x-2 -top-px h-0.5 bg-accent" /> : null}
            {dropIndex === items.length && index === items.length - 1 && dragging ? (
              <span aria-hidden="true" className="absolute inset-x-2 -bottom-px h-0.5 bg-accent" />
            ) : null}
            {renderStart ? renderStart(item) : null}
            <span className="min-w-0 flex-1 truncate pt-0.5 pb-1">{renderLabel ? renderLabel(item) : item.label}</span>
            {item.locked ? null : (
              <span className="flex items-center gap-1">
                <IconButton
                  icon={<ArrowUp />}
                  size="xs"
                  data-autofocus={autoFocusFirst && index === firstMovable ? "" : undefined}
                  aria-label={`Move ${item.label} up`}
                  disabledReason={atTop ? "Already at the top" : undefined}
                  onClick={() => move(item, index, -1)}
                />
                <IconButton
                  icon={<ArrowDown />}
                  size="xs"
                  aria-label={`Move ${item.label} down`}
                  disabledReason={atBottom ? "Already at the bottom" : undefined}
                  onClick={() => move(item, index, 1)}
                />
              </span>
            )}
            {renderEnd ? renderEnd(item) : null}
            {item.locked ? (
              <span aria-hidden="true" className="size-6 shrink-0" />
            ) : (
              <span
                aria-hidden="true"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", item.id);
                  setDragging(item.id);
                }}
                onDragEnd={() => {
                  setDragging(null);
                  setDropIndex(null);
                }}
                className="inline-flex size-6 shrink-0 cursor-grab items-center justify-center text-muted active:cursor-grabbing"
              >
                <GripVertical className="size-icon-sm" />
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
