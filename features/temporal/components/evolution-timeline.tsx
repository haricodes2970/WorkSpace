"use client";

import { useEffect, useState } from "react";
import { Clock, TrendingUp, Flame, Compass, Coffee, Lightbulb, BookOpenText } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTemporalIntelligenceAction } from "@/features/temporal/actions/temporal-actions";
import type { TemporalIntelligence, ExecutionSeason } from "@/features/temporal/temporal.service";
import type { SeasonKind } from "@/features/temporal/execution-seasons";

const SEASON_CONFIG: Record<SeasonKind, {
  icon:  React.ReactNode;
  cls:   string;
  dot:   string;
}> = {
  sprint:      { icon: <Flame   className="h-3 w-3" />, cls: "text-[--color-success]",   dot: "bg-[--color-success]" },
  exploration: { icon: <Lightbulb className="h-3 w-3" />, cls: "text-[--color-warning]",  dot: "bg-[--color-warning]" },
  recovery:    { icon: <Coffee  className="h-3 w-3" />, cls: "text-[--color-text-muted]", dot: "bg-[--color-text-muted]/40" },
  building:    { icon: <TrendingUp className="h-3 w-3" />, cls: "text-[--color-primary]", dot: "bg-[--color-primary]" },
  reflection:  { icon: <BookOpenText className="h-3 w-3" />, cls: "text-[--color-accent]", dot: "bg-[--color-accent]" },
};

function SeasonDot({ season }: { season: ExecutionSeason & { runLength?: number } }) {
  const cfg = SEASON_CONFIG[season.kind];
  return (
    <div className="flex flex-col items-center gap-1" title={`${season.label}: ${season.description}`}>
      <div className={cn("h-2.5 w-2.5 rounded-full", cfg.dot)} />
      {season.runLength && season.runLength > 1 && (
        <span className="text-[9px] font-mono text-[--color-text-muted]">×{season.runLength}</span>
      )}
    </div>
  );
}

export function EvolutionTimeline({ className }: { className?: string }) {
  const [intel, setIntel] = useState<TemporalIntelligence | null>(null);

  useEffect(() => {
    getTemporalIntelligenceAction().then(setIntel).catch(console.error);
  }, []);

  if (!intel) return null;

  const { yearStats, narrative, seasons } = intel;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-1.5">
        <Clock className="h-3 w-3 text-[--color-text-muted]" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[--color-text-muted]">
          {yearStats.year} Evolution
        </span>
      </div>

      {/* Year stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Shipped",  value: yearStats.shippedProjects },
          { label: "Ideas",    value: yearStats.capturedIdeas  },
          { label: "Reviews",  value: yearStats.strategicReviews },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-[--color-border] bg-[--color-card] px-2 py-2 text-center">
            <p className="text-[14px] font-bold tabular-nums text-[--color-text-primary]">{s.value}</p>
            <p className="text-[10px] text-[--color-text-muted]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Season timeline */}
      {seasons.length > 0 && (
        <div>
          <p className="text-[10px] text-[--color-text-muted] mb-2">Season history</p>
          <div className="flex items-end gap-1.5 overflow-x-auto pb-1">
            {seasons.slice(0, 12).reverse().map((s, i) => (
              <SeasonDot key={i} season={s as ExecutionSeason & { runLength?: number }} />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {(["sprint", "building", "exploration", "reflection", "recovery"] as SeasonKind[]).map((k) => (
              <span key={k} className="flex items-center gap-1 text-[10px] text-[--color-text-muted]">
                <span className={cn("h-1.5 w-1.5 rounded-full inline-block", SEASON_CONFIG[k].dot)} />
                {k}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Narrative */}
      <p className="text-[12px] text-[--color-text-secondary] italic leading-relaxed">
        {narrative}
      </p>
    </div>
  );
}
