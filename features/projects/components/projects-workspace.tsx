"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Plus, FolderKanban, ArrowRight, Clock,
  Rocket, CheckSquare, Circle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn, formatRelativeTime } from "@/lib/utils";
import { motionPresets } from "@/lib/design-tokens";
import { MomentumBadge } from "@/features/execution/momentum/momentum-badge";
import type { ProjectStatus, ExecutionState } from "@prisma/client";
import type { MomentumState } from "@/features/execution/momentum/calculator";

export interface ProjectListItem {
  id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  executionState: ExecutionState;
  momentumScore: number;
  tags: string[];
  taskTotal: number;
  taskDone: number;
  targetDate: Date | null;
  updatedAt: Date;
  linkedIdeaTitle?: string | null;
}

const STATUS_CONFIG: Record<ProjectStatus, {
  label: string;
  variant: "default" | "primary" | "accent" | "success" | "warning" | "danger" | "outline";
}> = {
  PLANNING: { label: "Planning",  variant: "default" },
  ACTIVE:   { label: "Active",    variant: "accent" },
  PAUSED:   { label: "Paused",    variant: "warning" },
  SHIPPED:  { label: "Shipped",   variant: "success" },
  ARCHIVED: { label: "Archived",  variant: "outline" },
};

const STATUS_FILTERS = ["All", "PLANNING", "ACTIVE", "PAUSED", "SHIPPED"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

interface ProjectsWorkspaceProps {
  projects: ProjectListItem[];
}

export function ProjectsWorkspace({ projects }: ProjectsWorkspaceProps) {
  const [filter, setFilter] = useState<StatusFilter>("All");

  const filtered = filter === "All"
    ? projects
    : projects.filter((p) => p.status === filter);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[--color-border-subtle] bg-[--color-panel] shrink-0">
        <h1 className="text-[15px] font-semibold text-[--color-text-primary] mr-2">Projects</h1>
        <div className="flex items-center gap-1 flex-1 overflow-x-auto">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "px-2.5 py-1 rounded-md text-[12px] font-medium whitespace-nowrap transition-colors",
                filter === s
                  ? "bg-[--color-primary-subtle] text-[--color-text-primary]"
                  : "text-[--color-text-muted] hover:text-[--color-text-secondary] hover:bg-[--color-card]"
              )}
            >
              {s === "All" ? "All" : STATUS_CONFIG[s as ProjectStatus]?.label ?? s}
            </button>
          ))}
        </div>
        <Link href="/projects/new">
          <Button size="sm" className="gap-1.5 text-[12px] h-7 shrink-0">
            <Plus className="h-3.5 w-3.5" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {filtered.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-20 text-center"
            {...motionPresets.fadeUp}
          >
            <FolderKanban className="h-10 w-10 text-[--color-text-muted] opacity-30 mb-4" />
            <p className="text-[14px] text-[--color-text-muted]">No projects yet</p>
            <p className="text-[12px] text-[--color-text-muted] mt-1">
              Convert an idea or start fresh.
            </p>
            <Link href="/projects/new">
              <Button size="sm" className="mt-4 gap-1.5 text-[12px] h-7">
                <Plus className="h-3.5 w-3.5" /> Start a project
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.2 }}
              >
                <ProjectCard project={project} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function executionStateToMomentumState(
  executionState: ExecutionState,
  momentumScore: number
): MomentumState {
  if (executionState === "PAUSED" || executionState === "ARCHIVED") return "ABANDONED";
  if (momentumScore >= 75) return "ACCELERATING";
  if (momentumScore >= 55) return "ACTIVE";
  if (momentumScore >= 35) return "STABLE";
  if (momentumScore >= 15) return "SLOWING";
  return "STALLED";
}

function ProjectCard({ project }: { project: ProjectListItem }) {
  const { label, variant } = STATUS_CONFIG[project.status];
  const progress = project.taskTotal > 0
    ? Math.round((project.taskDone / project.taskTotal) * 100)
    : 0;
  const momentumState = executionStateToMomentumState(
    project.executionState,
    project.momentumScore
  );

  return (
    <Link href={`/projects/${project.id}`}>
      <motion.div
        className="group flex flex-col gap-3 rounded-lg border border-[--color-border] bg-[--color-card] p-4 h-full cursor-pointer transition-colors hover:border-[--color-border-strong] hover:bg-[--color-card-hover]"
        whileHover={{ y: -1 }}
        transition={{ duration: 0.15 }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[13px] font-medium text-[--color-text-primary] line-clamp-2 group-hover:text-[--color-text-primary] flex-1">
            {project.title}
          </h3>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant={variant} dot className="text-[10px]">{label}</Badge>
            <MomentumBadge state={momentumState} score={project.momentumScore} size="sm" />
            <ArrowRight className="h-3.5 w-3.5 text-[--color-text-muted] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {project.description && (
          <p className="text-[12px] text-[--color-text-muted] line-clamp-2">{project.description}</p>
        )}

        {/* Progress */}
        {project.taskTotal > 0 && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[--color-text-muted] flex items-center gap-1">
                <CheckSquare className="h-3 w-3" />
                {project.taskDone}/{project.taskTotal} tasks
              </span>
              <span className="text-[11px] text-[--color-text-muted]">{progress}%</span>
            </div>
            <Progress
              value={progress}
              className="h-1"
              indicatorClassName={
                progress === 100 ? "bg-[--color-success]"
                : project.status === "SHIPPED" ? "bg-[--color-success]"
                : undefined
              }
            />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-1 border-t border-[--color-border-subtle]">
          <div className="flex flex-wrap gap-1">
            {project.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
            ))}
            {project.linkedIdeaTitle && (
              <Badge variant="default" className="text-[10px] gap-1">
                <Circle className="h-2 w-2 fill-[--color-warning] text-[--color-warning]" />
                From idea
              </Badge>
            )}
          </div>
          <span className="text-[11px] text-[--color-text-muted] flex items-center gap-1">
            {project.status === "SHIPPED" ? (
              <Rocket className="h-3 w-3 text-[--color-success]" />
            ) : (
              <Clock className="h-3 w-3" />
            )}
            {formatRelativeTime(project.updatedAt)}
          </span>
        </div>
      </motion.div>
    </Link>
  );
}
