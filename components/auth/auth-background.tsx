"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function AuthBackground() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Before mount: default to dark (matches defaultTheme) to avoid flicker
  const isDark = !mounted || resolvedTheme !== "light";

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      {/* Background image layer */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-[background-image] duration-700"
        style={{
          backgroundImage: isDark
            ? "url('/placeholder/auth-bg-dark.jpg')"
            : "url('/placeholder/auth-bg-light.jpg')",
        }}
      />

      {/* Gradient overlay — tones down image, creates depth */}
      <div
        className={[
          "absolute inset-0 transition-opacity duration-700",
          isDark
            ? "bg-gradient-to-br from-[#070B10]/92 via-[#0B0F14]/88 to-[#060A0F]/95"
            : "bg-gradient-to-br from-slate-100/85 via-white/80 to-slate-50/90",
        ].join(" ")}
      />

      {/* Radial vignette — architectural depth */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 30%, rgba(0,0,0,0.55) 100%)"
            : "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 30%, rgba(0,0,0,0.08) 100%)",
        }}
      />

      {/* Subtle noise texture layer — grounded, not sterile */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize:   "128px 128px",
        }}
      />
    </div>
  );
}
