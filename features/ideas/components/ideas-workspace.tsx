"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Plus, Lightbulb, Tag, ArrowRight,
  Clock, LayoutGrid, List, Inbox,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motionPresets } from "@/lib/design-tokens";
import { formatRelativeTime, cn } from "@/lib/utils";
import { InboxView } from "./inbox-view";
import type { IdeaStatus, ReadinessStatus } from "@prisma/client";
import type { InboxItem } from "./inbox-view";

export interface IdeaListItem {
  id: string;
  title: string;
  description: string | null;
  status: IdeaStatus;
  readinessScore: number;
  readinessStatus: ReadinessStatus;
  tags: string[];
  pinned: boolean;
  updatedAt: Date;
}

const STATUS_CONFIG: Record<IdeaStatus, { label: string; variant: "default" | "primary" | "accent" | "success" | "warning" | "danger" | "outline" }> = {
  RAW:       { label: "Raw",       variant: "default" },
  REFINING:  { label: "Refining",  variant: "warning" },
  READY:     { label: "Ready",     variant: "success" },
  CONVERTED: { label: "Converted", variant: "primary" },
  ARCHIVED:  { label: "Archived",  variant: "outline" },
};

const STATUS_FILTERS = ["All", "RAW", "REFINING", "READY", "CONVERTED"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

type WorkspaceTab = "all" | "inbox";

interface IdeasWorkspaceProps {
  ideas: IdeaListItem[];
  inboxItems: InboxItem[];
  onDismissInboxItem?: (id: string) => void;
  onRefineInboxItem?: (id: string) => void;
}

export function IdeasWorkspace({
  ideas,
  inboxItems,
  onDismissInboxItem,
  onRefineInboxItem,
}: IdeasWorkspaceProps) {
  const [tab, setTab] = useState<WorkspaceTab>("all");
  const [filter, setFilter] = useState<StatusFilter>("All");
  const [view, setView] = useState<"list" | "grid">("list");

  const filtered = filter === "All"
    ? ideas
    : ideas.filter((i) => i.status === filter);

  const pinned = filtered.filter((i) => i.pinned);
  const rest    = filtered.filter((i) => !i.pinned);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[--color-border-subtle] bg-[--color-panel] shrink-0">
        <h1 className="text-[15px] font-semibold text-[--color-text-primary] mr-1">Ideas</h1>

        {/* Tab selector */}
        <div className="flex items-center gap-0.5 rounded-md border border-[--color-border] p-0.5 mr-1">
          <button
            onClick={() => setTab("all")}
            className={cn(
              "px-2.5 py-1 rounded text-[11px] font-medium transition-colors",
              tab === "all"
                ? "bg-[--color-card] text-[--color-text-primary]"
                : "text-[--color-text-muted] hover:text-[--color-text-secondary]"
            )}
          >
            All
          </button>
          <button
            onClick={() => setTab("inbox")}
            className={cn(
              "px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors",
              tab === "inbox"
                ? "bg-[--color-card] text-[--color-text-primary]"
                : "text-[--color-text-muted] hover:text-[--color-text-secondary]"
            )}
          >
            <Inbox className="h-3 w-3" />
            Inbox
            {inboxItems.length > 0 && (
              <span className="ml-0.5 h-4 min-w-[16px] rounded-full bg-[--color-primary] text-white text-[9px] font-bold flex items-center justify-center px-1">
                {inboxItems.length}
              </span>
            )}
          </button>
        </div>

        {/* Status filters (only for All tab) */}
        {tab === "all" && (
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
                {s === "All" ? "All" : STATUS_CONFIG[s as IdeaStatus]?.label ?? s}
              </button>
            ))}
          </div>
        )}

        {tab === "inbox" && <div className="flex-1" />}

        {/* View toggle (only for All tab) */}
        {tab === "all" && (
          <div className="flex items-center gap-0.5 border border-[--color-border] rounded-md p-0.5">
            <button
              onClick={() => setView("list")}
              className={cn("p-1 rounded transition-colors", view === "list" ? "bg-[--color-card] text-[--color-text-primary]" : "text-[--color-text-muted] hover:text-[--color-text-secondary]")}
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setView("grid")}
              className={cn("p-1 rounded transition-colors", view === "grid" ? "bg-[--color-card] text-[--color-text-primary]" : "text-[--color-text-muted] hover:text-[--color-text-secondary]")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <Link href="/ideas/new">
          <Button size="sm" className="gap-1.5 text-[12px] h-7 shrink-0">
            <Plus className="h-3.5 w-3.5" />
            New Idea
          </Button>
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <AnimatePresence mode="wait">
          {tab === "inbox" ? (
            <motion.div
              key="inbox"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <InboxView
                items={inboxItems}
                onDismiss={onDismissInboxItem}
                onRefine={onRefineInboxItem}
              />
            </motion.div>
          ) : (
            <motion.div
              key="all"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {filtered.length === 0 ? (
                <motion.div
                  className="flex flex-col items-center justify-center py-20 text-center"
                  {...motionPresets.fadeUp}
                >
                  <Lightbulb className="h-10 w-10 text-[--color-text-muted] opacity-30 mb-4" />
                  <p className="text-[14px] text-[--color-text-muted]">No ideas yet</p>
                  <p className="text-[12px] text-[--color-text-muted] mt-1">
                    Ideas are the seeds of execution.
                  </p>
                  <Link href="/ideas/new">
                    <Button size="sm" className="mt-4 gap-1.5 text-[12px] h-7">
                      <Plus className="h-3.5 w-3.5" /> Capture first idea
                    </Button>
                  </Link>
                </motion.div>
              ) : (
                <div className="flex flex-col gap-4">
                  {pinned.length > 0 && (
                    <section>
                      <p className="text-[11px] font-medium text-[--color-text-muted] uppercase tracking-wider mb-2 px-1">
                        Pinned
                      </p>
                      <IdeaList ideas={pinned} view={view} />
                    </section>
                  )}
                  <section>
                    {pinned.length > 0 && (
                      <p className="text-[11px] font-medium text-[--color-text-muted] uppercase tracking-wider mb-2 px-1">
                        All Ideas
                      </p>
                    )}
                    <IdeaList ideas={rest} view={view} />
                  </section>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function IdeaList({ ideas, view }: { ideas: IdeaListItem[]; view: "list" | "grid" }) {
  if (view === "grid") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <AnimatePresence>
          {ideas.map((idea, i) => (
            <motion.div
              key={idea.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: i * 0.04, duration: 0.2 }}
            >
              <IdeaGridCard idea={idea} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-lg border border-[--color-border] overflow-hidden">
      <AnimatePresence>
        {ideas.map((idea, i) => (
          <motion.div
            key={idea.id}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: i * 0.03, duration: 0.15 }}
          >
            <IdeaListRow idea={idea} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function IdeaListRow({ idea }: { idea: IdeaListItem }) {
  const { label, variant } = STATUS_CONFIG[idea.status];
  return (
    <Link
      href={`/ideas/${idea.id}`}
      className="group flex items-center gap-4 px-4 py-3 border-b border-[--color-border-subtle] last:border-0 hover:bg-[--color-card-hover] transition-colors"
    >
      <Lightbulb className="h-3.5 w-3.5 text-[--color-text-muted] shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-[--color-text-primary] truncate">
          {idea.title}
        </p>
        {idea.description && (
          <p className="text-[12px] text-[--color-text-muted] truncate mt-0.5">
            {idea.description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {idea.tags.slice(0, 2).map((tag) => (
          <Badge key={tag} variant="outline" className="text-[10px] hidden sm:inline-flex">
            <Tag className="h-2.5 w-2.5" />{tag}
          </Badge>
        ))}
        <Badge variant={variant} dot className="text-[11px]">{label}</Badge>
        {/* Readiness score pill */}
        {idea.readinessScore > 0 && (
          <span className={cn(
            "text-[10px] tabular-nums px-1.5 py-0.5 rounded font-medium",
            idea.readinessScore >= 60
              ? "bg-[--color-success]/15 text-[--color-success]"
              : idea.readinessScore >= 30
              ? "bg-[--color-warning]/15 text-[--color-warning]"
              : "bg-[--color-card] text-[--color-text-muted]"
          )}>
            {idea.readinessScore}
          </span>
        )}
        <span className="text-[11px] text-[--color-text-muted] flex items-center gap-1 hidden md:flex">
          <Clock className="h-3 w-3" />
          {formatRelativeTime(idea.updatedAt)}
        </span>
        <ArrowRight className="h-3.5 w-3.5 text-[--color-text-muted] opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  );
}

function IdeaGridCard({ idea }: { idea: IdeaListItem }) {
  const { label, variant } = STATUS_CONFIG[idea.status];
  return (
    <Link
      href={`/ideas/${idea.id}`}
      className="group flex flex-col gap-3 rounded-lg border border-[--color-border] bg-[--color-card] p-4 hover:border-[--color-border-strong] hover:bg-[--color-card-hover] transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-medium text-[--color-text-primary] line-clamp-2">
          {idea.title}
        </p>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge variant={variant} dot className="text-[10px]">{label}</Badge>
          {idea.readinessScore > 0 && (
            <span className={cn(
              "text-[10px] tabular-nums font-semibold",
              idea.readinessScore >= 60
                ? "text-[--color-success]"
                : idea.readinessScore >= 30
                ? "text-[--color-warning]"
                : "text-[--color-text-muted]"
            )}>
              {idea.readinessScore}%
            </span>
          )}
        </div>
      </div>
      {idea.description && (
        <p className="text-[12px] text-[--color-text-muted] line-clamp-2">{idea.description}</p>
      )}
      <div className="flex items-center justify-between mt-auto pt-1 border-t border-[--color-border-subtle]">
        <div className="flex flex-wrap gap-1">
          {idea.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
          ))}
        </div>
        <span className="text-[11px] text-[--color-text-muted]">
          {formatRelativeTime(idea.updatedAt)}
        </span>
      </div>
    </Link>
  );
}
