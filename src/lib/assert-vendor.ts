"use server";

import { cookies } from "next/headers";
import {
  readVendorSession,
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
  const session = readVendorSession(jar.get(vendorCookieName())?.value);
  if (!session) {
    throw new Error("UNAUTHORIZED_VENDOR");
  }
  const vendor = await prisma.vendor.findUnique({
    where: { id: session.vendorId },
    select: {
      id: true,
      statut: true,
      nomBoutique: true,
      slug: true,
      sessionVersion: true,
    },
  });
  // Mot de passe changé depuis la connexion → session révoquée
  if (!vendor || vendor.sessionVersion !== session.sessionVersion) {
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
