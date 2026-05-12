import type { InsightType, InsightSeverity } from "@prisma/client";

// ─── Input shape ──────────────────────────────────────────────────────────

export interface ProjectSnapshot {
  id: string;
  title: string;
  status: string;
  momentumScore: number;
  createdAt: Date;
  shippedAt: Date | null;
  taskCount: number;
  taskDone: number;
  blockerCount: number;
  activeBlockerCount: number;
  reviewCount: number;
  decisionCount: number;
  decisionReversalCount: number;
  mvpScopeCount: number;
  laterScopeCount: number;
}

export interface UserExecutionData {
  projects: ProjectSnapshot[];
}

export interface InsightCandidate {
  type: InsightType;
  title: string;
  body: string;
  severity: InsightSeverity;
  evidence: Record<string, unknown>;
}

// ─── Detectors (pure functions) ───────────────────────────────────────────

export function detectScopeInflation(data: UserExecutionData): InsightCandidate | null {
  const bloated = data.projects.filter(
    (p) => p.status !== "ARCHIVED" && p.status !== "SHIPPED" && p.mvpScopeCount >= 12
  );
  if (bloated.length === 0) return null;

  const worst = bloated.reduce((a, b) => (a.mvpScopeCount > b.mvpScopeCount ? a : b));
  return {
    type:     "SCOPE_INFLATION",
    title:    "MVP scope is over-loaded",
    body:     `"${worst.title}" has ${worst.mvpScopeCount} items in MVP. Scope creep kills shipping velocity. Move non-essential items to V1 or Later.`,
    severity: worst.mvpScopeCount >= 20 ? "CRITICAL" : "WARNING",
    evidence: { projectId: worst.id, mvpScopeCount: worst.mvpScopeCount, bloatedProjects: bloated.length },
  };
}

export function detectAbandonedPattern(data: UserExecutionData): InsightCandidate | null {
  const stalled = data.projects.filter(
    (p) => p.status === "PAUSED" || (p.status === "ACTIVE" && p.momentumScore < 15)
  );
  if (stalled.length < 2) return null;

  const avgScore = stalled.reduce((s, p) => s + p.momentumScore, 0) / stalled.length;
  return {
    type:     "ABANDONED_PATTERN",
    title:    `${stalled.length} projects losing momentum`,
    body:     `You have ${stalled.length} projects that are paused or stalling (avg momentum ${Math.round(avgScore)}). Review each: cut, archive, or restart with a smaller scope.`,
    severity: stalled.length >= 4 ? "CRITICAL" : "WARNING",
    evidence: { stalledCount: stalled.length, avgMomentumScore: avgScore, projects: stalled.map((p) => ({ id: p.id, title: p.title })) },
  };
}

export function detectBlockerPattern(data: UserExecutionData): InsightCandidate | null {
  const projectsWithBlockers = data.projects.filter((p) => p.activeBlockerCount > 0);
  const totalActive = projectsWithBlockers.reduce((s, p) => s + p.activeBlockerCount, 0);
  if (totalActive < 3) return null;

  return {
    type:     "BLOCKER_PATTERN",
    title:    `${totalActive} unresolved blockers across ${projectsWithBlockers.length} projects`,
    body:     "Persistent blockers compound execution drag. Schedule a blocker resolution session — even one hour of focused clearing accelerates all affected projects.",
    severity: totalActive >= 6 ? "CRITICAL" : "WARNING",
    evidence: { totalActive, projectsAffected: projectsWithBlockers.length },
  };
}

export function detectDecisionReversals(data: UserExecutionData): InsightCandidate | null {
  const totalDecisions = data.projects.reduce((s, p) => s + p.decisionCount, 0);
  const totalReversals = data.projects.reduce((s, p) => s + p.decisionReversalCount, 0);
  if (totalDecisions < 5 || totalReversals < 2) return null;

  const rate = totalReversals / totalDecisions;
  if (rate < 0.25) return null;

  return {
    type:     "DECISION_REVERSAL",
    title:    `High decision reversal rate (${Math.round(rate * 100)}%)`,
    body:     "You are reversing more than 1 in 4 decisions. This signals decisions made under time pressure or without enough context. Write more context before deciding.",
    severity: rate >= 0.4 ? "WARNING" : "INFO",
    evidence: { totalDecisions, totalReversals, reversalRate: rate },
  };
}

export function detectMomentumDecay(data: UserExecutionData): InsightCandidate | null {
  const active = data.projects.filter((p) => p.status === "ACTIVE" && p.momentumScore < 30);
  if (active.length === 0) return null;

  const worst = active.reduce((a, b) => (a.momentumScore < b.momentumScore ? a : b));
  return {
    type:     "MOMENTUM_DECAY",
    title:    "Active project losing momentum",
    body:     `"${worst.title}" is marked active but momentum has dropped to ${Math.round(worst.momentumScore)}. Complete one small task today to re-engage the flywheel.`,
    severity: worst.momentumScore < 10 ? "WARNING" : "INFO",
    evidence: { projectId: worst.id, momentumScore: worst.momentumScore, affectedCount: active.length },
  };
}

export function detectReviewBenefit(data: UserExecutionData): InsightCandidate | null {
  const activeNoReview = data.projects.filter(
    (p) => p.status === "ACTIVE" && p.reviewCount === 0 && p.taskCount > 5
  );
  if (activeNoReview.length === 0) return null;

  return {
    type:     "REVIEW_BENEFIT",
    title:    `${activeNoReview.length} active project${activeNoReview.length > 1 ? "s" : ""} without a weekly review`,
    body:     "Projects with regular weekly reviews maintain momentum 40% longer. Write your first review — even 5 minutes of reflection surfaces what to do next.",
    severity: "INFO",
    evidence: { projectIds: activeNoReview.map((p) => p.id), count: activeNoReview.length },
  };
}

export function detectExecutionBottleneck(data: UserExecutionData): InsightCandidate | null {
  const projects = data.projects.filter((p) => p.status === "ACTIVE");
  if (projects.length === 0) return null;

  const totalTasks = projects.reduce((s, p) => s + p.taskCount, 0);
  const totalDone  = projects.reduce((s, p) => s + p.taskDone, 0);
  if (totalTasks < 10) return null;

  const completionRate = totalDone / totalTasks;
  if (completionRate > 0.3) return null;

  return {
    type:     "EXECUTION_BOTTLENECK",
    title:    `Low task completion across active projects (${Math.round(completionRate * 100)}%)`,
    body:     "Most tasks are started but not finished. Pick 3 tasks to complete this week — finishing builds momentum faster than starting new work.",
    severity: completionRate < 0.1 ? "WARNING" : "INFO",
    evidence: { completionRate, totalTasks, totalDone },
  };
}

// ─── Run all detectors ────────────────────────────────────────────────────

export function runAllDetectors(data: UserExecutionData): InsightCandidate[] {
  const detectors = [
    detectScopeInflation,
    detectAbandonedPattern,
    detectBlockerPattern,
    detectDecisionReversals,
    detectMomentumDecay,
    detectReviewBenefit,
    detectExecutionBottleneck,
  ];

  return detectors.flatMap((fn) => {
    const result = fn(data);
    return result ? [result] : [];
  });
}
