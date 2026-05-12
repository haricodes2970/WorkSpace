/**
 * Failure Prediction Engine — survivability heuristics.
 * Produces abandonment probability and execution risk classification.
 * Pure functions. No I/O.
 */

import type { SurvivabilityResult, RiskFactor, ExecutionRisk } from "./types";
import type { AdvisorProjectInput } from "./advisor.calculator";

// ─── Weight table ─────────────────────────────────────────────────────────────
// Each factor contributes a weighted score to abandonmentProbability.
// Max total weight = 100.

const WEIGHT = {
  inactivity:      25,
  lowMomentum:     20,
  scopeOverload:   15,
  noReviews:       12,
  activeBlockers:  10,
  lowCompletion:   10,
  highRiskCount:    8,
} as const;

// ─── Individual risk factor evaluators ───────────────────────────────────────

function evalInactivity(p: AdvisorProjectInput): RiskFactor | null {
  if (p.inactiveDays === undefined || p.inactiveDays < 7) return null;

  const contribution =
    p.inactiveDays >= 30 ? WEIGHT.inactivity
    : p.inactiveDays >= 14 ? Math.round(WEIGHT.inactivity * 0.7)
    : Math.round(WEIGHT.inactivity * 0.3);

  return {
    label:       "Inactivity",
    weight:      contribution,
    description: `No execution activity for ${p.inactiveDays} days. Momentum loss compounds over time.`,
  };
}

function evalLowMomentum(p: AdvisorProjectInput): RiskFactor | null {
  if (p.momentumScore >= 40) return null;

  const contribution =
    p.momentumScore < 10 ? WEIGHT.lowMomentum
    : p.momentumScore < 25 ? Math.round(WEIGHT.lowMomentum * 0.7)
    : Math.round(WEIGHT.lowMomentum * 0.4);

  return {
    label:       "Low Momentum",
    weight:      contribution,
    description: `Momentum score ${Math.round(p.momentumScore)}/100. Below 40 signals execution drag.`,
  };
}

function evalScopeOverload(p: AdvisorProjectInput): RiskFactor | null {
  if (p.mvpScopeCount <= 8) return null;

  const contribution =
    p.mvpScopeCount >= 20 ? WEIGHT.scopeOverload
    : p.mvpScopeCount >= 12 ? Math.round(WEIGHT.scopeOverload * 0.65)
    : Math.round(WEIGHT.scopeOverload * 0.3);

  return {
    label:       "Scope Overload",
    weight:      contribution,
    description: `${p.mvpScopeCount} items in MVP scope. Overloaded MVPs rarely ship.`,
  };
}

function evalNoReviews(p: AdvisorProjectInput): RiskFactor | null {
  if (p.reviewCount > 0 && p.stalledWeeks < 3) return null;

  const contribution =
    p.reviewCount === 0 && p.ageDays > 21 ? WEIGHT.noReviews
    : p.stalledWeeks >= 3 ? Math.round(WEIGHT.noReviews * 0.75)
    : Math.round(WEIGHT.noReviews * 0.3);

  return {
    label:       "No Reflection",
    weight:      contribution,
    description: p.reviewCount === 0
      ? "Zero weekly reviews. Projects without reflection lose direction."
      : `${p.stalledWeeks} consecutive weeks without a review entry.`,
  };
}

function evalActiveBlockers(p: AdvisorProjectInput): RiskFactor | null {
  if (p.activeBlockerCount === 0) return null;

  const contribution =
    p.activeBlockerCount >= 3 ? WEIGHT.activeBlockers
    : Math.round(WEIGHT.activeBlockers * p.activeBlockerCount / 3);

  return {
    label:       "Active Blockers",
    weight:      contribution,
    description: `${p.activeBlockerCount} unresolved blocker${p.activeBlockerCount > 1 ? "s" : ""} holding execution back.`,
  };
}

function evalLowCompletion(p: AdvisorProjectInput): RiskFactor | null {
  const rate = p.taskCount > 0 ? p.taskDone / p.taskCount : 0;
  if (rate >= 0.25 || p.taskCount < 5) return null;

  const contribution =
    rate < 0.05 ? WEIGHT.lowCompletion
    : rate < 0.15 ? Math.round(WEIGHT.lowCompletion * 0.6)
    : Math.round(WEIGHT.lowCompletion * 0.3);

  return {
    label:       "Completion Gap",
    weight:      contribution,
    description: `Only ${Math.round(rate * 100)}% of tasks completed. High open:done ratio signals start-but-not-finish pattern.`,
  };
}

function evalHighRisk(p: AdvisorProjectInput): RiskFactor | null {
  if (p.criticalRiskCount === 0 && p.openRiskCount < 2) return null;

  const contribution =
    p.criticalRiskCount >= 2 ? WEIGHT.highRiskCount
    : p.criticalRiskCount === 1 ? Math.round(WEIGHT.highRiskCount * 0.7)
    : Math.round(WEIGHT.highRiskCount * 0.3);

  return {
    label:       "Unmitigated Risks",
    weight:      contribution,
    description: `${p.criticalRiskCount} critical + ${p.openRiskCount - p.criticalRiskCount} moderate risks unaddressed.`,
  };
}

// ─── Survivability calculator ─────────────────────────────────────────────────

export function calculateSurvivability(p: AdvisorProjectInput): SurvivabilityResult {
  // Only meaningful for active/planning projects
  if (p.status === "SHIPPED" || p.status === "ARCHIVED") {
    return {
      projectId:              p.id,
      projectTitle:           p.title,
      abandonmentProbability: 0,
      executionRisk:          "LOW",
      survivabilityScore:     100,
      riskFactors:            [],
      primaryThreat:          "none",
    };
  }

  const evaluators = [
    evalInactivity,
    evalLowMomentum,
    evalScopeOverload,
    evalNoReviews,
    evalActiveBlockers,
    evalLowCompletion,
    evalHighRisk,
  ];

  const factors: RiskFactor[] = evaluators
    .flatMap((fn) => {
      const r = fn(p);
      return r ? [r] : [];
    });

  const raw = factors.reduce((s, f) => s + f.weight, 0);
  const abandonmentProbability = Math.min(98, Math.round(raw));
  const survivabilityScore     = 100 - abandonmentProbability;

  const executionRisk: ExecutionRisk =
    abandonmentProbability >= 70 ? "CRITICAL"
    : abandonmentProbability >= 50 ? "HIGH"
    : abandonmentProbability >= 30 ? "MODERATE"
    : "LOW";

  const heaviest = factors.sort((a, b) => b.weight - a.weight)[0];
  const primaryThreat = heaviest?.label ?? "none";

  return {
    projectId:              p.id,
    projectTitle:           p.title,
    abandonmentProbability,
    executionRisk,
    survivabilityScore,
    riskFactors:            factors.sort((a, b) => b.weight - a.weight),
    primaryThreat,
  };
}

export function calculateAllSurvivability(
  projects: AdvisorProjectInput[]
): SurvivabilityResult[] {
  return projects
    .filter((p) => p.status !== "SHIPPED" && p.status !== "ARCHIVED")
    .map(calculateSurvivability)
    .sort((a, b) => b.abandonmentProbability - a.abandonmentProbability);
}
