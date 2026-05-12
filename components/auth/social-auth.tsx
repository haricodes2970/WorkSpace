"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { signInWithGoogle } from "@/lib/auth/auth-client";

// Google logo SVG — inline, no external dependency
function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

interface SocialAuthProps {
  mode:      "signin" | "register";
  className?: string;
}

export function SocialAuth({ mode, className }: SocialAuthProps) {
  const [loading, setLoading] = useState(false);
  const [error,   setError  ] = useState<string | null>(null);

  async function handleGoogle() {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      // Browser will redirect — no need to setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
      setLoading(false);
    }
  }

  const label = mode === "signin" ? "Continue with Google" : "Sign up with Google";

  return (
    <div className={cn("space-y-3", className)}>
      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-white/[0.08]" />
        <span className="text-[11px] text-white/25 font-medium uppercase tracking-widest">or</span>
        <div className="h-px flex-1 bg-white/[0.08]" />
      </div>

      {/* Google button */}
      <button
        onClick={handleGoogle}
        disabled={loading}
        className={cn(
          "group relative flex w-full items-center justify-center gap-3",
          "rounded-xl border px-4 py-2.5 text-[13px] font-medium",
          "transition-all duration-150",
          "border-white/[0.09] bg-white/[0.04] text-white/70",
          "hover:border-white/[0.14] hover:bg-white/[0.07] hover:text-white/90",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-primary]/40 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent",
        )}
        aria-label={label}
      >
        {loading
          ? <Loader2 className="h-4 w-4 animate-spin text-white/40" />
          : <GoogleLogo className="h-4 w-4 shrink-0" />
        }
        <span>{label}</span>
      </button>

      {error && (
        <p className="text-center text-[11px] text-red-400/80">{error}</p>
      )}
    </div>
  );
}
