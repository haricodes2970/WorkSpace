"use client";

import { AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TodayInsight } from "../today.service";

const SEVERITY_CONFIG = {
  CRITICAL: {
    bg:     "bg-[--color-danger-subtle] border-[--color-danger]/30",
    icon:   <AlertTriangle className="h-3.5 w-3.5 text-[--color-danger] shrink-0 mt-0.5" />,
    label:  "text-[--color-danger]",
  },
  WARNING: {
    bg:     "bg-[--color-warning-subtle] border-[--color-warning]/30",
    icon:   <AlertTriangle className="h-3.5 w-3.5 text-[--color-warning] shrink-0 mt-0.5" />,
    label:  "text-[--color-warning]",
  },
  INFO: {
    bg:     "bg-[--color-card] border-[--color-border]",
    icon:   <Info className="h-3.5 w-3.5 text-[--color-text-muted] shrink-0 mt-0.5" />,
    label:  "text-[--color-text-secondary]",
  },
} as const;

interface InsightBannerProps {
  insights: TodayInsight[];
  onDismiss: (id: string) => void;
}

export function InsightBanner({ insights, onDismiss }: InsightBannerProps) {
  if (insights.length === 0) return null;

  return (
    <ul className="flex flex-col gap-2">
      {insights.map((insight) => {
        const cfg = SEVERITY_CONFIG[insight.severity];
        return (
          <li
            key={insight.id}
            className={cn(
              "flex items-start gap-2.5 rounded-lg border px-3 py-2.5",
              cfg.bg
            )}
          >
            {cfg.icon}
            <div className="flex-1 min-w-0">
              <p className={cn("text-[12px] font-medium", cfg.label)}>
                {insight.title}
              </p>
              <p className="text-[11px] text-[--color-text-muted] mt-0.5 line-clamp-2">
                {insight.body}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(insight.id)}
              className="shrink-0 text-[--color-text-muted] hover:text-[--color-text-secondary] text-[11px] mt-0.5 transition-colors"
              aria-label="Dismiss insight"
            >
              ✕
            </button>
          </li>
        );
      })}
    </ul>
  );
}
