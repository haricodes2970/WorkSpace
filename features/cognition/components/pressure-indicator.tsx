"use client";

import { useEffect, useState } from "react";
import { Brain, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCognitionLoadAction } from "@/features/cognition/actions/cognition-actions";
import type { CognitionResult, PressureLevel } from "@/features/cognition/cognition.service";

const LEVEL_STYLES: Record<PressureLevel, string> = {
  calm:       "text-[--color-success] bg-[--color-success]/10 border-[--color-success]/20",
  moderate:   "text-[--color-text-muted] bg-[--color-card] border-[--color-border]",
  high:       "text-[--color-warning] bg-[--color-warning]/10 border-[--color-warning]/20",
  overloaded: "text-[--color-error] bg-[--color-error]/10 border-[--color-error]/20",
};

const LEVEL_LABEL: Record<PressureLevel, string> = {
  calm:       "Calm",
  moderate:   "Moderate",
  high:       "High load",
  overloaded: "Overloaded",
};

interface PressureIndicatorProps {
  compact?:   boolean;
  className?: string;
}

export function PressureIndicator({ compact = false, className }: PressureIndicatorProps) {
  const [result, setResult] = useState<CognitionResult | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    getCognitionLoadAction().then(setResult).catch(console.error);
  }, []);

  if (!result || result.level === "calm") return null;

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
          LEVEL_STYLES[result.level]
        )}
      >
        <Brain className="h-3 w-3 shrink-0" />
        {!compact && <span>{LEVEL_LABEL[result.level]}</span>}
        <span className="font-mono">{result.score}</span>
      </button>

      {expanded && (
        <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-xl border border-[--color-border] bg-[--color-panel] p-3 shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[--color-text-muted]">
              Cognitive Load
            </p>
            <button onClick={() => setExpanded(false)} className="text-[--color-text-muted] hover:text-[--color-text-primary]">
              <X className="h-3 w-3" />
            </button>
          </div>

          {/* Score bar */}
          <div className="mb-3">
            <div className="h-1.5 w-full rounded-full bg-[--color-card] overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", {
                  "bg-[--color-success]": result.level === "calm",
                  "bg-[--color-text-muted]": result.level === "moderate",
                  "bg-[--color-warning]": result.level === "high",
                  "bg-[--color-error]":  result.level === "overloaded",
                })}
                style={{ width: `${result.score}%` }}
              />
            </div>
          </div>

          {/* Factors */}
          {result.factors.length > 0 && (
            <div className="space-y-1 mb-3">
              {result.factors.map((f) => (
                <div key={f.label} className="flex items-start justify-between gap-2">
                  <span className="text-[11px] text-[--color-text-secondary] flex-1">{f.label}</span>
                  <span className="text-[10px] text-[--color-text-muted] shrink-0">{f.detail}</span>
                </div>
              ))}
            </div>
          )}

          {/* Top suggestion */}
          {result.suggestions[0] && (
            <p className="text-[11px] text-[--color-text-muted] border-t border-[--color-border-subtle] pt-2 leading-relaxed">
              {result.suggestions[0].message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
