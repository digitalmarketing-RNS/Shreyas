"use client";

import { type ChangeEvent, useId } from "react";

/**
 * Plain labelled fields for the overlay demos, drawn with the TextInput and Select box tokens
 * (bg-surface border-input rounded-md, hover:border-muted). The real controls are group 1's.
 */
const BOX =
  "w-full rounded-md border border-input bg-surface px-3 text-sm text-fg transition-colors duration-fast placeholder:text-muted hover:border-muted";

export function GalleryInput({
  label,
  value,
  onChange,
  placeholder,
  invalid,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  invalid?: boolean;
  error?: string;
}) {
  const id = useId();
  const errorId = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-fg">
        {label}
      </label>
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        className={`${BOX} h-control-md ${invalid ? "border-danger" : ""}`}
      />
      {error ? (
        <p id={errorId} className="m-0 text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function GalleryTextarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-fg">
        {label}
      </label>
      <textarea id={id} value={value} rows={3} dir="auto" onChange={(event) => onChange(event.target.value)} className={`${BOX} py-2 leading-prose`} />
    </div>
  );
}

export function GallerySelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-fg">
        {label}
      </label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={`${BOX} h-control-md`}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

export function GalleryCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex min-h-hit cursor-pointer items-center gap-2 text-sm text-fg">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-checkbox accent-accent" />
      {label}
    </label>
  );
}

/** A field drawn for a static preview (no behaviour). */
export function FieldDraw({ label, value, invalid, error }: { label: string; value: string; invalid?: boolean; error?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-fg">{label}</span>
      <span className={`${BOX} flex h-control-md items-center ${invalid ? "border-danger" : ""}`}>{value}</span>
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </div>
  );
}
