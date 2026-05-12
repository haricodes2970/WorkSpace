"use client";

import Link from "next/link";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActiveBuild } from "../today.service";

function MomentumBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const color =
    pct >= 70 ? "bg-[--color-success]" :
    pct >= 40 ? "bg-[--color-warning]" :
    "bg-[--color-danger]";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full bg-[--color-border]">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn(
        "text-[11px] font-mono tabular-nums w-7 text-right",
        pct >= 70 ? "text-[--color-success]" :
        pct >= 40 ? "text-[--color-warning]" :
        "text-[--color-danger]"
      )}>
        {Math.round(pct)}
      </span>
    </div>
  );
}

interface BuildCardProps {
  build: ActiveBuild;
}

export function BuildCard({ build }: BuildCardProps) {
  const taskPct = build.tasksTotal > 0
    ? Math.round((build.tasksDone / build.tasksTotal) * 100)
    : 0;

  return (
    <Link href={`/projects/${build.id}` as `/projects/${string}`}>
      <div className="group flex items-center gap-3 rounded-lg border border-[--color-border] bg-[--color-card] px-4 py-3 hover:border-[--color-border-strong] hover:bg-[--color-card-hover] transition-all duration-150 cursor-pointer">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-[13px] font-medium text-[--color-text-primary] truncate">
              {build.title}
            </p>
            {build.activeBlockers > 0 && (
              <span className="shrink-0 flex items-center gap-1 text-[11px] text-[--color-danger] bg-[--color-danger-subtle] rounded-full px-2 py-0.5">
                <AlertTriangle className="h-3 w-3" />
                {build.activeBlockers}
              </span>
            )}
          </div>
          <MomentumBar score={build.momentumScore} />
          <div className="mt-1.5 flex items-center gap-3">
            <span className="text-[11px] text-[--color-text-muted]">
              {build.tasksDone}/{build.tasksTotal} tasks
            </span>
            {taskPct > 0 && (
              <span className="text-[11px] text-[--color-text-muted]">{taskPct}% done</span>
            )}
          </div>
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-[--color-text-muted] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </div>
    </Link>
  );
}
