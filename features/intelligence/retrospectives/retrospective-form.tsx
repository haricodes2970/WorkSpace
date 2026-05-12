"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ChevronDown, ChevronRight, Trash2, Plus, X } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { RetrospectiveType } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────

export interface RetrospectiveData {
  id: string;
  type: RetrospectiveType;
  title: string;
  period: string | null;
  wentWell: string;
  wentPoorly: string;
  learned: string;
  nextActions: string;
  createdAt: Date;
}

export interface RetrospectiveFormInput {
  type: RetrospectiveType;
  title: string;
  period?: string;
  wentWell: string;
  wentPoorly: string;
  learned: string;
  nextActions: string;
}

interface RetrospectiveFormProps {
  projectId?: string;
  onSave:     (data: RetrospectiveFormInput) => Promise<void>;
  onCancel:   () => void;
  defaultType?: RetrospectiveType;
}

interface RetrospectiveListProps {
  retrospectives: RetrospectiveData[];
  onDelete:       (id: string) => Promise<void>;
  projectId?:     string;
  onAdd:          (data: RetrospectiveFormInput) => Promise<void>;
}

// ─── Config ───────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<RetrospectiveType, { label: string; placeholder: string }> = {
  WEEKLY:         { label: "Weekly",           placeholder: "Week of…" },
  MONTHLY:        { label: "Monthly",          placeholder: "Month…" },
  PROJECT_CLOSE:  { label: "Project Close",    placeholder: "Project name…" },
  IDEA_AUDIT:     { label: "Idea Audit",       placeholder: "Topic…" },
  DECISION_REVIEW:{ label: "Decision Review",  placeholder: "Decision…" },
  QUARTERLY:      { label: "Quarterly",        placeholder: "Q1 2025…" },
};

const RETRO_TYPES: RetrospectiveType[] = [
  "WEEKLY", "MONTHLY", "PROJECT_CLOSE", "QUARTERLY", "DECISION_REVIEW", "IDEA_AUDIT",
];

const inputCls = "w-full rounded-md border border-[--color-border] bg-[--color-input] px-3 py-2 text-[12px] text-[--color-text-primary] placeholder-[--color-text-muted] focus:outline-none focus:border-[--color-primary] resize-none leading-relaxed";

// ─── Form ─────────────────────────────────────────────────────────────────

export function RetrospectiveForm({ onSave, onCancel, defaultType = "WEEKLY" }: RetrospectiveFormProps) {
  const [type,       setType]       = useState<RetrospectiveType>(defaultType);
  const [title,      setTitle]      = useState("");
  const [period,     setPeriod]     = useState("");
  const [wentWell,   setWentWell]   = useState("");
  const [wentPoorly, setWentPoorly] = useState("");
  const [learned,    setLearned]    = useState("");
  const [nextActions,setNextActions]= useState("");
  const [busy,       setBusy]       = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      await onSave({ type, title: title.trim(), period: period.trim() || undefined, wentWell, wentPoorly, learned, nextActions });
    } finally {
      setBusy(false);
    }
  }

  const typeCfg = TYPE_CONFIG[type];

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border border-[--color-border] bg-[--color-card] p-4"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Type selector */}
      <div className="flex flex-wrap gap-1.5">
        {RETRO_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={cn(
              "px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors",
              type === t
                ? "bg-[--color-primary-subtle] border-[--color-primary]/30 text-[--color-text-primary]"
                : "border-[--color-border] text-[--color-text-muted] hover:text-[--color-text-secondary]"
            )}
          >
            {TYPE_CONFIG[t].label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2 sm:col-span-1">
          <label className="text-[10px] text-[--color-text-muted] uppercase tracking-wider mb-1 block">Title *</label>
          <input
            className={inputCls}
            placeholder="Give this retro a name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div>
          <label className="text-[10px] text-[--color-text-muted] uppercase tracking-wider mb-1 block">Period</label>
          <input
            className={inputCls}
            placeholder={typeCfg.placeholder}
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] text-[--color-success] uppercase tracking-wider mb-1 block">What went well?</label>
        <textarea className={cn(inputCls, "min-h-[56px]")} rows={2} placeholder="Wins, momentum, decisions that paid off…" value={wentWell} onChange={(e) => setWentWell(e.target.value)} />
      </div>

      <div>
        <label className="text-[10px] text-[--color-danger] uppercase tracking-wider mb-1 block">What went poorly?</label>
        <textarea className={cn(inputCls, "min-h-[56px]")} rows={2} placeholder="Blockers, mistakes, scope creep, missed estimates…" value={wentPoorly} onChange={(e) => setWentPoorly(e.target.value)} />
      </div>

      <div>
        <label className="text-[10px] text-[--color-accent] uppercase tracking-wider mb-1 block">What did you learn?</label>
        <textarea className={cn(inputCls, "min-h-[56px]")} rows={2} placeholder="Insights, patterns, discoveries, constraints…" value={learned} onChange={(e) => setLearned(e.target.value)} />
      </div>

      <div>
        <label className="text-[10px] text-[--color-warning] uppercase tracking-wider mb-1 block">Next actions</label>
        <textarea className={cn(inputCls, "min-h-[48px]")} rows={2} placeholder="What specifically changes next week / sprint?" value={nextActions} onChange={(e) => setNextActions(e.target.value)} />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className="text-[12px] text-[--color-text-muted] hover:text-[--color-text-secondary]">
          Cancel
        </button>
        <Button size="sm" type="submit" disabled={!title.trim() || busy} className="text-[12px] h-7">
          Save retrospective
        </Button>
      </div>
    </motion.form>
  );
}

// ─── Retrospective Card ───────────────────────────────────────────────────

function RetrospectiveCard({ retro, onDelete }: { retro: RetrospectiveData; onDelete: (id: string) => Promise<void> }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = TYPE_CONFIG[retro.type];

  const sections = [
    { label: "Went well",   color: "text-[--color-success]", content: retro.wentWell },
    { label: "Went poorly", color: "text-[--color-danger]",  content: retro.wentPoorly },
    { label: "Learned",     color: "text-[--color-accent]",  content: retro.learned },
    { label: "Next actions",color: "text-[--color-warning]", content: retro.nextActions },
  ].filter((s) => s.content.trim());

  return (
    <motion.div layout className="rounded-lg border border-[--color-border] bg-[--color-card] overflow-hidden">
      <div
        className="flex items-center gap-2.5 px-4 py-3 cursor-pointer hover:bg-[--color-card-hover] transition-colors group"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded
          ? <ChevronDown className="h-3.5 w-3.5 text-[--color-text-muted] shrink-0" />
          : <ChevronRight className="h-3.5 w-3.5 text-[--color-text-muted] shrink-0" />
        }
        <BookOpen className="h-3.5 w-3.5 text-[--color-text-muted] shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-[--color-text-muted] bg-[--color-card-hover] px-1.5 py-0.5 rounded">
              {cfg.label}
            </span>
            {retro.period && (
              <span className="text-[11px] text-[--color-text-muted]">{retro.period}</span>
            )}
          </div>
          <p className="text-[13px] font-medium text-[--color-text-primary] mt-0.5">{retro.title}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[11px] text-[--color-text-muted]">{formatDate(retro.createdAt)}</span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(retro.id); }}
            className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-[--color-text-muted] hover:text-[--color-danger]"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && sections.length > 0 && (
          <motion.div
            className="px-4 pb-4 border-t border-[--color-border-subtle] grid grid-cols-1 gap-3 pt-3"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {sections.map((s) => (
              <div key={s.label}>
                <p className={cn("text-[10px] font-semibold uppercase tracking-wider mb-1", s.color)}>{s.label}</p>
                <p className="text-[12px] text-[--color-text-secondary] whitespace-pre-wrap leading-relaxed">{s.content}</p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── List with Add ────────────────────────────────────────────────────────

export function RetrospectiveList({ retrospectives, onDelete, onAdd }: RetrospectiveListProps) {
  const [showForm, setShowForm] = useState(false);

  async function handleSave(data: RetrospectiveFormInput) {
    await onAdd(data);
    setShowForm(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5 text-[--color-text-muted]" />
          <span className="text-[11px] text-[--color-text-muted] uppercase tracking-wider font-medium">
            Retrospectives
          </span>
          {retrospectives.length > 0 && (
            <span className="text-[10px] text-[--color-text-muted] opacity-60">{retrospectives.length}</span>
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
          {showForm ? "Cancel" : "New"}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <RetrospectiveForm onSave={handleSave} onCancel={() => setShowForm(false)} />
        )}
      </AnimatePresence>

      {retrospectives.length === 0 && !showForm ? (
        <div className="flex flex-col items-center py-10 text-center rounded-lg border border-dashed border-[--color-border]">
          <BookOpen className="h-7 w-7 text-[--color-text-muted] opacity-25 mb-2" />
          <p className="text-[12px] text-[--color-text-muted]">No retrospectives yet</p>
          <p className="text-[11px] text-[--color-text-muted] opacity-70 mt-0.5">
            Reflect on what worked, what didn't, and what changed.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {retrospectives.map((r) => (
            <RetrospectiveCard key={r.id} retro={r} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
