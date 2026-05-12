"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lightbulb, AlertTriangle, AlertCircle, TrendingDown, Package, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InsightType, InsightSeverity } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────

export interface InsightData {
  id: string;
  type: InsightType;
  title: string;
  body: string;
  severity: InsightSeverity;
  generatedAt: Date;
}

interface InsightCardsProps {
  insights:   InsightData[];
  onDismiss:  (id: string) => Promise<void>;
  onRefresh?: () => Promise<void>;
  compact?:   boolean;
  className?: string;
}

// ─── Config ───────────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<InsightSeverity, { border: string; bg: string; icon: React.ReactNode }> = {
  INFO:     { border: "border-[--color-border]",          bg: "bg-[--color-card]",          icon: <Lightbulb className="h-3.5 w-3.5 text-[--color-accent]" /> },
  WARNING:  { border: "border-[--color-warning]/30",      bg: "bg-[--color-warning]/5",      icon: <AlertTriangle className="h-3.5 w-3.5 text-[--color-warning]" /> },
  CRITICAL: { border: "border-[--color-danger]/30",       bg: "bg-[--color-danger]/5",       icon: <AlertCircle className="h-3.5 w-3.5 text-[--color-danger]" /> },
};

const TYPE_ICON: Record<InsightType, React.ReactNode> = {
  BLOCKER_PATTERN:     <AlertCircle className="h-3 w-3" />,
  SCOPE_INFLATION:     <Package className="h-3 w-3" />,
  MOMENTUM_DECAY:      <TrendingDown className="h-3 w-3" />,
  ABANDONED_PATTERN:   <AlertTriangle className="h-3 w-3" />,
  EXECUTION_BOTTLENECK:<AlertTriangle className="h-3 w-3" />,
  REVIEW_BENEFIT:      <Lightbulb className="h-3 w-3" />,
  DECISION_REVERSAL:   <RefreshCw className="h-3 w-3" />,
  VELOCITY_TREND:      <TrendingDown className="h-3 w-3" />,
};

// ─── Single Insight Card ──────────────────────────────────────────────────

function InsightCard({
  insight,
  onDismiss,
  compact,
}: {
  insight:   InsightData;
  onDismiss: (id: string) => Promise<void>;
  compact:   boolean;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);
  const { border, bg, icon } = SEVERITY_CONFIG[insight.severity];

  async function handleDismiss() {
    setBusy(true);
    setDismissed(true);
    await onDismiss(insight.id).catch(() => setDismissed(false));
    setBusy(false);
  }

  if (dismissed) return null;

  return (
    <motion.div
      layout
      className={cn(
        "rounded-lg border p-3 flex gap-2.5",
        border,
        bg
      )}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
    >
      <span className="shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-[--color-text-primary] leading-snug">{insight.title}</p>
        {!compact && (
          <p className="text-[11px] text-[--color-text-muted] mt-1 leading-relaxed">{insight.body}</p>
        )}
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        disabled={busy}
        className="shrink-0 p-0.5 rounded text-[--color-text-muted] hover:text-[--color-text-secondary] hover:bg-[--color-card-hover] transition-colors mt-0.5"
        title="Dismiss"
      >
        <X className="h-3 w-3" />
      </button>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────

export function InsightCards({ insights, onDismiss, onRefresh, compact = false, className }: InsightCardsProps) {
  const [refreshing, setRefreshing] = useState(false);

  const sorted = [...insights].sort((a, b) => {
    const sev = { CRITICAL: 3, WARNING: 2, INFO: 1 };
    return (sev[b.severity] ?? 0) - (sev[a.severity] ?? 0);
  });

  const visible = compact ? sorted.slice(0, 3) : sorted;

  async function handleRefresh() {
    if (!onRefresh) return;
    setRefreshing(true);
    await onRefresh().catch(() => null);
    setRefreshing(false);
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Lightbulb className="h-3.5 w-3.5 text-[--color-text-muted]" />
          <span className="text-[11px] text-[--color-text-muted] uppercase tracking-wider font-medium">
            Signals
          </span>
          {sorted.length > 0 && (
            <span className="text-[10px] tabular-nums text-[--color-text-muted] opacity-60">
              {sorted.length}
            </span>
          )}
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1 rounded text-[--color-text-muted] hover:text-[--color-text-secondary] hover:bg-[--color-card] transition-colors"
            title="Refresh signals"
          >
            <RefreshCw className={cn("h-3 w-3", refreshing && "animate-spin")} />
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center py-5 rounded-lg border border-dashed border-[--color-border]">
          <Lightbulb className="h-5 w-5 text-[--color-text-muted] opacity-25 mb-1.5" />
          <p className="text-[11px] text-[--color-text-muted]">No signals right now</p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {visible.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onDismiss={onDismiss}
              compact={compact}
            />
          ))}
        </AnimatePresence>
      )}

      {compact && sorted.length > 3 && (
        <p className="text-[10px] text-[--color-text-muted] text-center">
          +{sorted.length - 3} more signals
        </p>
      )}
    </div>
  );
}
