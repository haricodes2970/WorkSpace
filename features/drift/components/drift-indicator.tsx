"use client";

import { useEffect, useState } from "react";
import { Compass, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStrategicDriftAction } from "@/features/drift/actions/drift-actions";
import type { DriftResult, DriftLevel } from "@/features/drift/drift.service";

const LEVEL_STYLES: Record<DriftLevel, string> = {
  "aligned":            "text-[--color-success] bg-[--color-success]/10 border-[--color-success]/20",
  "minor-drift":        "text-[--color-text-muted] bg-[--color-card] border-[--color-border]",
  "moderate-drift":     "text-[--color-warning] bg-[--color-warning]/10 border-[--color-warning]/20",
  "significant-drift":  "text-[--color-error] bg-[--color-error]/10 border-[--color-error]/20",
};

const LEVEL_LABEL: Record<DriftLevel, string> = {
  "aligned":           "Aligned",
  "minor-drift":       "Minor drift",
  "moderate-drift":    "Drifting",
  "significant-drift": "Drifting",
};

interface DriftIndicatorProps {
  compact?:   boolean;
  className?: string;
}

export function DriftIndicator({ compact = false, className }: DriftIndicatorProps) {
  const [result, setResult]     = useState<DriftResult | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    getStrategicDriftAction().then(setResult).catch(console.error);
  }, []);

  if (!result || result.driftLevel === "aligned") return null;

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
          LEVEL_STYLES[result.driftLevel]
        )}
      >
        <Compass className="h-3 w-3 shrink-0" />
        {!compact && <span>{LEVEL_LABEL[result.driftLevel]}</span>}
      </button>

      {expanded && (
        <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-xl border border-[--color-border] bg-[--color-panel] p-3 shadow-2xl space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[--color-text-muted]">
              Strategic Alignment
            </p>
            <button onClick={() => setExpanded(false)} className="text-[--color-text-muted] hover:text-[--color-text-primary]">
              <X className="h-3 w-3" />
            </button>
          </div>

          <p className="text-[12px] text-[--color-text-secondary] leading-relaxed">
            {result.summary}
          </p>

          {result.overFocusAreas.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-[--color-warning] uppercase tracking-wider mb-1">
                Over-focused
              </p>
              {result.overFocusAreas.map((o) => (
                <p key={o.projectId} className="text-[11px] text-[--color-text-secondary]">
                  {o.title} — {o.reason}
                </p>
              ))}
            </div>
          )}

          {result.neglectedAreas.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-[--color-text-muted] uppercase tracking-wider mb-1">
                Neglected
              </p>
              {result.neglectedAreas.slice(0, 3).map((n) => (
                <p key={n.projectId} className="text-[11px] text-[--color-text-secondary]">
                  {n.title} — {n.daysSince}d inactive
                </p>
              ))}
            </div>
          )}

          {result.abandonedPriorities.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-[--color-text-muted] uppercase tracking-wider mb-1">
                Sitting idle
              </p>
              {result.abandonedPriorities.slice(0, 3).map((a) => (
                <p key={a.id} className="text-[11px] text-[--color-text-secondary]">
                  {a.title}{a.score ? ` (score ${a.score})` : ""}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
