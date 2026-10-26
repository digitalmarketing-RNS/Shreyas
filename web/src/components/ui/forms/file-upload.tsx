"use client";

import { CircleAlert, CircleCheck, CloudUpload, Download, FileText, Paperclip, RotateCcw, Trash2, X } from "lucide-react";
import { type ChangeEvent, type DragEvent, type ReactNode, useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { ControlSpinner, IconButton } from "../icon-button";
import { buttonVariants } from "../button";
import { useFieldControl } from "./field-context";
import { checkFile, formatFileSize, middleTruncate } from "./files";
import { type FileUploader, UploadError, signedUrlUploader } from "./uploads";

export type FileRowStatus = "checking" | "uploading" | "uploaded" | "invalid" | "failed" | "unreadable" | "cancelled";

export type FileRow = {
  key: string;
  name: string;
  size: number;
  status: FileRowStatus;
  /** 0 to 100 while uploading. */
  progress?: number;
  /** The server's file id once uploaded; submitted as `{name}[]`. */
  id?: string;
  /** The message for invalid rows ("photo.jpg is 7.2 MB. The limit is 5 MB."). */
  message?: string;
  /** Read-only lists link each file. */
  href?: string;
};

export type FileUploadProps = {
  /** Uploaded file ids leave as hidden inputs named `{name}[]`. */
  name: string;
  /** single (S07 import, S01 field), multiple (S10 attachments, S08 documents), compact (a Paperclip button) or public (button only, 48 px). */
  variant?: "single" | "multiple" | "compact" | "public";
  /** Extensions and MIME types: [".csv", ".xlsx"]. */
  accept?: string[];
  /** Words for the type error: "CSV or XLSX file" → "leads-oct.pdf isn't a CSV or XLSX file." */
  typeLabel?: string;
  maxBytes?: number;
  maxFiles?: number;
  maxTotalBytes?: number;
  /** Names the total limit: "Email attachments" → "Email attachments can total 5 MB." */
  totalLabel?: string;
  /** Uploads one file; by default the signed-URL flow against `endpoint`. */
  upload?: FileUploader;
  endpoint?: string;
  /** Rows to start with (files already attached, or a server response). */
  initialFiles?: FileRow[];
  onFilesChange?: (files: FileRow[]) => void;
  disabled?: boolean;
  /** The list only, with download links. */
  readOnly?: boolean;
  className?: string;
};

/** The dropzone's look in each state, shared with the gallery's still pictures. */
export function dropzoneClassName(state: "idle" | "over" | "disabled" = "idle") {
  return cn(
    "flex min-h-32 flex-col items-center justify-center gap-2 rounded-lg border p-6 text-center text-sm transition-colors duration-fast",
    state === "over"
      ? "border-solid border-accent bg-accent-subtle text-fg"
      : state === "disabled"
        ? "cursor-not-allowed border-dashed border-border bg-surface-subtle text-muted"
        : "border-dashed border-input bg-surface-subtle text-muted",
    "has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-focus-ring has-[input:focus-visible]:outline-solid",
  );
}

let keySeed = 0;
function nextKey() {
  keySeed += 1;
  return `file-${keySeed}`;
}

/**
 * Add one or more files by choosing them or dropping them (components.md FileUpload), with clear
 * size and type errors and visible progress. The "Choose file" button is the <label> of a visually
 * hidden native file input, which keeps keyboard focus (its ring is drawn on the label). Dragging is
 * never the only way (2.5.7). The status region announces the start, end and failure of each
 * file, never each percent. While it is mounted, a file dropped anywhere else on the page is
 * ignored, so the browser never leaves a half-filled form.
 */
export function FileUpload({
  name,
  variant = "multiple",
  accept = [],
  typeLabel,
  maxBytes,
  maxFiles,
  maxTotalBytes,
  totalLabel = "These files",
  upload,
  endpoint = "/api/app/uploads",
  initialFiles = [],
  onFilesChange,
  disabled: disabledProp,
  readOnly: readOnlyProp,
  className,
}: FileUploadProps) {
  const control = useFieldControl({ disabled: disabledProp, readOnly: readOnlyProp });
  const base = useId();
  const inputId = `${base}-input`;
  const replaceId = `${base}-replace`;
  const [rows, setRows] = useState<FileRow[]>(initialFiles);
  const [status, setStatus] = useState("");
  const [dragState, setDragState] = useState<"idle" | "over" | "too-many">("idle");
  const files = useRef(new Map<string, File>());
  const controllers = useRef(new Map<string, AbortController>());
  const listRef = useRef<HTMLUListElement | null>(null);
  const chooseRef = useRef<HTMLInputElement | null>(null);
  const uploader = useMemo(() => upload ?? signedUrlUploader(endpoint), [upload, endpoint]);
  const reportError = control.reportError;

  const multiple = variant === "multiple" || variant === "compact";
  const isPublic = variant === "public";
  const limit = multiple ? (maxFiles ?? Infinity) : 1;

  const onFilesChangeRef = useRef(onFilesChange);
  useEffect(() => {
    onFilesChangeRef.current = onFilesChange;
  });
  useEffect(() => {
    onFilesChangeRef.current?.(rows);
  }, [rows]);

  // A file dropped outside the zone must not replace the page.
  useEffect(() => {
    if (control.readOnly) return;
    const block = (event: globalThis.DragEvent) => {
      if (event.dataTransfer?.types.includes("Files")) event.preventDefault();
    };
    window.addEventListener("dragover", block);
    window.addEventListener("drop", block);
    const pending = controllers.current;
    return () => {
      window.removeEventListener("dragover", block);
      window.removeEventListener("drop", block);
      pending.forEach((controller) => controller.abort());
    };
  }, [control.readOnly]);

  const patch = (key: string, change: Partial<FileRow>) => setRows((current) => current.map((row) => (row.key === key ? { ...row, ...change } : row)));

  const start = (key: string, file: File) => {
    const controller = new AbortController();
    controllers.current.set(key, controller);
    patch(key, { status: "uploading", progress: 0, message: undefined });
    setStatus(`Uploading ${file.name}`);
    uploader(file, { signal: controller.signal, onProgress: (progress) => patch(key, { progress }) }).then(
      ({ id }) => {
        controllers.current.delete(key);
        patch(key, { status: "uploaded", id, progress: 100 });
        setStatus(`${file.name} added`);
      },
      (error: unknown) => {
        controllers.current.delete(key);
        if (controller.signal.aborted) {
          patch(key, { status: "cancelled", message: "Upload cancelled." });
          setStatus(`Upload of ${file.name} cancelled`);
          return;
        }
        const unreadable = error instanceof UploadError && error.kind === "unreadable";
        const message = unreadable
          ? `We couldn't read ${file.name}. Save it again and retry.`
          : `${file.name} didn't upload. Check your connection and try again.`;
        patch(key, { status: unreadable ? "unreadable" : "failed", message });
        setStatus(message);
      },
    );
  };

  const add = (list: FileList | File[], replaceKey?: string) => {
    const incoming = Array.from(list);
    if (incoming.length === 0) return;
    const kept = replaceKey ? rows.filter((row) => row.key !== replaceKey) : multiple ? rows : [];
    if (multiple && kept.length + incoming.length > limit) {
      reportError(`You can attach up to ${limit} files. Remove one first.`);
      return;
    }
    if (maxTotalBytes !== undefined) {
      const total = kept.reduce((sum, row) => sum + row.size, 0) + incoming.reduce((sum, file) => sum + file.size, 0);
      if (total > maxTotalBytes) {
        reportError(`${incoming.length + kept.length > 1 ? "These files add up to" : "This file is"} ${formatFileSize(total)}. ${totalLabel} can total ${formatFileSize(maxTotalBytes)}.`);
        return;
      }
    }
    reportError(null);
    const added: FileRow[] = incoming.slice(0, multiple ? incoming.length : 1).map((file) => {
      const key = nextKey();
      files.current.set(key, file);
      const problem = checkFile(file, { accept, maxBytes, typeLabel });
      return problem
        ? { key, name: file.name, size: file.size, status: "invalid" as const, message: problem.message }
        : { key, name: file.name, size: file.size, status: "checking" as const };
    });
    setRows([...kept, ...added]);
    for (const row of added) {
      if (row.status === "checking") start(row.key, files.current.get(row.key)!);
      else setStatus(row.message ?? "");
    }
  };

  const remove = (key: string) => {
    controllers.current.get(key)?.abort();
    const index = rows.findIndex((row) => row.key === key);
    const removed = rows[index];
    const next = rows.filter((row) => row.key !== key);
    setRows(next);
    reportError(null);
    if (removed) setStatus(`${removed.name} removed`);
    // Focus the next row's first action, or "Choose file".
    window.requestAnimationFrame(() => {
      const buttons = listRef.current?.querySelectorAll<HTMLElement>("li [data-row-action]");
      const target = buttons?.[Math.min(index, (buttons?.length ?? 1) - 1)];
      if (target && next.length > 0) target.focus();
      else chooseRef.current?.focus();
    });
  };

  const onInput = (event: ChangeEvent<HTMLInputElement>, replaceKey?: string) => {
    if (event.currentTarget.files) add(event.currentTarget.files, replaceKey);
    event.currentTarget.value = "";
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (control.disabled || !event.dataTransfer.types.includes("Files")) return;
    event.preventDefault();
    const count = event.dataTransfer.items.length;
    setDragState(multiple && rows.length + count > limit ? "too-many" : !multiple && count > 1 ? "too-many" : "over");
  };
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    if (control.disabled) return;
    event.preventDefault();
    setDragState("idle");
    add(event.dataTransfer.files);
  };

  const pending = rows.some((row) => row.status === "uploading" || row.status === "checking");
  const acceptAttr = accept.join(",");
  const chooseLabel = variant === "compact" ? "Attach file" : multiple ? "Choose files" : "Choose file";

  const chooseButton = (
    <label
      className={cn(
        buttonVariants({
          variant: "secondary",
          size: isPublic ? "lg" : variant === "compact" ? "sm" : "md",
          disabled: control.disabled,
          fullWidth: isPublic,
        }),
        "cursor-pointer has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-focus-ring has-[input:focus-visible]:outline-solid",
        control.disabled && "cursor-not-allowed",
      )}
    >
      {variant === "compact" ? <Paperclip aria-hidden="true" className="size-icon-sm" /> : null}
      {chooseLabel}
      <input
        ref={chooseRef}
        id={inputId}
        type="file"
        accept={acceptAttr || undefined}
        multiple={multiple || undefined}
        disabled={control.disabled}
        aria-describedby={control.describedBy}
        onChange={(event) => onInput(event)}
        className="sr-only"
      />
    </label>
  );

  const showZone = !control.readOnly && (variant === "multiple" || (variant === "single" && rows.length === 0));

  return (
    <div
      role="group"
      aria-labelledby={control.field?.labelId}
      data-uploads-pending={pending ? "true" : undefined}
      className={cn("flex w-full min-w-0 flex-col gap-2", className)}
    >
      {control.readOnly ? null : showZone ? (
        <div
          onDragOver={onDragOver}
          onDragEnter={onDragOver}
          onDragLeave={() => setDragState("idle")}
          onDrop={onDrop}
          className={dropzoneClassName(control.disabled ? "disabled" : dragState === "idle" ? "idle" : "over")}
        >
          <CloudUpload aria-hidden="true" className="size-icon-lg" />
          {dragState === "over" ? (
            <p className="m-0 font-medium">Drop to add</p>
          ) : dragState === "too-many" ? (
            <p className="m-0 font-medium">You can attach up to {Number.isFinite(limit) ? limit : 1} files.</p>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <p className="m-0">Drag {multiple ? "files" : "a file"} here, or</p>
              {chooseButton}
            </div>
          )}
        </div>
      ) : variant === "compact" || variant === "public" ? (
        <div className={cn(isPublic ? "w-full" : "self-start")}>{chooseButton}</div>
      ) : null}

      {rows.length > 0 ? (
        <ul ref={listRef} className="m-0 flex list-none flex-col gap-2 p-0">
          {rows.map((row) => (
            <FileRowItem
              key={row.key}
              row={row}
              isPublic={isPublic}
              readOnly={control.readOnly}
              single={variant === "single"}
              replaceId={replaceId}
              onCancel={() => controllers.current.get(row.key)?.abort()}
              onRetry={() => {
                const file = files.current.get(row.key);
                if (file) start(row.key, file);
              }}
              onRemove={() => remove(row.key)}
              onReplace={(event) => onInput(event, row.key)}
              acceptAttr={acceptAttr}
            />
          ))}
        </ul>
      ) : control.readOnly ? (
        <p className="m-0 text-sm text-muted">No files</p>
      ) : null}

      {rows
        .filter((row) => row.status === "uploaded" && row.id)
        .map((row) => (
          <input key={row.key} type="hidden" name={`${name}[]`} value={row.id} />
        ))}
      <span role="status" className="sr-only">
        {status}
      </span>
    </div>
  );
}

function FileRowItem({
  row,
  isPublic,
  readOnly,
  single,
  replaceId,
  acceptAttr,
  onCancel,
  onRetry,
  onRemove,
  onReplace,
}: {
  row: FileRow;
  isPublic: boolean;
  readOnly: boolean;
  single: boolean;
  replaceId: string;
  acceptAttr: string;
  onCancel: () => void;
  onRetry: () => void;
  onRemove: () => void;
  onReplace: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const failed = row.status === "invalid" || row.status === "failed" || row.status === "unreadable";
  const shortName = middleTruncate(row.name);
  const actionSize = isPublic ? "lg" : "sm";

  let statusNode: ReactNode = null;
  if (row.status === "uploading") {
    statusNode = (
      <div
        role="progressbar"
        aria-label={`Uploading ${row.name}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={row.progress ?? 0}
        className="mt-1 h-1 w-full overflow-hidden rounded-pill bg-surface-sunken"
      >
        <div className="h-full rounded-pill bg-accent motion-safe:transition-[width] motion-safe:duration-base" style={{ width: `${row.progress ?? 0}%` }} />
      </div>
    );
  } else if (row.status === "checking") {
    statusNode = (
      <span className="flex items-center gap-1 text-xs text-muted [&_svg]:size-icon-sm">
        <ControlSpinner /> Checking…
      </span>
    );
  } else if (row.status === "cancelled") {
    statusNode = <span className="text-xs text-muted">{row.message ?? "Upload cancelled."}</span>;
  } else if (failed && row.message) {
    statusNode = (
      <span className="flex items-start gap-1 text-xs font-medium text-danger">
        <CircleAlert aria-hidden="true" className="mt-px size-icon-sm shrink-0" />
        {row.message}
      </span>
    );
  }

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-md border px-3 py-2",
        isPublic ? "min-h-14" : "min-h-row",
        failed ? "border-danger bg-danger-subtle text-fg" : "border-border bg-surface text-fg",
      )}
    >
      <FileText aria-hidden="true" className="size-icon-md shrink-0 text-muted" />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-w-0 items-baseline gap-2">
          {readOnly && row.href ? (
            <a href={row.href} title={row.name} className="truncate pt-0.5 pb-1 text-sm text-accent underline underline-offset-2">
              <span aria-hidden="true">{shortName}</span>
              <span className="sr-only">{row.name}</span>
            </a>
          ) : (
            <span title={row.name} className="truncate pt-0.5 pb-1 text-sm">
              <span aria-hidden="true">{shortName}</span>
              <span className="sr-only">{row.name}</span>
            </span>
          )}
          <span className="shrink-0 text-xs text-muted tabular-nums">{formatFileSize(row.size)}</span>
        </div>
        {statusNode}
      </div>
      {row.status === "uploaded" && !readOnly ? (
        <CircleCheck role="img" aria-label="Uploaded" className="size-icon-sm shrink-0 text-success" />
      ) : null}
      <div className="flex shrink-0 items-center gap-1">
        {readOnly ? (
          row.href ? (
            <IconButton asChild size={actionSize} icon={<Download />} aria-label={`Download ${row.name}`}>
              <a href={row.href} download />
            </IconButton>
          ) : null
        ) : row.status === "uploading" || row.status === "checking" ? (
          <IconButton data-row-action="" size={actionSize} icon={<X />} aria-label={`Cancel upload of ${row.name}`} onClick={onCancel} />
        ) : (
          <>
            {row.status === "failed" || row.status === "unreadable" || row.status === "cancelled" ? (
              <IconButton data-row-action="" size={actionSize} icon={<RotateCcw />} aria-label={`Retry ${row.name}`} onClick={onRetry} />
            ) : null}
            {single && row.status === "uploaded" ? (
              <label
                className={cn(
                  buttonVariants({ variant: "ghost", size: isPublic ? "lg" : "sm" }),
                  "cursor-pointer has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-focus-ring has-[input:focus-visible]:outline-solid",
                )}
              >
                Replace
                <span className="sr-only"> file</span>
                <input id={replaceId} type="file" accept={acceptAttr || undefined} onChange={onReplace} className="sr-only" />
              </label>
            ) : null}
            <IconButton data-row-action="" size={actionSize} variant="danger-ghost" icon={<Trash2 />} aria-label={`Remove ${row.name}`} onClick={onRemove} />
          </>
        )}
      </div>
    </li>
  );
}
