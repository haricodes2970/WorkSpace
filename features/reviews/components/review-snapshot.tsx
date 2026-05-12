"use client";

import { TrendingUp, Package, CheckSquare, BookOpen, Brain, Target } from "lucide-react";
import type { ReviewSnapshot } from "../types";

interface ReviewSnapshotProps {
  snapshot: ReviewSnapshot;
}

function Stat({ icon, label, value, sub }: {
  icon:   React.ReactNode;
  label:  string;
  value:  string | number;
  sub?:   string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-1">
      <div className="flex items-center gap-1.5 text-white/40">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-lg font-semibold text-white tabular-nums">{value}</p>
      {sub && <p className="text-xs text-white/30">{sub}</p>}
    </div>
  );
}

export function ReviewSnapshot({ snapshot }: ReviewSnapshotProps) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-white/30 uppercase tracking-wide font-medium">Period Stats</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <Stat
          icon={<Package className="h-3.5 w-3.5" />}
          label="Projects active"
          value={snapshot.projectsActive}
          sub={snapshot.projectsShipped > 0 ? `${snapshot.projectsShipped} shipped` : undefined}
        />
        <Stat
          icon={<CheckSquare className="h-3.5 w-3.5" />}
          label="Tasks completed"
          value={snapshot.tasksCompleted}
        />
        <Stat
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          label="Avg momentum"
          value={`${snapshot.avgMomentumScore}`}
          sub="out of 100"
        />
        <Stat
          icon={<Target className="h-3.5 w-3.5" />}
          label="Ideas created"
          value={snapshot.ideasCreated}
          sub={snapshot.ideasConverted > 0 ? `${snapshot.ideasConverted} converted` : undefined}
        />
        <Stat
          icon={<BookOpen className="h-3.5 w-3.5" />}
          label="Weekly reviews"
          value={snapshot.weeklyReviews}
        />
        <Stat
          icon={<Brain className="h-3.5 w-3.5" />}
          label="Memories captured"
          value={snapshot.memoriesCapured}
        />
      </div>

      {snapshot.shippedProjects.length > 0 && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-1">
          <p className="text-xs font-medium text-emerald-400">Shipped this period</p>
          {snapshot.shippedProjects.map((p) => (
            <p key={p.id} className="text-sm text-white/70">
              {p.title}
              <span className="text-xs text-white/30 ml-2">
                {new Date(p.shippedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </p>
          ))}
        </div>
      )}

      {snapshot.stalledProjects.length > 0 && (
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3 space-y-1">
          <p className="text-xs font-medium text-yellow-400">Stalled projects</p>
          {snapshot.stalledProjects.map((p) => (
            <p key={p.id} className="text-sm text-white/70">{p.title}</p>
          ))}
        </div>
      )}
    </div>
  );
}
