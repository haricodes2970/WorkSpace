"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TodayTask } from "../today.service";

const PRIORITY_CONFIG = {
  URGENT: { dot: "bg-[--color-danger]",   label: "Urgent" },
  HIGH:   { dot: "bg-[--color-warning]",  label: "High" },
  MEDIUM: { dot: "bg-[--color-accent]",   label: "" },
  LOW:    { dot: "bg-[--color-text-muted]", label: "" },
} as const;

const STATUS_LABEL: Record<string, string> = {
  IN_PROGRESS: "In progress",
  BLOCKED:     "Blocked",
  TODO:        "",
};

interface TaskQueueProps {
  tasks: TodayTask[];
}

export function TaskQueue({ tasks }: TaskQueueProps) {
  if (tasks.length === 0) {
    return (
      <p className="text-[12px] text-[--color-text-muted] py-2">
        No urgent tasks. Good signal.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-0.5">
      {tasks.map((task) => {
        const cfg = PRIORITY_CONFIG[task.priority];
        const statusLabel = STATUS_LABEL[task.status] ?? "";
        return (
          <li key={task.id}>
            <Link
              href={`/projects/${task.projectId}` as `/projects/${string}`}
              className="flex items-start gap-2.5 rounded-md px-2.5 py-2 hover:bg-[--color-card] transition-colors group"
            >
              <span
                className={cn("mt-1.5 h-1.5 w-1.5 rounded-full shrink-0", cfg.dot)}
                title={cfg.label || task.priority}
              />
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-[12px] text-[--color-text-secondary] group-hover:text-[--color-text-primary] truncate transition-colors",
                  task.status === "BLOCKED" && "text-[--color-danger]"
                )}>
                  {task.title}
                </p>
                <p className="text-[11px] text-[--color-text-muted] truncate mt-0.5">
                  {task.projectTitle}
                  {statusLabel && <span className="ml-1.5 opacity-70">· {statusLabel}</span>}
                </p>
              </div>
              {task.isOverdue && (
                <span className="shrink-0 flex items-center gap-0.5 text-[10px] text-[--color-danger] mt-0.5">
                  <Clock className="h-3 w-3" />
                  overdue
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
