"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { sendOtpAction } from "@/lib/auth/auth-actions";
import { SocialAuth } from "./social-auth";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
});
type FormValues = z.infer<typeof schema>;

interface LoginFormProps {
  onSuccess: (email: string) => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const [serverError, setServerError] = useState<string | null>(null);

  async function onSubmit(data: FormValues) {
    setServerError(null);
    const result = await sendOtpAction(data.email);
    if (!result.success) {
      setServerError(result.error);
      return;
    }
    onSuccess(result.data.email);
  }

  return (
    <motion.div
      key="login"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
    >
      <div>
        <h2 className="text-[20px] font-semibold text-white/90 tracking-tight">
          Welcome back
        </h2>
        <p className="mt-1 text-[13px] text-white/40">
          Enter your email to receive a sign-in code.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="login-email" className="block text-[12px] font-medium text-white/50">
            Email address
          </label>
          <input
            {...register("email")}
            id="login-email"
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="you@example.com"
            className={cn(
              "w-full rounded-xl border px-3.5 py-2.5 text-[13px] outline-none",
              "bg-white/[0.04] text-white/90 placeholder:text-white/20",
              "transition-all duration-150",
              errors.email
                ? "border-red-400/50 focus:border-red-400/70"
                : "border-white/[0.09] focus:border-white/20 focus:bg-white/[0.06]",
              "focus-visible:ring-1 focus-visible:ring-[--color-primary]/30",
            )}
            aria-describedby={errors.email ? "login-email-error" : undefined}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p id="login-email-error" className="text-[11px] text-red-400/80" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        {serverError && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[12px] text-red-400/80"
            role="alert"
          >
            {serverError}
          </motion.p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5",
            "bg-[--color-primary] text-[13px] font-medium text-white",
            "transition-all duration-150",
            "hover:bg-[--color-primary-hover] hover:shadow-[0_0_20px_rgba(124,58,237,0.28)]",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-primary]/50",
          )}
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? "Sending code…" : "Continue with email"}
        </button>
      </form>

      <SocialAuth mode="signin" />
    </motion.div>
  );
}
