"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Inbox, Lightbulb, ChevronRight, Clock, Trash2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import type { ReadinessStatus } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────

export interface InboxItem {
  id: string;
  title: string;
  description: string | null;
  readinessScore: number;
  readinessStatus: ReadinessStatus;
  capturedAt: Date;
  tags: string[];
}

interface InboxViewProps {
  items: InboxItem[];
  onDismiss?: (id: string) => void;
  onRefine?: (id: string) => void;
}

// ─── Status badge config ──────────────────────────────────────────────────

const STATUS_COLORS: Record<ReadinessStatus, string> = {
  CAPTURED:   "bg-[--color-text-muted]/20 text-[--color-text-muted]",
  EXPLORING:  "bg-[--color-warning]/15 text-[--color-warning]",
  VALIDATING: "bg-[--color-accent]/15 text-[--color-accent]",
  PLANNING:   "bg-[--color-primary]/15 text-[--color-primary]",
  READY:      "bg-[--color-success]/15 text-[--color-success]",
  CONVERTED:  "bg-[--color-success]/15 text-[--color-success]",
  ARCHIVED:   "bg-[--color-text-muted]/10 text-[--color-text-muted]",
};

const STATUS_LABELS: Record<ReadinessStatus, string> = {
  CAPTURED:   "Captured",
  EXPLORING:  "Exploring",
  VALIDATING: "Validating",
  PLANNING:   "Planning",
  READY:      "Ready",
  CONVERTED:  "Converted",
  ARCHIVED:   "Archived",
};

// ─── Component ────────────────────────────────────────────────────────────

export function InboxView({ items, onDismiss, onRefine }: InboxViewProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-20 text-center"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Inbox className="h-10 w-10 text-[--color-text-muted] opacity-30 mb-4" />
        <p className="text-[14px] text-[--color-text-muted]">Inbox is clear</p>
        <p className="text-[12px] text-[--color-text-muted] mt-1">
          New ideas captured from Quick Capture appear here.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-[11px] text-[--color-text-muted] uppercase tracking-wider font-medium">
          Inbox
        </span>
        <span className="text-[11px] text-[--color-text-muted] tabular-nums">
          {items.length} idea{items.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex flex-col rounded-lg border border-[--color-border] overflow-hidden">
        <AnimatePresence initial={false}>
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <InboxRow
                item={item}
                hovered={hoveredId === item.id}
                onDismiss={onDismiss ? () => onDismiss(item.id) : undefined}
                onRefine={onRefine ? () => onRefine(item.id) : undefined}
                delay={i * 0.03}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────

function InboxRow({
  item,
  hovered,
  onDismiss,
  onRefine,
  delay,
}: {
  item: InboxItem;
  hovered: boolean;
  onDismiss?: () => void;
  onRefine?: () => void;
  delay: number;
}) {
  return (
    <div className="group flex items-start gap-3 px-4 py-3 border-b border-[--color-border-subtle] last:border-0 bg-[--color-card] hover:bg-[--color-card-hover] transition-colors">
      {/* Score bar */}
      <div className="flex flex-col items-center gap-1 shrink-0 mt-0.5">
        <Lightbulb className="h-3.5 w-3.5 text-[--color-text-muted]" />
        <div className="h-8 w-0.5 bg-[--color-border-subtle] rounded-full overflow-hidden">
          <motion.div
            className="w-full bg-[--color-primary] rounded-full"
            initial={{ height: 0 }}
            animate={{ height: `${item.readinessScore}%` }}
            transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ marginTop: `${100 - item.readinessScore}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className={cn(
              "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium",
              STATUS_COLORS[item.readinessStatus]
            )}
          >
            {STATUS_LABELS[item.readinessStatus]}
          </span>
          <span className="text-[10px] text-[--color-text-muted] flex items-center gap-0.5">
            <Clock className="h-2.5 w-2.5" />
            {formatRelativeTime(item.capturedAt)}
          </span>
        </div>

        <p className="text-[13px] font-medium text-[--color-text-primary] truncate">
          {item.title}
        </p>

        {item.description && (
          <p className="text-[12px] text-[--color-text-muted] truncate mt-0.5">
            {item.description}
          </p>
        )}

        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {item.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 rounded bg-[--color-bg] border border-[--color-border-subtle] text-[--color-text-muted]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div
        className={cn(
          "flex items-center gap-1 shrink-0 transition-opacity",
          hovered ? "opacity-100" : "opacity-0"
        )}
      >
        {onDismiss && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onDismiss();
            }}
            title="Archive"
            className="p-1.5 rounded hover:bg-[--color-bg] text-[--color-text-muted] hover:text-[--color-error] transition-colors"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
        {onRefine && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onRefine();
            }}
            title="Open to refine"
            className="p-1.5 rounded hover:bg-[--color-bg] text-[--color-text-muted] hover:text-[--color-primary] transition-colors"
          >
            <Pencil className="h-3 w-3" />
          </button>
        )}
        <Link
          href={`/ideas/${item.id}`}
          className="p-1.5 rounded hover:bg-[--color-bg] text-[--color-text-muted] hover:text-[--color-text-secondary] transition-colors"
        >
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
