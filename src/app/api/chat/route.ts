import { NextResponse } from "next/server";
import { z } from "zod";
import { runShopAgent, type AgentPrefs } from "@/lib/shop-agent";
import { rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  message: z.string().trim().min(1).max(500),
  pathname: z.string().max(200).optional(),
  prefs: z
    .object({
      budgetMax: z.number().int().positive().max(5_000_000).optional(),
      budgetMin: z.number().int().positive().max(5_000_000).optional(),
      categorie: z
        .enum(["montre", "bijou", "sac", "lunette"])
        .optional(),
      genre: z.enum(["homme", "femme", "unisexe"]).optional(),
      mode: z.enum(["guide"]).nullable().optional(),
    })
    .optional(),
});

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anon";

  const limited = rateLimit({
    key: `chat:${ip}`,
    limit: 40,
    windowMs: 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429 }
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const prefs = (parsed.data.prefs ?? {}) as AgentPrefs;
  const reply = await runShopAgent({
    message: parsed.data.message,
    pathname: parsed.data.pathname,
    prefs,
  });

  return NextResponse.json({ ok: true, ...reply });
}
