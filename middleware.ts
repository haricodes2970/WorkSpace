import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/login", "/verify", "/api/auth/callback", "/dev-login"];
const AUTH_ROUTES   = ["/login", "/verify"];

// ─── Dev bypass ───────────────────────────────────────────────────────────────

function isDevBypassEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.DEV_AUTH_BYPASS === "true"
  );
}

// ─── Supabase env ─────────────────────────────────────────────────────────────

type SupabaseEnv = { url: string; anonKey: string } | { error: NextResponse };

function getSupabaseEnv(): SupabaseEnv {
  const url     = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    const missing: string[] = [];
    if (!url)     missing.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!anonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

    if (process.env.NODE_ENV === "development") {
      console.error("[middleware] Missing Supabase env vars:", { missing });
    }

    return {
      error: new NextResponse(
        `Missing required Supabase environment variable(s): ${missing.join(", ")}`,
        { status: 500 }
      ),
    };
  }

  return { url, anonKey };
}

// ─── Middleware ────────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Dev bypass: skip all auth checks, attach marker header ──────────────────
  if (isDevBypassEnabled()) {
    const response = NextResponse.next({ request });
    response.headers.set("x-workspace-dev-auth", "enabled");
    return response;
  }

  // ── Production / real-auth path ─────────────────────────────────────────────
  let supabaseResponse = NextResponse.next({ request });
  const env = getSupabaseEnv();

  if ("error" in env) return env.error;

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, {
            ...options,
            httpOnly: true,
            secure: true,
            sameSite: "lax",
          })
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublic    = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/today", request.url));
  }

  if (!user && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
