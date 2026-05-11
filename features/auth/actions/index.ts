"use server";

import { redirect } from "next/navigation";
import { emailSchema, otpSchema } from "@/schemas/auth";
import { sendOtp, verifyOtp, signOut } from "@/services/auth.service";
import type { ActionResult } from "@/types/api";

export async function sendOtpAction(
  formData: FormData
): Promise<ActionResult<{ email: string }>> {
  const raw = { email: formData.get("email") };
  const parsed = emailSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Invalid email",
    };
  }

  try {
    await sendOtp(parsed.data.email);
    return { success: true, data: { email: parsed.data.email } };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send OTP",
      code: "OTP_SEND_FAILED",
    };
  }
}

export async function verifyOtpAction(
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    email: formData.get("email"),
    token: formData.get("token"),
  };
  const parsed = otpSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Invalid OTP",
    };
  }

  try {
    await verifyOtp(parsed.data.email, parsed.data.token);
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Verification failed",
      code: "OTP_VERIFY_FAILED",
    };
  }

  redirect("/dashboard");
}

export async function signOutAction(): Promise<void> {
  await signOut();
  redirect("/login");
}
