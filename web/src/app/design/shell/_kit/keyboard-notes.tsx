import { Fragment } from "react";

/** The keyboard behaviour of a component, as components.md gives it, under its specimens. */
export function KeyboardNotes({
  items,
  title = "Keyboard",
  headingLevel = 3,
}: {
  items: readonly (readonly [string, string])[];
  title?: string;
  headingLevel?: 3 | 4;
}) {
  const Heading = `h${headingLevel}` as const;
  return (
    <div className="max-w-form rounded-lg border border-border bg-surface p-4">
      <Heading className="m-0 mb-2 text-sm font-semibold text-fg">{title}</Heading>
      <dl className="m-0 grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
        {items.map(([keys, action]) => (
          <Fragment key={keys + action}>
            <dt className="font-medium text-fg">{keys}</dt>
            <dd className="m-0 mb-1 leading-prose text-muted sm:mb-0">{action}</dd>
          </Fragment>
        ))}
      </dl>
    </div>
  );
}
