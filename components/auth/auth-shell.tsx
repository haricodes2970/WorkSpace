"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

interface AuthShellProps {
  children:    React.ReactNode;
  className?:  string;
  showLogo?:   boolean;
}

export function AuthShell({ children, className, showLogo = true }: AuthShellProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        // Structure
        "relative w-full max-w-[420px] rounded-3xl overflow-hidden",
        // Glassmorphism — restrained, not theatrical
        "backdrop-blur-xl",
        "bg-white/[0.04] dark:bg-[#080C12]/55",
        "border border-white/[0.09] dark:border-white/[0.07]",
        "shadow-[0_8px_40px_rgba(0,0,0,0.40)]",
        className
      )}
    >
      {/* Inner top-edge glow — thin highlight, not a border */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)",
        }}
      />

      {/* Card body */}
      <div className="relative px-8 pb-8 pt-7">
        {/* Header row: wordmark + theme toggle */}
        {showLogo && (
          <div className="mb-7 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* Monogram mark */}
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#7C3AED]/90 shadow-[0_0_12px_rgba(124,58,237,0.35)]">
                <span className="text-[11px] font-bold text-white tracking-tight">W</span>
              </div>
              <span className="text-[14px] font-semibold text-white/90 tracking-tight">
                WorkSpace
              </span>
            </div>
            <ThemeToggle />
          </div>
        )}

        {children}
      </div>

      {/* Bottom inner vignette */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.08), transparent)",
        }}
      />
    </motion.div>
  );
}
