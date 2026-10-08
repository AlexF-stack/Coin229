import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  align?: "left" | "right";
  className?: string;
  /** Mobile : sert de titre de la carte */
  primary?: boolean;
  /** Mobile : actions en bas de la carte, sans libellé */
  actions?: boolean;
  /** Mobile : colonne masquée (information secondaire) */
  hideOnMobile?: boolean;
};

/**
 * Tableau Coin229 — ordinateur : vrai tableau (en-tête, lignes, survol) ;
 * mobile : chaque ligne devient une carte « libellé : valeur » (rien ne déborde).
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  empty,
  className,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Titre lu par les lecteurs d'écran */
  caption: string;
  /** Affiché quand il n'y a aucune ligne (ex. <EmptyState />) */
  empty?: ReactNode;
  className?: string;
}) {
  if (rows.length === 0 && empty) return <>{empty}</>;
  const primary = columns.find((c) => c.primary);
  const actions = columns.filter((c) => c.actions);
  const details = columns.filter((c) => !c.primary && !c.actions && !c.hideOnMobile);

  return (
    <div className={className}>
      {/* Ordinateur / tablette */}
      <div className="hidden overflow-x-auto rounded-card border border-border bg-surface shadow-card md:block">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-border bg-surface-muted">
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={cn(
                    "whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted",
                    c.align === "right" ? "text-right" : "text-left",
                    c.className
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className="border-b border-border last:border-0 hover:bg-surface-muted">
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn("px-4 py-3 align-middle text-fg", c.align === "right" && "text-right", c.className)}
                  >
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile : une carte par ligne */}
      <ul className="space-y-3 md:hidden" aria-label={caption}>
        {rows.map((row) => (
          <li key={rowKey(row)} className="rounded-card border border-border bg-surface p-4 shadow-card">
            {primary && <div className="mb-3 font-medium text-fg">{primary.cell(row)}</div>}
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              {details.map((c) => (
                <div key={c.key} className="contents">
                  <dt className="text-muted">{c.header}</dt>
                  <dd className="min-w-0 text-right text-fg">{c.cell(row)}</dd>
                </div>
              ))}
            </dl>
            {actions.length > 0 && (
              <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-border pt-3">
                {actions.map((c) => (
                  <div key={c.key}>{c.cell(row)}</div>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
