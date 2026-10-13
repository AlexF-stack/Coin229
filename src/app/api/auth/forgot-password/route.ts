import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, rateLimitAsync } from "@/lib/rate-limit";
import { requestPasswordReset } from "@/lib/password-requests";

/** « Mot de passe oublié » du site (clients et vendeurs) — réponse identique dans tous les cas */
const schema = z.object({ email: z.string().trim().toLowerCase().email().max(120) });

export async function POST(request: Request) {
  const limited = await rateLimitAsync({ key: `forgot:${clientIp(request)}`, limit: 8, windowMs: 60 * 60 * 1000 });
  if (!limited.ok) {
    return NextResponse.json({ ok: false, error: "Trop de demandes. Réessaie plus tard." }, { status: 429 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Email invalide." }, { status: 400 });
  }
  await requestPasswordReset(parsed.data.email);
  return NextResponse.json({ ok: true });
}
