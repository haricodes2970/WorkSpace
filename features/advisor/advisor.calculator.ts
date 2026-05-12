/**
 * Execution Advisor — deterministic heuristic signals.
 * Pure functions. No side effects. No I/O.
 */

import type { AdvisorSignal, AdvisorSeverity } from "./types";
import type { ProjectSnapshot } from "@/features/intelligence/insights/pattern-detectors";

// ─── Input shape ──────────────────────────────────────────────────────────────

export interface AdvisorProjectInput extends ProjectSnapshot {
  weeklyReviewRatings:   number[];   // overallRating from each review, chronological
  stalledWeeks:          number;     // consecutive weeks with 0 progress in reviews
  milestoneCount:        number;
  milestoneMissed:       number;
  openRiskCount:         number;
  criticalRiskCount:     number;
  ageDays:               number;     // days since project creation
}

export interface AdvisorInput {
  projects: AdvisorProjectInput[];
  userId:   string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function signal(
  id: string,
  type: AdvisorSignal["type"],
  title: string,
  body: string,
  confidence: number,
  severity: AdvisorSeverity,
  evidence: Record<string, unknown>,
  projectId?: string,
  projectTitle?: string,
  actionLabel?: string,
  actionHref?: string
): AdvisorSignal {
  return {
    id,
    type,
    title,
    body,
    confidence,
    severity,
    evidence,
    projectId,
    projectTitle,
    dismissible: true,
    actionLabel,
    actionHref,
  };
}

// ─── Detector: Repeated failure pattern ──────────────────────────────────────

export function detectRepeatedFailure(input: AdvisorInput): AdvisorSignal | null {
  const stalled = input.projects.filter(
    (p) =>
      (p.status === "PAUSED" || p.status === "ARCHIVED") &&
      p.taskDone < p.taskCount * 0.2 &&
      p.ageDays > 30
  );

  if (stalled.length < 2) return null;

  const avgCompletion = stalled.reduce((s, p) =>
    s + (p.taskCount > 0 ? p.taskDone / p.taskCount : 0), 0) / stalled.length;

  const confidence = Math.min(95, 50 + stalled.length * 15);

  return signal(
    "repeated-failure",
    "REPEATED_FAILURE",
    `${stalled.length} projects abandoned before 20% completion`,
    `A recurring pattern: projects start, reach early complexity, then stall. The common thread is not execution ability — it's scope that outpaces commitment. Before starting anything new, finish or formally close one of these.`,
    confidence,
    stalled.length >= 3 ? "critical" : "warning",
    { stalledCount: stalled.length, avgCompletion: Math.round(avgCompletion * 100), projects: stalled.map((p) => ({ id: p.id, title: p.title })) },
    undefined,
    undefined,
    "Review stalled projects",
    "/projects?status=paused"
  );
}

// ─── Detector: Review inconsistency ──────────────────────────────────────────

export function detectReviewInconsistency(input: AdvisorInput): AdvisorSignal | null {
  const active = input.projects.filter((p) => p.status === "ACTIVE" && p.ageDays > 14);
  if (active.length === 0) return null;

  const withDeclineReviews = active.filter((p) => {
    if (p.weeklyReviewRatings.length < 3) return false;
    const recent = p.weeklyReviewRatings.slice(-3);
    return recent.every((r, i) => i === 0 || r <= (recent[i - 1] ?? r));
  });

  const withGaps = active.filter((p) => p.stalledWeeks >= 2);

  if (withDeclineReviews.length === 0 && withGaps.length === 0) return null;

  const worstGap = withGaps.reduce(
    (a, b) => (a.stalledWeeks > b.stalledWeeks ? a : b),
    withGaps[0] ?? active[0]!
  );

  if (withGaps.length > 0) {
    return signal(
      "review-inconsistency",
      "REVIEW_INCONSISTENCY",
      `Reviews missed for ${worstGap.stalledWeeks} consecutive weeks`,
      `Weekly reviews are the cheapest way to detect drift early. A project without reflection accumulates hidden problems. Write a 5-minute review — even a brief one resets your mental model.`,
      70,
      "warning",
      { stalledWeeks: worstGap.stalledWeeks, projectId: worstGap.id, affectedCount: withGaps.length },
      worstGap.id,
      worstGap.title,
      "Write a review",
      `/projects/${worstGap.id}`
    );
  }

  return signal(
    "review-inconsistency",
    "REVIEW_INCONSISTENCY",
    "Review quality declining across active projects",
    `Project ratings have dropped consistently in recent reviews. Declining review scores correlate with execution drift — address root causes before momentum collapses.`,
    65,
    "info",
    { affectedProjects: withDeclineReviews.map((p) => p.id) }
  );
}

// ─── Detector: Blocker recurrence ────────────────────────────────────────────

export function detectBlockerRecurrence(input: AdvisorInput): AdvisorSignal | null {
  const highBlocker = input.projects.filter(
    (p) => p.status === "ACTIVE" && p.activeBlockerCount >= 2
  );
  if (highBlocker.length === 0) return null;

  const worst = highBlocker.reduce((a, b) =>
    a.activeBlockerCount > b.activeBlockerCount ? a : b
  );

  return signal(
    "blocker-recurrence",
    "BLOCKER_RECURRENCE",
    `${worst.activeBlockerCount} unresolved blockers in "${worst.title}"`,
    `Multiple simultaneous blockers indicate a systemic problem — not just bad luck. The second blocker often blocks the resolution of the first. Tackle them in sequence: resolve the most external one first.`,
    80,
    worst.activeBlockerCount >= 4 ? "critical" : "warning",
    { blockerCount: worst.activeBlockerCount, projectId: worst.id },
    worst.id,
    worst.title,
    "View blockers",
    `/projects/${worst.id}`
  );
}

// ─── Detector: MVP drift ──────────────────────────────────────────────────────

export function detectMvpDrift(input: AdvisorInput): AdvisorSignal | null {
  const drifted = input.projects.filter(
    (p) =>
      p.status !== "ARCHIVED" &&
      p.status !== "SHIPPED" &&
      p.mvpScopeCount > 8 &&
      p.laterScopeCount < p.mvpScopeCount * 0.5
  );

  if (drifted.length === 0) return null;

  const worst = drifted.reduce((a, b) => (a.mvpScopeCount > b.mvpScopeCount ? a : b));

  const confidence = Math.min(90, 40 + worst.mvpScopeCount * 3);

  return signal(
    "mvp-drift",
    "MVP_DRIFT",
    `"${worst.title}" MVP has grown to ${worst.mvpScopeCount} items`,
    `MVP scope has expanded well beyond a minimal definition. With ${worst.mvpScopeCount} items in MVP, this is closer to a V2 than a minimum shippable product. Cut to the 3-5 items that test your core assumption.`,
    confidence,
    worst.mvpScopeCount >= 15 ? "critical" : "warning",
    { mvpCount: worst.mvpScopeCount, projectId: worst.id, laterCount: worst.laterScopeCount },
    worst.id,
    worst.title,
    "Review scope",
    `/projects/${worst.id}`
  );
}

// ─── Detector: Unmitigated risk accumulation ──────────────────────────────────

export function detectRiskAccumulation(input: AdvisorInput): AdvisorSignal | null {
  const risky = input.projects.filter(
    (p) => p.status === "ACTIVE" && p.criticalRiskCount >= 1
  );
  if (risky.length === 0) return null;

  const totalCritical = risky.reduce((s, p) => s + p.criticalRiskCount, 0);
  const worst = risky.reduce((a, b) => (a.criticalRiskCount > b.criticalRiskCount ? a : b));

  return signal(
    "risk-accumulation",
    "FAILURE_RISK",
    `${totalCritical} critical risk${totalCritical > 1 ? "s" : ""} unmitigated`,
    `Unmitigated critical risks accumulate compounding uncertainty. Each unaddressed risk reduces decision quality downstream. Address or explicitly accept each critical risk before the next milestone.`,
    85,
    "critical",
    { totalCritical, projectId: worst.id, projectsAffected: risky.length },
    worst.id,
    worst.title,
    "Review risks",
    `/projects/${worst.id}`
  );
}

// ─── Run all advisor detectors ────────────────────────────────────────────────

export function runAdvisorDetectors(input: AdvisorInput): AdvisorSignal[] {
  const detectors = [
    detectRepeatedFailure,
    detectReviewInconsistency,
    detectBlockerRecurrence,
    detectMvpDrift,
    detectRiskAccumulation,
  ];

  return detectors
    .flatMap((fn) => {
      const r = fn(input);
      return r ? [r] : [];
    })
    .sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3);
    });
}
