"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/** Tracking léger UTM partage vendeur (analytics / console). */
export function VendorUtmTracker() {
  const params = useSearchParams();

  useEffect(() => {
    const campaign = params.get("utm_campaign");
    const source = params.get("utm_source");
    const medium = params.get("utm_medium");
    if (!campaign && !source) return;
    const payload = {
      utm_source: source,
      utm_medium: medium,
      utm_campaign: campaign,
    };
    try {
      // Vercel Analytics custom event si dispo
      const va = (
        window as unknown as {
          va?: (event: string, data: Record<string, string | null>) => void;
        }
      ).va;
      va?.("vendor_share_landing", payload);
    } catch {
      /* ignore */
    }
    if (process.env.NODE_ENV === "development") {
      console.info("[utm]", payload);
    }
  }, [params]);

  return null;
}
