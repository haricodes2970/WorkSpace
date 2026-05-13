"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, X, ChevronDown, ChevronRight, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EntityType, GraphRelationshipType } from "@prisma/client";
import type { GraphEdge } from "./graph.repository";

// ─── Types ────────────────────────────────────────────────────────────────

interface GraphLinksProps {
  edges:       GraphEdge[];
  onUnlink:    (id: string) => Promise<void>;
  onAddLink?:  (targetType: EntityType, targetId: string, type: GraphRelationshipType, note?: string) => Promise<void>;
  className?:  string;
}

// ─── Config ───────────────────────────────────────────────────────────────

const ENTITY_CONFIG: Record<EntityType, { label: string; color: string }> = {
  IDEA:             { label: "Idea",             color: "text-[--color-warning]" },
  PROJECT:          { label: "Project",          color: "text-[--color-accent]" },
  DECISION:         { label: "Decision",         color: "text-[--color-text-secondary]" },
  WEEKLY_REVIEW:    { label: "Review",           color: "text-[--color-text-muted]" },
  NOTE:             { label: "Note",             color: "text-[--color-text-muted]" },
  KNOWLEDGE_MEMORY: { label: "Memory",           color: "text-[--color-primary]" },
  MILESTONE:        { label: "Milestone",        color: "text-[--color-success]" },
  BLOCKER:          { label: "Blocker",          color: "text-[--color-danger]" },
  TASK:             { label: "Task",             color: "text-[--color-text-muted]" },
  SCOPE_ITEM:       { label: "Scope Item",       color: "text-[--color-text-muted]" },
  RISK:             { label: "Risk",             color: "text-[--color-warning]" },
  RETROSPECTIVE:    { label: "Retrospective",    color: "text-[--color-text-muted]" },
  STRATEGIC_REVIEW: { label: "Strategic Review", color: "text-[--color-text-muted]" },
};

const REL_LABELS: Record<GraphRelationshipType, string> = {
  RELATED_TO:   "related to",
  INSPIRED_BY:  "inspired by",
  BLOCKED_BY:   "blocked by",
  DUPLICATES:   "duplicates",
  EVOLVED_INTO: "evolved into",
  REFERENCES:   "references",
  CONTRADICTS:  "contradicts",
  DEPENDS_ON:   "depends on",
  VALIDATES:    "validates",
  REPLACES:     "replaces",
};

// ─── Edge Row ─────────────────────────────────────────────────────────────

function EdgeRow({ edge, onUnlink }: { edge: GraphEdge; onUnlink: (id: string) => Promise<void> }) {
  const cfg    = ENTITY_CONFIG[edge.peer.entityType];
  const relLabel = REL_LABELS[edge.type];

  return (
    <motion.div
      layout
      className="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[--color-card-hover] transition-colors"
    >
      <span className="text-[--color-text-muted] shrink-0">
        {edge.direction === "outgoing"
          ? <ArrowRight className="h-3 w-3" />
          : <ArrowLeft className="h-3 w-3" />
        }
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[9px] font-medium uppercase tracking-wider text-[--color-text-muted]">
            {relLabel}
          </span>
          <span className={cn("text-[11px] font-medium truncate", cfg.color)}>
            {edge.peer.label}
          </span>
          {edge.peer.sublabel && (
            <span className="text-[9px] text-[--color-text-muted] bg-[--color-card] border border-[--color-border-subtle] px-1.5 py-0.5 rounded-full">
              {edge.peer.sublabel}
            </span>
          )}
        </div>
        {edge.note && (
          <p className="text-[10px] text-[--color-text-muted] mt-0.5 leading-snug line-clamp-1">{edge.note}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onUnlink(edge.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-[--color-text-muted] hover:text-[--color-danger]"
        title="Remove link"
      >
        <X className="h-3 w-3" />
      </button>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────

export function GraphLinks({ edges, onUnlink, className }: GraphLinksProps) {
  const [expanded, setExpanded] = useState(edges.length > 0);

  const grouped = edges.reduce<Record<string, GraphEdge[]>>((acc, e) => {
    const k = e.peer.entityType;
    if (!acc[k]) acc[k] = [];
    acc[k].push(e);
    return acc;
  }, {});

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 w-full text-left py-1"
      >
        <Link2 className="h-3.5 w-3.5 text-[--color-text-muted]" />
        <span className="text-[11px] text-[--color-text-muted] uppercase tracking-wider font-medium flex-1">
          Connections
        </span>
        <span className="text-[10px] text-[--color-text-muted] opacity-60 mr-1">{edges.length}</span>
        {expanded
          ? <ChevronDown className="h-3 w-3 text-[--color-text-muted]" />
          : <ChevronRight className="h-3 w-3 text-[--color-text-muted]" />
        }
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="flex flex-col gap-1"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
          >
            {edges.length === 0 ? (
              <div className="flex items-center gap-2 px-2 py-2 rounded-md border border-dashed border-[--color-border]">
                <Link2 className="h-3.5 w-3.5 text-[--color-text-muted] opacity-40" />
                <span className="text-[11px] text-[--color-text-muted]">No connections yet</span>
              </div>
            ) : (
              Object.entries(grouped).map(([entityType, groupEdges]) => {
                const cfg = ENTITY_CONFIG[entityType as EntityType];
                return (
                  <div key={entityType}>
                    <p className={cn("text-[9px] font-semibold uppercase tracking-wider px-2 mb-0.5", cfg.color)}>
                      {cfg.label}
                    </p>
                    {groupEdges.map((e) => (
                      <EdgeRow key={e.id} edge={e} onUnlink={onUnlink} />
                    ))}
                  </div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
