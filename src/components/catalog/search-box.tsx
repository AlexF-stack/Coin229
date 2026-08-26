"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export function SearchBox({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/recherche?q=${encodeURIComponent(query)}` : "/recherche");
  }

  return (
    <form onSubmit={onSubmit} className="px-4 md:px-0">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 stroke-[1.5] text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Montre, bijou, sac…"
          className="w-full rounded-[16px] border border-border bg-card py-3.5 pl-11 pr-4 text-sm outline-none focus:border-amber md:rounded-full"
          autoFocus
        />
      </div>
    </form>
  );
}

export function SearchBoxFromParams() {
  const params = useSearchParams();
  return <SearchBox initialQuery={params.get("q") ?? ""} />;
}
