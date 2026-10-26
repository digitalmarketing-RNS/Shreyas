"use client";

import { Copy, Pencil, Share2, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/forms/text-input";
import { Dialog, DialogCancel } from "@/components/ui/overlays/dialog";
import { SAVED_VIEW_TEXT, type SavedView } from "./saved-views";

export type ManageViewsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  views: SavedView[];
  onRename: (id: string, name: string) => void;
  onShareChange: (id: string, shared: boolean) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
};

/**
 * "Manage views" (dialog-md, components.md SavedViewPicker): the person's views with Rename, Share
 * or Stop sharing, Duplicate and Delete; shared views from others with Duplicate only. Delete asks
 * first, in place in the row (a dialog never opens another dialog).
 */
export function ManageViewsDialog({ open, onOpenChange, views, onRename, onShareChange, onDuplicate, onDelete }: ManageViewsDialogProps) {
  const [renaming, setRenaming] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [status, setStatus] = useState("");
  const mine = views.filter((view) => view.mine && !view.builtIn);
  const others = views.filter((view) => !view.mine && !view.builtIn);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Manage views" size="md" footer={<DialogCancel>Close</DialogCancel>}>
      <div className="flex flex-col gap-5">
        <section aria-labelledby="manage-views-mine" className="flex flex-col gap-2">
          <h3 id="manage-views-mine" className="m-0 text-xs font-medium text-muted">
            My views
          </h3>
          {mine.length === 0 ? <p className="m-0 text-sm text-muted">You haven&apos;t saved any views yet.</p> : null}
          <ul className="m-0 flex list-none flex-col divide-y divide-border p-0">
            {mine.map((view) => (
              <li key={view.id} className="flex flex-col gap-2 py-2">
                {renaming === view.id ? (
                  <TextInput
                    aria-label={`New name for ${view.name}`}
                    size="sm"
                    defaultValue={view.name}
                    maxLength={60}
                    autoFocus
                    onSave={(name) => {
                      if (name.trim()) onRename(view.id, name.trim());
                      setRenaming(null);
                      setStatus(`Renamed to ${name.trim()}.`);
                    }}
                    onCancel={() => setRenaming(null)}
                  />
                ) : (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="min-w-0 flex-1 truncate pt-0.5 pb-1 text-sm text-fg">
                      {view.name}
                      {view.shared ? <span className="ml-2 text-xs text-muted">Shared with everyone</span> : null}
                    </span>
                    <span className="flex flex-wrap items-center gap-1">
                      <Button variant="ghost" size="xs" leadingIcon={<Pencil />} aria-label={`Rename ${view.name}`} onClick={() => setRenaming(view.id)}>
                        Rename
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        leadingIcon={view.shared ? <Users /> : <Share2 />}
                        aria-label={`${view.shared ? "Stop sharing" : "Share"} ${view.name}`}
                        onClick={() => {
                          onShareChange(view.id, !view.shared);
                          setStatus(view.shared ? `${view.name} is now only yours.` : `${view.name} is shared with everyone.`);
                        }}
                      >
                        {view.shared ? "Stop sharing" : "Share"}
                      </Button>
                      <Button variant="ghost" size="xs" leadingIcon={<Copy />} aria-label={`Duplicate ${view.name}`} onClick={() => onDuplicate(view.id)}>
                        Duplicate
                      </Button>
                      <Button variant="ghost" size="xs" leadingIcon={<Trash2 />} aria-label={`Delete ${view.name}`} onClick={() => setConfirming(view.id)}>
                        Delete
                      </Button>
                    </span>
                  </div>
                )}
                {confirming === view.id ? (
                  <div role="group" aria-labelledby={`${view.id}-confirm`} className="flex flex-col gap-2 rounded-md bg-danger-subtle p-3 text-sm text-fg">
                    <p id={`${view.id}-confirm`} className="m-0 font-semibold">{`Delete "${view.name}"?`}</p>
                    <p className="m-0">
                      {view.shared ? "People who use this shared view will lose it. Their own views aren't affected." : "This view will be gone for good."}
                    </p>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button variant="secondary" size="sm" onClick={() => setConfirming(null)}>
                        Cancel
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        loading={deleting}
                        loadingLabel="Deleting…"
                        className="focus-visible:outline-on-danger"
                        onClick={async () => {
                          setDeleting(true);
                          try {
                            await onDelete(view.id);
                            setStatus(`${view.name} deleted.`);
                            setConfirming(null);
                          } finally {
                            setDeleting(false);
                          }
                        }}
                      >
                        Delete view
                      </Button>
                    </div>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="manage-views-shared" className="flex flex-col gap-2">
          <h3 id="manage-views-shared" className="m-0 text-xs font-medium text-muted">
            Shared with you
          </h3>
          <ul className="m-0 flex list-none flex-col divide-y divide-border p-0">
            {others.map((view) => (
              <li key={view.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate pt-0.5 pb-1 text-sm text-fg">{view.name}</span>
                  {view.ownerName ? <span className="text-xs text-muted">{`Shared by ${view.ownerName}`}</span> : null}
                </span>
                <Button variant="ghost" size="xs" leadingIcon={<Copy />} aria-label={`Duplicate ${view.name}`} onClick={() => onDuplicate(view.id)}>
                  Duplicate
                </Button>
              </li>
            ))}
          </ul>
        </section>
        <p className="m-0 text-xs text-muted">{SAVED_VIEW_TEXT.shareNote}</p>
        <p role="status" className="sr-only">
          {status}
        </p>
      </div>
    </Dialog>
  );
}
