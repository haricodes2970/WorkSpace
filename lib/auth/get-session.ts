import "server-only";
import { isDevAuthEnabled, DEV_PRISMA_USER, DEV_SUPABASE_USER } from "./dev-session";
import { createClient } from "@/lib/supabase/server";
import { userRepository } from "@/repositories/user.repository";
import type { AuthUser } from "@/types/auth";

/**
 * Unified session entry point for all server code.
 *
 * Development + DEV_AUTH_BYPASS=true → returns deterministic mock user, no DB call.
 * Production / real auth           → resolves Supabase session, then Prisma profile.
 */
export async function getSession(): Promise<AuthUser | null> {
  if (isDevAuthEnabled()) {
    return { supabase: DEV_SUPABASE_USER, profile: DEV_PRISMA_USER };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const profile = await userRepository.findByAuthId(user.id);
  if (!profile) return null;

  return { supabase: user, profile };
}

/**
 * Throws UNAUTHORIZED when no session exists.
 * Drop-in replacement for requireAuthUser() in server actions and pages.
 */
export async function requireSession(): Promise<AuthUser> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}
