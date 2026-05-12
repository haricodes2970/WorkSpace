"use server";

// Typed server actions for auth — accept plain args (compatible with RHF handleSubmit)

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { userRepository } from "@/repositories/user.repository";
import { emailSchema, otpSchema } from "@/schemas/auth";
import { getCallbackUrl } from "./auth-redirect";
import type { ActionResult } from "@/types/api";

// ─── OTP ──────────────────────────────────────────────────────────────────────

export async function sendOtpAction(
  email: string
): Promise<ActionResult<{ email: string }>> {
  const parsed = emailSchema.safeParse({ email });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid email" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: getCallbackUrl("/callback"),
    },
  });

  if (error) return { success: false, error: error.message, code: "OTP_SEND_FAILED" };
  return { success: true, data: { email: parsed.data.email } };
}

export async function verifyOtpAction(
  email: string,
  token: string
): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = otpSchema.safeParse({ email, token });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid code" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.token,
    type: "email",
  });

  if (error) return { success: false, error: error.message, code: "OTP_VERIFY_FAILED" };
  if (!data.user) return { success: false, error: "Verification failed" };

  await userRepository.upsertByAuthId(data.user.id, {
    email: data.user.email!,
    name:      (data.user.user_metadata?.["name"]       as string | undefined) ?? null,
    avatarUrl: (data.user.user_metadata?.["avatar_url"] as string | undefined) ?? null,
    timezone:  "UTC",
  });

  return { success: true, data: { redirectTo: "/today" } };
}

// ─── Sign out ─────────────────────────────────────────────────────────────────

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
