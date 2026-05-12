"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Plus, Pin, Trash2, X, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatRelativeTime } from "@/lib/utils";
import type { MemoryType } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────

export interface MemoryData {
  id: string;
  type: MemoryType;
  title: string;
  body: string;
  tags: string[];
  significance: number;
  pinned: boolean;
  createdAt: Date;
}

export interface MemoryFormInput {
  type: MemoryType;
  title: string;
  body: string;
  tags: string[];
  significance: number;
}

interface MemoryPanelProps {
  memories: MemoryData[];
  onAdd:    (data: MemoryFormInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onPin:    (id: string, pinned: boolean) => Promise<void>;
  className?: string;
}

// ─── Config ───────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<MemoryType, { label: string; color: string; bg: string }> = {
  INSIGHT:     { label: "Insight",     color: "text-[--color-accent]",   bg: "bg-[--color-accent]/10 border-[--color-accent]/20" },
  MISTAKE:     { label: "Mistake",     color: "text-[--color-danger]",   bg: "bg-[--color-danger]/10 border-[--color-danger]/20" },
  DISCOVERY:   { label: "Discovery",   color: "text-[--color-success]",  bg: "bg-[--color-success]/10 border-[--color-success]/20" },
  PATTERN:     { label: "Pattern",     color: "text-[--color-warning]",  bg: "bg-[--color-warning]/10 border-[--color-warning]/20" },
  CONSTRAINT:  { label: "Constraint",  color: "text-[--color-text-muted]", bg: "bg-[--color-card] border-[--color-border]" },
  LEARNING:    { label: "Learning",    color: "text-[--color-primary]",  bg: "bg-[--color-primary-subtle] border-[--color-primary]/20" },
  BREAKTHROUGH:{ label: "Breakthrough",color: "text-[--color-success]",  bg: "bg-[--color-success]/15 border-[--color-success]/30" },
  PIVOT:       { label: "Pivot",       color: "text-[--color-warning]",  bg: "bg-[--color-warning]/10 border-[--color-warning]/20" },
};

const MEMORY_TYPES: MemoryType[] = [
  "INSIGHT", "MISTAKE", "DISCOVERY", "PATTERN",
  "CONSTRAINT", "LEARNING", "BREAKTHROUGH", "PIVOT",
];

// ─── Add Form ─────────────────────────────────────────────────────────────

function MemoryAddForm({ onAdd, onCancel }: { onAdd: (d: MemoryFormInput) => Promise<void>; onCancel: () => void }) {
  const [type,  setType]  = useState<MemoryType>("LEARNING");
  const [title, setTitle] = useState("");
  const [body,  setBody]  = useState("");
  const [sig,   setSig]   = useState(5);
  const [busy,  setBusy]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      await onAdd({ type, title: title.trim(), body: body.trim(), tags: [], significance: sig });
      onCancel();
    } finally {
      setBusy(false);
    }
  }

  const inputCls = "w-full rounded-md border border-[--color-border] bg-[--color-input] px-3 py-1.5 text-[12px] text-[--color-text-primary] placeholder-[--color-text-muted] focus:outline-none focus:border-[--color-primary] resize-none";

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 rounded-lg border border-[--color-border] bg-[--color-card] p-3"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Type selector */}
      <div className="flex flex-wrap gap-1">
        {MEMORY_TYPES.map((t) => {
          const cfg = TYPE_CONFIG[t];
          return (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                "px-2 py-0.5 rounded-full border text-[10px] font-medium transition-colors",
                type === t ? `${cfg.bg} ${cfg.color}` : "border-[--color-border] text-[--color-text-muted] hover:text-[--color-text-secondary]"
              )}
            >
              {cfg.label}
            </button>
          );
        })}
      </div>

      <input
        className={inputCls}
        placeholder="What did you learn or notice?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
        maxLength={300}
      />
      <textarea
        className={cn(inputCls, "min-h-[64px]")}
        placeholder="Add context, details, or impact (optional)"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[--color-text-muted]">Significance</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setSig(n * 2)}
                className={cn(
                  "h-2.5 w-2.5 rounded-sm transition-colors",
                  sig >= n * 2 ? "bg-[--color-accent]" : "bg-[--color-border]"
                )}
              />
            ))}
          </div>
        </div>
        <div className="flex gap-1.5">
          <button type="button" onClick={onCancel} className="text-[11px] text-[--color-text-muted] hover:text-[--color-text-secondary]">
            Cancel
          </button>
          <Button size="sm" type="submit" disabled={!title.trim() || busy} className="h-6 text-[11px] px-2.5">
            Save
          </Button>
        </div>
      </div>
    </motion.form>
  );
}

// ─── Memory Card ──────────────────────────────────────────────────────────

function MemoryCard({
  memory, onDelete, onPin,
}: {
  memory:   MemoryData;
  onDelete: (id: string) => Promise<void>;
  onPin:    (id: string, pinned: boolean) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = TYPE_CONFIG[memory.type];

  return (
    <motion.div
      layout
      className="rounded-lg border border-[--color-border] bg-[--color-card] overflow-hidden group"
    >
      <div
        className="flex items-start gap-2 px-3 py-2.5 cursor-pointer hover:bg-[--color-card-hover] transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className={cn("mt-px", expanded ? <ChevronDown /> : <ChevronRight />)}>
          {expanded
            ? <ChevronDown className="h-3 w-3 text-[--color-text-muted]" />
            : <ChevronRight className="h-3 w-3 text-[--color-text-muted]" />
          }
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={cn("text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full border", cfg.bg, cfg.color)}>
              {cfg.label}
            </span>
            {memory.pinned && <Pin className="h-2.5 w-2.5 text-[--color-warning]" />}
          </div>
          <p className="text-[12px] font-medium text-[--color-text-primary] leading-snug line-clamp-2">
            {memory.title}
          </p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onPin(memory.id, !memory.pinned); }}
            className="p-1 rounded hover:bg-[--color-card-hover] text-[--color-text-muted] hover:text-[--color-warning]"
            title={memory.pinned ? "Unpin" : "Pin"}
          >
            <Pin className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(memory.id); }}
            className="p-1 rounded hover:bg-[--color-card-hover] text-[--color-text-muted] hover:text-[--color-danger]"
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && memory.body && (
          <motion.div
            className="px-3 pb-3 border-t border-[--color-border-subtle]"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <p className="text-[12px] text-[--color-text-secondary] whitespace-pre-wrap leading-relaxed mt-2">
              {memory.body}
            </p>
            <p className="text-[10px] text-[--color-text-muted] mt-2">
              {formatRelativeTime(memory.createdAt)}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────

export function MemoryPanel({ memories, onAdd, onDelete, onPin, className }: MemoryPanelProps) {
  const [showForm,   setShowForm]   = useState(false);
  const [typeFilter, setTypeFilter] = useState<MemoryType | "ALL">("ALL");

  const filtered = typeFilter === "ALL"
    ? memories
    : memories.filter((m) => m.type === typeFilter);

  const handleAdd = useCallback(async (data: MemoryFormInput) => {
    await onAdd(data);
    setShowForm(false);
  }, [onAdd]);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Brain className="h-3.5 w-3.5 text-[--color-text-muted]" />
          <span className="text-[11px] text-[--color-text-muted] uppercase tracking-wider font-medium">
            Memory
          </span>
          {memories.length > 0 && (
            <span className="text-[10px] text-[--color-text-muted] opacity-60">{memories.length}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] transition-colors",
            showForm
              ? "bg-[--color-primary-subtle] text-[--color-primary]"
              : "text-[--color-text-muted] hover:text-[--color-text-secondary] hover:bg-[--color-card]"
          )}
        >
          {showForm ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
          {showForm ? "Cancel" : "Capture"}
        </button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <MemoryAddForm onAdd={handleAdd} onCancel={() => setShowForm(false)} />
        )}
      </AnimatePresence>

      {/* Type filter chips */}
      {memories.length > 3 && (
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setTypeFilter("ALL")}
            className={cn(
              "px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors",
              typeFilter === "ALL" ? "bg-[--color-primary-subtle] text-[--color-text-primary]" : "text-[--color-text-muted] hover:text-[--color-text-secondary]"
            )}
          >
            All
          </button>
          {(["INSIGHT", "MISTAKE", "LEARNING", "PATTERN"] as MemoryType[]).map((t) => {
            const count = memories.filter((m) => m.type === t).length;
            if (count === 0) return null;
            const cfg = TYPE_CONFIG[t];
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={cn(
                  "px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors",
                  typeFilter === t ? `${cfg.bg} ${cfg.color}` : "text-[--color-text-muted] hover:text-[--color-text-secondary]"
                )}
              >
                {cfg.label} {count}
              </button>
            );
          })}
        </div>
      )}

      {/* Memory list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center rounded-lg border border-dashed border-[--color-border]">
          <Brain className="h-6 w-6 text-[--color-text-muted] opacity-30 mb-2" />
          <p className="text-[11px] text-[--color-text-muted]">No memories yet</p>
          <p className="text-[10px] text-[--color-text-muted] opacity-70 mt-0.5">
            Capture learnings, mistakes, and discoveries.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {filtered.map((m) => (
            <MemoryCard key={m.id} memory={m} onDelete={onDelete} onPin={onPin} />
          ))}
        </div>
      )}
    </div>
  );
}
