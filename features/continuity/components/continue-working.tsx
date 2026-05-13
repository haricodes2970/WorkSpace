"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, FolderKanban } from "lucide-react";
import { ExecutionState } from "@prisma/client";
import { getLastActiveProjectAction } from "@/features/continuity/actions/continuity-actions";

interface Project {
  id:             string;
  title:          string;
  executionState: ExecutionState;
  momentumScore:  number;
}

const MOMENTUM_LABEL: Record<string, string> = {
  HIGH:    "high momentum",
  MEDIUM:  "building",
  LOW:     "needs attention",
  BLOCKED: "blocked",
};

export function ContinueWorking() {
  const [project, setProject] = useState<Project | null | undefined>(undefined);

  useEffect(() => {
    getLastActiveProjectAction()
      .then((p) => setProject(p ? { id: p.id, title: p.title, executionState: p.executionState, momentumScore: p.momentumScore } : null))
      .catch(() => setProject(null));
  }, []);

  if (project === undefined || project === null) return null;

  const momentumLabel = project.momentumScore > 0
    ? (MOMENTUM_LABEL[project.executionState] ?? project.executionState.toLowerCase())
    : null;

  return (
    <Link
      href={`/projects/${project.id}` as never}
      className="group flex items-center gap-3 rounded-lg border border-[--color-border] bg-[--color-card] px-3 py-2.5 transition-colors hover:border-[--color-primary]/40 hover:bg-[--color-primary-subtle]"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[--color-primary]/10">
        <FolderKanban className="h-3.5 w-3.5 text-[--color-primary]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-[--color-text-primary] truncate">
          {project.title}
        </p>
        {momentumLabel && (
          <p className="text-[11px] text-[--color-text-muted]">{momentumLabel}</p>
        )}
      </div>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[--color-text-muted] transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
