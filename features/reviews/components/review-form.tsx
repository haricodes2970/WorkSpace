"use client";

import { useState, useTransition, useEffect } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { ReviewSnapshot } from "./review-snapshot";
import { generateReviewPreviewAction, createStrategicReviewAction } from "../actions/review-actions";
import type { ReviewAnalysis, StrategicReviewKind } from "../types";
import { getCurrentPeriods } from "../types";

interface ReviewFormProps {
  type:        StrategicReviewKind;
  period:      string;
  periodStart: string;
  periodEnd:   string;
  onSaved:     () => void;
}

export function ReviewForm({ type, period, periodStart, periodEnd, onSaved }: ReviewFormProps) {
  const [analysis, setAnalysis]   = useState<ReviewAnalysis | null>(null);
  const [wins, setWins]           = useState("");
  const [struggles, setStruggles] = useState("");
  const [patterns, setPatterns]   = useState("");
  const [nextFocus, setNextFocus] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isSaving,  startSave]       = useTransition();

  // Auto-load analysis
  useEffect(() => {
    startTransition(async () => {
      const a = await generateReviewPreviewAction(type, periodStart, periodEnd, period);
      setAnalysis(a);
      // Pre-fill from generated analysis
      if (!wins)      setWins(a.wins.join("\n"));
      if (!struggles) setStruggles(a.risks.join("\n"));
      if (!patterns)  setPatterns(a.patterns.join("\n"));
      if (!nextFocus) setNextFocus(a.recommendation);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, period, periodStart, periodEnd]);

  function handleSave() {
    startSave(async () => {
      await createStrategicReviewAction({
        type,
        period,
        periodStart,
        periodEnd,
        wins,
        struggles,
        patterns,
        nextFocus,
      });
      onSaved();
    });
  }

  const typeLabel: Record<StrategicReviewKind, string> = {
    MONTHLY:          "Monthly Review",
    QUARTERLY:        "Quarterly Review",
    ANNUAL:           "Annual Review",
    PORTFOLIO:        "Portfolio Review",
    EXECUTION_HEALTH: "Execution Health Check",
    IDEA_CEMETERY:    "Idea Audit",
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-white">{typeLabel[type]}</h2>
        <p className="text-sm text-white/40">{period}</p>
      </div>

      {isPending && (
        <div className="flex items-center gap-2 text-white/40">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Analyzing execution data…</span>
        </div>
      )}

      {analysis && !isPending && (
        <>
          {/* System-generated summary */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-violet-400" />
              <span className="text-xs font-medium text-white/60 uppercase tracking-wide">Generated analysis</span>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">{analysis.summary}</p>
            {analysis.recommendation && (
              <p className="text-sm text-white/50 mt-2 border-t border-white/10 pt-2">
                <strong className="text-white/70">Recommendation:</strong> {analysis.recommendation}
              </p>
            )}
          </div>

          <ReviewSnapshot snapshot={analysis.snapshot} />
        </>
      )}

      {/* Review fields */}
      <div className="space-y-4">
        <Field
          label="Wins"
          hint="What went well? What shipped? What habits held?"
          value={wins}
          onChange={setWins}
        />
        <Field
          label="Struggles"
          hint="What stalled? What was harder than expected?"
          value={struggles}
          onChange={setStruggles}
        />
        <Field
          label="Patterns"
          hint="What behavioral or execution patterns did you notice?"
          value={patterns}
          onChange={setPatterns}
        />
        <Field
          label="Next focus"
          hint="What's the one thing that matters most in the next period?"
          value={nextFocus}
          onChange={setNextFocus}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={isSaving || !wins.trim()}
          className="flex items-center gap-2 rounded-lg bg-[--color-primary] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Save review
        </button>
      </div>
    </div>
  );
}

function Field({ label, hint, value, onChange }: {
  label:    string;
  hint:     string;
  value:    string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div>
        <label className="text-sm font-medium text-white">{label}</label>
        <p className="text-xs text-white/40">{hint}</p>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[--color-primary]/50 resize-none"
        placeholder={`Your ${label.toLowerCase()}…`}
      />
    </div>
  );
}

// ─── Period picker (shown before form) ───────────────────────────────────────

interface PeriodPickerProps {
  onSelect: (type: StrategicReviewKind, period: string, start: string, end: string) => void;
}

export function ReviewPeriodPicker({ onSelect }: PeriodPickerProps) {
  const periods = getCurrentPeriods();

  const options: Array<{
    type:  StrategicReviewKind;
    label: string;
    sub:   string;
    start: Date;
    end:   Date;
    period: string;
  }> = [
    {
      type:   "MONTHLY",
      label:  "Monthly Review",
      sub:    periods.monthly.period,
      start:  periods.monthly.periodStart,
      end:    periods.monthly.periodEnd,
      period: periods.monthly.period,
    },
    {
      type:   "QUARTERLY",
      label:  "Quarterly Review",
      sub:    periods.quarterly.period,
      start:  periods.quarterly.periodStart,
      end:    periods.quarterly.periodEnd,
      period: periods.quarterly.period,
    },
    {
      type:   "ANNUAL",
      label:  "Annual Review",
      sub:    periods.annual.period,
      start:  periods.annual.periodStart,
      end:    periods.annual.periodEnd,
      period: periods.annual.period,
    },
    {
      type:   "PORTFOLIO",
      label:  "Portfolio Review",
      sub:    "All-time project landscape",
      start:  new Date(2000, 0, 1),
      end:    new Date(),
      period: `portfolio-${new Date().getFullYear()}`,
    },
    {
      type:   "EXECUTION_HEALTH",
      label:  "Execution Health",
      sub:    "System-wide momentum audit",
      start:  new Date(Date.now() - 90 * 86_400_000),
      end:    new Date(),
      period: `health-${new Date().toISOString().slice(0, 7)}`,
    },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm text-white/40">Select review type</p>
      {options.map((opt) => (
        <button
          key={opt.type}
          onClick={() =>
            onSelect(opt.type, opt.period, opt.start.toISOString(), opt.end.toISOString())
          }
          className="w-full text-left rounded-lg border border-white/10 bg-white/5 p-4 hover:bg-white/8 hover:border-white/20 transition-colors"
        >
          <p className="text-sm font-medium text-white">{opt.label}</p>
          <p className="text-xs text-white/40 mt-0.5">{opt.sub}</p>
        </button>
      ))}
    </div>
  );
}
