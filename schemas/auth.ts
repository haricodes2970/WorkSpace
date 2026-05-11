import { z } from "zod";

export const emailSchema = z.object({
  email: z
    .string()
    .min(1, "Email required")
    .email("Invalid email address")
    .toLowerCase()
    .trim(),
});

export const otpSchema = z.object({
  email: z.string().email(),
  token: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must be numeric"),
});

export type EmailInput = z.infer<typeof emailSchema>;
export type OtpInput = z.infer<typeof otpSchema>;
