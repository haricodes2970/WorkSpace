"use client";

import { ChevronDown, ChevronRight, Scissors } from "lucide-react";
import { useState } from "react";
import type { CompressionResult } from "../types";

interface CompressionSuggestionsProps {
  results: CompressionResult[];
}

const actionLabels: Record<string, string> = {
  MOVE_TO_V1:        "Move to V1",
  MOVE_TO_LATER:     "Defer to Later",
  CONSOLIDATE:       "Consolidate",
  CUT_EXPERIMENTAL:  "Cut experimental",
};

const impactColors: Record<string, string> = {
  HIGH:   "text-red-400 bg-red-400/10",
  MEDIUM: "text-yellow-400 bg-yellow-400/10",
  LOW:    "text-white/40 bg-white/5",
};

export function CompressionSuggestions({ results }: CompressionSuggestionsProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (results.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-center">
        <Scissors className="h-8 w-8 text-white/20 mx-auto mb-2" />
        <p className="text-sm text-white/40">No compression opportunities detected.</p>
        <p className="text-xs text-white/25 mt-1">Scope looks clean across projects.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {results.map((r) => (
        <div key={r.projectId} className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === r.projectId ? null : r.projectId)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{r.projectTitle}</p>
              <p className="text-xs text-white/40 mt-0.5">
                MVP: {r.currentMvpSize} items → target {r.targetMvpSize}
                {" · "}{r.suggestions.length} suggestion{r.suggestions.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              {r.compressionScore >= 70 && (
                <span className="text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">Critical</span>
              )}
              {expanded === r.projectId
                ? <ChevronDown className="h-4 w-4 text-white/40" />
                : <ChevronRight className="h-4 w-4 text-white/40" />
              }
            </div>
          </button>

          {expanded === r.projectId && (
            <div className="border-t border-white/10 divide-y divide-white/5">
              {r.suggestions.map((s, i) => (
                <div key={i} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-white">{s.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${impactColors[s.estimatedImpact]}`}>
                      {s.estimatedImpact}
                    </span>
                  </div>
                  <p className="text-xs text-white/50">{s.rationale}</p>
                  {s.items.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {s.items.map((item, j) => (
                        <span key={j} className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="pt-1">
                    <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded">
                      {actionLabels[s.action] ?? s.action}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
