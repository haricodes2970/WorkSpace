"use client";

import { useActionState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { verifyOtpAction } from "@/features/auth/actions";

type State = { success: boolean; error?: string } | null;

export function VerifyForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [state, formAction, isPending] = useActionState<State, FormData>(
    async (_prev, formData) => {
      const result = await verifyOtpAction(formData);
      return result as State;
    },
    null
  );

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (state && !state.success && state.error) {
      toast.error(state.error);
      inputRef.current?.select();
    }
  }, [state]);

  if (!email) {
    return (
      <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-6 text-center">
        <p className="text-sm text-[--color-text-muted]">
          No email provided.{" "}
          <a href="/login" className="text-[--color-accent] hover:underline">
            Go back
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-[--color-text-primary]">
          Check your email
        </h2>
        <p className="mt-1 text-sm text-[--color-text-muted]">
          Sent a 6-digit code to{" "}
          <span className="text-[--color-text-secondary] font-medium">{email}</span>
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="email" value={email} />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="token">One-time code</Label>
          <Input
            ref={inputRef}
            id="token"
            name="token"
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            placeholder="000000"
            autoComplete="one-time-code"
            required
            disabled={isPending}
            className="text-center text-2xl tracking-[0.5em] font-mono"
          />
        </div>

        <Button type="submit" loading={isPending} className="w-full">
          {isPending ? "Verifying..." : "Verify code"}
        </Button>

        <p className="text-center text-xs text-[--color-text-muted]">
          Didn&apos;t receive it?{" "}
          <a href="/login" className="text-[--color-accent] hover:underline">
            Resend
          </a>
        </p>
      </form>
    </div>
  );
}
