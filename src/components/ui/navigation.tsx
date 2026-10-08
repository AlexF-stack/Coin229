"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

/* — Onglets — */

export type TabItem = { key: string; label: ReactNode; href?: string; badge?: ReactNode };

/** Onglets : liens (navigation) ou boutons (filtre local). Défilent horizontalement sur mobile. */
export function Tabs({
  items,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  items: TabItem[];
  value: string;
  onChange?: (key: string) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <nav aria-label={ariaLabel} className={cn("hide-scrollbar flex gap-1 overflow-x-auto border-b border-border", className)}>
      {items.map((t) => {
        const active = t.key === value;
        const cls = cn(
          "relative inline-flex min-h-11 shrink-0 items-center gap-2 px-3 text-sm font-medium transition-colors",
          "after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full",
          active ? "text-primary after:bg-accent" : "text-muted hover:text-fg"
        );
        const content = (
          <>
            {t.label}
            {t.badge}
          </>
        );
        return t.href ? (
          <Link key={t.key} href={t.href} aria-current={active ? "page" : undefined} className={cls}>
            {content}
          </Link>
        ) : (
          <button key={t.key} type="button" aria-pressed={active} onClick={() => onChange?.(t.key)} className={cls}>
            {content}
          </button>
        );
      })}
    </nav>
  );
}

/* — Menu d'actions — */

export type DropdownItem = {
  label: ReactNode;
  onSelect?: () => void;
  href?: string;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
};

/** Menu déroulant d'actions (Échap, clic à côté et flèches du clavier) */
export function Dropdown({
  items,
  label = "Plus d’actions",
  trigger,
  align = "right",
}: {
  items: DropdownItem[];
  label?: string;
  trigger?: ReactNode;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    root.current?.querySelector<HTMLElement>("[role=menuitem]:not([aria-disabled=true])")?.focus();
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function onMenuKey(e: React.KeyboardEvent) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const list = [...(root.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? [])];
    const i = list.indexOf(document.activeElement as HTMLElement);
    list[(i + (e.key === "ArrowDown" ? 1 : -1) + list.length) % list.length]?.focus();
  }

  const itemCls = (it: DropdownItem) =>
    cn(
      "flex w-full items-center gap-2 rounded-badge px-3 py-2 text-left text-sm outline-none [&_svg]:h-4 [&_svg]:w-4",
      it.danger ? "text-error hover:bg-error-soft focus:bg-error-soft" : "text-fg hover:bg-background focus:bg-background",
      it.disabled && "pointer-events-none opacity-50"
    );

  return (
    <div ref={root} className="relative inline-block">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={trigger ? undefined : label}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-control border border-border bg-surface px-2 text-fg-secondary hover:bg-background hover:text-fg"
      >
        {trigger ?? <MoreHorizontal className="h-4 w-4" />}
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          onKeyDown={onMenuKey}
          className={cn(
            "absolute z-40 mt-1 min-w-48 rounded-card border border-border bg-surface p-1 shadow-raised",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {items.map((it, i) =>
            it.href ? (
              <Link key={i} href={it.href} role="menuitem" className={itemCls(it)} onClick={() => setOpen(false)}>
                {it.icon}
                {it.label}
              </Link>
            ) : (
              <button
                key={i}
                type="button"
                role="menuitem"
                aria-disabled={it.disabled || undefined}
                className={itemCls(it)}
                onClick={() => {
                  setOpen(false);
                  it.onSelect?.();
                }}
              >
                {it.icon}
                {it.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

/* — Pagination — */

/** Pagination par liens (préserve les autres paramètres de l'URL via hrefFor) */
export function Pagination({
  page,
  pageCount,
  hrefFor,
  className,
}: {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
  className?: string;
}) {
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1
  );
  const cell = "inline-flex h-9 min-w-9 items-center justify-center rounded-control px-2 text-sm";
  return (
    <nav aria-label="Pagination" className={cn("flex items-center justify-center gap-1", className)}>
      <PageLink disabled={page <= 1} href={hrefFor(page - 1)} label="Page précédente" cls={cell}>
        <ChevronLeft className="h-4 w-4" />
      </PageLink>
      {pages.map((p, i) => (
        <span key={p} className="contents">
          {i > 0 && p - pages[i - 1]! > 1 && <span className="px-1 text-muted">…</span>}
          <Link
            href={hrefFor(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(cell, p === page ? "bg-primary font-semibold text-inverse" : "text-fg hover:bg-background")}
          >
            {p}
          </Link>
        </span>
      ))}
      <PageLink disabled={page >= pageCount} href={hrefFor(page + 1)} label="Page suivante" cls={cell}>
        <ChevronRight className="h-4 w-4" />
      </PageLink>
    </nav>
  );
}

function PageLink({ disabled, href, label, cls, children }: { disabled: boolean; href: string; label: string; cls: string; children: ReactNode }) {
  if (disabled) {
    return (
      <span aria-hidden className={cn(cls, "text-border-strong")}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} aria-label={label} className={cn(cls, "text-fg hover:bg-background")}>
      {children}
    </Link>
  );
}
