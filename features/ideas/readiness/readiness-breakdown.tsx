"use client";

import { motion } from "framer-motion";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReadinessScore, FactorScore } from "./calculator";

const FACTOR_LABELS: Record<string, string> = {
  PROBLEM:         "Problem defined",
  USER_PAIN:       "User pain mapped",
  EXECUTION_PLAN:  "Execution plan",
  MVP_SCOPE:       "MVP scoped",
  MARKET_GAP:      "Market gap",
  SUCCESS_METRICS: "Success metrics",
  RISKS:           "Risks identified",
};

interface ReadinessBreakdownProps {
  readiness: ReadinessScore;
  compact?: boolean;
  className?: string;
}

export function ReadinessBreakdown({
  readiness,
  compact = false,
  className,
}: ReadinessBreakdownProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {readiness.factors.map((factor, i) => (
        <FactorRow
          key={factor.factor}
          factor={factor}
          compact={compact}
          animDelay={i * 0.04}
        />
      ))}
    </div>
  );
}

function FactorRow({
  factor,
  compact,
  animDelay,
}: {
  factor: FactorScore;
  compact: boolean;
  animDelay: number;
}) {
  const label = FACTOR_LABELS[factor.factor] ?? factor.factor;
  const pct = factor.pct;

  return (
    <motion.div
      className="flex items-center gap-2"
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: animDelay, duration: 0.15 }}
    >
      {/* Completion icon */}
      {factor.filled ? (
        <Check className="h-3 w-3 text-[--color-success] shrink-0" />
      ) : (
        <Circle className="h-3 w-3 text-[--color-text-muted] shrink-0 opacity-40" />
      )}

      {/* Label + bar */}
      <div className="flex-1 min-w-0">
        {!compact && (
          <div className="flex items-center justify-between mb-0.5">
            <span
              className={cn(
                "text-[11px]",
                factor.filled
                  ? "text-[--color-text-secondary]"
                  : "text-[--color-text-muted]"
              )}
            >
              {label}
            </span>
            <span className="text-[10px] text-[--color-text-muted] tabular-nums">
              {factor.weight}pt
            </span>
          </div>
        )}
        <div className="h-1 w-full rounded-full bg-[--color-card] overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full",
              factor.filled
                ? "bg-[--color-success]"
                : pct > 50
                ? "bg-[--color-warning]"
                : "bg-[--color-text-muted] opacity-40"
            )}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ delay: animDelay + 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>

      {compact && (
        <span className="text-[10px] text-[--color-text-muted] tabular-nums shrink-0">
          {factor.weight}
        </span>
      )}
    </motion.div>
  );
}
