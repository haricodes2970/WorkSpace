"use client";

import { AlertCircle, Lightbulb, HelpCircle } from "lucide-react";
import type { ThinkingAssistResult } from "../types";

interface ThinkingHintsProps {
  result: ThinkingAssistResult;
}

const severityConfig = {
  warning:    { icon: <AlertCircle className="h-3.5 w-3.5" />, color: "text-red-400",    bg: "bg-red-400/10 border-red-400/20" },
  suggestion: { icon: <Lightbulb className="h-3.5 w-3.5" />,  color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" },
  hint:       { icon: <HelpCircle className="h-3.5 w-3.5" />, color: "text-white/50",   bg: "bg-white/5 border-white/10" },
};

export function ThinkingHints({ result }: ThinkingHintsProps) {
  if (result.gaps.length === 0) {
    return (
      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
        <p className="text-sm text-emerald-400">Thinking blocks complete</p>
        <p className="text-xs text-white/40 mt-1">{result.readiness}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Clarity bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-white/40">
          <span>Thinking clarity</span>
          <span>{result.clarity}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              result.clarity >= 80 ? "bg-emerald-500"
              : result.clarity >= 60 ? "bg-yellow-500"
              : result.clarity >= 40 ? "bg-orange-500"
              : "bg-red-500"
            }`}
            style={{ width: `${result.clarity}%` }}
          />
        </div>
        <p className="text-xs text-white/30">{result.readiness}</p>
      </div>

      {/* Gaps */}
      <div className="space-y-2">
        {result.gaps.map((gap, i) => {
          const cfg = severityConfig[gap.severity];
          return (
            <div key={i} className={`rounded-lg border p-3 space-y-1 ${cfg.bg}`}>
              <div className={`flex items-center gap-1.5 ${cfg.color}`}>
                {cfg.icon}
                <span className="text-xs font-medium">{gap.label}</span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">{gap.prompt}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
