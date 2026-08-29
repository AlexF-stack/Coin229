import type { ReactNode } from "react";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl space-y-6 px-4 py-8 md:px-0 md:py-12">
      <header className="rounded-[12px] bg-cream px-5 py-6 md:px-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-navy md:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted">Dernière mise à jour : {updated}</p>
      </header>
      <div className="prose-legal space-y-5 text-sm leading-relaxed text-fg md:text-base [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-navy [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_a]:font-medium [&_a]:text-navy [&_a]:underline [&_a]:decoration-amber [&_a]:underline-offset-2">
        {children}
      </div>
    </article>
  );
}
