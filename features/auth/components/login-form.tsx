"use client";

import { useActionState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendOtpAction } from "@/features/auth/actions";

type State = {
  success: boolean;
  error?: string;
  data?: { email: string };
} | null;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [state, formAction, isPending] = useActionState<State, FormData>(
    async (_prev, formData) => {
      const result = await sendOtpAction(formData);
      return result as State;
    },
    null
  );

  useEffect(() => {
    if (state?.success && state.data?.email) {
      const params = new URLSearchParams({ email: state.data.email, next });
      router.push(`/verify?${params.toString()}`);
    }
    if (state && !state.success && state.error) {
      toast.error(state.error);
    }
  }, [state, router, next]);

  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-[--color-text-primary]">
          Sign in
        </h2>
        <p className="mt-1 text-sm text-[--color-text-muted]">
          Enter your email to receive a one-time code
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            autoFocus
            required
            disabled={isPending}
          />
        </div>

        <Button type="submit" loading={isPending} className="w-full">
          {isPending ? "Sending..." : "Send code"}
        </Button>
      </form>
    </div>
  );
}
