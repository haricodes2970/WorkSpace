"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckSquare, Target, GitCommit, BarChart2, ClipboardList,
  ArrowRight, AlertCircle, CheckCircle, FileText, Rocket,
  RefreshCw, Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimelineEventType } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────

export interface TimelineEventData {
  id: string;
  type: TimelineEventType;
  title: string;
  description: string | null;
  occurredAt: Date;
}

interface TimelineViewProps {
  events: TimelineEventData[];
  className?: string;
}

// ─── Config ───────────────────────────────────────────────────────────────

const EVENT_CONFIG: Record<TimelineEventType, {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  label: string;
}> = {
  TASK_COMPLETED:    { icon: CheckSquare, color: "text-[--color-success]",        bg: "bg-[--color-success]/10",   label: "Task" },
  MILESTONE_REACHED: { icon: Target,      color: "text-[--color-primary]",         bg: "bg-[--color-primary]/10",   label: "Milestone" },
  SCOPE_CHANGED:     { icon: RefreshCw,   color: "text-[--color-warning]",         bg: "bg-[--color-warning]/10",   label: "Scope" },
  DECISION_MADE:     { icon: GitCommit,   color: "text-[--color-accent]",          bg: "bg-[--color-accent]/10",    label: "Decision" },
  REVIEW_COMPLETED:  { icon: ClipboardList, color: "text-[--color-text-secondary]", bg: "bg-[--color-card]",        label: "Review" },
  STATUS_CHANGED:    { icon: ArrowRight,  color: "text-[--color-text-muted]",      bg: "bg-[--color-card]",         label: "Status" },
  BLOCKED:           { icon: AlertCircle, color: "text-[--color-error]",           bg: "bg-[--color-error]/10",     label: "Blocked" },
  UNBLOCKED:         { icon: CheckCircle, color: "text-[--color-success]",         bg: "bg-[--color-success]/10",   label: "Unblocked" },
  NOTE_ADDED:        { icon: FileText,    color: "text-[--color-text-muted]",      bg: "bg-[--color-card]",         label: "Note" },
  SHIPPED:           { icon: Rocket,      color: "text-[--color-success]",         bg: "bg-[--color-success]/10",   label: "Shipped" },
};

const ALL_FILTERS: TimelineEventType[] = [
  "TASK_COMPLETED", "MILESTONE_REACHED", "DECISION_MADE",
  "REVIEW_COMPLETED", "SCOPE_CHANGED", "BLOCKED",
];

// ─── Helpers ──────────────────────────────────────────────────────────────

function groupByDate(events: TimelineEventData[]): Map<string, TimelineEventData[]> {
  const groups = new Map<string, TimelineEventData[]>();
  for (const event of events) {
    const key = event.occurredAt.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const g = groups.get(key) ?? [];
    g.push(event);
    groups.set(key, g);
  }
  return groups;
}

function isToday(date: Date): boolean {
  const t = new Date();
  return (
    date.getFullYear() === t.getFullYear() &&
    date.getMonth() === t.getMonth() &&
    date.getDate() === t.getDate()
  );
}

function timeLabel(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// ─── Component ────────────────────────────────────────────────────────────

export function TimelineView({ events, className }: TimelineViewProps) {
  const [activeFilter, setActiveFilter] = useState<TimelineEventType | null>(null);

  const filtered = activeFilter
    ? events.filter((e) => e.type === activeFilter)
    : events;

  const grouped = groupByDate(filtered);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] text-[--color-text-muted] uppercase tracking-wider font-medium">
          Timeline
        </span>
        <span className="text-[10px] text-[--color-text-muted] tabular-nums">
          {events.length} events
        </span>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1">
        <FilterChip
          active={activeFilter === null}
          onClick={() => setActiveFilter(null)}
          label="All"
        />
        {ALL_FILTERS.map((type) => (
          <FilterChip
            key={type}
            active={activeFilter === type}
            onClick={() => setActiveFilter(activeFilter === type ? null : type)}
            label={EVENT_CONFIG[type].label}
            color={EVENT_CONFIG[type].color}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <BarChart2 className="h-7 w-7 text-[--color-text-muted] opacity-25 mb-3" />
          <p className="text-[11px] text-[--color-text-muted]">
            {activeFilter ? "No events of this type" : "No execution history yet"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {Array.from(grouped.entries()).map(([dateLabel, dayEvents]) => (
            <DateGroup
              key={dateLabel}
              dateLabel={dateLabel}
              events={dayEvents}
              isToday={isToday(dayEvents[0]!.occurredAt)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Date group ───────────────────────────────────────────────────────────

function DateGroup({
  dateLabel,
  events,
  isToday: today,
}: {
  dateLabel: string;
  events: TimelineEventData[];
  isToday: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className={cn(
          "text-[10px] font-semibold uppercase tracking-wide",
          today ? "text-[--color-primary]" : "text-[--color-text-muted]"
        )}>
          {today ? "Today" : dateLabel}
        </span>
        <div className="flex-1 h-px bg-[--color-border-subtle]" />
      </div>

      <div className="flex flex-col gap-1">
        {events.map((event, i) => (
          <EventCard key={event.id} event={event} animDelay={i * 0.03} />
        ))}
      </div>
    </div>
  );
}

// ─── Event card ───────────────────────────────────────────────────────────

function EventCard({ event, animDelay }: { event: TimelineEventData; animDelay: number }) {
  const cfg = EVENT_CONFIG[event.type];
  const Icon = cfg.icon;

  return (
    <motion.div
      className="flex items-start gap-2.5"
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: animDelay, duration: 0.12 }}
    >
      {/* Icon */}
      <div className={cn(
        "h-6 w-6 rounded-md flex items-center justify-center shrink-0 mt-0.5",
        cfg.bg
      )}>
        <Icon className={cn("h-3 w-3", cfg.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[12px] text-[--color-text-secondary] leading-snug">
          {event.title}
        </p>
        {event.description && (
          <p className="text-[11px] text-[--color-text-muted] mt-0.5 leading-snug">
            {event.description}
          </p>
        )}
      </div>

      <span className="text-[10px] text-[--color-text-muted] shrink-0 tabular-nums mt-0.5">
        {timeLabel(event.occurredAt)}
      </span>
    </motion.div>
  );
}

// ─── Filter chip ──────────────────────────────────────────────────────────

function FilterChip({
  active,
  onClick,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-2 py-0.5 rounded text-[10px] font-medium transition-colors border",
        active
          ? "border-[--color-primary]/40 bg-[--color-primary]/10 text-[--color-primary]"
          : "border-[--color-border-subtle] text-[--color-text-muted] hover:border-[--color-border]"
      )}
    >
      {label}
    </button>
  );
}
