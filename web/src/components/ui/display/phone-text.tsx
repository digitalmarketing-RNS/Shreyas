import { MISSING, formatPhone } from "@/lib/format";
import { cn } from "@/lib/cn";

export type PhoneTextProps = {
  /** E.164: "+919876543210". Unparseable values show as stored, unformatted. null → "—". */
  value: string | null;
  /** India: numbers starting 6–9 are shown as mobiles unless you know it is a landline. */
  kind?: "auto" | "mobile" | "landline";
  /**
   * A tel: link, only where the institution turned on service-call links and the value is not
   * masked; never on public pages. Calls normally go through the app's click-to-call button.
   */
  link?: boolean;
  className?: string;
};

/**
 * A phone number stored in E.164 in the international format people read and dial, without
 * guessing its type (components.md, PhoneText). <bdi dir="ltr"> keeps it in order inside
 * right-to-left text. Masked numbers use MaskedValue, which uses this for the revealed value.
 */
export function PhoneText({ value, kind = "auto", link = false, className }: PhoneTextProps) {
  if (!value) {
    return (
      <span className={cn("text-muted", className)}>
        <span aria-hidden="true">{MISSING}</span>
        <span className="sr-only">No number</span>
      </span>
    );
  }
  const text = formatPhone(value, { kind });
  const number = <bdi dir="ltr">{text}</bdi>;
  if (link && /^\+\d+$/.test(value)) {
    return (
      <a
        href={`tel:${value}`}
        className={cn("rounded-sm whitespace-nowrap text-accent underline decoration-1 underline-offset-2 tabular-nums hover:decoration-2", className)}
      >
        {number}
      </a>
    );
  }
  return <span className={cn("whitespace-nowrap text-fg tabular-nums", className)}>{number}</span>;
}
