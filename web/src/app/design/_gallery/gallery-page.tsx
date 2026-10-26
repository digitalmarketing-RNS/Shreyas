import type { ReactNode } from "react";

/**
 * The top of every gallery page: the one h1 and a short intro. Set the page's metadata title to
 * the same words (the layout adds " · Design system").
 */
export function GalleryPage({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="text-xl text-fg">{title}</h1>
        {description ? <div className="max-w-form text-sm leading-prose text-muted">{description}</div> : null}
      </header>
      {children}
    </>
  );
}
