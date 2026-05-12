"use client";

import { X, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { AdvisorSignal } from "../types";

interface SignalCardProps {
  signal: AdvisorSignal;
  onDismiss?: (id: string) => void;
}

const severityStyles = {
  info:     "border-blue-500/20 bg-blue-500/5",
  warning:  "border-yellow-500/20 bg-yellow-500/5",
  critical: "border-red-500/20 bg-red-500/5",
};

const severityBadge = {
  info:     "text-blue-400 bg-blue-400/10",
  warning:  "text-yellow-400 bg-yellow-400/10",
  critical: "text-red-400 bg-red-400/10",
};

const typeLabels: Record<string, string> = {
  REPEATED_FAILURE:     "Failure pattern",
  SCOPE_INFLATION:      "Scope inflation",
  MOMENTUM_DECAY_RISK:  "Momentum decay",
  BLOCKER_RECURRENCE:   "Blocker recurrence",
  REVIEW_INCONSISTENCY: "Review gap",
  EXECUTION_BOTTLENECK: "Bottleneck",
  FAILURE_RISK:         "Failure risk",
  MVP_DRIFT:            "MVP drift",
  MISSING_ASSUMPTION:   "Missing assumption",
  SCOPE_COMPRESSION:    "Scope compression",
};

export function SignalCard({ signal, onDismiss }: SignalCardProps) {
  return (
    <div className={`rounded-lg border p-4 space-y-2 ${severityStyles[signal.severity]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityBadge[signal.severity]}`}>
              {signal.severity.toUpperCase()}
            </span>
            <span className="text-xs text-white/40">{typeLabels[signal.type] ?? signal.type}</span>
            {signal.projectTitle && (
              <span className="text-xs text-white/30">{signal.projectTitle}</span>
            )}
          </div>
          <p className="text-sm font-medium text-white">{signal.title}</p>
        </div>
        {signal.dismissible && onDismiss && (
          <button
            onClick={() => onDismiss(signal.id)}
            className="text-white/30 hover:text-white/60 transition-colors shrink-0 mt-0.5"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <p className="text-xs text-white/55 leading-relaxed">{signal.body}</p>

      <div className="flex items-center gap-3 pt-1">
        <div className="flex items-center gap-1 text-xs text-white/25">
          <span>Confidence</span>
          <div className="h-1 w-12 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-white/30"
              style={{ width: `${signal.confidence}%` }}
            />
          </div>
          <span>{signal.confidence}%</span>
        </div>

        {signal.actionLabel && signal.actionHref && (
          <Link
            href={signal.actionHref}
            className="ml-auto flex items-center gap-1 text-xs text-white/60 hover:text-white transition-colors"
          >
            {signal.actionLabel}
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
