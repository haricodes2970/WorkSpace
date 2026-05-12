import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { userRepository } from "@/repositories/user.repository";
import { sanitizeRedirect } from "@/lib/auth/auth-redirect";

// Handles:
//   1. OAuth callback codes  (Google → Supabase → here)
//   2. Email magic-link codes (Supabase confirmation emails)
// Safe on: localhost, Vercel preview, production domains

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);

  const code    = searchParams.get("code");
  const next    = sanitizeRedirect(searchParams.get("next"));
  const error   = searchParams.get("error");
  const errDesc = searchParams.get("error_description");

  // ── Auth provider returned an error ─────────────────────────────────────────
  if (error) {
    const msg = errDesc ?? error;
    console.error("[auth/callback] provider error:", msg);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(msg)}`
    );
  }

  // ── No code — invalid state ──────────────────────────────────────────────────
  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  // ── Exchange code for session ────────────────────────────────────────────────
  const supabase = await createClient();
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error("[auth/callback] exchange error:", exchangeError.message);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(exchangeError.message)}`
    );
  }

  if (!data.user) {
    return NextResponse.redirect(`${origin}/login?error=no_user`);
  }

  // ── Upsert profile ───────────────────────────────────────────────────────────
  try {
    await userRepository.upsertByAuthId(data.user.id, {
      email:     data.user.email!,
      name:      (data.user.user_metadata?.["name"]       as string | undefined) ?? null,
      avatarUrl: (data.user.user_metadata?.["avatar_url"] as string | undefined) ?? null,
      timezone:  "UTC",
    });
  } catch (profileErr) {
    // Non-fatal — user is authenticated, profile sync failure shouldn't block login
    console.error("[auth/callback] profile upsert failed:", profileErr);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
