import { Fragment } from "react";
import { Kbd } from "../../primitives/kbd";

export type KeyboardItem = { keys: string[]; action: string };

/**
 * The keyboard behaviour of one block, as a definition list. Each `keys` entry is one key or a
 * combination written "Ctrl + Enter"; several entries mean "any of these".
 */
export function KeyboardNote({ items, title = "Keyboard" }: { items: KeyboardItem[]; title?: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
      <h4 className="m-0 text-sm font-semibold text-fg">{title}</h4>
      <dl className="m-0 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
        {items.map((item) => (
          <Fragment key={`${item.keys.join("|")}-${item.action}`}>
            <dt className="flex flex-wrap items-center gap-1 text-muted">
              {item.keys.map((key, index) => (
                <Fragment key={key}>
                  {index > 0 ? <span className="text-xs">or</span> : null}
                  {key.includes(" + ") ? <Kbd keys={key.split(" + ")} /> : <Kbd>{key}</Kbd>}
                </Fragment>
              ))}
            </dt>
            <dd className="m-0 text-fg">{item.action}</dd>
          </Fragment>
        ))}
      </dl>
    </div>
  );
}
