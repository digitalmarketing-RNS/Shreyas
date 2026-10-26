/**
 * Saved views (components.md, SavedViewPicker). A view saves filters, search, sort and columns. A
 * shared view shares the filters, not the data: each person sees only the records their role and
 * data scope allow. The view id lives in the URL (?view=…), and so do edits on top of it.
 */
export type SavedView = {
  id: string;
  name: string;
  /** "All leads" and "My leads". */
  builtIn?: boolean;
  /** The signed-in person owns it. */
  mine?: boolean;
  /** Everyone at the institution can use it. */
  shared?: boolean;
  /** For shared views from others: "Ravi Kumar". */
  ownerName?: string;
  /** Audience picker (S16): the saved filter's match count, formatted ("About 1,240 leads"). */
  matchCount?: string;
};

export const SAVED_VIEW_TEXT = {
  notOwner: (owner: string) => `Only ${owner} can change this view. Save a copy instead.`,
  deletedToast: "This view was deleted by its owner. Showing All leads.",
  removedField: "A filter in this view uses a field that was removed. Fix or delete that condition in More filters.",
  nameTaken: (name: string) => `You already have a view called "${name}". Pick another name.`,
  nameMissing: "Give the view a name.",
  shareNote: "Everyone sees only the leads their role allows.",
} as const;
