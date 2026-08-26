import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureOAuthClient } from "@/lib/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/compte";
  if (!next.startsWith("/")) next = "/compte";

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(`${origin}/auth/erreur?reason=config`);
  }

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        await ensureOAuthClient();
        const forwardedHost = request.headers.get("x-forwarded-host");
        const isLocal = process.env.NODE_ENV === "development";
        if (isLocal) {
          return NextResponse.redirect(`${origin}${next}`);
        }
        if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${next}`);
        }
        return NextResponse.redirect(`${origin}${next}`);
      }
    } catch {
      // fallthrough
    }
  }

  return NextResponse.redirect(`${origin}/auth/erreur`);
}
