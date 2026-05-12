"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { getEnvironmentHealthAction } from "@/features/environment/actions/environment-actions";
import type { EnvironmentHealth, HealthGrade } from "@/features/environment/environment.service";

const GRADE_STYLES: Record<HealthGrade, string> = {
  A: "text-[--color-success] bg-[--color-success]/10 border-[--color-success]/20",
  B: "text-[--color-text-muted] bg-[--color-card] border-[--color-border]",
  C: "text-[--color-warning] bg-[--color-warning]/10 border-[--color-warning]/20",
  D: "text-[--color-error] bg-[--color-error]/10 border-[--color-error]/20",
};

export function HealthBadge({ className }: { className?: string }) {
  const [health, setHealth] = useState<EnvironmentHealth | null>(null);

  useEffect(() => {
    getEnvironmentHealthAction().then(setHealth).catch(console.error);
  }, []);

  if (!health || health.grade === "A") return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
        GRADE_STYLES[health.grade],
        className
      )}
      title={`Environment health: ${health.score}/100`}
    >
      <Activity className="h-3 w-3" />
      {health.grade}
    </span>
  );
}
