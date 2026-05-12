"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAttentionProfileAction } from "@/features/attention/actions/attention-actions";
import type { AttentionProfile } from "@/features/attention/attention.service";

function Bar({ value, max, className }: { value: number; max: number; className?: string }) {
  const pct = Math.min(100, max > 0 ? Math.round((value / max) * 100) : 0);
  return (
    <div className="h-1 w-full rounded-full bg-[--color-card] overflow-hidden">
      <div
        className={cn("h-full rounded-full", className ?? "bg-[--color-primary]")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

const TREND_ICON = {
  improving: <TrendingUp   className="h-3 w-3 text-[--color-success]" />,
  stable:    <Minus        className="h-3 w-3 text-[--color-text-muted]" />,
  declining: <TrendingDown className="h-3 w-3 text-[--color-error]" />,
};

export function FocusSummary({ className }: { className?: string }) {
  const [profile, setProfile] = useState<AttentionProfile | null>(null);

  useEffect(() => {
    getAttentionProfileAction().then(setProfile).catch(console.error);
  }, []);

  if (!profile || !profile.weeklyData.length) return null;

  const maxMinutes = Math.max(...profile.weeklyData.map((w) => w.deepWorkMinutes), 1);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-1.5">
        <Zap className="h-3 w-3 text-[--color-primary]" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[--color-text-muted]">
          Focus Pattern
        </span>
        <span className="ml-auto flex items-center gap-1">
          {TREND_ICON[profile.trend]}
          <span className="text-[10px] text-[--color-text-muted] capitalize">{profile.trend}</span>
        </span>
      </div>

      {/* Weekly heatmap bars */}
      <div className="space-y-1">
        {profile.weeklyData.slice(0, 6).reverse().map((w) => (
          <div key={w.period} className="flex items-center gap-2">
            <span className="w-12 shrink-0 text-[10px] font-mono text-[--color-text-muted]">
              {w.period.replace(/^\d{4}-/, "")}
            </span>
            <Bar
              value={w.deepWorkMinutes}
              max={maxMinutes}
              className={w.deepWorkMinutes > 60 ? "bg-[--color-primary]" : "bg-[--color-text-muted]/30"}
            />
            <span className="w-10 text-right shrink-0 text-[10px] font-mono text-[--color-text-muted]">
              {w.deepWorkMinutes}m
            </span>
          </div>
        ))}
      </div>

      {/* Metrics */}
      <div className="flex gap-4">
        <div>
          <p className="text-[10px] text-[--color-text-muted]">Avg/week</p>
          <p className="text-[13px] font-semibold text-[--color-text-primary] tabular-nums">
            {profile.avgDeepWorkPerWeek}m
          </p>
        </div>
        <div>
          <p className="text-[10px] text-[--color-text-muted]">Consistency</p>
          <p className="text-[13px] font-semibold text-[--color-text-primary] tabular-nums">
            {profile.consistencyScore}%
          </p>
        </div>
      </div>
    </div>
  );
}
