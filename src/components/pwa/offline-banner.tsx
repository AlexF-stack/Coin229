"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/** Bandeau mobile-first — visible dès que le réseau tombe. */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-[45] border-b border-amber/40 bg-navy px-3 py-2 text-center text-xs font-medium text-white"
    >
      <span className="inline-flex items-center gap-1.5">
        <WifiOff className="h-3.5 w-3.5 stroke-[1.5] text-amber" aria-hidden />
        Hors ligne — pages déjà ouvertes restent disponibles
      </span>
    </div>
  );
}
