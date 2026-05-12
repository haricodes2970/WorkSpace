"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import type { TodayBlocker } from "../today.service";

interface BlockerStripProps {
  blockers: TodayBlocker[];
}

export function BlockerStrip({ blockers }: BlockerStripProps) {
  if (blockers.length === 0) return null;

  return (
    <ul className="flex flex-col gap-0.5">
      {blockers.map((b) => (
        <li key={b.id}>
          <Link
            href={`/projects/${b.projectId}` as `/projects/${string}`}
            className="flex items-start gap-2.5 rounded-md px-2.5 py-2 hover:bg-[--color-card] transition-colors group"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-[--color-danger] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-[--color-text-secondary] group-hover:text-[--color-text-primary] truncate transition-colors">
                {b.title}
              </p>
              <p className="text-[11px] text-[--color-text-muted] truncate mt-0.5">
                {b.projectTitle}
                {b.daysOld > 0 && (
                  <span className="ml-1.5 opacity-70">
                    · {b.daysOld}d old
                  </span>
                )}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
