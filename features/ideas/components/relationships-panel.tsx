"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Link2, Plus, X, ChevronRight, Lightbulb,
  ArrowRight, GitBranch, Copy, AlertOctagon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RelationshipType } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────

export interface IdeaRelationshipItem {
  id: string;
  relatedIdeaId: string;
  relatedIdeaTitle: string;
  relationshipType: RelationshipType;
  direction: "source" | "target";
}

interface RelationshipsPanelProps {
  relationships: IdeaRelationshipItem[];
  onAdd?: (relatedIdeaId: string, type: RelationshipType) => void;
  onRemove?: (id: string) => void;
  className?: string;
}

// ─── Config ───────────────────────────────────────────────────────────────

const REL_CONFIG: Record<RelationshipType, {
  label: string;
  inverseLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = {
  RELATED: {
    label: "Related to",
    inverseLabel: "Related to",
    icon: Link2,
    color: "text-[--color-accent]",
  },
  DEPENDS_ON: {
    label: "Depends on",
    inverseLabel: "Depended on by",
    icon: ArrowRight,
    color: "text-[--color-warning]",
  },
  BLOCKS: {
    label: "Blocks",
    inverseLabel: "Blocked by",
    icon: AlertOctagon,
    color: "text-[--color-error]",
  },
  DUPLICATE_OF: {
    label: "Duplicate of",
    inverseLabel: "Has duplicate",
    icon: Copy,
    color: "text-[--color-text-muted]",
  },
  SPAWNED_FROM: {
    label: "Spawned from",
    inverseLabel: "Spawned",
    icon: GitBranch,
    color: "text-[--color-primary]",
  },
};

const REL_TYPE_OPTIONS = Object.entries(REL_CONFIG).map(([type, cfg]) => ({
  type: type as RelationshipType,
  label: cfg.label,
}));

// ─── Component ────────────────────────────────────────────────────────────

export function RelationshipsPanel({
  relationships,
  onAdd,
  onRemove,
  className,
}: RelationshipsPanelProps) {
  const [adding, setAdding] = useState(false);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] text-[--color-text-muted] uppercase tracking-wider font-medium">
          Relationships
        </span>
        {onAdd && (
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className={cn(
              "text-[11px] flex items-center gap-1 transition-colors",
              adding
                ? "text-[--color-primary]"
                : "text-[--color-text-muted] hover:text-[--color-text-secondary]"
            )}
          >
            <Plus className="h-3 w-3" />
            Link
          </button>
        )}
      </div>

      <AnimatePresence>
        {adding && onAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
          >
            <AddRelationshipForm
              onAdd={(relatedId, type) => {
                onAdd(relatedId, type);
                setAdding(false);
              }}
              onCancel={() => setAdding(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {relationships.length === 0 && !adding ? (
        <div className="flex items-center justify-center py-6 rounded-lg border border-[--color-border-subtle] border-dashed">
          <p className="text-[11px] text-[--color-text-muted]">No relationships yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <AnimatePresence initial={false}>
            {relationships.map((rel, i) => (
              <motion.div
                key={rel.id}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 4 }}
                transition={{ delay: i * 0.03, duration: 0.15 }}
              >
                <RelationshipRow
                  rel={rel}
                  onRemove={onRemove ? () => onRemove(rel.id) : undefined}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────

function RelationshipRow({
  rel,
  onRemove,
}: {
  rel: IdeaRelationshipItem;
  onRemove?: () => void;
}) {
  const cfg = REL_CONFIG[rel.relationshipType];
  const Icon = cfg.icon;
  const label = rel.direction === "source" ? cfg.label : cfg.inverseLabel;

  return (
    <div className="group flex items-center gap-2 px-3 py-2 rounded-lg border border-[--color-border-subtle] bg-[--color-card] hover:border-[--color-border] transition-colors">
      <Icon className={cn("h-3 w-3 shrink-0", cfg.color)} />

      <span className="text-[10px] text-[--color-text-muted] shrink-0 w-20 truncate">
        {label}
      </span>

      <Link
        href={`/ideas/${rel.relatedIdeaId}`}
        className="flex-1 min-w-0 flex items-center gap-1.5 hover:text-[--color-primary] transition-colors"
      >
        <Lightbulb className="h-3 w-3 shrink-0 text-[--color-text-muted]" />
        <span className="text-[12px] text-[--color-text-secondary] truncate">
          {rel.relatedIdeaTitle}
        </span>
        <ChevronRight className="h-3 w-3 text-[--color-text-muted] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </Link>

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[--color-bg] text-[--color-text-muted] hover:text-[--color-error] transition-all shrink-0"
          title="Remove relationship"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

// ─── Add form ─────────────────────────────────────────────────────────────

function AddRelationshipForm({
  onAdd,
  onCancel,
}: {
  onAdd: (relatedIdeaId: string, type: RelationshipType) => void;
  onCancel: () => void;
}) {
  const [ideaId, setIdeaId] = useState("");
  const [relType, setRelType] = useState<RelationshipType>("RELATED");

  const canSubmit = ideaId.trim().length > 0;

  return (
    <div className="rounded-lg border border-[--color-primary]/30 bg-[--color-card] p-3 flex flex-col gap-2.5">
      <div>
        <label className="block text-[10px] text-[--color-text-muted] uppercase tracking-wide mb-1">
          Idea ID or title
        </label>
        <input
          type="text"
          value={ideaId}
          onChange={(e) => setIdeaId(e.target.value)}
          placeholder="Paste idea ID…"
          autoFocus
          className={cn(
            "w-full rounded border border-[--color-border] bg-[--color-bg]",
            "px-2.5 py-1.5 text-[12px] text-[--color-text-primary]",
            "placeholder:text-[--color-text-muted]",
            "focus:outline-none focus:border-[--color-primary]/50",
            "transition-colors"
          )}
        />
      </div>

      <div>
        <label className="block text-[10px] text-[--color-text-muted] uppercase tracking-wide mb-1">
          Relationship type
        </label>
        <div className="flex flex-wrap gap-1">
          {REL_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.type}
              type="button"
              onClick={() => setRelType(opt.type)}
              className={cn(
                "px-2 py-1 rounded text-[10px] font-medium transition-colors border",
                relType === opt.type
                  ? "border-[--color-primary]/40 bg-[--color-primary]/10 text-[--color-primary]"
                  : "border-[--color-border-subtle] text-[--color-text-muted] hover:border-[--color-border]"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="text-[11px] text-[--color-text-muted] hover:text-[--color-text-secondary] transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => canSubmit && onAdd(ideaId.trim(), relType)}
          disabled={!canSubmit}
          className={cn(
            "px-3 py-1.5 rounded text-[11px] font-medium transition-colors",
            canSubmit
              ? "bg-[--color-primary] text-white hover:opacity-90"
              : "bg-[--color-card] text-[--color-text-muted] border border-[--color-border] cursor-not-allowed"
          )}
        >
          Add Link
        </button>
      </div>
    </div>
  );
}
