import { CircleAlert, CircleCheck, Info, type LucideIcon, TriangleAlert } from "lucide-react";

/**
 * The five tones (components.md, Conventions: "Tone words"). A tone sets colour only; the label
 * and the icon carry the meaning, so colour is never the only signal.
 */
export type Tone = "neutral" | "info" | "success" | "warning" | "danger";

export const TONES: readonly Tone[] = ["neutral", "info", "success", "warning", "danger"];

/** Alert and Banner fills. The border repeats the fill so the box keeps an edge in forced-colours mode. */
export const TONE_SURFACE: Record<Tone, string> = {
  neutral: "bg-surface-subtle border-border",
  info: "bg-info-subtle border-info-subtle",
  success: "bg-success-subtle border-success-subtle",
  warning: "bg-warning-subtle border-warning-subtle",
  danger: "bg-danger-subtle border-danger-subtle",
};

/** Tone icons on a tone fill or on a plain surface. */
export const TONE_ICON_TEXT: Record<Tone, string> = {
  neutral: "text-muted",
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

/** Default icons (components.md, Alert variants). Neutral alerts pass the icon of their topic. */
export const TONE_ICON: Record<Tone, LucideIcon> = {
  neutral: Info,
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleAlert,
};

/** The sr-only word that starts a message when its title does not already say the tone. */
export const TONE_WORD: Record<Tone, string> = {
  neutral: "",
  info: "Note",
  success: "Done",
  warning: "Warning",
  danger: "Error",
};
