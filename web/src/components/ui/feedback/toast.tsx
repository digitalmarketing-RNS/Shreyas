"use client";

import { CircleCheck, CircleX, Info, type LucideIcon, X } from "lucide-react";
import { Toast as RadixToast } from "radix-ui";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/cn";
import { JobProgress } from "./job-progress";
import { type Job, deriveJobState, isFinished } from "./jobs";

export type ToastTone = "success" | "error" | "info";

export type ToastAction = {
  /** "Undo", "View report", "Try again". */
  label: string;
  /** Another way to do it, for screen readers (Radix requires it): "Change the stage back from the lead profile". */
  altText: string;
  onAction: () => void;
};

export type ToastData = {
  id: string;
  tone: ToastTone;
  /** One line: "Stage changed to Counselling done". */
  title: string;
  /** Up to 2 lines. */
  description?: string;
  /** A toast with an action never dismisses itself. */
  action?: ToastAction;
  /** An error caused by the person's own action is announced assertively (type foreground). */
  foreground?: boolean;
  /** A running job's toast holds a compact JobProgress and stays until the job ends. */
  job?: Job;
};

const ICON: Record<ToastTone, LucideIcon> = { success: CircleCheck, error: CircleX, info: Info };
const ICON_TEXT: Record<ToastTone, string> = { success: "text-success", error: "text-danger", info: "text-info" };

export const toastClassName = cn(
  "flex w-full items-start gap-3 rounded-lg border border-border bg-surface-raised p-3 text-fg shadow-pop",
  "data-[state=open]:motion-safe:animate-slide-in-right data-[state=open]:motion-reduce:animate-fade-in data-[state=closed]:animate-fade-out",
  "data-[swipe=move]:translate-x-(--radix-toast-swipe-move-x) data-[swipe=cancel]:translate-x-0 data-[swipe=end]:animate-slide-out-right",
);

/**
 * How long a toast stays (decisions.md section 8, 2.2.1): success and info 6 s (paused on hover,
 * focus and while the window is not focused); errors, toasts with an action and running jobs stay
 * until dismissed.
 */
export function toastDuration(toast: Pick<ToastData, "tone" | "action" | "job">): number {
  if (toast.tone === "error" || toast.action) return Number.POSITIVE_INFINITY;
  if (toast.job && !isFinished(deriveJobState(toast.job))) return Number.POSITIVE_INFINITY;
  return 6000;
}

/**
 * One toast (components.md, Toast). Rendered by the Toaster from useToast(); not used directly.
 * Never takes focus; F8 moves focus to the viewport, Esc dismisses the focused toast, a swipe right
 * dismisses on touch.
 */
export function Toast({ toast, open, onOpenChange }: { toast: ToastData; open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <RadixToast.Root
      open={open}
      onOpenChange={onOpenChange}
      type={toast.foreground ? "foreground" : "background"}
      duration={toastDuration(toast)}
      className={toastClassName}
    >
      <ToastLayout
        toast={toast}
        title={<RadixToast.Title className="text-sm font-semibold">{toast.title}</RadixToast.Title>}
        description={
          toast.description ? <RadixToast.Description className="text-sm text-muted">{toast.description}</RadixToast.Description> : null
        }
        action={
          toast.action ? (
            <RadixToast.Action altText={toast.action.altText} asChild>
              <Button variant="link" onClick={toast.action.onAction}>
                {toast.action.label}
              </Button>
            </RadixToast.Action>
          ) : null
        }
        onDismiss={() => onOpenChange(false)}
      />
    </RadixToast.Root>
  );
}

/**
 * A toast drawn in place, for documentation and screenshots only (the /design gallery). Never
 * use it in the app.
 */
export function ToastPreview({ toast, className }: { toast: Omit<ToastData, "id">; className?: string }) {
  return (
    <div className={cn(toastClassName, "w-[min(360px,100%)]", className)}>
      <ToastLayout
        toast={toast}
        title={<div className="text-sm font-semibold">{toast.title}</div>}
        description={toast.description ? <div className="text-sm text-muted">{toast.description}</div> : null}
        action={toast.action ? <Button variant="link">{toast.action.label}</Button> : null}
        onDismiss={() => {}}
      />
    </div>
  );
}

function ToastLayout({
  toast,
  title,
  description,
  action,
  onDismiss,
}: {
  toast: Omit<ToastData, "id">;
  title: ReactNode;
  description: ReactNode;
  action: ReactNode;
  onDismiss: () => void;
}) {
  const Icon = ICON[toast.tone];
  return (
    <>
      <Icon aria-hidden="true" className={cn("mt-px size-icon-md shrink-0", ICON_TEXT[toast.tone])} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {title}
        {description}
        {toast.job ? <JobProgress job={toast.job} variant="toast" className="mt-1" /> : null}
        {action ? <div className="mt-1">{action}</div> : null}
      </div>
      <IconButton icon={<X />} aria-label="Dismiss" size="xs" className="-mt-0.5 -mr-1" onClick={onDismiss} />
    </>
  );
}
