"use client";

import { Toast as RadixToast } from "radix-ui";
import { type ReactNode, createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Toast, type ToastData } from "./toast";
import { useAvoidFocusOverlap } from "./use-avoid-focus-overlap";

export type ToastOptions = Omit<ToastData, "id"> & {
  /** The same id updates the toast in place (a job going from running to done), not a second toast. */
  id?: string;
};

export type ToastApi = {
  /** Shows a toast and returns its id. */
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
};

type Entry = { data: ToastData; open: boolean };

const ToastContext = createContext<ToastApi | null>(null);

/** At most 3 visible; older ones wait in a queue. */
const MAX_VISIBLE = 3;

/**
 * The toast API. Outside a Toaster it does nothing (and says so in development), so components
 * that report results can be rendered anywhere.
 */
export function useToast(): ToastApi {
  return useContext(ToastContext) ?? NO_TOASTER;
}

const NO_TOASTER: ToastApi = {
  toast: (options) => {
    if (process.env.NODE_ENV !== "production") console.warn("useToast() called outside a <Toaster>:", options.title);
    return "";
  },
  dismiss: () => {},
};

export type ToasterProps = {
  children?: ReactNode;
  /** F8 by default. A framed preview passes [] so only the page's own toaster answers F8. */
  hotkey?: string[];
  /** "Updates ({hotkey})" so screen readers don't confuse toasts with the bell's "Notifications". */
  label?: string;
  /** Position the viewport inside a framed preview instead of the window. */
  className?: string;
};

/**
 * Radix Toast.Provider (duration 6000, label "Update", swipe right) with the queue and the
 * viewport (components.md, Toast). The viewport is fixed bottom-right above --bottom-bar (sticky
 * bottom bars and the JobTray), centred and full width minus 32 px below sm, and moves to the top
 * while it would cover the focused element.
 */
export function Toaster({ children, hotkey = ["F8"], label = "Updates ({hotkey})", className }: ToasterProps) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const counter = useRef(0);

  const remove = useCallback((id: string) => {
    setEntries((current) => current.filter((entry) => entry.data.id !== id));
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      toast: (options) => {
        counter.current += 1;
        const id = options.id ?? `toast-${counter.current}`;
        const data: ToastData = { ...options, id };
        setEntries((current) => {
          const index = current.findIndex((entry) => entry.data.id === id);
          if (index === -1) return [...current, { data, open: true }];
          const next = current.slice();
          next[index] = { data, open: true };
          return next;
        });
        return id;
      },
      dismiss: (id) => {
        setEntries((current) => current.map((entry) => (entry.data.id === id ? { ...entry, open: false } : entry)));
        window.setTimeout(() => remove(id), 400);
      },
    }),
    [remove],
  );

  const visible = entries.filter((entry) => entry.open).slice(0, MAX_VISIBLE);
  const closing = entries.filter((entry) => !entry.open);

  return (
    <ToastContext.Provider value={api}>
      <RadixToast.Provider duration={6000} label="Update" swipeDirection="right">
        {children}
        {[...closing, ...visible].map((entry) => (
          <Toast
            key={entry.data.id}
            toast={entry.data}
            open={entry.open}
            onOpenChange={(open) => {
              if (!open) api.dismiss(entry.data.id);
            }}
          />
        ))}
        <ToastViewport hotkey={hotkey} label={label} className={className} />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}

function ToastViewport({ hotkey, label, className }: { hotkey: string[]; label: string; className?: string }) {
  const ref = useRef<HTMLOListElement>(null);
  const moved = useAvoidFocusOverlap(ref);
  return (
    <RadixToast.Viewport
      ref={ref}
      hotkey={hotkey}
      label={label}
      className={cn(
        "fixed right-4 z-(--z-toast) m-0 flex w-[min(360px,calc(100vw-2rem))] list-none flex-col gap-2 p-0 md:right-5",
        "max-sm:right-auto max-sm:left-1/2 max-sm:-translate-x-1/2",
        moved ? "top-[calc(var(--layout-header)+1rem)]" : "bottom-[calc(var(--bottom-bar,0px)+1rem)]",
        className,
      )}
    />
  );
}
