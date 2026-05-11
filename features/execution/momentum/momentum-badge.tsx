"use client";

import { cn } from "@/lib/utils";
import type { MomentumState } from "./calculator";

interface MomentumBadgeProps {
  state: MomentumState;
  score?: number;
  size?: "sm" | "md";
  className?: string;
}

const STATE_CONFIG: Record<MomentumState, {
  label: string;
  color: string;
  bg: string;
  dot: string;
}> = {
  ACCELERATING: {
    label: "Accelerating",
    color: "text-[--color-success]",
    bg: "bg-[--color-success]/10 border-[--color-success]/20",
    dot: "bg-[--color-success]",
  },
  ACTIVE: {
    label: "Active",
    color: "text-[--color-accent]",
    bg: "bg-[--color-accent]/10 border-[--color-accent]/20",
    dot: "bg-[--color-accent]",
  },
  STABLE: {
    label: "Stable",
    color: "text-[--color-text-secondary]",
    bg: "bg-[--color-card] border-[--color-border]",
    dot: "bg-[--color-text-muted]",
  },
  SLOWING: {
    label: "Slowing",
    color: "text-[--color-warning]",
    bg: "bg-[--color-warning]/10 border-[--color-warning]/20",
    dot: "bg-[--color-warning]",
  },
  STALLED: {
    label: "Stalled",
    color: "text-[--color-error]",
    bg: "bg-[--color-error]/10 border-[--color-error]/20",
    dot: "bg-[--color-error]",
  },
  ABANDONED: {
    label: "Abandoned",
    color: "text-[--color-text-muted]",
    bg: "bg-[--color-card] border-[--color-border-subtle]",
    dot: "bg-[--color-text-muted] opacity-40",
  },
};

export function MomentumBadge({ state, score, size = "sm", className }: MomentumBadgeProps) {
  const cfg = STATE_CONFIG[state];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
        cfg.bg,
        cfg.color,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dot)} />
      {cfg.label}
      {score !== undefined && (
        <span className="opacity-70 tabular-nums">{score}</span>
      )}
    </span>
  );
}
