"use client";

import { X, Timer, Focus } from "lucide-react";
import { useDeepWork } from "./deep-work-context";

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function DeepWorkOverlay() {
  const { session, isActive, exit, elapsed } = useDeepWork();
  if (!isActive || !session) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
      <div className="flex items-center gap-3 bg-black/90 border border-white/15 rounded-full px-4 py-2.5 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-2 text-violet-400">
          <Focus className="h-4 w-4" />
          <span className="text-xs font-medium">Deep Work</span>
        </div>
        <div className="w-px h-4 bg-white/20" />
        <div className="min-w-0">
          <p className="text-xs text-white/80 truncate max-w-[180px]">{session.focus}</p>
          <p className="text-xs text-white/30 truncate max-w-[180px]">{session.projectTitle}</p>
        </div>
        <div className="flex items-center gap-1.5 text-white/50">
          <Timer className="h-3.5 w-3.5" />
          <span className="text-xs tabular-nums">{formatElapsed(elapsed)}</span>
        </div>
        <div className="w-px h-4 bg-white/20" />
        <button
          onClick={exit}
          className="text-white/40 hover:text-white/80 transition-colors"
          title="End deep work session"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
