/**
 * Rate-limit partagé via Postgres (multi-instance Vercel).
 * Fallback mémoire si DB indisponible.
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
  if (existing.count >= opts.limit) {
    return {
      ok: false,
      retryAfterSec: Math.ceil((existing.resetAt - now) / 1000),
    };
  }
  existing.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

export async function rateLimitAsync(opts: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<{ ok: boolean; retryAfterSec: number }> {
  const now = new Date();
  try {
    const row = await prisma.rateLimitBucket.findUnique({
      where: { key: opts.key },
    });
    const windowExpired =
      !row ||
      now.getTime() - row.windowStart.getTime() >= opts.windowMs;

    if (windowExpired) {
      await prisma.rateLimitBucket.upsert({
        where: { key: opts.key },
        create: { key: opts.key, count: 1, windowStart: now },
        update: { count: 1, windowStart: now },
      });
      return { ok: true, retryAfterSec: 0 };
    }

    if (row.count >= opts.limit) {
      const retryAfterSec = Math.ceil(
        (opts.windowMs - (now.getTime() - row.windowStart.getTime())) / 1000
      );
      return { ok: false, retryAfterSec: Math.max(1, retryAfterSec) };
    }

    await prisma.rateLimitBucket.update({
      where: { key: opts.key },
      data: { count: { increment: 1 } },
    });
    return { ok: true, retryAfterSec: 0 };
  } catch {
    return memoryLimit(opts);
  }
}

/** Sync wrapper — préfère rateLimitAsync dans les routes async. */
export function rateLimit(opts: {
  key: string;
  limit: number;
  windowMs: number;
}): { ok: boolean; retryAfterSec: number } {
  return memoryLimit(opts);
}
