"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Send, Star } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────

export interface ReviewFormData {
  weekStarting: Date;
  movedForward: string;
  stalled: string;
  changed: string;
  assumptionsFailed: string;
  shouldCut: string;
  worthContinuing: boolean;
  overallRating: number;
}

interface ReviewFormProps {
  weekStarting: Date;
  initial?: Partial<ReviewFormData>;
  onSubmit: (data: ReviewFormData) => Promise<void>;
  onCancel?: () => void;
}

// ─── Questions ────────────────────────────────────────────────────────────

interface Question {
  key: keyof Pick<ReviewFormData, "movedForward" | "stalled" | "changed" | "assumptionsFailed" | "shouldCut">;
  label: string;
  placeholder: string;
  hint: string;
}

const QUESTIONS: Question[] = [
  {
    key: "movedForward",
    label: "What moved forward this week?",
    placeholder: "Tasks shipped, decisions made, clarity gained…",
    hint: "Concrete progress, not vague effort.",
  },
  {
    key: "stalled",
    label: "What stalled or blocked?",
    placeholder: "What didn't move? Why?",
    hint: "Name the blocker. Named blockers can be solved.",
  },
  {
    key: "changed",
    label: "What changed or surprised you?",
    placeholder: "New information, failed assumptions, scope shifts…",
    hint: "Reality always diverges from plan. Track it.",
  },
  {
    key: "assumptionsFailed",
    label: "What assumptions failed?",
    placeholder: "Users don't care about X. Y takes 3x longer. Z is blocked by…",
    hint: "Failed assumptions are the most valuable data.",
  },
  {
    key: "shouldCut",
    label: "What should be cut or deferred?",
    placeholder: "Features, scope items, tasks that no longer earn their place…",
    hint: "Cutting is a form of progress.",
  },
];

// ─── Component ────────────────────────────────────────────────────────────

export function ReviewForm({ weekStarting, initial, onSubmit, onCancel }: ReviewFormProps) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [answers, setAnswers] = useState<Pick<ReviewFormData, "movedForward" | "stalled" | "changed" | "assumptionsFailed" | "shouldCut">>({
    movedForward:      initial?.movedForward ?? "",
    stalled:           initial?.stalled ?? "",
    changed:           initial?.changed ?? "",
    assumptionsFailed: initial?.assumptionsFailed ?? "",
    shouldCut:         initial?.shouldCut ?? "",
  });

  const [worthContinuing, setWorthContinuing] = useState(initial?.worthContinuing ?? true);
  const [rating, setRating] = useState(initial?.overallRating ?? 3);

  const totalSteps = QUESTIONS.length + 1; // +1 for final rating step
  const isLastStep = step === totalSteps - 1;
  const q = QUESTIONS[step];

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      await onSubmit({
        weekStarting,
        ...answers,
        worthContinuing,
        overallRating: rating,
      });
    } finally {
      setSubmitting(false);
    }
  }, [weekStarting, answers, worthContinuing, rating, onSubmit]);

  const weekLabel = weekStarting.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[--color-text-muted] uppercase tracking-wider font-medium">
          Week of {weekLabel}
        </span>
        <span className="text-[10px] text-[--color-text-muted]">
          {step + 1} / {totalSteps}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 w-full bg-[--color-border-subtle] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-[--color-primary] rounded-full"
          animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          transition={{ duration: 0.25 }}
        />
      </div>

      {/* Step content */}
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.15 }}
        className="flex flex-col gap-3"
      >
        {!isLastStep && q ? (
          <>
            <div>
              <p className="text-[13px] font-medium text-[--color-text-primary] leading-snug mb-0.5">
                {q.label}
              </p>
              <p className="text-[11px] text-[--color-text-muted] italic">{q.hint}</p>
            </div>
            <textarea
              autoFocus
              value={answers[q.key]}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.key]: e.target.value }))}
              placeholder={q.placeholder}
              rows={4}
              className={cn(
                "w-full rounded-lg border border-[--color-border] bg-[--color-card]",
                "px-3 py-2.5 text-[13px] text-[--color-text-primary] resize-none",
                "placeholder:text-[--color-text-muted] leading-relaxed",
                "focus:outline-none focus:border-[--color-primary]/50 focus:ring-1 focus:ring-[--color-primary]/20",
                "transition-colors"
              )}
            />
          </>
        ) : (
          /* Final step: rating + worth continuing */
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-[13px] font-medium text-[--color-text-primary] mb-2">
                How was this week overall?
              </p>
              <StarRating value={rating} onChange={setRating} />
            </div>

            <div>
              <p className="text-[13px] font-medium text-[--color-text-primary] mb-2">
                Is this project still worth continuing?
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWorthContinuing(true)}
                  className={cn(
                    "flex-1 py-2 rounded-lg border text-[12px] font-medium transition-colors",
                    worthContinuing
                      ? "border-[--color-success]/30 bg-[--color-success]/10 text-[--color-success]"
                      : "border-[--color-border] text-[--color-text-muted] hover:border-[--color-border-strong]"
                  )}
                >
                  Yes, continue
                </button>
                <button
                  type="button"
                  onClick={() => setWorthContinuing(false)}
                  className={cn(
                    "flex-1 py-2 rounded-lg border text-[12px] font-medium transition-colors",
                    !worthContinuing
                      ? "border-[--color-error]/30 bg-[--color-error]/10 text-[--color-error]"
                      : "border-[--color-border] text-[--color-text-muted] hover:border-[--color-border-strong]"
                  )}
                >
                  Reconsider
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={step === 0 ? onCancel : () => setStep((s) => s - 1)}
          className="flex items-center gap-1 text-[12px] text-[--color-text-muted] hover:text-[--color-text-secondary] transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {step === 0 ? "Cancel" : "Back"}
        </button>

        {isLastStep ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-medium transition-all",
              "bg-[--color-primary] text-white hover:opacity-90",
              submitting && "opacity-60 cursor-wait"
            )}
          >
            {submitting ? (
              <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Save Review
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="flex items-center gap-1 px-4 py-2 rounded-lg text-[12px] font-medium bg-[--color-primary] text-white hover:opacity-90 transition-opacity"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Star rating ──────────────────────────────────────────────────────────

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={cn(
              "h-5 w-5 transition-colors",
              (hovered ? star <= hovered : star <= value)
                ? "text-[--color-warning] fill-[--color-warning]"
                : "text-[--color-border] fill-none"
            )}
          />
        </button>
      ))}
      <span className="ml-2 text-[11px] text-[--color-text-muted]">
        {["", "Rough week", "Slow progress", "Steady", "Good week", "Excellent"][hovered || value]}
      </span>
    </div>
  );
}
