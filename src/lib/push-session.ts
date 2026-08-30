import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  normalizeBjPhone,
  phoneCookieName,
  readPhoneFromToken,
} from "@/lib/phone-session";

/** Résout le Client connecté (téléphone ou OAuth) pour lier un abonnement push. */
export async function resolveSessionClientId(): Promise<string | null> {
  try {
    const jar = await cookies();
    const phone = await readPhoneFromToken(jar.get(phoneCookieName())?.value);
    if (phone) {
      const normalized = normalizeBjPhone(phone) || phone;
      const client = await prisma.client.findFirst({
        where: { telephone: normalized },
        select: { id: true },
      });
      return client?.id ?? null;
    }

    if (!isSupabaseConfigured()) return null;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const byAuth = await prisma.client.findFirst({
      where: { authId: user.id },
      select: { id: true },
    });
    if (byAuth) return byAuth.id;

    if (user.email) {
      const byEmail = await prisma.client.findFirst({
        where: { email: user.email },
        select: { id: true },
      });
      return byEmail?.id ?? null;
    }
  } catch {
    // ignore
  }
  return null;
}
