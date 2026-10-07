/**
 * Rate-limit partagé via Postgres (toutes les instances Vercel voient le même compteur).
 * Une seule requête SQL atomique par tentative : pas de course entre requêtes simultanées.
 * Repli mémoire uniquement si la base est injoignable.
 */
import { prisma } from "@/lib/prisma";

type Bucket = { count: number; resetAt: number };
const memory = new Map<string, Bucket>();

function memoryLimit(opts: {
  key: string;
  limit: number;
  windowMs: number;
}): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const existing = memory.get(opts.key);
  if (!existing || existing.resetAt <= now) {
    memory.set(opts.key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true, retryAfterSec: 0 };
  }
  existing.count += 1;
  if (existing.count > opts.limit) {
    return {
      ok: false,
      retryAfterSec: Math.ceil((existing.resetAt - now) / 1000),
    };
  }
  return { ok: true, retryAfterSec: 0 };
}

export async function rateLimitAsync(opts: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<{ ok: boolean; retryAfterSec: number }> {
  const windowSec = opts.windowMs / 1000;
  try {
    // Compte la tentative et réinitialise la fenêtre si elle est écoulée, en une fois
    const rows = await prisma.$queryRaw<{ count: number; elapsed: number }[]>`
      INSERT INTO "rate_limit_buckets" ("key", "count", "window_start")
      VALUES (${opts.key}, 1, now())
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN "rate_limit_buckets"."window_start" <= now() - make_interval(secs => ${windowSec})
          THEN 1 ELSE "rate_limit_buckets"."count" + 1 END,
        "window_start" = CASE
          WHEN "rate_limit_buckets"."window_start" <= now() - make_interval(secs => ${windowSec})
          THEN now() ELSE "rate_limit_buckets"."window_start" END
      RETURNING "count", EXTRACT(EPOCH FROM (now() - "window_start"))::float8 AS "elapsed"
    `;
    const row = rows[0];
    if (!row) return { ok: true, retryAfterSec: 0 };
    if (row.count > opts.limit) {
      return {
        ok: false,
        retryAfterSec: Math.max(1, Math.ceil(windowSec - row.elapsed)),
      };
    }
    return { ok: true, retryAfterSec: 0 };
  } catch {
    return memoryLimit(opts);
  }
}

/** Plusieurs limites à la fois (ex. par IP ET par compte) : bloqué si une seule est dépassée */
export async function rateLimitAll(
  rules: { key: string; limit: number; windowMs: number }[]
): Promise<{ ok: boolean; retryAfterSec: number }> {
  const results = await Promise.all(rules.map((r) => rateLimitAsync(r)));
  const blocked = results.filter((r) => !r.ok);
  if (!blocked.length) return { ok: true, retryAfterSec: 0 };
  return {
    ok: false,
    retryAfterSec: Math.max(...blocked.map((r) => r.retryAfterSec)),
  };
}

/** Adresse IP du client (Vercel renseigne x-forwarded-for) */
export function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
