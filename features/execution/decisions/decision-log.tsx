"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitCommit, Plus, ChevronDown, ChevronRight,
  RotateCcw, X, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────

export interface DecisionData {
  id: string;
  title: string;
  context: string;
  decision: string;
  alternatives: string;
  tradeoffs: string;
  reversed: boolean;
  reversalNote: string | null;
  createdAt: Date;
}

export interface DecisionFormInput {
  title: string;
  context: string;
  decision: string;
  alternatives: string;
  tradeoffs: string;
}

interface DecisionLogProps {
  decisions: DecisionData[];
  onAdd: (data: DecisionFormInput) => Promise<void>;
  onReverse: (id: string, note: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────

export function DecisionLog({ decisions, onAdd, onReverse, onDelete, className }: DecisionLogProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] text-[--color-text-muted] uppercase tracking-wider font-medium">
          Decisions
        </span>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 text-[11px] text-[--color-primary] hover:opacity-80 transition-opacity"
          >
            <Plus className="h-3 w-3" />
            Log decision
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="rounded-lg border border-[--color-primary]/30 bg-[--color-card] p-4">
              <DecisionForm
                onSubmit={async (data) => {
                  await onAdd(data);
                  setShowForm(false);
                }}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {decisions.length === 0 && !showForm ? (
        <div className="flex flex-col items-center py-8 rounded-lg border border-dashed border-[--color-border]">
          <GitCommit className="h-6 w-6 text-[--color-text-muted] opacity-30 mb-2" />
          <p className="text-[11px] text-[--color-text-muted]">
            No decisions logged yet
          </p>
          <p className="text-[10px] text-[--color-text-muted] mt-0.5">
            Log the why behind every major call
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {decisions.map((d, i) => (
            <DecisionCard
              key={d.id}
              decision={d}
              animDelay={i * 0.04}
              onReverse={onReverse}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Decision form ────────────────────────────────────────────────────────

function DecisionForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: DecisionFormInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [data, setData] = useState<DecisionFormInput>({
    title: "",
    context: "",
    decision: "",
    alternatives: "",
    tradeoffs: "",
  });
  const [saving, setSaving] = useState(false);

  const set = (key: keyof DecisionFormInput, value: string) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const canSubmit = data.title.trim() && data.decision.trim();

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      await onSubmit(data);
    } finally {
      setSaving(false);
    }
  }, [data, canSubmit, onSubmit]);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12px] font-medium text-[--color-text-secondary]">
        Log a decision
      </p>

      <Field label="What was decided?" required>
        <input
          autoFocus
          value={data.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Use JWT instead of sessions"
          className={inputClass}
        />
      </Field>

      <Field label="Context / Why now?">
        <textarea
          value={data.context}
          onChange={(e) => set("context", e.target.value)}
          placeholder="What information or constraints led to this decision?"
          rows={2}
          className={cn(inputClass, "resize-none")}
        />
      </Field>

      <Field label="The decision" required>
        <textarea
          value={data.decision}
          onChange={(e) => set("decision", e.target.value)}
          placeholder="We will use JWT tokens stored in httpOnly cookies…"
          rows={3}
          className={cn(inputClass, "resize-none")}
        />
      </Field>

      <Field label="Alternatives considered">
        <textarea
          value={data.alternatives}
          onChange={(e) => set("alternatives", e.target.value)}
          placeholder="Sessions with Redis (rejected: ops overhead). Supabase auth (rejected: coupling)."
          rows={2}
          className={cn(inputClass, "resize-none")}
        />
      </Field>

      <Field label="Tradeoffs">
        <textarea
          value={data.tradeoffs}
          onChange={(e) => set("tradeoffs", e.target.value)}
          placeholder="Gains: stateless, horizontal scale. Costs: token revocation complexity."
          rows={2}
          className={cn(inputClass, "resize-none")}
        />
      </Field>

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
          onClick={handleSubmit}
          disabled={!canSubmit || saving}
          className={cn(
            "px-3 py-1.5 rounded text-[11px] font-medium transition-colors",
            canSubmit
              ? "bg-[--color-primary] text-white hover:opacity-90"
              : "bg-[--color-card] text-[--color-text-muted] border border-[--color-border] cursor-not-allowed"
          )}
        >
          {saving ? "Saving…" : "Log decision"}
        </button>
      </div>
    </div>
  );
}

const inputClass = cn(
  "w-full rounded-md border border-[--color-border] bg-[--color-bg]",
  "px-2.5 py-1.5 text-[12px] text-[--color-text-primary]",
  "placeholder:text-[--color-text-muted]",
  "focus:outline-none focus:border-[--color-primary]/50",
  "transition-colors"
);

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[10px] font-medium text-[--color-text-muted] uppercase tracking-wide mb-1">
        {label}
        {required && <span className="ml-0.5 text-[--color-error]">*</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Decision card ────────────────────────────────────────────────────────

function DecisionCard({
  decision,
  animDelay,
  onReverse,
  onDelete,
}: {
  decision: DecisionData;
  animDelay: number;
  onReverse: (id: string, note: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showReversal, setShowReversal] = useState(false);
  const [reversalNote, setReversalNote] = useState("");
  const [reversing, setReversing] = useState(false);

  const handleReverse = async () => {
    setReversing(true);
    try {
      await onReverse(decision.id, reversalNote);
      setShowReversal(false);
    } finally {
      setReversing(false);
    }
  };

  return (
    <motion.div
      className={cn(
        "rounded-lg border overflow-hidden",
        decision.reversed
          ? "border-[--color-border-subtle] opacity-60"
          : "border-[--color-border]"
      )}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: decision.reversed ? 0.6 : 1, y: 0 }}
      transition={{ delay: animDelay, duration: 0.15 }}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2.5 px-4 py-3 bg-[--color-card] hover:bg-[--color-card-hover] transition-colors text-left"
      >
        <GitCommit className={cn(
          "h-3.5 w-3.5 shrink-0",
          decision.reversed ? "text-[--color-text-muted]" : "text-[--color-primary]"
        )} />

        <span className={cn(
          "flex-1 text-[12px] font-medium truncate",
          decision.reversed ? "line-through text-[--color-text-muted]" : "text-[--color-text-primary]"
        )}>
          {decision.title}
        </span>

        {decision.reversed && (
          <span className="text-[10px] text-[--color-error] shrink-0">reversed</span>
        )}

        <span className="text-[10px] text-[--color-text-muted] shrink-0">
          {formatRelativeTime(decision.createdAt)}
        </span>

        {expanded ? (
          <ChevronDown className="h-3 w-3 text-[--color-text-muted] shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 text-[--color-text-muted] shrink-0" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-[--color-border-subtle] bg-[--color-bg] flex flex-col gap-2.5">
              {[
                { label: "Decision", value: decision.decision },
                { label: "Context", value: decision.context },
                { label: "Alternatives", value: decision.alternatives },
                { label: "Tradeoffs", value: decision.tradeoffs },
              ]
                .filter((s) => s.value.trim())
                .map((s) => (
                  <div key={s.label}>
                    <p className="text-[10px] font-medium text-[--color-text-muted] uppercase tracking-wide mb-0.5">
                      {s.label}
                    </p>
                    <p className="text-[12px] text-[--color-text-secondary] whitespace-pre-wrap leading-relaxed">
                      {s.value}
                    </p>
                  </div>
                ))}

              {decision.reversalNote && (
                <div className="flex items-start gap-2 rounded-md bg-[--color-error]/10 border border-[--color-error]/20 px-3 py-2">
                  <RotateCcw className="h-3.5 w-3.5 text-[--color-error] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[--color-error]">{decision.reversalNote}</p>
                </div>
              )}

              {/* Reversal form */}
              {showReversal && (
                <div className="flex flex-col gap-2 rounded-md border border-[--color-warning]/30 bg-[--color-warning]/5 px-3 py-2.5">
                  <p className="text-[11px] font-medium text-[--color-warning]">
                    Why was this reversed?
                  </p>
                  <textarea
                    autoFocus
                    value={reversalNote}
                    onChange={(e) => setReversalNote(e.target.value)}
                    placeholder="New information, changed constraints, failed assumption…"
                    rows={2}
                    className={cn(inputClass, "resize-none")}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleReverse}
                      disabled={reversing}
                      className="px-3 py-1 rounded text-[10px] font-medium bg-[--color-warning] text-black hover:opacity-90 disabled:opacity-60 transition-opacity"
                    >
                      {reversing ? "Saving…" : "Confirm reversal"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReversal(false)}
                      className="text-[10px] text-[--color-text-muted] hover:text-[--color-text-secondary]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              {!decision.reversed && !showReversal && (
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowReversal(true)}
                    className="flex items-center gap-1 text-[10px] text-[--color-text-muted] hover:text-[--color-warning] transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Mark reversed
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(decision.id)}
                    className="flex items-center gap-1 text-[10px] text-[--color-text-muted] hover:text-[--color-error] transition-colors ml-auto"
                  >
                    <X className="h-3 w-3" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
