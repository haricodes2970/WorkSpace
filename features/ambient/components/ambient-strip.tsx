"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Brain, Lightbulb, AlertCircle, ChevronRight } from "lucide-react";
import { getAmbientSurfaceAction } from "@/features/ambient/actions/ambient-actions";
import type { AmbientSurface } from "@/features/ambient/ambient.service";

export function AmbientStrip() {
  const [surface, setSurface] = useState<AmbientSurface | null>(null);

  useEffect(() => {
    getAmbientSurfaceAction().then(setSurface).catch(console.error);
  }, []);

  if (!surface) return null;
  if (surface.resurface.length === 0 && surface.nudges.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Sparkles className="h-3 w-3 text-[--color-primary]" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[--color-text-muted]">
          Ambient
        </span>
      </div>

      {surface.resurface.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className="group block rounded-lg border border-[--color-border] bg-[--color-card] p-3 transition-colors hover:border-[--color-primary]/30 hover:bg-[--color-primary-subtle]"
        >
          <div className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0 text-[--color-text-muted]">
              {item.kind === "memory"
                ? <Brain      className="h-3.5 w-3.5 text-[--color-primary]" />
                : <Lightbulb  className="h-3.5 w-3.5 text-[--color-warning]" />}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-[--color-text-primary] truncate">
                {item.title}
              </p>
              {item.body && (
                <p className="text-[11px] text-[--color-text-muted] line-clamp-2 mt-0.5">
                  {item.body}
                </p>
              )}
              <p className="text-[10px] text-[--color-text-muted] mt-1 italic">
                {item.reason}
              </p>
            </div>
            <ChevronRight className="h-3 w-3 shrink-0 mt-0.5 text-[--color-text-muted] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </Link>
      ))}

      {surface.nudges.map((nudge) => (
        <Link
          key={nudge.id}
          href={nudge.href}
          className="group flex items-center gap-2.5 rounded-lg border border-[--color-warning]/20 bg-[--color-warning]/5 px-3 py-2 transition-colors hover:border-[--color-warning]/40"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-[--color-warning]" />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-[--color-text-primary] truncate">
              {nudge.title}
            </p>
            <p className="text-[11px] text-[--color-text-muted]">{nudge.message}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
