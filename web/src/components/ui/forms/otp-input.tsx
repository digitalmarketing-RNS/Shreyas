"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "../button";
import { CONTROL_HEIGHT, controlBox } from "./control-styles";
import { joinIds } from "./field-context";

export type OtpChannel = "sms" | "email" | "totp" | "guardian";

export type OtpVerifyResult =
  | { ok: true }
  | { ok: false; reason: "wrong"; triesLeft?: number }
  | { ok: false; reason: "expired" }
  | { ok: false; reason: "locked"; until: string };

export type OtpStatus = "not-sent" | "waiting" | "verifying" | "verified" | "wrong" | "expired" | "locked" | "send-failed";

export type OtpInputProps = {
  /** sms (WebOTP and one-time-code autofill), email, totp (S03: no resend, recovery code) or guardian (/consent/:token). */
  channel: OtpChannel;
  /** Where the code went, shown so nobody types it again: "+91 98765 43210", "priya@example.com". */
  destination?: string;
  /** Shows "Change number" or "Change email". */
  onChangeDestination?: () => void;
  /** The only time limit, stated in the hint: "The code works for 10 minutes." */
  expiryNote?: string;
  surface?: "staff" | "public";
  /** Checks the code. Without it, Verify is a submit button and the form's Server Action checks it. */
  onVerify?: (code: string) => Promise<OtpVerifyResult>;
  /** Sends a new code; resolves false when sending failed. */
  onResend?: () => Promise<boolean>;
  /** Guardian: sends the first code when the guardian presses "Send code". */
  onSend?: () => Promise<boolean>;
  onRecoveryCode?: (code: string) => Promise<boolean>;
  /** Seconds before "Resend code" works (30). */
  resendSeconds?: number;
  name?: string;
  /** Starting state, for screens that render after a server response (and the gallery). */
  initialStatus?: OtpStatus;
  initialCode?: string;
  initialTriesLeft?: number;
  initialLockedUntil?: string;
  /** Seconds left on the resend wait when the component mounts (defaults to resendSeconds). */
  initialResendIn?: number;
  className?: string;
};

function clean(text: string): string {
  return text.replace(/\D/g, "").slice(0, 6);
}

function clock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/**
 * A 6-digit code sent by SMS or email, or shown in an authenticator app (components.md OtpInput).
 *
 * - One field, never one box per digit. Everything except digits is removed on input and paste,
 *   and the first 6 digits are kept ("Your code is 482 913" → 482913). No maxlength, which would
 *   cut a pasted "482 913" first. No auto-submit on the 6th digit: Enter or Verify submits.
 * - Wrong code: the digits stay and are selected, so typing replaces them. Server errors render in
 *   a role="alert" container.
 * - Resend is aria-disabled for 30 s. The countdown sits after the label, aria-hidden, so the name
 *   never changes and screen readers do not re-read it every second.
 * - Tab order: input, Verify, Resend code, Change number.
 */
export function OtpInput({
  channel,
  destination,
  onChangeDestination,
  expiryNote,
  surface = "staff",
  onVerify,
  onResend,
  onSend,
  onRecoveryCode,
  resendSeconds = 30,
  name = "code",
  initialStatus,
  initialCode = "",
  initialTriesLeft,
  initialLockedUntil,
  initialResendIn,
  className,
}: OtpInputProps) {
  const base = useId();
  const inputId = `${base}-input`;
  const hintId = `${base}-hint`;
  const errorId = `${base}-error`;
  const waitId = `${base}-wait`;
  const isPublic = surface === "public";
  const [status, setStatus] = useState<OtpStatus>(initialStatus ?? (channel === "guardian" ? "not-sent" : "waiting"));
  const [code, setCode] = useState(clean(initialCode));
  const [triesLeft, setTriesLeft] = useState(initialTriesLeft);
  const [lockedUntil, setLockedUntil] = useState(initialLockedUntil ?? "");
  const [resendIn, setResendIn] = useState(channel === "totp" ? 0 : (initialResendIn ?? resendSeconds));
  const [resending, setResending] = useState(false);
  const [sending, setSending] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [emptyError, setEmptyError] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [recoveryError, setRecoveryError] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Resend countdown, one tick a second; the end is said once.
  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => {
      setResendIn(resendIn - 1);
      if (resendIn === 1) setAnnouncement("You can ask for a new code now.");
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  // WebOTP: offer the code from the SMS where the browser supports it; abort on submit or unmount.
  const sent = status !== "not-sent";
  useEffect(() => {
    if (!sent || (channel !== "sms" && channel !== "guardian")) return;
    if (typeof window === "undefined" || !("OTPCredential" in window)) return;
    const controller = new AbortController();
    abortRef.current = controller;
    const request = navigator.credentials.get({ otp: { transport: ["sms"] }, signal: controller.signal } as CredentialRequestOptions);
    request
      .then((credential) => {
        const otp = credential as (Credential & { code?: string }) | null;
        if (otp?.code) setCode(clean(otp.code));
      })
      .catch(() => {});
    return () => controller.abort();
  }, [sent, channel]);

  const locked = status === "locked";
  const verifying = status === "verifying";
  const verified = status === "verified";

  const verify = async () => {
    abortRef.current?.abort();
    if (code.length !== 6) {
      setEmptyError(true);
      inputRef.current?.focus();
      return;
    }
    setEmptyError(false);
    if (!onVerify) return;
    setStatus("verifying");
    const result = await onVerify(code);
    if (result.ok) {
      setStatus("verified");
      return;
    }
    if (result.reason === "wrong") {
      setTriesLeft(result.triesLeft);
      setStatus("wrong");
      window.requestAnimationFrame(() => inputRef.current?.select());
    } else if (result.reason === "expired") {
      setStatus("expired");
    } else {
      setLockedUntil(result.until);
      setStatus("locked");
    }
  };

  const resend = async () => {
    if (resendIn > 0 || resending || !onResend) return;
    setResending(true);
    const ok = await onResend();
    setResending(false);
    if (ok) {
      setStatus("waiting");
      setCode("");
      setResendIn(resendSeconds);
      setAnnouncement("We sent a new code.");
    } else {
      setStatus("send-failed");
    }
  };

  const sendFirst = async () => {
    if (!onSend) return;
    setSending(true);
    const ok = await onSend();
    setSending(false);
    setStatus(ok ? "waiting" : "send-failed");
    if (ok) {
      setResendIn(resendSeconds);
      setAnnouncement("We sent the code.");
    }
  };

  const where = channel === "email" ? "email" : channel === "totp" ? "authenticator app" : "SMS";
  const errorText = emptyError
    ? "Enter the 6-digit code."
    : status === "wrong"
      ? `That code isn't right. ${channel === "totp" ? "Check your authenticator app" : `Check the latest ${where}`} and try again.${
          triesLeft !== undefined ? ` ${triesLeft} ${triesLeft === 1 ? "try" : "tries"} left.` : ""
        }`
      : status === "expired"
        ? "This code has expired. Ask for a new one."
        : status === "locked"
          ? `Too many wrong codes. Try again after ${lockedUntil}.`
          : status === "send-failed"
            ? `We couldn't send the code. Check the ${channel === "email" ? "email address" : "number"} and try again.`
            : "";

  const hint =
    channel === "totp"
      ? "Open your authenticator app and type the code it shows for this account."
      : channel === "email"
        ? `We sent it to ${destination ?? "your email address"}.`
        : channel === "guardian"
          ? status === "not-sent"
            ? `We'll send a code by SMS to ${destination ?? "the guardian's mobile"}. Nothing is sent until you press "Send code".`
            : `We sent it by SMS to ${destination ?? "the guardian's mobile"}.`
          : `We sent it by SMS to ${destination ?? "your mobile"}.`;

  const textSize = "text-base";
  const linkHeight = isPublic ? "min-h-hit-public" : "min-h-hit";
  const changeLabel = channel === "email" ? "Change email" : "Change number";

  if (recovery && channel === "totp") {
    const recoveryId = `${base}-recovery`;
    return (
      <div className={cn("flex flex-col", className)}>
        <label htmlFor={recoveryId} className="text-sm font-medium text-fg">
          Recovery code
        </label>
        <p id={`${recoveryId}-hint`} className="m-0 mt-0.5 text-xs text-muted">
          One of the codes you saved when you turned on two-step sign-in.
        </p>
        <input
          id={recoveryId}
          name="recovery_code"
          type="text"
          autoComplete="off"
          spellCheck={false}
          autoCapitalize="off"
          value={recoveryCode}
          aria-invalid={recoveryError || undefined}
          aria-describedby={joinIds(recoveryError && `${recoveryId}-error`, `${recoveryId}-hint`)}
          onChange={(event) => setRecoveryCode(event.currentTarget.value)}
          className={cn("mt-2 w-56 px-3 font-mono", CONTROL_HEIGHT.md, textSize, controlBox({ invalid: recoveryError }))}
        />
        <div role="alert" id={`${recoveryId}-error`}>
          {recoveryError ? <ErrorLine text="That recovery code isn't right. Check it and try again." /> : null}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Button
            size="md"
            onClick={async () => {
              const ok = onRecoveryCode ? await onRecoveryCode(recoveryCode.trim()) : false;
              setRecoveryError(!ok);
            }}
          >
            Verify
          </Button>
          <Button variant="link" onClick={() => setRecovery(false)}>
            Use a code from your app
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      <label htmlFor={inputId} className={cn("font-medium text-fg", isPublic ? "text-base" : "text-sm")}>
        {channel === "totp" ? "Code from your authenticator app" : "Enter the 6-digit code"}
      </label>
      <p id={hintId} className={cn("m-0 mt-0.5 text-muted", isPublic ? "text-sm" : "text-xs")}>
        {hint}
        {expiryNote && sent && channel !== "totp" ? ` ${expiryNote}` : null}
      </p>
      {status === "not-sent" ? (
        <div className="mt-3">
          <Button size={isPublic ? "lg" : "md"} fullWidth={isPublic} loading={sending} loadingLabel="Sending…" onClick={sendFirst}>
            Send code
          </Button>
        </div>
      ) : (
        <>
          <input
            ref={inputRef}
            id={inputId}
            name={name}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            value={code}
            readOnly={verifying || verified}
            disabled={locked}
            aria-invalid={Boolean(errorText) || undefined}
            aria-describedby={joinIds(errorText && errorId, hintId)}
            onChange={(event) => {
              setCode(clean(event.currentTarget.value));
              setEmptyError(false);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && onVerify) {
                event.preventDefault();
                void verify();
              }
            }}
            className={cn(
              "mt-2 px-3 tracking-widest tabular-nums",
              isPublic ? cn(CONTROL_HEIGHT.lg, "w-44 px-4") : cn(CONTROL_HEIGHT.md, "w-40"),
              textSize,
              controlBox({ invalid: Boolean(errorText), disabled: locked, readOnly: verifying || verified }),
            )}
          />
        </>
      )}
      <div role="alert" id={errorId}>
        {errorText ? <ErrorLine text={errorText} isPublic={isPublic} /> : null}
      </div>
      {verified ? (
        <p className={cn("m-0 mt-1 flex items-center gap-1 font-medium text-success", isPublic ? "text-sm" : "text-xs")}>
          <CircleCheck aria-hidden="true" className="size-icon-sm shrink-0" />
          Verified
        </p>
      ) : null}
      {status !== "not-sent" ? (
        <div className={cn("mt-4 flex flex-wrap items-center gap-x-4 gap-y-2", isPublic && "flex-col items-stretch")}>
          <Button
            type={onVerify ? "button" : "submit"}
            size={isPublic ? "lg" : "md"}
            fullWidth={isPublic}
            loading={verifying}
            loadingLabel="Checking…"
            disabledReason={verified ? "This code is verified." : undefined}
            disabled={locked}
            onClick={onVerify ? () => void verify() : undefined}
          >
            Verify
          </Button>
          {channel === "totp" ? (
            <Button variant="link" className={linkHeight} onClick={() => setRecovery(true)}>
              Use a recovery code
            </Button>
          ) : (
            <>
              <button
                type="button"
                aria-disabled={resendIn > 0 || resending || undefined}
                aria-describedby={resendIn > 0 ? waitId : undefined}
                onClick={() => void resend()}
                className={cn(
                  "inline-flex items-center self-start rounded-sm text-sm font-medium underline decoration-1 underline-offset-2",
                  linkHeight,
                  resendIn > 0 || resending ? "cursor-not-allowed text-muted no-underline" : "text-accent hover:decoration-2",
                )}
              >
                Resend code
                {resendIn > 0 ? <span aria-hidden="true">&nbsp;in {clock(resendIn)}</span> : null}
              </button>
              {onChangeDestination ? (
                <Button variant="link" className={cn("self-start", linkHeight)} onClick={onChangeDestination}>
                  {changeLabel}
                </Button>
              ) : null}
            </>
          )}
        </div>
      ) : null}
      {channel !== "totp" ? (
        <span id={waitId} className="sr-only">
          You can ask for a new code in {resendSeconds} seconds
        </span>
      ) : null}
      <span role="status" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}

function ErrorLine({ text, isPublic = false }: { text: string; isPublic?: boolean }) {
  return (
    <p className={cn("m-0 mt-1 flex items-start gap-1 font-medium text-danger", isPublic ? "text-sm" : "text-xs")}>
      <CircleAlert aria-hidden="true" className="mt-px size-icon-sm shrink-0" />
      <span>
        <span className="sr-only">Error: </span>
        {text}
      </span>
    </p>
  );
}
