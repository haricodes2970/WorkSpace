"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, AlertTriangle, Check, Rocket, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReadinessRing } from "../readiness/readiness-ring";
import { ReadinessBreakdown } from "../readiness/readiness-breakdown";
import type { ReadinessScore } from "../readiness/calculator";
import type { ReadinessStatus } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────

export interface ConversionConfig {
  projectName: string;
  projectDescription: string;
  taskSeeds: string[];
  selectedTasks: Set<number>;
}

export interface ConversionGateProps {
  ideaTitle: string;
  readiness: ReadinessScore;
  taskSeeds: string[];
  onConvert: (config: ConversionConfig) => Promise<void>;
  onClose: () => void;
}

type Step = "review" | "config" | "tasks" | "confirm";

const STEPS: Step[] = ["review", "config", "tasks", "confirm"];

const STEP_LABELS: Record<Step, string> = {
  review: "Readiness Review",
  config: "Project Setup",
  tasks: "Initial Tasks",
  confirm: "Convert",
};

// ─── Main Modal ───────────────────────────────────────────────────────────

export function ConversionGate({
  ideaTitle,
  readiness,
  taskSeeds,
  onConvert,
  onClose,
}: ConversionGateProps) {
  const [step, setStep] = useState<Step>("review");
  const [converting, setConverting] = useState(false);
  const [config, setConfig] = useState<ConversionConfig>({
    projectName: ideaTitle,
    projectDescription: "",
    taskSeeds,
    selectedTasks: new Set(taskSeeds.map((_, i) => i)),
  });

  const currentIndex = STEPS.indexOf(step);

  const goNext = useCallback(() => {
    const next = STEPS[currentIndex + 1];
    if (next) setStep(next);
  }, [currentIndex]);

  const goPrev = useCallback(() => {
    const prev = STEPS[currentIndex - 1];
    if (prev) setStep(prev);
  }, [currentIndex]);

  const handleConvert = useCallback(async () => {
    setConverting(true);
    try {
      await onConvert(config);
    } finally {
      setConverting(false);
    }
  }, [config, onConvert]);

  const canProceedFromReview = readiness.canConvert;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        className="relative z-10 w-full max-w-lg mx-4 rounded-xl border border-[--color-border] bg-[--color-bg] shadow-2xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[--color-border]">
          <div className="flex items-center gap-3">
            <Rocket className="h-4 w-4 text-[--color-primary]" />
            <span className="text-[13px] font-semibold text-[--color-text-primary]">
              Convert to Project
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[--color-text-muted] hover:text-[--color-text-secondary] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step indicator */}
        <StepIndicator steps={STEPS} current={step} />

        {/* Step content */}
        <div className="px-5 py-5 min-h-[300px]">
          <AnimatePresence mode="wait">
            {step === "review" && (
              <StepReview key="review" readiness={readiness} ideaTitle={ideaTitle} />
            )}
            {step === "config" && (
              <StepConfig key="config" config={config} onChange={setConfig} />
            )}
            {step === "tasks" && (
              <StepTasks key="tasks" config={config} onChange={setConfig} />
            )}
            {step === "confirm" && (
              <StepConfirm key="confirm" config={config} readiness={readiness} />
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-[--color-border] bg-[--color-card]">
          <button
            type="button"
            onClick={goPrev}
            disabled={currentIndex === 0}
            className={cn(
              "flex items-center gap-1.5 text-[12px] transition-colors",
              currentIndex === 0
                ? "text-[--color-text-muted] opacity-30 cursor-default"
                : "text-[--color-text-muted] hover:text-[--color-text-secondary]"
            )}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back
          </button>

          {step === "confirm" ? (
            <button
              type="button"
              onClick={handleConvert}
              disabled={converting}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium transition-all",
                "bg-[--color-primary] text-white hover:opacity-90",
                converting && "opacity-60 cursor-wait"
              )}
            >
              {converting ? (
                <>
                  <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Converting…
                </>
              ) : (
                <>
                  <Rocket className="h-3.5 w-3.5" />
                  Convert to Project
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              disabled={step === "review" && !canProceedFromReview}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-medium transition-all",
                step === "review" && !canProceedFromReview
                  ? "bg-[--color-card] text-[--color-text-muted] border border-[--color-border] cursor-not-allowed"
                  : "bg-[--color-primary] text-white hover:opacity-90"
              )}
            >
              {STEP_LABELS[STEPS[currentIndex + 1] ?? "confirm"]}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────

function StepIndicator({ steps, current }: { steps: Step[]; current: Step }) {
  const currentIndex = steps.indexOf(current);

  return (
    <div className="flex items-center gap-0 px-5 py-2 border-b border-[--color-border-subtle]">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center">
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                "h-1.5 w-1.5 rounded-full transition-colors",
                i < currentIndex
                  ? "bg-[--color-success]"
                  : i === currentIndex
                  ? "bg-[--color-primary]"
                  : "bg-[--color-border]"
              )}
            />
            <span
              className={cn(
                "text-[10px] transition-colors",
                i === currentIndex
                  ? "text-[--color-text-secondary] font-medium"
                  : "text-[--color-text-muted]"
              )}
            >
              {STEP_LABELS[step]}
            </span>
          </div>
          {i < steps.length - 1 && (
            <ChevronRight className="h-3 w-3 text-[--color-border] mx-2 shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Step: Review ─────────────────────────────────────────────────────────

function StepReview({
  readiness,
  ideaTitle,
}: {
  readiness: ReadinessScore;
  ideaTitle: string;
}) {
  return (
    <motion.div
      key="review"
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.15 }}
      className="flex flex-col gap-4"
    >
      <div className="flex items-center gap-4">
        <ReadinessRing
          score={readiness.total}
          status={readiness.status}
          size={64}
          strokeWidth={5}
        />
        <div>
          <p className="text-[13px] font-medium text-[--color-text-primary] line-clamp-1">
            {ideaTitle}
          </p>
          <p className="text-[11px] text-[--color-text-muted] mt-0.5">
            Readiness score: <span className="font-semibold text-[--color-text-secondary]">{readiness.total}/100</span>
            {" · "}
            <span className={cn(
              "font-medium",
              readiness.canConvert ? "text-[--color-success]" : "text-[--color-warning]"
            )}>
              {readiness.status.toLowerCase().replace("_", " ")}
            </span>
          </p>
        </div>
      </div>

      <ReadinessBreakdown readiness={readiness} />

      {!readiness.canConvert && (
        <div className="flex items-start gap-2 rounded-lg bg-[--color-warning]/10 border border-[--color-warning]/20 px-3 py-2.5">
          <AlertTriangle className="h-3.5 w-3.5 text-[--color-warning] shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-medium text-[--color-warning]">
              {readiness.total < 60
                ? `Score too low (${readiness.total}/100 — need 60+)`
                : "Missing required blocks"}
            </p>
            {readiness.missingRequired.length > 0 && (
              <p className="text-[10px] text-[--color-text-muted] mt-0.5">
                Required: {readiness.missingRequired.map((r) => r.toLowerCase().replace("_", " ")).join(", ")}
              </p>
            )}
          </div>
        </div>
      )}

      {readiness.canConvert && (
        <div className="flex items-center gap-2 rounded-lg bg-[--color-success]/10 border border-[--color-success]/20 px-3 py-2.5">
          <Check className="h-3.5 w-3.5 text-[--color-success] shrink-0" />
          <p className="text-[11px] text-[--color-success]">
            Idea meets conversion threshold — ready to become a project
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ─── Step: Config ─────────────────────────────────────────────────────────

function StepConfig({
  config,
  onChange,
}: {
  config: ConversionConfig;
  onChange: (c: ConversionConfig) => void;
}) {
  return (
    <motion.div
      key="config"
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.15 }}
      className="flex flex-col gap-4"
    >
      <div>
        <label className="block text-[11px] font-medium text-[--color-text-muted] mb-1.5 uppercase tracking-wide">
          Project Name
        </label>
        <input
          type="text"
          value={config.projectName}
          onChange={(e) => onChange({ ...config, projectName: e.target.value })}
          placeholder="Name your project"
          className={cn(
            "w-full rounded-lg border border-[--color-border] bg-[--color-card]",
            "px-3 py-2 text-[13px] text-[--color-text-primary]",
            "placeholder:text-[--color-text-muted]",
            "focus:outline-none focus:border-[--color-primary]/50 focus:ring-1 focus:ring-[--color-primary]/20",
            "transition-colors"
          )}
          autoFocus
        />
      </div>

      <div>
        <label className="block text-[11px] font-medium text-[--color-text-muted] mb-1.5 uppercase tracking-wide">
          Description <span className="normal-case font-normal">(optional)</span>
        </label>
        <textarea
          value={config.projectDescription}
          onChange={(e) => onChange({ ...config, projectDescription: e.target.value })}
          placeholder="One-line description for the project overview"
          rows={3}
          className={cn(
            "w-full rounded-lg border border-[--color-border] bg-[--color-card]",
            "px-3 py-2 text-[13px] text-[--color-text-primary] resize-none",
            "placeholder:text-[--color-text-muted]",
            "focus:outline-none focus:border-[--color-primary]/50 focus:ring-1 focus:ring-[--color-primary]/20",
            "transition-colors"
          )}
        />
      </div>
    </motion.div>
  );
}

// ─── Step: Tasks ──────────────────────────────────────────────────────────

function StepTasks({
  config,
  onChange,
}: {
  config: ConversionConfig;
  onChange: (c: ConversionConfig) => void;
}) {
  const toggleTask = (i: number) => {
    const next = new Set(config.selectedTasks);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    onChange({ ...config, selectedTasks: next });
  };

  return (
    <motion.div
      key="tasks"
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.15 }}
      className="flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[12px] font-medium text-[--color-text-secondary]">
            Seed tasks from MVP scope
          </p>
          <p className="text-[10px] text-[--color-text-muted] mt-0.5">
            Select which tasks to create in the project backlog
          </p>
        </div>
        <span className="text-[11px] text-[--color-text-muted] tabular-nums">
          {config.selectedTasks.size}/{config.taskSeeds.length}
        </span>
      </div>

      {config.taskSeeds.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Package className="h-6 w-6 text-[--color-text-muted] opacity-40" />
          <p className="text-[11px] text-[--color-text-muted]">
            No tasks parsed from MVP scope block.
            <br />
            Add bullet points in the MVP Scope block to seed tasks.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto">
          {config.taskSeeds.map((task, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleTask(i)}
              className={cn(
                "flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-colors",
                config.selectedTasks.has(i)
                  ? "border-[--color-primary]/30 bg-[--color-primary]/5"
                  : "border-[--color-border-subtle] bg-[--color-card] hover:border-[--color-border]"
              )}
            >
              <div
                className={cn(
                  "h-3.5 w-3.5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                  config.selectedTasks.has(i)
                    ? "border-[--color-primary] bg-[--color-primary]"
                    : "border-[--color-border]"
                )}
              >
                {config.selectedTasks.has(i) && (
                  <Check className="h-2.5 w-2.5 text-white" />
                )}
              </div>
              <span className="text-[12px] text-[--color-text-secondary] leading-snug">
                {task}
              </span>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Step: Confirm ────────────────────────────────────────────────────────

function StepConfirm({
  config,
  readiness,
}: {
  config: ConversionConfig;
  readiness: ReadinessScore;
}) {
  const selectedCount = config.selectedTasks.size;

  return (
    <motion.div
      key="confirm"
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.15 }}
      className="flex flex-col gap-4"
    >
      <div className="rounded-lg border border-[--color-border] bg-[--color-card] divide-y divide-[--color-border-subtle]">
        <SummaryRow label="Project name" value={config.projectName || "—"} />
        {config.projectDescription && (
          <SummaryRow label="Description" value={config.projectDescription} />
        )}
        <SummaryRow
          label="Readiness score"
          value={
            <span className="text-[--color-success] font-semibold">
              {readiness.total}/100
            </span>
          }
        />
        <SummaryRow
          label="Seed tasks"
          value={
            selectedCount > 0
              ? `${selectedCount} task${selectedCount > 1 ? "s" : ""} will be created`
              : "No seed tasks"
          }
        />
      </div>

      <p className="text-[11px] text-[--color-text-muted] leading-relaxed">
        This will create a new project from this idea. The idea will be archived
        and linked to the project for reference.
      </p>
    </motion.div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-3 py-2.5">
      <span className="text-[11px] text-[--color-text-muted] shrink-0">{label}</span>
      <span className="text-[11px] text-[--color-text-secondary] text-right leading-snug">
        {value}
      </span>
    </div>
  );
}
