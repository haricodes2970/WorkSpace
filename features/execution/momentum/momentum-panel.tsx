"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { MomentumBadge } from "./momentum-badge";
import { MomentumSparkline } from "./momentum-sparkline";
import type { MomentumResult } from "./calculator";

interface MomentumPanelProps {
  momentum: MomentumResult;
  className?: string;
}

export function MomentumPanel({ momentum, className }: MomentumPanelProps) {
  const TrendIcon =
    momentum.trend === "up" ? TrendingUp
    : momentum.trend === "down" ? TrendingDown
    : Minus;

  const trendColor =
    momentum.trend === "up" ? "text-[--color-success]"
    : momentum.trend === "down" ? "text-[--color-error]"
    : "text-[--color-text-muted]";

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <span className="text-[11px] text-[--color-text-muted] uppercase tracking-wider font-medium px-1">
        Momentum
      </span>

      {/* Score + state */}
      <div className="rounded-lg border border-[--color-border] bg-[--color-card] px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-[28px] font-bold tabular-nums text-[--color-text-primary] leading-none">
              {momentum.score}
            </span>
            <div className="flex flex-col gap-1">
              <MomentumBadge state={momentum.state} />
              <div className={cn("flex items-center gap-1 text-[10px]", trendColor)}>
                <TrendIcon className="h-3 w-3" />
                <span>
                  {momentum.thisWeekCompletions} this week
                  {momentum.lastWeekCompletions > 0 && ` (was ${momentum.lastWeekCompletions})`}
                </span>
              </div>
            </div>
          </div>

          <MomentumSparkline
            data={momentum.sparkline}
            trend={momentum.trend}
          />
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[--color-border-subtle]">
          <MetricCell label="Velocity" value={`${momentum.thisWeekCompletions}/wk`} />
          <MetricCell label="Done" value={`${momentum.completionRate}%`} />
          <MetricCell
            label="Inactive"
            value={
              momentum.inactiveDays === 0
                ? "Today"
                : `${momentum.inactiveDays}d`
            }
            warn={momentum.inactiveDays >= 7}
          />
        </div>
      </div>

      {/* Stall warning */}
      {(momentum.state === "STALLED" || momentum.state === "ABANDONED") && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 rounded-lg bg-[--color-warning]/10 border border-[--color-warning]/20 px-3 py-2.5"
        >
          <AlertTriangle className="h-3.5 w-3.5 text-[--color-warning] shrink-0 mt-0.5" />
          <p className="text-[11px] text-[--color-warning]">
            {momentum.state === "ABANDONED"
              ? `No activity for ${momentum.inactiveDays} days. Consider archiving or restarting.`
              : `No completions in ${momentum.inactiveDays} days. Pick up a task to restore momentum.`}
          </p>
        </motion.div>
      )}
    </div>
  );
}

function MetricCell({
  label,
  value,
  warn = false,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-[--color-text-muted] uppercase tracking-wide">{label}</span>
      <span
        className={cn(
          "text-[12px] font-semibold tabular-nums",
          warn ? "text-[--color-warning]" : "text-[--color-text-secondary]"
        )}
      >
        {value}
      </span>
    </div>
  );
}
