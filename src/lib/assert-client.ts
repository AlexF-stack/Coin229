"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  phoneCookieName,
  readPhoneFromToken,
} from "@/lib/phone-session";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** Client connecté (OTP téléphone ou OAuth). */
export async function requireClient(): Promise<{
  clientId: string;
  nom: string;
}> {
  const jar = await cookies();
  const phone = await readPhoneFromToken(jar.get(phoneCookieName())?.value);
  if (phone) {
    const client = await prisma.client.findUnique({
      where: { telephone: phone },
      select: { id: true, nom: true },
    });
    if (!client) throw new Error("UNAUTHORIZED_CLIENT");
    return { clientId: client.id, nom: client.nom };
  }

  if (!isSupabaseConfigured()) throw new Error("UNAUTHORIZED_CLIENT");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHORIZED_CLIENT");

  const client = await prisma.client.findFirst({
    where: {
      OR: [
        { authId: user.id },
        ...(user.email ? [{ email: user.email }] : []),
      ],
    },
    select: { id: true, nom: true },
  });
  if (!client) throw new Error("UNAUTHORIZED_CLIENT");
  return { clientId: client.id, nom: client.nom };
}

export async function assertClient() {
  try {
    return { ok: true as const, ...(await requireClient()) };
  } catch {
    return { ok: false as const };
  }
}
