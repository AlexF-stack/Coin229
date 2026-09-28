"use server";

import { cookies } from "next/headers";
import {
  readVendorSessionToken,
  vendorCookieName,
} from "@/lib/vendor-auth";
import { prisma } from "@/lib/prisma";

export async function requireVendor(): Promise<{
  vendorId: string;
  statut: string;
  nomBoutique: string;
  slug: string | null;
}> {
  const jar = await cookies();
  const vendorId = readVendorSessionToken(jar.get(vendorCookieName())?.value);
  if (!vendorId) {
    throw new Error("UNAUTHORIZED_VENDOR");
  }
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: {
      id: true,
      statut: true,
      nomBoutique: true,
      slug: true,
    },
  });
  if (!vendor) {
    throw new Error("UNAUTHORIZED_VENDOR");
  }
  if (vendor.statut === "suspendu") {
    throw new Error("VENDOR_SUSPENDED");
  }
  return {
    vendorId: vendor.id,
    statut: vendor.statut,
    nomBoutique: vendor.nomBoutique,
    slug: vendor.slug,
  };
}

export async function assertVendor() {
  try {
    return { ok: true as const, ...(await requireVendor()) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "VENDOR_SUSPENDED") {
      return { ok: false as const, reason: "suspended" as const };
    }
    return { ok: false as const, reason: "unauthorized" as const };
  }
}
