import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { releaseExpiredReservations } from "@/lib/order-expiry";

/**
 * Tâche planifiée Vercel (filet de sécurité) : libère le stock des commandes
 * Mobile Money non payées à temps. Vercel envoie « Authorization: Bearer CRON_SECRET ».
 */
export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const given = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET?.trim()) {
    return NextResponse.json({ ok: false, error: "cron_not_configured" }, { status: 503 });
  }
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const released = await releaseExpiredReservations();
  return NextResponse.json({ ok: true, released });
}
