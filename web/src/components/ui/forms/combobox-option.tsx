import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ComboboxOption } from "./combobox";
import { TRUNCATE } from "./control-styles";
import { matchSegments } from "./text-match";

/** The inside of one option: chosen box (multi), avatar, label with the match in semibold, second line, Check (single). */
export function ComboboxOptionContent({
  option,
  query = "",
  multiple,
  chosen,
}: {
  option: ComboboxOption;
  query?: string;
  multiple: boolean;
  chosen: boolean;
}) {
  return (
    <>
      {multiple ? (
        <span
          aria-hidden="true"
          className={cn(
            "inline-flex size-checkbox shrink-0 items-center justify-center rounded-xs border",
            chosen ? "border-accent bg-accent text-on-accent" : "border-input bg-surface",
          )}
        >
          {chosen ? <Check className="size-3" strokeWidth={3} /> : null}
        </span>
      ) : null}
      {option.leading ? <span className="inline-flex shrink-0">{option.leading}</span> : null}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={TRUNCATE}>
          {matchSegments(option.label, query).map((segment, i) =>
            segment.match ? (
              <span key={i} className="font-semibold">
                {segment.text}
              </span>
            ) : (
              <span key={i}>{segment.text}</span>
            ),
          )}
        </span>
        {option.description ? <span className="text-xs text-muted">{option.description}</span> : null}
      </span>
      {!multiple && chosen ? <Check aria-hidden="true" className="size-icon-sm shrink-0 text-accent" /> : null}
    </>
  );
}
