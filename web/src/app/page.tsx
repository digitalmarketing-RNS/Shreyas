import Link from "next/link";

export default function Home() {
  return (
    <main id="main" className="mx-auto flex max-w-form flex-col gap-4 px-gutter-sm py-16 md:px-gutter">
      <h1 className="text-xl text-fg">Admissions CRM</h1>
      <p className="text-base text-muted">
        Enquiries, follow-ups, messages and fee payments for colleges and schools, in one place. The staff screens are
        being built now; the design system and its components are ready to browse.
      </p>
      <p>
        <Link
          href="/design"
          className="inline-flex min-h-hit items-center text-base text-accent underline decoration-1 underline-offset-2 hover:decoration-2"
        >
          Open the design system
        </Link>
      </p>
    </main>
  );
}
