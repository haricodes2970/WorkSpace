"use client";

import Link from "next/link";
import { FolderKanban, Lightbulb, Brain, LayoutDashboard, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkingSet } from "@/features/working-set/working-set-context";
import { clusterWorkingSet, type WorkingSetCluster } from "@/features/working-set/cluster";
import type { WorkingSetEntry } from "@/lib/session-store";

const KIND_ICON: Record<string, React.ReactNode> = {
  project:   <FolderKanban  className="h-3 w-3" />,
  idea:      <Lightbulb     className="h-3 w-3" />,
  knowledge: <Brain         className="h-3 w-3" />,
  page:      <LayoutDashboard className="h-3 w-3" />,
};

function ClusterSection({ cluster }: { cluster: WorkingSetCluster }) {
  const { unpin } = useWorkingSet();

  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[--color-text-muted] px-1">
        {cluster.label}
      </p>
      {cluster.entries.map((e) => (
        <div
          key={`${e.entityKind}:${e.entityId}`}
          className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[--color-card] transition-colors"
        >
          <span className="text-[--color-text-muted] shrink-0">
            {KIND_ICON[e.entityKind] ?? <LayoutDashboard className="h-3 w-3" />}
          </span>
          <Link
            href={e.href}
            className="flex-1 min-w-0 text-[12px] text-[--color-text-secondary] truncate hover:text-[--color-text-primary]"
          >
            {e.label}
          </Link>
          <button
            onClick={() => unpin(e.entityKind, e.entityId)}
            className="shrink-0 opacity-0 group-hover:opacity-100 text-[10px] text-[--color-text-muted] hover:text-[--color-error] transition-all"
            aria-label="Unpin"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export function ClusterPanel() {
  const { entries } = useWorkingSet();
  const clusters    = clusterWorkingSet(entries);

  if (!clusters.length) return (
    <div className="px-2 py-6 text-center">
      <Layers className="h-5 w-5 text-[--color-text-muted] mx-auto mb-2" />
      <p className="text-[12px] text-[--color-text-muted]">
        Pin items to build your working set
      </p>
    </div>
  );

  return (
    <div className="space-y-3">
      {clusters.map((c) => (
        <ClusterSection key={c.id} cluster={c} />
      ))}
    </div>
  );
}
