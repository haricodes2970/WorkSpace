import { createClient } from "@/lib/supabase/server";
import { userRepository } from "@/repositories/user.repository";
import type { AuthUser } from "@/types/auth";

export async function getAuthUser(): Promise<AuthUser | null> {
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

export async function requireAuthUser(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function sendOtp(email: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
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

  // Upsert user profile
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
