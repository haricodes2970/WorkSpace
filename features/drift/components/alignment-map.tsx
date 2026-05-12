"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { getStrategicDriftAction } from "@/features/drift/actions/drift-actions";
import type { DriftResult } from "@/features/drift/drift.service";

export function AlignmentMap({ className }: { className?: string }) {
  const [result, setResult] = useState<DriftResult | null>(null);

  useEffect(() => {
    getStrategicDriftAction().then(setResult).catch(console.error);
  }, []);

  if (!result || !result.allocationMap.length) return null;

  return (
    <div className={className}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[--color-text-muted] mb-2">
        Execution Allocation
      </p>
      <div className="space-y-1.5">
        {result.allocationMap.slice(0, 6).map((item) => (
          <div key={item.projectId} className="flex items-center gap-2">
            <Link
              href={`/projects/${item.projectId}`}
              className="flex-1 min-w-0 text-[12px] text-[--color-text-secondary] hover:text-[--color-text-primary] truncate"
            >
              {item.title}
            </Link>
            <div className="w-24 h-1.5 rounded-full bg-[--color-card] overflow-hidden shrink-0">
              <div
                className="h-full rounded-full bg-[--color-primary]"
                style={{ width: `${item.pct}%` }}
              />
            </div>
            <span className="w-8 text-right shrink-0 text-[10px] font-mono text-[--color-text-muted]">
              {item.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
