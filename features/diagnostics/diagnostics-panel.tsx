"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2 } from "lucide-react";
import {
  getMetrics,
  getAverageLatency,
  clearMetrics,
  subscribeToDiagnostics,
  type Metric,
} from "./diagnostics-store";

const TRACKED_NAMES = ["autosave", "search", "command-open", "page-load", "tab-switch"];

function AvgRow({ name }: { name: string }) {
  const avg = getAverageLatency(name);
  if (avg === null) return null;

  const color =
    avg < 120  ? "text-[--color-success]" :
    avg < 300  ? "text-[--color-warning]" :
    "text-[--color-danger]";

  return (
    <div className="flex items-center justify-between py-1 border-b border-[--color-border-subtle] last:border-0">
      <span className="text-[11px] text-[--color-text-muted]">{name}</span>
      <span className={`text-[11px] font-mono tabular-nums ${color}`}>{avg}ms avg</span>
    </div>
  );
}

function MetricRow({ metric }: { metric: Metric }) {
  const color =
    metric.unit === "ms" && metric.value > 300 ? "text-[--color-danger]" :
    metric.unit === "ms" && metric.value > 150 ? "text-[--color-warning]" :
    "text-[--color-text-secondary]";

  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="text-[10px] text-[--color-text-muted] w-28 truncate shrink-0">
        {metric.name}
      </span>
      <span className={`text-[10px] font-mono tabular-nums ${color}`}>
        {metric.value}{metric.unit}
      </span>
      <span className="text-[10px] text-[--color-text-muted] ml-auto">
        {new Date(metric.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </span>
    </div>
  );
}

export function DiagnosticsPanel() {
  const [open, setOpen] = useState(false);
  const [, forceUpdate] = useState(0);

  const refresh = useCallback(() => forceUpdate((n) => n + 1), []);

  // Dev-only keyboard shortcut: ⌘⌥D
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.altKey && e.key === "d") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    return subscribeToDiagnostics(refresh);
  }, [refresh]);

  if (process.env.NODE_ENV !== "development") return null;

  const metrics = getMetrics();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.15 }}
          className="fixed bottom-4 right-4 z-[200] w-72 rounded-xl border border-[--color-border] bg-[--color-panel] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-[--color-border-subtle]">
            <span className="text-[11px] font-semibold text-[--color-text-muted] uppercase tracking-wider">
              Diagnostics
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => { clearMetrics(); refresh(); }}
                className="p-1 text-[--color-text-muted] hover:text-[--color-text-secondary] transition-colors"
                title="Clear"
              >
                <Trash2 className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 text-[--color-text-muted] hover:text-[--color-text-secondary] transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Averages */}
          <div className="px-3 py-2 border-b border-[--color-border-subtle]">
            <p className="text-[10px] uppercase tracking-wider text-[--color-text-muted] mb-1.5">Averages</p>
            {TRACKED_NAMES.map((name) => <AvgRow key={name} name={name} />)}
            {TRACKED_NAMES.every((n) => getAverageLatency(n) === null) && (
              <p className="text-[11px] text-[--color-text-muted]">No data yet.</p>
            )}
          </div>

          {/* Recent events */}
          <div className="px-3 py-2 max-h-48 overflow-y-auto">
            <p className="text-[10px] uppercase tracking-wider text-[--color-text-muted] mb-1.5">
              Recent ({metrics.length})
            </p>
            {metrics.length === 0
              ? <p className="text-[11px] text-[--color-text-muted]">No events recorded.</p>
              : metrics.slice(0, 20).map((m, i) => <MetricRow key={i} metric={m} />)
            }
          </div>

          <div className="px-3 py-2 border-t border-[--color-border-subtle]">
            <p className="text-[10px] text-[--color-text-muted]">⌘⌥D to toggle · dev only</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
