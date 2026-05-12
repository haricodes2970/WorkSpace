import { createClient } from "@/lib/supabase/server";
import { userRepository } from "@/repositories/user.repository";
import { getSession, requireSession } from "@/lib/auth/get-session";
import type { AuthUser } from "@/types/auth";

// ─── Session helpers (delegate to unified get-session) ────────────────────────

export async function getAuthUser(): Promise<AuthUser | null> {
  return getSession();
}

export async function requireAuthUser(): Promise<AuthUser> {
  return requireSession();
}

// ─── OTP flow ─────────────────────────────────────────────────────────────────

export async function sendOtp(email: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    },
  });

  if (error) throw new Error(error.message);
}

export async function verifyOtp(email: string, token: string): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Verification failed");

  await userRepository.upsertByAuthId(data.user.id, {
    email: data.user.email!,
    name: (data.user.user_metadata?.["name"] as string | undefined) ?? null,
    avatarUrl: (data.user.user_metadata?.["avatar_url"] as string | undefined) ?? null,
    timezone: "UTC",
  });
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
