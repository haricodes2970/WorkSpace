// Auth redirect utilities — safe URL computation for OAuth and email links

const BLOCKED_REDIRECT_PREFIXES = ["/login", "/register", "/callback", "/verify", "/api"];

/** Compute the base site URL. Works in server and client contexts. */
export function getSiteUrl(): string {
  // Client-side: always use origin
  if (typeof window !== "undefined") return window.location.origin;
  // Server-side explicit override
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  // Vercel preview deployments
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/** Build a full callback URL for OAuth redirectTo / email magic links. */
export function getCallbackUrl(path = "/callback"): string {
  return `${getSiteUrl()}${path}`;
}

/** Check a redirect path is safe (internal, non-auth, non-API). */
export function isValidRedirectPath(path: string): boolean {
  if (!path.startsWith("/") || path.startsWith("//")) return false;
  return !BLOCKED_REDIRECT_PREFIXES.some((p) => path.startsWith(p));
}

/** Sanitize the `next` search param — fallback to /today on anything invalid. */
export function sanitizeRedirect(next: string | null | undefined): string {
  if (!next) return "/today";
  try {
    const decoded = decodeURIComponent(next);
    return isValidRedirectPath(decoded) ? decoded : "/today";
  } catch {
    return "/today";
  }
}
