"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../button";
import { IconButton } from "../icon-button";
import { announce } from "./announce";
import { isMacPlatform } from "./hooks";

export type CopyButtonProps = {
  /** The exact string copied: no trailing spaces, no line numbers. */
  value: string;
  /** The name says what gets copied, and never changes: "Copy embed code". */
  label: string;
  /** The thing, for the announcement "{Thing} copied": "Embed code". */
  thing: string;
  /** icon (with tooltip, default), labelled (Button secondary: "Copy" → "Copied") or inline (xs, next to a value). */
  variant?: "icon" | "labelled" | "inline";
  /** The visible label of the labelled variant ("Copy code"); defaults to "Copy". */
  text?: string;
  /** xs 24, sm 32 (default), md 40. */
  size?: "xs" | "sm" | "md";
  /** ghost (default) or secondary (bordered) for the icon variant. */
  look?: "ghost" | "secondary";
  /** On failure the text of this element is selected, so the person can press Ctrl+C. */
  sourceId?: string;
  /** Nothing to copy yet. */
  disabled?: boolean;
  /** Called after a successful copy (SecretReveal tracks it). */
  onCopied?: () => void;
  /** Start in a state, for still previews and server-rendered fallbacks. */
  initialState?: "copied" | "failed";
  className?: string;
};

function selectSource(id: string | undefined): boolean {
  if (!id) return false;
  const node = document.getElementById(id);
  if (!node) return false;
  if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) {
    node.focus();
    node.select();
    return true;
  }
  const range = document.createRange();
  range.selectNodeContents(node);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  return true;
}

/**
 * Copies a value in one action (components.md CopyButton): embed code, API key, tracking link, DNS
 * record, lead number. The icon becomes Check for 2 s (another click restarts the timer); the
 * labelled variant shows "Copied" but keeps its name, because some screen readers ignore name
 * changes. The shared polite region says "{Thing} copied" once. If the clipboard is blocked, the
 * source text is selected and a message under the value says to press Ctrl+C (Cmd+C on a Mac).
 * The copied state keeps the idle colours, so it works on every surface.
 */
export function CopyButton({
  value,
  label,
  thing,
  variant = "icon",
  text = "Copy",
  size,
  look = "ghost",
  sourceId,
  disabled = false,
  initialState,
  onCopied,
  className,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(initialState === "copied");
  const [failed, setFailed] = useState<string | null>(
    initialState === "failed" ? "Couldn't copy. The text is selected, so press Ctrl+C." : null,
  );
  const timer = useRef<{ id: number | null }>({ id: null });

  useEffect(() => {
    const state = timer.current;
    return () => {
      if (state.id !== null) window.clearTimeout(state.id);
    };
  }, []);

  const copy = async () => {
    try {
      if (!navigator.clipboard) throw new Error("No clipboard");
      await navigator.clipboard.writeText(value);
      setFailed(null);
      setCopied(true);
      announce(`${thing} copied`);
      onCopied?.();
      if (timer.current.id !== null) window.clearTimeout(timer.current.id);
      timer.current.id = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      selectSource(sourceId);
      setCopied(false);
      setFailed(`Couldn't copy. The text is selected, so press ${isMacPlatform() ? "Cmd+C" : "Ctrl+C"}.`);
    }
  };

  const failure = failed ? (
    <p role="alert" className="m-0 basis-full text-xs text-danger">
      {failed}
    </p>
  ) : null;

  if (variant === "labelled") {
    return (
      <>
        <Button
          variant="secondary"
          size={size === "xs" ? "xs" : (size ?? "sm")}
          leadingIcon={copied ? <Check /> : <Copy />}
          disabled={disabled}
          onClick={copy}
          className={className}
        >
          {/* As wide as the longer label, so it does not jump. */}
          <span className="grid">
            <span aria-hidden="true" className="invisible col-start-1 row-start-1">
              {text}
            </span>
            <span aria-hidden="true" className="invisible col-start-1 row-start-1">
              Copied
            </span>
            <span aria-hidden="true" className="col-start-1 row-start-1">
              {copied ? "Copied" : text}
            </span>
            <span className="sr-only">{label}</span>
          </span>
        </Button>
        {failure}
      </>
    );
  }

  return (
    <>
      <IconButton
        variant={look}
        size={variant === "inline" ? "xs" : (size ?? "sm")}
        icon={copied ? <Check /> : <Copy />}
        aria-label={label}
        disabled={disabled}
        onClick={copy}
        className={className}
      />
      {failure}
    </>
  );
}
