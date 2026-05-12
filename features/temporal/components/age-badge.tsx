"use client";

import { computeAge, type AgeCategory } from "@/features/temporal/aging";
import { cn } from "@/lib/utils";

const BADGE_CLS: Record<AgeCategory, string> = {
  fresh:   "bg-[--color-success]/10 text-[--color-success] border-[--color-success]/20",
  active:  "bg-[--color-card] text-[--color-text-muted] border-[--color-border]",
  aging:   "bg-[--color-warning]/10 text-[--color-warning] border-[--color-warning]/20",
  stale:   "bg-[--color-error]/10 text-[--color-error] border-[--color-error]/20",
  dormant: "bg-[--color-error]/10 text-[--color-error] border-[--color-error]/20",
};

interface AgeBadgeProps {
  updatedAt:  Date | string;
  className?: string;
  showDot?:   boolean;
}

export function AgeBadge({ updatedAt, className, showDot = false }: AgeBadgeProps) {
  const age = computeAge(updatedAt);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-mono",
        BADGE_CLS[age.category],
        className
      )}
    >
      {showDot && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: age.colorToken }}
        />
      )}
      {age.label}
    </span>
  );
}
