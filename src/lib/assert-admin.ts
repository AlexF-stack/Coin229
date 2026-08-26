"use server";

import { cookies } from "next/headers";
import {
  adminCookieName,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";

export async function assertAdmin() {
  const jar = await cookies();
  const token = jar.get(adminCookieName())?.value;
  const ok = await verifyAdminSessionToken(token);
  if (!ok) {
    return { ok: false as const };
  }
  return { ok: true as const };
}

export async function requireAdmin() {
  const result = await assertAdmin();
  if (!result.ok) {
    throw new Error("UNAUTHORIZED");
  }
}
