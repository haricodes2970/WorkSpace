"use client";

import Link from "next/link";
import { BookOpenText, ChevronRight } from "lucide-react";
import type { StrategicReviewRecord } from "../types";

interface ReviewListProps {
  reviews: StrategicReviewRecord[];
}

const TYPE_LABELS: Record<string, string> = {
  MONTHLY:          "Monthly",
  QUARTERLY:        "Quarterly",
  ANNUAL:           "Annual",
  PORTFOLIO:        "Portfolio",
  EXECUTION_HEALTH: "Health Check",
  IDEA_CEMETERY:    "Idea Audit",
};

const TYPE_COLORS: Record<string, string> = {
  MONTHLY:          "text-blue-400 bg-blue-400/10",
  QUARTERLY:        "text-violet-400 bg-violet-400/10",
  ANNUAL:           "text-emerald-400 bg-emerald-400/10",
  PORTFOLIO:        "text-yellow-400 bg-yellow-400/10",
  EXECUTION_HEALTH: "text-orange-400 bg-orange-400/10",
  IDEA_CEMETERY:    "text-red-400 bg-red-400/10",
};

export function ReviewList({ reviews }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-8 text-center">
        <BookOpenText className="h-8 w-8 text-white/20 mx-auto mb-3" />
        <p className="text-sm text-white/40">No strategic reviews yet.</p>
        <p className="text-xs text-white/25 mt-1">
          Monthly, quarterly, and annual reviews help you see the long arc of your execution.
        </p>
      </div>
    );
  }

  const byType = new Map<string, StrategicReviewRecord[]>();
  for (const r of reviews) {
    const list = byType.get(r.type) ?? [];
    list.push(r);
    byType.set(r.type, list);
  }

  return (
    <div className="space-y-6">
      {[...byType.entries()].map(([type, list]) => (
        <div key={type} className="space-y-2">
          <p className="text-xs text-white/30 uppercase tracking-wide font-medium flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs ${TYPE_COLORS[type] ?? "text-white/40 bg-white/10"}`}>
              {TYPE_LABELS[type] ?? type}
            </span>
            {list.length} review{list.length !== 1 ? "s" : ""}
          </p>
          <div className="space-y-1.5">
            {list.map((r) => (
              <Link
                key={r.id}
                href={`/reviews/${r.id}`}
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 hover:bg-white/8 hover:border-white/20 transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">{r.period}</p>
                  {r.wins && (
                    <p className="text-xs text-white/40 truncate mt-0.5">
                      {r.wins.split("\n")[0]}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-white/25">
                    {r.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-white/20 group-hover:text-white/50 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
