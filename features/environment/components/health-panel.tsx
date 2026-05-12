"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, Archive, X as CloseIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getEnvironmentHealthAction } from "@/features/environment/actions/environment-actions";
import type { EnvironmentHealth } from "@/features/environment/environment.service";

const DIM_BAR_CLS = (score: number) =>
  score >= 80 ? "bg-[--color-success]" :
  score >= 60 ? "bg-[--color-text-muted]" :
  score >= 40 ? "bg-[--color-warning]" :
  "bg-[--color-error]";

export function HealthPanel({ onClose }: { onClose?: () => void }) {
  const [health, setHealth]   = useState<EnvironmentHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEnvironmentHealthAction()
      .then(setHealth)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[--color-primary]" />
          <h2 className="text-[14px] font-semibold text-[--color-text-primary]">
            Environment Health
          </h2>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-[--color-text-muted] hover:text-[--color-text-primary]">
            <CloseIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {loading && (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-6 rounded bg-[--color-card]" />)}
        </div>
      )}

      {health && (
        <>
          {/* Score */}
          <div className="flex items-end gap-3">
            <span className={cn(
              "text-3xl font-bold tabular-nums",
              health.grade === "A" && "text-[--color-success]",
              health.grade === "B" && "text-[--color-text-secondary]",
              health.grade === "C" && "text-[--color-warning]",
              health.grade === "D" && "text-[--color-error]",
            )}>
              {health.score}
            </span>
            <span className="text-[13px] text-[--color-text-muted] mb-1">/ 100 · Grade {health.grade}</span>
          </div>

          {/* Dimensions */}
          <div className="space-y-2">
            {health.dimensions.map((d) => (
              <div key={d.label}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[12px] text-[--color-text-secondary]">{d.label}</span>
                  <span className="text-[11px] font-mono text-[--color-text-muted]">{d.score}</span>
                </div>
                <div className="h-1 w-full rounded-full bg-[--color-card] overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", DIM_BAR_CLS(d.score))}
                    style={{ width: `${d.score}%` }}
                  />
                </div>
                <p className="text-[10px] text-[--color-text-muted] mt-0.5">{d.detail}</p>
              </div>
            ))}
          </div>

          {/* Cleanup items */}
          {health.cleanupItems.length > 0 && (
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[--color-text-muted]">
                Cleanup
              </p>
              {health.cleanupItems.map((item, i) => (
                <Link
                  key={i}
                  href={item.href}
                  className="flex items-center gap-2 rounded-lg border border-[--color-border] bg-[--color-card] px-3 py-2 text-[12px] text-[--color-text-secondary] hover:text-[--color-text-primary] transition-colors"
                >
                  <span className="flex-1">{item.message}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Archive suggestions */}
          {health.archiveSuggestions.length > 0 && (
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[--color-text-muted]">
                Archive
              </p>
              {health.archiveSuggestions.map((s, i) => (
                <Link
                  key={i}
                  href={s.href}
                  className="flex items-center gap-2 rounded-lg border border-[--color-border] bg-[--color-card] px-3 py-2 text-[12px] text-[--color-text-secondary] hover:text-[--color-text-primary] transition-colors"
                >
                  <Archive className="h-3.5 w-3.5 shrink-0 text-[--color-text-muted]" />
                  <span className="flex-1">{s.message}</span>
                </Link>
              ))}
            </div>
          )}

          {health.grade === "A" && (
            <p className="text-[12px] text-[--color-success] text-center py-2">
              Environment is clean and well-organized.
            </p>
          )}
        </>
      )}
    </div>
  );
}
