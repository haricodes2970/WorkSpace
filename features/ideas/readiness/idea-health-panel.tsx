"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { IdeaHealthMetrics } from "./calculator";

interface IdeaHealthPanelProps {
  health: IdeaHealthMetrics;
  className?: string;
}

interface Metric {
  key: keyof IdeaHealthMetrics;
  label: string;
  description: string;
  format: (v: number) => string;
  color: (v: number) => string;
  barWidth: (v: number) => number;
}

const METRICS: Metric[] = [
  {
    key: "completeness",
    label: "Completeness",
    description: "Overall readiness score",
    format: (v) => `${v}%`,
    color: (v) => (v >= 60 ? "bg-[--color-success]" : v >= 30 ? "bg-[--color-warning]" : "bg-[--color-text-muted]"),
    barWidth: (v) => v,
  },
  {
    key: "executionConfidence",
    label: "Execution Confidence",
    description: "Execution plan + success metrics",
    format: (v) => `${v}%`,
    color: (v) => (v >= 70 ? "bg-[--color-success]" : v >= 40 ? "bg-[--color-warning]" : "bg-[--color-text-muted]"),
    barWidth: (v) => v,
  },
  {
    key: "validationReadiness",
    label: "Validation Readiness",
    description: "Validation strategy + assumptions",
    format: (v) => `${v}%`,
    color: (v) => (v >= 60 ? "bg-[--color-success]" : v >= 30 ? "bg-[--color-warning]" : "bg-[--color-text-muted]"),
    barWidth: (v) => v,
  },
  {
    key: "riskDensity",
    label: "Risk Density",
    description: "Risk items vs total content",
    format: (v) => `${v}%`,
    // high risk density = warning (too risky or too risk-focused)
    color: (v) => (v > 60 ? "bg-[--color-error]" : v > 25 ? "bg-[--color-warning]" : v > 5 ? "bg-[--color-success]" : "bg-[--color-text-muted]"),
    barWidth: (v) => Math.min(v, 100),
  },
  {
    key: "scopeComplexity",
    label: "Scope Complexity",
    description: "MVP task items defined",
    format: (v) => `${v} items`,
    // 3–8 items = good, too few or too many = warn
    color: (v) => (v >= 3 && v <= 8 ? "bg-[--color-success]" : v > 0 ? "bg-[--color-warning]" : "bg-[--color-text-muted]"),
    barWidth: (v) => Math.min(100, (v / 10) * 100),
  },
];


function getRiskHint(v: number): string {
  if (v === 0) return "No risks documented — add risks to improve score";
  if (v <= 20) return "Healthy risk coverage";
  if (v <= 50) return "Good risk awareness";
  return "High risk focus — may indicate concern";
}

function getScopeHint(v: number): string {
  if (v === 0) return "No scope items — break down MVP tasks";
  if (v < 3) return "Too few items — expand scope definition";
  if (v <= 8) return "Well-scoped MVP";
  return "Large scope — consider trimming";
}

export function IdeaHealthPanel({ health, className }: IdeaHealthPanelProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <span className="text-[11px] text-[--color-text-muted] uppercase tracking-wider font-medium px-1">
        Idea Health
      </span>

      <div className="flex flex-col gap-2">
        {METRICS.map((metric, i) => (
          <HealthMetricRow
            key={metric.key}
            metric={metric}
            value={health[metric.key]}
            animDelay={i * 0.05}
            hint={
              metric.key === "riskDensity"
                ? getRiskHint(health.riskDensity)
                : metric.key === "scopeComplexity"
                ? getScopeHint(health.scopeComplexity)
                : undefined
            }
          />
        ))}
      </div>

      <HealthSummaryChip health={health} />
    </div>
  );
}

function HealthMetricRow({
  metric,
  value,
  animDelay,
  hint,
}: {
  metric: Metric;
  value: number;
  animDelay: number;
  hint?: string;
}) {
  const barW = metric.barWidth(value);
  const barColor = metric.color(value);

  return (
    <motion.div
      className="rounded-md border border-[--color-border-subtle] bg-[--color-card] px-3 py-2.5"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animDelay, duration: 0.15 }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px] font-medium text-[--color-text-secondary]">
          {metric.label}
        </span>
        <span className="text-[12px] font-semibold tabular-nums text-[--color-text-primary]">
          {metric.format(value)}
        </span>
      </div>

      {/* Bar */}
      <div className="h-1 w-full rounded-full bg-[--color-bg] overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full opacity-80", barColor)}
          initial={{ width: 0 }}
          animate={{ width: `${barW}%` }}
          transition={{ delay: animDelay + 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {hint && (
        <p className="text-[10px] text-[--color-text-muted] mt-1.5 italic leading-tight">
          {hint}
        </p>
      )}

      {!hint && (
        <p className="text-[10px] text-[--color-text-muted] mt-1 leading-tight">
          {metric.description}
        </p>
      )}
    </motion.div>
  );
}

function HealthSummaryChip({ health }: { health: IdeaHealthMetrics }) {
  const issues: string[] = [];

  if (health.completeness < 30) issues.push("low completeness");
  if (health.riskDensity === 0) issues.push("no risks documented");
  if (health.scopeComplexity === 0) issues.push("no MVP scope");
  if (health.executionConfidence < 30) issues.push("weak execution plan");
  if (health.validationReadiness < 20) issues.push("no validation strategy");

  if (issues.length === 0) {
    return (
      <div className="rounded-md bg-[--color-success]/10 border border-[--color-success]/20 px-3 py-2">
        <p className="text-[11px] text-[--color-success]">
          Idea well-structured — ready to develop further
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md bg-[--color-card] border border-[--color-border-subtle] px-3 py-2">
      <p className="text-[10px] text-[--color-text-muted] mb-1 font-medium uppercase tracking-wide">
        Gaps to address
      </p>
      <ul className="flex flex-col gap-0.5">
        {issues.map((issue) => (
          <li key={issue} className="flex items-center gap-1.5 text-[11px] text-[--color-text-muted]">
            <span className="h-1 w-1 rounded-full bg-[--color-warning] shrink-0" />
            {issue}
          </li>
        ))}
      </ul>
    </div>
  );
}
