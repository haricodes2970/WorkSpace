"use client";

import { BookOpen, TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";
import type { ExecutionNarrative, NarrativeChapter } from "../types";

interface NarrativePanelProps {
  narrative: ExecutionNarrative;
}

const trajectoryConfig = {
  ascending:  { icon: <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />,  label: "Building momentum",  color: "text-emerald-400" },
  descending: { icon: <TrendingDown className="h-3.5 w-3.5 text-red-400" />,    label: "Declining",          color: "text-red-400" },
  plateauing: { icon: <Minus className="h-3.5 w-3.5 text-white/40" />,          label: "Plateauing",         color: "text-white/40" },
  recovering: { icon: <RefreshCw className="h-3.5 w-3.5 text-blue-400" />,      label: "Recovering",         color: "text-blue-400" },
};

const sentimentStyles: Record<NarrativeChapter["sentiment"], string> = {
  positive: "border-l-emerald-500/50 bg-emerald-500/5",
  neutral:  "border-l-white/20 bg-white/5",
  negative: "border-l-red-500/50 bg-red-500/5",
  pivotal:  "border-l-yellow-500/50 bg-yellow-500/5",
};

export function NarrativePanel({ narrative }: NarrativePanelProps) {
  const traj = trajectoryConfig[narrative.trajectory];

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="flex items-start gap-2">
          <BookOpen className="h-4 w-4 text-violet-400 mt-0.5 shrink-0" />
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium text-white">{narrative.projectTitle}</p>
            <p className="text-sm text-white/70 leading-relaxed">{narrative.summary}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1 border-t border-white/10">
          <div className="flex items-center gap-1.5">
            {traj.icon}
            <span className={`text-xs ${traj.color}`}>{traj.label}</span>
          </div>
          <span className="text-white/20">·</span>
          <span className="text-xs text-white/40">{narrative.currentChapter}</span>
        </div>
      </div>

      {/* Key moments */}
      {narrative.keyMoments.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {narrative.keyMoments.map((m, i) => (
            <span key={i} className="text-xs text-white/50 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
              {m}
            </span>
          ))}
        </div>
      )}

      {/* Chapters */}
      <div className="space-y-2">
        <p className="text-xs text-white/30 uppercase tracking-wide font-medium">Story</p>
        {narrative.chapters.map((ch, i) => (
          <div
            key={i}
            className={`border-l-2 pl-3 py-2 rounded-r-lg ${sentimentStyles[ch.sentiment]}`}
          >
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <p className="text-xs font-medium text-white/80">{ch.title}</p>
              <span className="text-xs text-white/30 shrink-0">{ch.timeframe}</span>
            </div>
            <p className="text-xs text-white/50 leading-relaxed">{ch.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
