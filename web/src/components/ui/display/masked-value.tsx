"use client";

import { Check, Copy, Eye, EyeOff, Lock } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Tooltip } from "@/components/ui/overlays/tooltip";
import { cn } from "@/lib/cn";
import { describeMaskedEmail, lastDigits } from "@/lib/format";

export type MaskedKind = "phone" | "email";

export type RevealResult =
  /** The full value as it should show ("+91 98765 43210" for phones, the address for emails) and the raw value to copy. */
  | { ok: true; display: string; copy: string }
  | { ok: false; reason: "denied" | "failed" };

export type MaskedValueProps = {
  kind: MaskedKind;
  /** What the value is: "Mobile number", "Email", "Guardian's mobile". */
  label?: string;
  /** The masked string from the server ("+91 ••••• •3210", "pr•••@gmail.com"); null when not given. */
  masked: string | null;
  /** For the sr-only sentence: the last four digits (phones) or the masked email itself. */
  hint?: string;
  /**
   * The reveal server action (POST with a permission check and an audit row "lead.contact_reveal").
   * Absent: the role may not reveal (a lock icon shows). Tables and the publisher portal never pass it.
   */
  onReveal?: () => Promise<RevealResult>;
  /** Text size follows the parent: text-sm in profiles, text-table in tables. */
  className?: string;
};

type State = { kind: "masked" } | { kind: "revealing" } | { kind: "revealed"; display: string; copy: string } | { kind: "failed" } | { kind: "denied" };

/**
 * A lead's phone number or email for roles that may not see it in full, with an on-purpose reveal
 * that is recorded in the audit log (components.md, MaskedValue). The server sends only the masked
 * string unless the role may see the value; masking never happens in the browser. The masked
 * string is aria-hidden and an sr-only sentence gives its meaning. Enter or Space on Show reveals;
 * focus stays on the same button, which becomes Hide. The value is re-masked on Hide, on navigation
 * and when the profile reloads; nothing is cached client-side.
 */
export function MaskedValue({ kind, label = kind === "phone" ? "Mobile number" : "Email", masked, hint, onReveal, className }: MaskedValueProps) {
  const [state, setState] = useState<State>({ kind: "masked" });
  const [status, setStatus] = useState("");
  const [copied, setCopied] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLSpanElement>(null);
  // Show becomes Hide (and back) without losing focus: the new button takes it.
  const keepFocus = useRef(false);
  const errorId = useId();
  const lower = label.toLowerCase();

  useEffect(() => {
    if (!keepFocus.current || state.kind === "revealing") return;
    keepFocus.current = false;
    toggleRef.current?.focus();
  }, [state.kind]);

  const rememberFocus = () => {
    keepFocus.current = Boolean(rootRef.current?.contains(document.activeElement));
  };

  if (!masked) {
    return <span className={cn("text-muted", className)}>Not given</span>;
  }

  const description =
    kind === "phone" ? `${label} hidden, ends in ${hint ?? lastDigits(masked)}` : describeMaskedEmail(hint ?? masked).replace(/^Email/, label);

  const reveal = async () => {
    if (!onReveal || state.kind === "revealing") return;
    rememberFocus();
    setState({ kind: "revealing" });
    try {
      const result = await onReveal();
      if (result.ok) {
        setState({ kind: "revealed", display: result.display, copy: result.copy });
        setStatus(`${label} shown`);
      } else {
        setState({ kind: result.reason === "denied" ? "denied" : "failed" });
      }
    } catch {
      setState({ kind: "failed" });
    }
  };

  const hide = () => {
    rememberFocus();
    setState({ kind: "masked" });
    setStatus("");
    setCopied(false);
  };

  const copy = async () => {
    if (state.kind !== "revealed") return;
    try {
      await navigator.clipboard.writeText(state.copy);
      setCopied(true);
      setStatus(`${label} copied`);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setStatus("Couldn't copy. Select the number and copy it.");
    }
  };

  const revealed = state.kind === "revealed";

  return (
    <span ref={rootRef} className={cn("inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-fg tabular-nums", className)}>
      {revealed ? (
        <bdi dir="ltr">{state.display}</bdi>
      ) : (
        <>
          <span aria-hidden="true">{masked}</span>
          <span className="sr-only">{description}</span>
        </>
      )}
      {!onReveal || state.kind === "denied" ? (
        state.kind === "denied" ? null : (
          <Tooltip content="Hidden for your role">
            <span role="img" tabIndex={0} aria-label="Hidden for your role" className="inline-flex min-h-hit min-w-hit items-center justify-center rounded-sm">
              <Lock aria-hidden="true" className="size-icon-sm text-muted" />
            </span>
          </Tooltip>
        )
      ) : revealed ? (
        <>
          <Button ref={toggleRef} variant="link" leadingIcon={<EyeOff />} aria-label={`Hide ${lower}`} onClick={hide}>
            Hide
          </Button>
          <IconButton
            icon={copied ? <Check /> : <Copy />}
            aria-label={`Copy ${lower}`}
            size="xs"
            onClick={copy}
          />
        </>
      ) : (
        <Tooltip content="Showing it is recorded in the audit log.">
          <Button
            ref={toggleRef}
            variant="link"
            leadingIcon={<Eye />}
            aria-label={`Show ${lower}`}
            aria-describedby={state.kind === "failed" ? errorId : undefined}
            loading={state.kind === "revealing"}
            loadingLabel="Showing…"
            onClick={reveal}
          >
            Show
          </Button>
        </Tooltip>
      )}
      {state.kind === "failed" ? (
        <span id={errorId} className="text-xs text-danger">
          Couldn&apos;t show it. Try again.
        </span>
      ) : null}
      {state.kind === "denied" ? <span className="text-xs text-muted">You no longer have access to this.</span> : null}
      <span role="status" className="sr-only">
        {status}
      </span>
    </span>
  );
}
