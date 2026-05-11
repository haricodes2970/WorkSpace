"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, AlertTriangle, Package, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScopeBucket } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────

export interface ScopeItemData {
  id: string;
  title: string;
  notes: string | null;
  bucket: ScopeBucket;
  position: number;
}

interface ScopePanelProps {
  items: ScopeItemData[];
  onAdd: (title: string, bucket: ScopeBucket) => Promise<void>;
  onMove: (id: string, bucket: ScopeBucket) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  className?: string;
}

// ─── Config ───────────────────────────────────────────────────────────────

const BUCKET_CONFIG: Record<ScopeBucket, {
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  bg: string;
  border: string;
  warnAt: number;
}> = {
  MVP: {
    label: "MVP",
    shortLabel: "MVP",
    description: "Ships in first release",
    color: "text-[--color-primary]",
    bg: "bg-[--color-primary]/8",
    border: "border-[--color-primary]/20",
    warnAt: 10,
  },
  V1: {
    label: "v1",
    shortLabel: "v1",
    description: "After initial launch",
    color: "text-[--color-accent]",
    bg: "bg-[--color-accent]/8",
    border: "border-[--color-accent]/20",
    warnAt: 20,
  },
  LATER: {
    label: "Later",
    shortLabel: "Later",
    description: "Deferred indefinitely",
    color: "text-[--color-text-muted]",
    bg: "bg-[--color-card]",
    border: "border-[--color-border-subtle]",
    warnAt: 999,
  },
  EXPERIMENTAL: {
    label: "Experimental",
    shortLabel: "Exp",
    description: "Risky / unvalidated ideas",
    color: "text-[--color-warning]",
    bg: "bg-[--color-warning]/8",
    border: "border-[--color-warning]/20",
    warnAt: 999,
  },
};

const BUCKET_ORDER: ScopeBucket[] = ["MVP", "V1", "LATER", "EXPERIMENTAL"];

// ─── Component ────────────────────────────────────────────────────────────

export function ScopePanel({ items, onAdd, onMove, onRemove, className }: ScopePanelProps) {
  const [addingBucket, setAddingBucket] = useState<ScopeBucket | null>(null);
  const [collapsedBuckets, setCollapsedBuckets] = useState<Set<ScopeBucket>>(
    new Set(["LATER", "EXPERIMENTAL"])
  );

  const toggleBucket = (bucket: ScopeBucket) => {
    setCollapsedBuckets((prev) => {
      const next = new Set(prev);
      if (next.has(bucket)) next.delete(bucket);
      else next.add(bucket);
      return next;
    });
  };

  const grouped = BUCKET_ORDER.reduce<Record<ScopeBucket, ScopeItemData[]>>(
    (acc, bucket) => {
      acc[bucket] = items.filter((i) => i.bucket === bucket);
      return acc;
    },
    { MVP: [], V1: [], LATER: [], EXPERIMENTAL: [] }
  );

  const mvpCount = grouped.MVP.length;
  const cfg = BUCKET_CONFIG.MVP;
  const overloaded = mvpCount >= cfg.warnAt;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] text-[--color-text-muted] uppercase tracking-wider font-medium">
          Scope Buckets
        </span>
        {overloaded && (
          <span className="flex items-center gap-1 text-[10px] text-[--color-warning]">
            <AlertTriangle className="h-3 w-3" />
            MVP overloaded
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        {BUCKET_ORDER.map((bucket) => (
          <BucketSection
            key={bucket}
            bucket={bucket}
            items={grouped[bucket]}
            collapsed={collapsedBuckets.has(bucket)}
            isAdding={addingBucket === bucket}
            onToggleCollapse={() => toggleBucket(bucket)}
            onStartAdd={() => setAddingBucket(bucket)}
            onCancelAdd={() => setAddingBucket(null)}
            onAdd={async (title) => {
              await onAdd(title, bucket);
              setAddingBucket(null);
            }}
            onMove={onMove}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Bucket section ───────────────────────────────────────────────────────

function BucketSection({
  bucket,
  items,
  collapsed,
  isAdding,
  onToggleCollapse,
  onStartAdd,
  onCancelAdd,
  onAdd,
  onMove,
  onRemove,
}: {
  bucket: ScopeBucket;
  items: ScopeItemData[];
  collapsed: boolean;
  isAdding: boolean;
  onToggleCollapse: () => void;
  onStartAdd: () => void;
  onCancelAdd: () => void;
  onAdd: (title: string) => Promise<void>;
  onMove: (id: string, bucket: ScopeBucket) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const cfg = BUCKET_CONFIG[bucket];
  const warn = items.length >= cfg.warnAt;

  return (
    <div className={cn("rounded-lg border overflow-hidden", cfg.border)}>
      {/* Bucket header */}
      <button
        type="button"
        onClick={onToggleCollapse}
        className={cn(
          "flex w-full items-center gap-2 px-3 py-2 text-left transition-colors",
          cfg.bg,
          "hover:brightness-95"
        )}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3 text-[--color-text-muted] shrink-0" />
        ) : (
          <ChevronDown className="h-3 w-3 text-[--color-text-muted] shrink-0" />
        )}
        <span className={cn("text-[11px] font-semibold flex-1 text-left", cfg.color)}>
          {cfg.label}
        </span>
        <span className="text-[10px] text-[--color-text-muted] tabular-nums">
          {items.length}
        </span>
        {warn && (
          <AlertTriangle className="h-3 w-3 text-[--color-warning] shrink-0" />
        )}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onStartAdd(); }}
          className="ml-1 p-0.5 rounded hover:bg-[--color-border] transition-colors"
          title="Add item"
        >
          <Plus className="h-3 w-3 text-[--color-text-muted]" />
        </button>
      </button>

      {/* Items */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="bg-[--color-bg]">
              {items.map((item, i) => (
                <ScopeItemRow
                  key={item.id}
                  item={item}
                  currentBucket={bucket}
                  onMove={onMove}
                  onRemove={onRemove}
                  isLast={i === items.length - 1 && !isAdding}
                />
              ))}

              {isAdding && (
                <AddScopeItemRow
                  onAdd={onAdd}
                  onCancel={onCancelAdd}
                />
              )}

              {items.length === 0 && !isAdding && (
                <div className="flex items-center justify-center py-3 px-3">
                  <p className="text-[10px] text-[--color-text-muted] italic">
                    {cfg.description} — nothing here yet
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Item row ─────────────────────────────────────────────────────────────

function ScopeItemRow({
  item,
  currentBucket,
  onMove,
  onRemove,
  isLast,
}: {
  item: ScopeItemData;
  currentBucket: ScopeBucket;
  onMove: (id: string, bucket: ScopeBucket) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  isLast: boolean;
}) {
  const [showActions, setShowActions] = useState(false);
  const movableBuckets = BUCKET_ORDER.filter((b) => b !== currentBucket);

  return (
    <div
      className={cn(
        "group flex items-center gap-2 px-3 py-2 hover:bg-[--color-card-hover] transition-colors",
        !isLast && "border-b border-[--color-border-subtle]"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <Package className="h-3 w-3 text-[--color-text-muted] shrink-0 opacity-50" />
      <span className="flex-1 text-[12px] text-[--color-text-secondary] leading-tight">
        {item.title}
      </span>

      <div className={cn(
        "flex items-center gap-0.5 transition-opacity shrink-0",
        showActions ? "opacity-100" : "opacity-0"
      )}>
        {/* Move to bucket buttons */}
        {movableBuckets.map((target) => (
          <button
            key={target}
            type="button"
            onClick={() => onMove(item.id, target)}
            className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-[--color-card] border border-[--color-border-subtle] text-[--color-text-muted] hover:text-[--color-text-secondary] hover:border-[--color-border] transition-colors"
            title={`Move to ${BUCKET_CONFIG[target].label}`}
          >
            {BUCKET_CONFIG[target].shortLabel}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="p-1 rounded text-[--color-text-muted] hover:text-[--color-error] hover:bg-[--color-bg] transition-colors"
          title="Remove"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ─── Add item row ─────────────────────────────────────────────────────────

function AddScopeItemRow({
  onAdd,
  onCancel,
}: {
  onAdd: (title: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = useCallback(async () => {
    const t = value.trim();
    if (!t) return;
    setSaving(true);
    try {
      await onAdd(t);
    } finally {
      setSaving(false);
    }
  }, [value, onAdd]);

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-t border-[--color-border-subtle]">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") onCancel();
        }}
        placeholder="Feature name…"
        disabled={saving}
        className="flex-1 bg-transparent text-[12px] text-[--color-text-primary] placeholder:text-[--color-text-muted] outline-none"
      />
      <button
        type="button"
        onClick={submit}
        disabled={!value.trim() || saving}
        className="text-[10px] font-medium text-[--color-primary] hover:opacity-80 disabled:opacity-30 transition-opacity"
      >
        Add
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="text-[10px] text-[--color-text-muted] hover:text-[--color-text-secondary] transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}
