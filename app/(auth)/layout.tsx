import type { ReactNode } from "react";
import { AuthBackground } from "@/components/auth/auth-background";

// Auth layout — full viewport, immersive background, centered composition.
// ThemeProvider lives at root layout; auth pages read theme from there.

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-svh w-full items-center justify-center overflow-hidden p-4 sm:p-8">
      {/* Layered background system — placeholders, swap images without code change */}
      <AuthBackground />

      {/* Centered content above background layers */}
      <div className="relative z-10 w-full flex items-center justify-center">
        {children}
      </div>

      {/* Ambient tagline */}
      <p className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 text-[11px] text-white/15 whitespace-nowrap tracking-wide select-none">
        WorkSpace · calm execution for focused builders
      </p>
    </div>
  );
}
