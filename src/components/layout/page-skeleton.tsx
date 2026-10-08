/** Squelettes de chargement (loading.tsx) — même rythme visuel que les vraies pages */

function Bar({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-card bg-background ${className}`} />;
}

export function CatalogSkeleton() {
  return (
    <div aria-busy="true" aria-label="Chargement" className="space-y-6 px-4 py-6 md:px-0">
      <Bar className="h-8 w-40" />
      <Bar className="h-4 w-72 max-w-full" />
      <div className="flex gap-2">
        <Bar className="h-9 w-24" />
        <Bar className="h-9 w-24" />
        <Bar className="h-9 w-24" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="space-y-2">
            <Bar className="aspect-square w-full" />
            <Bar className="h-4 w-3/4" />
            <Bar className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProductSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Chargement"
      className="grid gap-6 px-4 py-6 md:grid-cols-2 md:gap-10 md:px-0"
    >
      <Bar className="aspect-square w-full" />
      <div className="space-y-4">
        <Bar className="h-4 w-24" />
        <Bar className="h-9 w-4/5" />
        <Bar className="h-4 w-40" />
        <Bar className="h-8 w-36" />
        <Bar className="h-12 w-full" />
        <Bar className="h-12 w-full" />
      </div>
    </div>
  );
}

export function OrderSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Chargement"
      className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-16"
    >
      <Bar className="h-16 w-16 rounded-full" />
      <Bar className="h-8 w-56" />
      <Bar className="h-4 w-72 max-w-full" />
      <Bar className="h-28 w-full" />
      <Bar className="h-12 w-full" />
    </div>
  );
}
