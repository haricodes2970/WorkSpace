"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, FolderKanban } from "lucide-react";
import { getLastActiveProjectAction } from "@/features/continuity/actions/continuity-actions";

interface Project {
  id:       string;
  title:    string;
  phase:    string | null;
  momentum: string | null;
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
      .then(setProject)
      .catch(() => setProject(null));
  }, []);

  if (project === undefined || project === null) return null;

  const momentumLabel = project.momentum
    ? (MOMENTUM_LABEL[project.momentum] ?? project.momentum.toLowerCase())
    : null;

  return (
    <Link
      href={`/projects/${project.id}`}
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
