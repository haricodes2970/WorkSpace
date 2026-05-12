"use client";

import { cn } from "@/lib/utils";

type ExecutionState = "building" | "shipping" | "blocked" | "paused" | "completed" | "idea";

const STATE_STYLES: Record<ExecutionState, string> = {
  building:  "bg-[--color-primary]/10 text-[--color-primary] border-[--color-primary]/20",
  shipping:  "bg-[--color-success]/10 text-[--color-success] border-[--color-success]/20",
  blocked:   "bg-[--color-error]/10 text-[--color-error] border-[--color-error]/20",
  paused:    "bg-[--color-warning]/10 text-[--color-warning] border-[--color-warning]/20",
  completed: "bg-[--color-card] text-[--color-text-muted] border-[--color-border]",
  idea:      "bg-[--color-accent]/10 text-[--color-accent] border-[--color-accent]/20",
};

const STATE_LABEL: Record<ExecutionState, string> = {
  building:  "Building",
  shipping:  "Shipping",
  blocked:   "Blocked",
  paused:    "Paused",
  completed: "Done",
  idea:      "Idea",
};

// Maps Prisma Phase enum values to execution state
export function phaseToExecutionState(phase: string | null): ExecutionState {
  if (!phase) return "idea";
  const map: Record<string, ExecutionState> = {
    IDEA:        "idea",
    PLANNING:    "idea",
    IN_PROGRESS: "building",
    REVIEW:      "shipping",
    SHIPPED:     "completed",
    ARCHIVED:    "completed",
    BLOCKED:     "blocked",
  };
  return map[phase] ?? "building";
}

interface ExecutionBadgeProps {
  state:      ExecutionState;
  className?: string;
}

export function ExecutionBadge({ state, className }: ExecutionBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium",
        STATE_STYLES[state],
        className
      )}
    >
      {STATE_LABEL[state]}
    </span>
  );
}
