"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckSquare, Circle, Clock, Lightbulb, ArrowRight,
  Plus, MoreHorizontal, Rocket, AlertCircle, Flag,
  Link2, Target, Calendar,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatDate, formatRelativeTime } from "@/lib/utils";
import { motionPresets } from "@/lib/design-tokens";
import type { TaskStatus, Priority, MilestoneStatus, ProjectStatus } from "@prisma/client";

/* ─── Types ──────────────────────────────────────────────────────────────── */

export interface ProjectDetailData {
  id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  tags: string[];
  targetDate: Date | null;
  shippedAt: Date | null;
  updatedAt: Date;
  linkedIdeaId: string | null;
  linkedIdeaTitle: string | null;
  tasks: TaskItem[];
  milestones: MilestoneItem[];
  notes: NoteItem[];
  links: LinkItem[];
}

export interface TaskItem {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: Date | null;
  milestoneId: string | null;
}

export interface MilestoneItem {
  id: string;
  title: string;
  status: MilestoneStatus;
  targetDate: Date | null;
  taskCount: number;
  taskDone: number;
}

export interface NoteItem {
  id: string;
  title: string | null;
  content: string;
  updatedAt: Date;
}

export interface LinkItem {
  id: string;
  label: string;
  url: string;
}

/* ─── Config maps ────────────────────────────────────────────────────────── */

const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; icon: React.ReactNode; color: string }> = {
  TODO:        { label: "Todo",        icon: <Circle className="h-3.5 w-3.5" />,      color: "text-[--color-text-muted]" },
  IN_PROGRESS: { label: "In Progress", icon: <Clock className="h-3.5 w-3.5" />,       color: "text-[--color-accent]" },
  BLOCKED:     { label: "Blocked",     icon: <AlertCircle className="h-3.5 w-3.5" />, color: "text-[--color-danger]" },
  DONE:        { label: "Done",        icon: <CheckSquare className="h-3.5 w-3.5" />, color: "text-[--color-success]" },
  CANCELLED:   { label: "Cancelled",   icon: <Circle className="h-3.5 w-3.5" />,      color: "text-[--color-text-muted] opacity-50" },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  LOW:    { label: "Low",    color: "text-[--color-text-muted]" },
  MEDIUM: { label: "Med",    color: "text-[--color-text-secondary]" },
  HIGH:   { label: "High",   color: "text-[--color-warning]" },
  URGENT: { label: "Urgent", color: "text-[--color-danger]" },
};

const MILESTONE_STATUS_CONFIG: Record<MilestoneStatus, { label: string; variant: "default" | "primary" | "accent" | "success" | "warning" | "danger" | "outline" }> = {
  UPCOMING:    { label: "Upcoming",    variant: "default" },
  IN_PROGRESS: { label: "In Progress", variant: "accent" },
  COMPLETED:   { label: "Completed",   variant: "success" },
  MISSED:      { label: "Missed",      variant: "danger" },
};

/* ─── Main Component ─────────────────────────────────────────────────────── */

interface ProjectCommandCenterProps {
  project: ProjectDetailData;
  onAddTask: () => void;
  onShip: () => void;
}

export function ProjectCommandCenter({
  project,
  onAddTask,
  onShip,
}: ProjectCommandCenterProps) {
  const doneTasks = project.tasks.filter((t) => t.status === "DONE").length;
  const progress = project.tasks.length > 0
    ? Math.round((doneTasks / project.tasks.length) * 100)
    : 0;

  const activeTasks = project.tasks.filter((t) => t.status === "IN_PROGRESS");
  const blockedTasks = project.tasks.filter((t) => t.status === "BLOCKED");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[--color-border-subtle] bg-[--color-panel] shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-1.5">
              <Badge
                variant={
                  project.status === "ACTIVE" ? "accent"
                  : project.status === "SHIPPED" ? "success"
                  : project.status === "PAUSED" ? "warning"
                  : "default"
                }
                dot
                className="text-[11px]"
              >
                {project.status.charAt(0) + project.status.slice(1).toLowerCase()}
              </Badge>
              {project.linkedIdeaTitle && (
                <span className="flex items-center gap-1 text-[11px] text-[--color-text-muted]">
                  <Lightbulb className="h-3 w-3 text-[--color-warning]" />
                  From: {project.linkedIdeaTitle}
                </span>
              )}
              <span className="text-[11px] text-[--color-text-muted] ml-auto">
                Updated {formatRelativeTime(project.updatedAt)}
              </span>
            </div>
            <h1 className="text-[20px] font-semibold text-[--color-text-primary] truncate">
              {project.title}
            </h1>
            {project.description && (
              <p className="mt-1 text-[13px] text-[--color-text-muted] line-clamp-2">
                {project.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {project.status !== "SHIPPED" && progress === 100 && (
              <Button size="sm" onClick={onShip} className="gap-1.5 text-[12px] h-7">
                <Rocket className="h-3.5 w-3.5" />
                Ship it
              </Button>
            )}
            {project.status === "SHIPPED" && (
              <Badge variant="success" className="text-[12px] gap-1.5 px-3 py-1">
                <Rocket className="h-3.5 w-3.5" />
                Shipped {project.shippedAt ? formatDate(project.shippedAt) : ""}
              </Badge>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 flex items-center gap-3">
          <Progress
            value={progress}
            className="flex-1 h-1.5"
            indicatorClassName={progress === 100 ? "bg-[--color-success]" : undefined}
          />
          <span className="text-[12px] text-[--color-text-muted] shrink-0 tabular-nums">
            {doneTasks}/{project.tasks.length} tasks · {progress}%
          </span>
        </div>

        {/* Quick stats */}
        {(activeTasks.length > 0 || blockedTasks.length > 0 || project.targetDate) && (
          <div className="flex items-center gap-4 mt-3">
            {activeTasks.length > 0 && (
              <span className="text-[12px] text-[--color-accent] flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {activeTasks.length} in progress
              </span>
            )}
            {blockedTasks.length > 0 && (
              <span className="text-[12px] text-[--color-danger] flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {blockedTasks.length} blocked
              </span>
            )}
            {project.targetDate && (
              <span className="text-[12px] text-[--color-text-muted] flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Target: {formatDate(project.targetDate)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tasks" className="flex flex-col flex-1 overflow-hidden">
        <TabsList className="px-6 bg-[--color-panel] shrink-0">
          <TabsTrigger value="tasks">
            Tasks
            {project.tasks.length > 0 && (
              <span className="ml-1.5 text-[10px] text-[--color-text-muted]">
                {project.tasks.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="milestones">
            Milestones
            {project.milestones.length > 0 && (
              <span className="ml-1.5 text-[10px] text-[--color-text-muted]">
                {project.milestones.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
        </TabsList>

        {/* Tasks tab */}
        <TabsContent value="tasks" className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] text-[--color-text-muted]">
                  {doneTasks} of {project.tasks.length} done
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onAddTask}
                  className="gap-1.5 text-[12px] h-7"
                >
                  <Plus className="h-3.5 w-3.5" /> Add task
                </Button>
              </div>

              {project.tasks.length === 0 ? (
                <EmptyState
                  icon={<CheckSquare className="h-8 w-8" />}
                  message="No tasks yet"
                  action={{ label: "Add first task", onClick: onAddTask }}
                />
              ) : (
                <TaskGroups tasks={project.tasks} />
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Milestones tab */}
        <TabsContent value="milestones" className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="px-6 py-4 flex flex-col gap-3">
              {project.milestones.length === 0 ? (
                <EmptyState icon={<Target className="h-8 w-8" />} message="No milestones yet" />
              ) : (
                project.milestones.map((m, i) => (
                  <MilestoneCard key={m.id} milestone={m} index={i} />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Notes tab */}
        <TabsContent value="notes" className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="px-6 py-4 flex flex-col gap-3">
              {project.notes.length === 0 ? (
                <EmptyState icon={<Flag className="h-8 w-8" />} message="No notes yet" />
              ) : (
                project.notes.map((note) => (
                  <div key={note.id} className="rounded-lg border border-[--color-border] bg-[--color-card] p-4">
                    {note.title && (
                      <p className="text-[13px] font-medium text-[--color-text-primary] mb-1.5">
                        {note.title}
                      </p>
                    )}
                    <p className="text-[13px] text-[--color-text-secondary] whitespace-pre-wrap leading-relaxed">
                      {note.content}
                    </p>
                    <p className="text-[11px] text-[--color-text-muted] mt-3">
                      {formatRelativeTime(note.updatedAt)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Links tab */}
        <TabsContent value="links" className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="px-6 py-4 flex flex-col gap-2">
              {project.links.length === 0 ? (
                <EmptyState icon={<Link2 className="h-8 w-8" />} message="No links yet" />
              ) : (
                project.links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg border border-[--color-border] bg-[--color-card] px-4 py-3 hover:border-[--color-border-strong] hover:bg-[--color-card-hover] transition-colors group"
                  >
                    <Link2 className="h-4 w-4 text-[--color-text-muted] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[--color-text-primary] truncate">
                        {link.label}
                      </p>
                      <p className="text-[11px] text-[--color-text-muted] truncate">{link.url}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-[--color-text-muted] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </a>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ─── Task groups ────────────────────────────────────────────────────────── */

const TASK_GROUP_ORDER: TaskStatus[] = ["IN_PROGRESS", "BLOCKED", "TODO", "DONE", "CANCELLED"];

function TaskGroups({ tasks }: { tasks: TaskItem[] }) {
  const grouped = TASK_GROUP_ORDER.reduce<Record<string, TaskItem[]>>((acc, status) => {
    const g = tasks.filter((t) => t.status === status);
    if (g.length > 0) acc[status] = g;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(grouped).map(([status, items]) => {
        const config = TASK_STATUS_CONFIG[status as TaskStatus];
        return (
          <div key={status}>
            <div className={cn("flex items-center gap-2 mb-1.5", config.color)}>
              {config.icon}
              <span className="text-[11px] font-medium uppercase tracking-wider">
                {config.label}
              </span>
              <span className="text-[11px] text-[--color-text-muted]">({items.length})</span>
            </div>
            <div className="flex flex-col rounded-lg border border-[--color-border] overflow-hidden">
              {items.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <TaskRow task={task} />
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TaskRow({ task }: { task: TaskItem }) {
  const statusCfg = TASK_STATUS_CONFIG[task.status];
  const priorityCfg = PRIORITY_CONFIG[task.priority];
  const isDone = task.status === "DONE" || task.status === "CANCELLED";

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 border-b border-[--color-border-subtle] last:border-0 hover:bg-[--color-card-hover] transition-colors group">
      <span className={statusCfg.color}>{statusCfg.icon}</span>
      <span className={cn(
        "flex-1 text-[13px] truncate",
        isDone ? "text-[--color-text-muted] line-through" : "text-[--color-text-primary]"
      )}>
        {task.title}
      </span>
      <div className="flex items-center gap-2 shrink-0">
        {task.priority !== "MEDIUM" && (
          <span className={cn("text-[11px] font-medium", priorityCfg.color)}>
            <Flag className="h-3 w-3 inline mr-0.5" />
            {priorityCfg.label}
          </span>
        )}
        {task.dueDate && (
          <span className="text-[11px] text-[--color-text-muted] flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(task.dueDate)}
          </span>
        )}
        <button className="opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal className="h-4 w-4 text-[--color-text-muted]" />
        </button>
      </div>
    </div>
  );
}

/* ─── Milestone card ─────────────────────────────────────────────────────── */

function MilestoneCard({ milestone, index }: { milestone: MilestoneItem; index: number }) {
  const { label, variant } = MILESTONE_STATUS_CONFIG[milestone.status];
  const progress = milestone.taskCount > 0
    ? Math.round((milestone.taskDone / milestone.taskCount) * 100)
    : 0;

  return (
    <motion.div
      className="rounded-lg border border-[--color-border] bg-[--color-card] p-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-[13px] font-medium text-[--color-text-primary]">{milestone.title}</p>
          {milestone.targetDate && (
            <p className="text-[11px] text-[--color-text-muted] mt-0.5 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(milestone.targetDate)}
            </p>
          )}
        </div>
        <Badge variant={variant} dot className="text-[10px] shrink-0">{label}</Badge>
      </div>

      {milestone.taskCount > 0 && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[--color-text-muted]">
              {milestone.taskDone}/{milestone.taskCount} tasks
            </span>
            <span className="text-[11px] text-[--color-text-muted]">{progress}%</span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>
      )}
    </motion.div>
  );
}

/* ─── Empty state ────────────────────────────────────────────────────────── */

function EmptyState({
  icon,
  message,
  action,
}: {
  icon: React.ReactNode;
  message: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-[--color-text-muted] opacity-25 mb-3">{icon}</span>
      <p className="text-[13px] text-[--color-text-muted]">{message}</p>
      {action && (
        <Button
          size="sm"
          variant="secondary"
          onClick={action.onClick}
          className="mt-3 gap-1.5 text-[12px] h-7"
        >
          <Plus className="h-3.5 w-3.5" />
          {action.label}
        </Button>
      )}
    </div>
  );
}
