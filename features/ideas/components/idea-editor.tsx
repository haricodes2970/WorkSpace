"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, ChevronDown, Tag, X, ArrowRight,
  Check, Circle, Clock, Zap, Lightbulb, AlertCircle,
  Save, Pin, Archive, MoreHorizontal, ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn, formatRelativeTime } from "@/lib/utils";
import { motionPresets } from "@/lib/design-tokens";
import type { IdeaStatus } from "@prisma/client";

/* ─── Types ──────────────────────────────────────────────────────────────── */

export interface IdeaEditorData {
  id: string;
  title: string;
  status: IdeaStatus;
  tags: string[];
  pinned: boolean;
  updatedAt: Date;
  sections: IdeaSections;
}

export interface IdeaSections {
  theme: string;
  problemStatement: string;
  targetUser: string;
  painPoints: string;
  marketGap: string;
  features: string;
  executionNotes: string;
}

export interface ConversionReadiness {
  hasProblem: boolean;
  hasUser: boolean;
  hasDifferentiation: boolean;
  hasFeatures: boolean;
  hasExecutionPlan: boolean;
}

interface IdeaEditorProps {
  idea: IdeaEditorData;
  onSave: (data: Partial<IdeaEditorData>) => Promise<void>;
  onConvert: () => void;
  onArchive: () => void;
  readOnly?: boolean;
}

/* ─── Section definitions ────────────────────────────────────────────────── */

const SECTIONS = [
  {
    id: "theme" as const,
    label: "Theme",
    placeholder: "One line: what is this idea fundamentally about?",
    hint: "Distill the core concept.",
    rows: 2,
  },
  {
    id: "problemStatement" as const,
    label: "Problem Statement",
    placeholder: "What problem does this solve? Who feels this pain?",
    hint: "Be specific. Vague problems create vague solutions.",
    rows: 4,
  },
  {
    id: "targetUser" as const,
    label: "Target User",
    placeholder: "Who is this for? Paint a picture of the person.",
    hint: "Solo devs, small teams, enterprises? Be precise.",
    rows: 3,
  },
  {
    id: "painPoints" as const,
    label: "Pain Points",
    placeholder: "- Current tools are too heavy\n- Takes too many steps\n- No offline support",
    hint: "Bullet list. Each point = a reason someone switches.",
    rows: 4,
  },
  {
    id: "marketGap" as const,
    label: "Market Gap",
    placeholder: "What do existing solutions miss? Why now?",
    hint: "The timing question is often the hardest.",
    rows: 3,
  },
  {
    id: "features" as const,
    label: "Core Features",
    placeholder: "- [ ] Feature 1\n- [ ] Feature 2\n- [ ] Feature 3",
    hint: "Minimum viable feature set. Not a roadmap.",
    rows: 5,
  },
  {
    id: "executionNotes" as const,
    label: "Execution Notes",
    placeholder: "Tech stack ideas, risks, open questions, links...",
    hint: "Thinking out loud. No format required.",
    rows: 4,
  },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

/* ─── Readiness Calculator ───────────────────────────────────────────────── */

function calcReadiness(sections: IdeaSections): ConversionReadiness & { score: number } {
  const r = {
    hasProblem: sections.problemStatement.trim().length > 30,
    hasUser: sections.targetUser.trim().length > 20,
    hasDifferentiation: sections.marketGap.trim().length > 20,
    hasFeatures: sections.features.trim().length > 20,
    hasExecutionPlan: sections.executionNotes.trim().length > 10,
  };
  const score = Math.round(
    (Object.values(r).filter(Boolean).length / 5) * 100
  );
  return { ...r, score };
}

const READINESS_LABELS: Record<keyof ConversionReadiness, string> = {
  hasProblem: "Problem defined",
  hasUser: "Target user defined",
  hasDifferentiation: "Market gap identified",
  hasFeatures: "Core features listed",
  hasExecutionPlan: "Execution notes added",
};

/* ─── Save status indicator ──────────────────────────────────────────────── */

type SaveStatus = "idle" | "saving" | "saved" | "error";

/* ─── Main Component ─────────────────────────────────────────────────────── */

export function IdeaEditor({ idea, onSave, onConvert, onArchive }: IdeaEditorProps) {
  const [title, setTitle] = useState(idea.title);
  const [sections, setSections] = useState<IdeaSections>(idea.sections);
  const [tags, setTags] = useState<string[]>(idea.tags);
  const [tagInput, setTagInput] = useState("");
  const [collapsed, setCollapsed] = useState<Set<SectionId>>(new Set());
  const [activeSection, setActiveSection] = useState<SectionId | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const readiness = calcReadiness(sections);

  // Autosave debounce
  const scheduleAutoSave = useCallback(() => {
    clearTimeout(saveTimer.current);
    setSaveStatus("saving");
    saveTimer.current = setTimeout(async () => {
      try {
        await onSave({ title, sections, tags });
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch {
        setSaveStatus("error");
      }
    }, 1200);
  }, [title, sections, tags, onSave]);

  useEffect(() => {
    scheduleAutoSave();
    return () => clearTimeout(saveTimer.current);
  }, [scheduleAutoSave]);

  const updateSection = (id: SectionId, value: string) => {
    setSections((prev) => ({ ...prev, [id]: value }));
  };

  const toggleCollapse = (id: SectionId) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t) && tags.length < 10) setTags((prev) => [...prev, t]);
    setTagInput("");
  };

  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left outline panel ── */}
      <aside className="hidden lg:flex w-44 xl:w-48 flex-col border-r border-[--color-border-subtle] bg-[--color-panel] shrink-0 overflow-y-auto">
        <div className="p-3 border-b border-[--color-border-subtle]">
          <p className="text-[11px] font-medium text-[--color-text-muted] uppercase tracking-wider">
            Sections
          </p>
        </div>
        <nav className="p-1.5 flex flex-col gap-0.5">
          {SECTIONS.map(({ id, label }) => {
            const filled = sections[id].trim().length > 0;
            const isCollapsed = collapsed.has(id);
            return (
              <button
                key={id}
                onClick={() => {
                  document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  if (isCollapsed) toggleCollapse(id);
                }}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] text-left transition-colors",
                  activeSection === id
                    ? "bg-[--color-primary-subtle] text-[--color-text-primary]"
                    : "text-[--color-text-muted] hover:text-[--color-text-secondary] hover:bg-[--color-card]"
                )}
              >
                {filled ? (
                  <Check className="h-3 w-3 text-[--color-success] shrink-0" />
                ) : (
                  <Circle className="h-3 w-3 shrink-0 opacity-30" />
                )}
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Readiness score */}
        <div className="mt-auto p-3 border-t border-[--color-border-subtle]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-[--color-text-muted]">Readiness</span>
            <span className="text-[11px] font-semibold text-[--color-text-primary]">
              {readiness.score}%
            </span>
          </div>
          <Progress value={readiness.score} className="h-1" />
        </div>
      </aside>

      {/* ── Main editor ── */}
      <div className="flex-1 overflow-y-auto min-w-0">
        {/* Title area */}
        <div className="sticky top-0 z-10 bg-[--color-bg] border-b border-[--color-border-subtle] px-6 py-4">
          <div className="flex items-start justify-between gap-4 max-w-3xl">
            <div className="flex-1 min-w-0">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Idea title..."
                className="w-full bg-transparent text-[22px] font-semibold text-[--color-text-primary] placeholder:text-[--color-text-muted] outline-none"
              />
              <div className="flex items-center gap-3 mt-1.5">
                <Badge variant={
                  idea.status === "READY" ? "success"
                  : idea.status === "REFINING" ? "warning"
                  : idea.status === "CONVERTED" ? "primary"
                  : idea.status === "ARCHIVED" ? "outline"
                  : "default"
                } dot className="text-[11px]">
                  {idea.status.charAt(0) + idea.status.slice(1).toLowerCase()}
                </Badge>
                <span className="text-[11px] text-[--color-text-muted] flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatRelativeTime(idea.updatedAt)}
                </span>
                <AutoSaveIndicator status={saveStatus} />
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {readiness.score >= 80 && idea.status !== "CONVERTED" && (
                <Button
                  size="sm"
                  onClick={onConvert}
                  className="gap-1.5 text-[12px] h-7"
                >
                  <Zap className="h-3.5 w-3.5" />
                  Convert to Project
                </Button>
              )}
              <button
                onClick={onArchive}
                className="p-1.5 rounded-md text-[--color-text-muted] hover:text-[--color-text-secondary] hover:bg-[--color-card] transition-colors"
                title="Archive"
              >
                <Archive className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1.5 mt-3 max-w-3xl">
            <Tag className="h-3.5 w-3.5 text-[--color-text-muted] shrink-0" />
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full border border-[--color-border] bg-[--color-card] px-2 py-0.5 text-[11px] text-[--color-text-secondary]"
              >
                {tag}
                <button type="button" onClick={() => removeTag(tag)}>
                  <X className="h-2.5 w-2.5 text-[--color-text-muted] hover:text-[--color-text-primary]" />
                </button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); }
              }}
              placeholder={tags.length === 0 ? "Add tags..." : ""}
              className="bg-transparent text-[12px] text-[--color-text-secondary] placeholder:text-[--color-text-muted] outline-none min-w-[80px]"
            />
          </div>
        </div>

        {/* Sections */}
        <div className="px-6 py-5 flex flex-col gap-2 max-w-3xl">
          {SECTIONS.map(({ id, label, placeholder, hint, rows }) => {
            const isCollapsed = collapsed.has(id);
            const filled = sections[id].trim().length > 0;

            return (
              <motion.section
                key={id}
                id={`section-${id}`}
                className="rounded-lg border border-[--color-border-subtle] overflow-hidden"
                layout
              >
                {/* Section header */}
                <button
                  onClick={() => toggleCollapse(id)}
                  onFocus={() => setActiveSection(id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors",
                    isCollapsed
                      ? "bg-[--color-card] hover:bg-[--color-card-hover]"
                      : "bg-[--color-card]"
                  )}
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-3.5 w-3.5 text-[--color-text-muted] shrink-0" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-[--color-text-muted] shrink-0" />
                  )}
                  <span className="flex-1 text-[13px] font-medium text-[--color-text-primary]">
                    {label}
                  </span>
                  {filled && isCollapsed && (
                    <Check className="h-3.5 w-3.5 text-[--color-success] shrink-0" />
                  )}
                  {!filled && (
                    <span className="text-[11px] text-[--color-text-muted]">Empty</span>
                  )}
                </button>

                {/* Section body */}
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-2 bg-[--color-bg]">
                        {hint && (
                          <p className="text-[11px] text-[--color-text-muted] mb-2 italic">
                            {hint}
                          </p>
                        )}
                        <Textarea
                          value={sections[id]}
                          onChange={(e) => updateSection(id, e.target.value)}
                          placeholder={placeholder}
                          rows={rows}
                          autoResize
                          onFocus={() => setActiveSection(id)}
                          onBlur={() => setActiveSection(null)}
                          className="bg-transparent border-0 focus:ring-0 focus:border-0 p-0 text-[13px] leading-relaxed text-[--color-text-secondary] placeholder:text-[--color-text-muted] font-[var(--font-mono)]"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.section>
            );
          })}
        </div>
      </div>

      {/* ── Right metadata panel ── */}
      <aside className="hidden xl:flex w-56 flex-col border-l border-[--color-border-subtle] bg-[--color-panel] shrink-0 overflow-y-auto">
        <div className="p-3 border-b border-[--color-border-subtle]">
          <p className="text-[11px] font-medium text-[--color-text-muted] uppercase tracking-wider">
            Conversion Readiness
          </p>
        </div>

        <div className="p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[13px] font-semibold text-[--color-text-primary]">
              {readiness.score}%
            </span>
            <span className="text-[11px] text-[--color-text-muted]">
              {readiness.score >= 80 ? "Ready to ship" : readiness.score >= 50 ? "Getting there" : "Keep going"}
            </span>
          </div>
          <Progress
            value={readiness.score}
            className="h-1.5 mb-2"
            indicatorClassName={
              readiness.score >= 80 ? "bg-[--color-success]"
              : readiness.score >= 50 ? "bg-[--color-warning]"
              : undefined
            }
          />

          {(Object.entries(READINESS_LABELS) as [keyof ConversionReadiness, string][]).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              {readiness[key] ? (
                <Check className="h-3.5 w-3.5 text-[--color-success] shrink-0" />
              ) : (
                <Circle className="h-3.5 w-3.5 text-[--color-text-muted] shrink-0 opacity-40" />
              )}
              <span className={cn(
                "text-[12px]",
                readiness[key] ? "text-[--color-text-secondary]" : "text-[--color-text-muted]"
              )}>
                {label}
              </span>
            </div>
          ))}

          {readiness.score >= 80 && idea.status !== "CONVERTED" && (
            <motion.div {...motionPresets.fadeUp} className="mt-3">
              <Button
                size="sm"
                onClick={onConvert}
                className="w-full gap-1.5 text-[12px] h-8"
              >
                <Zap className="h-3.5 w-3.5" />
                Convert to Project
              </Button>
            </motion.div>
          )}
        </div>

        <div className="mt-auto p-3 border-t border-[--color-border-subtle] flex flex-col gap-2">
          <p className="text-[11px] font-medium text-[--color-text-muted] uppercase tracking-wider mb-1">
            Metadata
          </p>
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[--color-text-muted]">Status</span>
            <Badge
              variant={
                idea.status === "READY" ? "success"
                : idea.status === "REFINING" ? "warning"
                : idea.status === "CONVERTED" ? "primary"
                : "default"
              }
              dot
              className="text-[10px]"
            >
              {idea.status.charAt(0) + idea.status.slice(1).toLowerCase()}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[--color-text-muted]">Updated</span>
            <span className="text-[11px] text-[--color-text-muted]">
              {formatRelativeTime(idea.updatedAt)}
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ─── Save status indicator ──────────────────────────────────────────────── */

function AutoSaveIndicator({ status }: { status: SaveStatus }) {
  return (
    <AnimatePresence mode="wait">
      {status === "saving" && (
        <motion.span key="saving" {...motionPresets.fadeIn} className="flex items-center gap-1 text-[11px] text-[--color-text-muted]">
          <span className="h-1.5 w-1.5 rounded-full bg-[--color-text-muted] animate-pulse-subtle" />
          Saving...
        </motion.span>
      )}
      {status === "saved" && (
        <motion.span key="saved" {...motionPresets.fadeIn} className="flex items-center gap-1 text-[11px] text-[--color-success]">
          <Check className="h-3 w-3" />
          Saved
        </motion.span>
      )}
      {status === "error" && (
        <motion.span key="error" {...motionPresets.fadeIn} className="flex items-center gap-1 text-[11px] text-[--color-danger]">
          <AlertCircle className="h-3 w-3" />
          Error saving
        </motion.span>
      )}
    </AnimatePresence>
  );
}
