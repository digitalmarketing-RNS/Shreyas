"use client";

import { Tabs } from "radix-ui";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { CONTROL_HEIGHT, controlBox } from "./control-styles";
import { CopyButton } from "./copy-button";
import { useFieldControl } from "./field-context";
import { InlineAlert } from "./inline-alert";

export type CodeSnippet = { value: string; label: string; language?: string; code: string };

export type CodeBlockProps = {
  /** "Embed code"; also the scroll region's name and the copy announcement ("Embed code copied"). */
  title: string;
  language?: string;
  /** One snippet; or `tabs` for tabbed snippets (S31: Script, iframe). */
  code?: string;
  tabs?: CodeSnippet[];
  /** Where to paste it: "Paste this into your website where the form should appear." */
  footer?: ReactNode;
  /** loading (a skeleton bar while the key is created) or unavailable (the form is turned off). */
  state?: "loading" | "unavailable";
  unavailableMessage?: string;
  /**
   * inline: one line with no header, a read-only input and a CopyButton (the form link). Put it in
   * a Field for its label.
   */
  variant?: "block" | "inline";
  /** The inline variant's value and its name for the copy button ("form link"). */
  value?: string;
  valueName?: string;
  className?: string;
};

/**
 * Code, or a value to paste somewhere else, with one-click copy (components.md CodeBlock). One text
 * colour, no syntax colours. The code region is role="region", named by the title, tabindex="0" so
 * the arrow keys scroll it, dir="ltr" and translate="no"; at most 320 px tall, scrolling both ways,
 * with a fade at the right edge while more is hidden. Tab order: tabs, "Copy code", the code.
 */
export function CodeBlock({
  title,
  language,
  code = "",
  tabs,
  footer,
  state,
  unavailableMessage = "This form is turned off, so the code shows nothing until you turn it on.",
  variant = "block",
  value = "",
  valueName = "value",
  className,
}: CodeBlockProps) {
  const base = useId();
  const [tab, setTab] = useState(tabs?.[0]?.value ?? "");

  if (variant === "inline") return <InlineValue value={value} valueName={valueName} title={title} className={className} />;

  const current = tabs ? (tabs.find((t) => t.value === tab) ?? tabs[0]) : null;
  const shownCode = current ? current.code : code;
  const shownLanguage = current?.language ?? language;
  const codeId = `${base}-code`;

  const header = (
    <div className="flex min-h-control-md flex-wrap items-center justify-between gap-2 border-b border-border bg-surface px-3 py-1">
      <div className="flex min-w-0 items-baseline gap-2">
        <span className="text-sm font-medium text-fg">{title}</span>
        {shownLanguage ? <span className="text-xs text-muted">{shownLanguage}</span> : null}
      </div>
      <CopyButton
        variant="labelled"
        text="Copy code"
        label="Copy code"
        thing={title}
        value={shownCode}
        sourceId={codeId}
        disabled={state === "loading" || !shownCode}
      />
    </div>
  );

  const body = <CodeRegion id={codeId} title={title} code={shownCode} loading={state === "loading"} />;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {state === "unavailable" ? <InlineAlert tone="warning">{unavailableMessage}</InlineAlert> : null}
      <div className="flex flex-col overflow-hidden rounded-md border border-border bg-surface-sunken">
        {tabs ? (
          <Tabs.Root value={current?.value} onValueChange={setTab} activationMode="automatic">
            <Tabs.List aria-label={`${title} format`} className="flex gap-1 border-b border-border bg-surface px-1 pt-1">
              {tabs.map((snippet) => (
                <Tabs.Trigger
                  key={snippet.value}
                  value={snippet.value}
                  className={cn(
                    "relative h-control-sm rounded-t-md px-3 text-sm font-medium text-muted transition-colors duration-fast hover:bg-surface-hover hover:text-fg focus-inset",
                    "data-[state=active]:text-fg data-[state=active]:after:absolute data-[state=active]:after:inset-x-0 data-[state=active]:after:-bottom-px data-[state=active]:after:h-0.5 data-[state=active]:after:bg-accent",
                  )}
                >
                  {snippet.label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
            {header}
            {tabs.map((snippet) => (
              <Tabs.Content key={snippet.value} value={snippet.value} tabIndex={-1}>
                {snippet.value === current?.value ? body : null}
              </Tabs.Content>
            ))}
          </Tabs.Root>
        ) : (
          <>
            {header}
            {body}
          </>
        )}
        {footer ? <p className="m-0 border-t border-border bg-surface px-3 py-2 text-xs text-muted">{footer}</p> : null}
      </div>
    </div>
  );
}

function CodeRegion({ id, title, code, loading }: { id: string; title: string; code: string; loading: boolean }) {
  const ref = useRef<HTMLPreElement | null>(null);
  const [moreRight, setMoreRight] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => setMoreRight(node.scrollWidth - node.clientWidth - node.scrollLeft > 1);
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    node.addEventListener("scroll", measure, { passive: true });
    return () => {
      observer.disconnect();
      node.removeEventListener("scroll", measure);
    };
  }, [code]);

  if (loading) {
    return (
      <div aria-busy="true" className="flex flex-col gap-2 p-4">
        <span className="sr-only">Loading {title.toLowerCase()}…</span>
        <span aria-hidden="true" className="h-4 w-3/4 rounded-sm bg-surface-hover motion-safe:animate-pulse" />
        <span aria-hidden="true" className="h-4 w-1/2 rounded-sm bg-surface-hover motion-safe:animate-pulse" />
      </div>
    );
  }

  return (
    <div className="relative">
      <pre
        ref={ref}
        role="region"
        aria-label={title}
        tabIndex={0}
        dir="ltr"
        translate="no"
        className="m-0 max-h-80 overflow-auto p-4 font-mono text-table whitespace-pre text-fg"
      >
        <code id={id}>{code}</code>
      </pre>
      {moreRight ? (
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-linear-to-l from-surface-sunken to-transparent" />
      ) : null}
    </div>
  );
}

function InlineValue({ value, valueName, title, className }: { value: string; valueName: string; title: string; className?: string }) {
  const control = useFieldControl({});
  const fallbackId = useId();
  const inputId = control.id ?? fallbackId;
  return (
    <div className={cn("flex w-full min-w-0 flex-wrap items-center gap-2", className)}>
      <input
        id={inputId}
        type="text"
        readOnly
        value={value}
        dir="ltr"
        aria-label={control.id ? undefined : title}
        aria-describedby={control.describedBy}
        onFocus={(event) => event.currentTarget.select()}
        className={cn("min-w-0 flex-1 px-3 font-mono text-sm", CONTROL_HEIGHT.md, controlBox({ readOnly: true }))}
      />
      <CopyButton variant="labelled" size="md" text="Copy" label={`Copy ${valueName}`} thing={title} value={value} sourceId={inputId} />
    </div>
  );
}
