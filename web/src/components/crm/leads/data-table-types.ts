import type { ReactNode } from "react";

/**
 * Types for DataTable (components.md, DataTable). Sort, filters, search and page live in the URL;
 * the page passes them in and gets changes back through the callbacks.
 */

export type SortDirection = "asc" | "desc";
export type SortState = { columnId: string; direction: SortDirection };

/** text (default), number (right-aligned, tabular), date, or a control column (StageBadge, owner…). */
export type ColumnKind = "text" | "number" | "date" | "other";

export type DataTableColumn<Row> = {
  id: string;
  /** The <th> text and the sort button's name: "Created". */
  header: string;
  kind?: ColumnKind;
  sortable?: boolean;
  /** Masked for this role (Mobile, Email): never sortable by it. */
  masked?: boolean;
  cell: (row: Row) => ReactNode;
  /** The full value of a truncated text cell, for its title attribute. */
  title?: (row: Row) => string | undefined;
  /** The cell holds several controls: Enter or F2 moves into it, Tab cycles, Esc goes back. */
  composite?: boolean;
  /** Width classes; defaults by kind (min-w-32, or min-w-24 for numbers and dates). */
  className?: string;
};

/**
 * new: nobody has worked on the lead yet (leads.untouched). merged: a duplicate merged into
 * another lead. on-hold: kept under a DPDP retention hold, shown only through "Show leads on hold".
 */
export type RowMarker = "new" | "merged" | "on-hold" | null;

export type PrimaryColumn<Row> = {
  /** "Name". */
  header: string;
  name: (row: Row) => string;
  href: (row: Row) => string;
  marker?: (row: Row) => RowMarker;
  /** Merged rows: the main record's name ("Merged into Meera Pillai"). */
  mergedInto?: (row: Row) => string | undefined;
  /** A second line in text-muted under the name ("Lead #10234"). */
  secondary?: (row: Row) => ReactNode;
  sortable?: boolean;
};

export type TableNoun = { one: string; other: string };

/**
 * ready: rows (or the empty state). loading: first load, Skeleton rows. refreshing: the rows stay
 * and a line runs along the top. error: with rows, an Alert above the table; without, the message
 * and "Try again" in the body.
 */
export type TableStatus = "ready" | "loading" | "refreshing" | "error";

/** Words for sort directions, by column kind. */
export function sortWords(kind: ColumnKind | undefined, direction: SortDirection): string {
  if (kind === "date") return direction === "desc" ? "newest first" : "oldest first";
  if (kind === "number") return direction === "desc" ? "highest first" : "lowest first";
  return direction === "asc" ? "A to Z" : "Z to A";
}

/** The first direction when a column is sorted: descending for dates and numbers, ascending for text. */
export function firstDirection(kind: ColumnKind | undefined): SortDirection {
  return kind === "date" || kind === "number" ? "desc" : "asc";
}
