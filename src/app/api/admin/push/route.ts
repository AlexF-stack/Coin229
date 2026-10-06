import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import {
  adminCookieName,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { sendPushTo } from "@/lib/push-audience";
import { isWebPushConfigured } from "@/lib/web-push";

async function requireAdminApi() {
  const jar = await cookies();
  const token = jar.get(adminCookieName())?.value;
  return verifyAdminSessionToken(token);
}

const sendSchema = z.object({
  title: z.string().trim().min(1).max(80),
  body: z.string().trim().min(1).max(240),
  url: z
    .string()
    .trim()
    .max(300)
    .optional()
    .transform((v) => {
      if (!v) return "/";
      if (v.startsWith("/")) return v;
      try {
        const u = new URL(v);
        const app = process.env.NEXT_PUBLIC_APP_URL;
        if (app && u.origin === new URL(app).origin) {
          return `${u.pathname}${u.search}`;
        }
      } catch {
        // ignore
      }
      return "/";
    }),
  tag: z.string().trim().max(64).optional(),
});

export async function GET() {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // Annonces marketing : abonnés clients uniquement
  const count = await prisma.pushSubscription.count({ where: { role: "client" } });
  return NextResponse.json({
    ok: true,
    configured: isWebPushConfigured(),
    subscribers: count,
  });
}

export async function POST(request: Request) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (!isWebPushConfigured()) {
    return NextResponse.json(
      { ok: false, error: "push_disabled" },
      { status: 503 }
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = sendSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  // Annonces marketing : abonnés clients uniquement
  const result = await sendPushTo(
    { roles: ["client"] },
    {
      title: parsed.data.title,
      body: parsed.data.body,
      url: parsed.data.url,
      tag: parsed.data.tag,
    }
  );

  return NextResponse.json({ ok: true, ...result });
}
