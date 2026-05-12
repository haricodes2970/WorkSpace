/**
 * Strategic Review Calculator — generates analysis + frozen snapshot from execution data.
 * Pure functions. No I/O. No LLM calls.
 * Produces ReviewAnalysis for the review creation flow.
 */

import type { ReviewSnapshot, ReviewAnalysis, StrategicReviewKind } from "./types";

// ─── Input shapes ─────────────────────────────────────────────────────────────

export interface ReviewProjectInput {
  id:             string;
  title:          string;
  status:         string;
  momentumScore:  number;
  shippedAt:      Date | null;
  createdAt:      Date;
  taskCount:      number;
  taskDone:       number;
  weeklyReviews:  number;
  decisions:      number;
}

export interface ReviewIdeaInput {
  id:          string;
  status:      string;
  createdAt:   Date;
  convertedAt: Date | null;
}

export interface ReviewMemoryInput {
  id:        string;
  createdAt: Date;
}

export interface ReviewCalculatorInput {
  userId:      string;
  periodType:  StrategicReviewKind;
  periodStart: Date;
  periodEnd:   Date;
  period:      string;
  projects:    ReviewProjectInput[];
  ideas:       ReviewIdeaInput[];
  memories:    ReviewMemoryInput[];
  tasksCompleted: number;
  decisionsLogged: number;
  weeklyReviews:   number;
}

// ─── Snapshot builder ─────────────────────────────────────────────────────────

export function buildReviewSnapshot(input: ReviewCalculatorInput): ReviewSnapshot {
  const inWindow = (d: Date) => d >= input.periodStart && d <= input.periodEnd;

  const activeProjects   = input.projects.filter((p) => p.status === "ACTIVE");
  const shippedInPeriod  = input.projects.filter((p) => p.shippedAt && inWindow(p.shippedAt));
  const archivedProjects = input.projects.filter((p) => p.status === "ARCHIVED");
  const ideasCreated     = input.ideas.filter((i) => inWindow(i.createdAt));
  const ideasConverted   = input.ideas.filter((i) => i.convertedAt && inWindow(i.convertedAt));
  const memoriesCreated  = input.memories.filter((m) => inWindow(m.createdAt));
  const abandonedIdeas   = input.ideas.filter((i) => i.status === "ARCHIVED").length;

  const avgMomentum = activeProjects.length > 0
    ? activeProjects.reduce((s, p) => s + p.momentumScore, 0) / activeProjects.length
    : 0;

  const stalledProjects = activeProjects
    .filter((p) => p.momentumScore < 25)
    .map((p) => ({
      id:           p.id,
      title:        p.title,
      stalledWeeks: Math.round(p.weeklyReviews > 0 ? (Date.now() - p.createdAt.getTime()) / (7 * 86_400_000) : 0),
    }));

  return {
    projectsActive:   activeProjects.length,
    projectsShipped:  shippedInPeriod.length,
    projectsArchived: archivedProjects.length,
    ideasCreated:     ideasCreated.length,
    ideasConverted:   ideasConverted.length,
    tasksCompleted:   input.tasksCompleted,
    decisionsLogged:  input.decisionsLogged,
    memoriesCapured:  memoriesCreated.length,
    weeklyReviews:    input.weeklyReviews,
    avgMomentumScore: Math.round(avgMomentum),
    topProjects: activeProjects
      .sort((a, b) => b.momentumScore - a.momentumScore)
      .slice(0, 5)
      .map((p) => ({ id: p.id, title: p.title, status: p.status, momentumScore: Math.round(p.momentumScore) })),
    shippedProjects: shippedInPeriod.map((p) => ({
      id:       p.id,
      title:    p.title,
      shippedAt: p.shippedAt!.toISOString(),
    })),
    stalledProjects,
    abandonedIdeas,
    generatedAt: new Date().toISOString(),
  };
}

// ─── Analysis generator ───────────────────────────────────────────────────────

export function generateReviewAnalysis(input: ReviewCalculatorInput): ReviewAnalysis {
  const snap = buildReviewSnapshot(input);

  const wins: string[]    = [];
  const risks: string[]   = [];
  const patterns: string[] = [];

  // Wins
  if (snap.projectsShipped > 0) {
    wins.push(`${snap.projectsShipped} project${snap.projectsShipped > 1 ? "s" : ""} shipped`);
  }
  if (snap.tasksCompleted > 10) wins.push(`${snap.tasksCompleted} tasks completed`);
  if (snap.ideasConverted > 0)  wins.push(`${snap.ideasConverted} idea${snap.ideasConverted > 1 ? "s" : ""} converted to projects`);
  if (snap.weeklyReviews > 2)   wins.push(`Consistent weekly review habit (${snap.weeklyReviews} reviews)`);
  if (snap.memoriesCapured > 3) wins.push(`${snap.memoriesCapured} knowledge memories captured`);
  if (snap.decisionsLogged > 0) wins.push(`${snap.decisionsLogged} decisions logged`);
  if (wins.length === 0)        wins.push("Staying engaged with active projects");

  // Risks
  if (snap.stalledProjects.length > 0) {
    risks.push(`${snap.stalledProjects.length} project${snap.stalledProjects.length > 1 ? "s" : ""} stalled (momentum < 25)`);
  }
  if (snap.avgMomentumScore < 30 && snap.projectsActive > 0) {
    risks.push(`Low average momentum (${snap.avgMomentumScore}) across active projects`);
  }
  if (snap.weeklyReviews === 0 && snap.projectsActive > 0) {
    risks.push("No weekly reviews — execution drift risk");
  }
  if (snap.ideasCreated > snap.ideasConverted * 4 && snap.ideasCreated > 5) {
    risks.push("High idea volume with low conversion — idea cemetery growing");
  }
  if (snap.projectsActive > 5) {
    risks.push(`${snap.projectsActive} simultaneous active projects — focus risk`);
  }

  // Patterns
  if (snap.projectsShipped >= 2) patterns.push("Consistent shipping habit");
  if (snap.weeklyReviews > 3)    patterns.push("Strong reflection discipline");
  if (snap.decisionsLogged > 5)  patterns.push("Active decision logging culture");
  if (snap.projectsActive > snap.projectsShipped * 3 && snap.projectsActive > 3) {
    patterns.push("More projects started than finished — breadth over depth");
  }
  if (snap.memoriesCapured > 5)  patterns.push("Regular knowledge capture habit");

  const summary = buildSummary(input.periodType, input.period, snap, wins, risks);
  const recommendation = buildRecommendation(snap, risks);

  return {
    period:         input.period,
    periodType:     input.periodType,
    summary,
    wins,
    risks,
    patterns,
    recommendation,
    snapshot:       snap,
  };
}

// ─── Summary text ─────────────────────────────────────────────────────────────

function buildSummary(
  type:   StrategicReviewKind,
  period: string,
  snap:   ReviewSnapshot,
  wins:   string[],
  risks:  string[]
): string {
  const typeLabel = {
    MONTHLY:          "month",
    QUARTERLY:        "quarter",
    ANNUAL:           "year",
    PORTFOLIO:        "portfolio review",
    EXECUTION_HEALTH: "execution health check",
    IDEA_CEMETERY:    "idea audit",
  }[type];

  if (snap.projectsShipped > 0 && risks.length === 0) {
    return `Strong ${typeLabel}. Shipped ${snap.projectsShipped} project${snap.projectsShipped > 1 ? "s" : ""}, completed ${snap.tasksCompleted} tasks, maintained momentum at ${snap.avgMomentumScore}/100.`;
  }
  if (snap.projectsActive === 0) {
    return `Quiet ${typeLabel}. No active projects — good time to review the idea backlog and pick a focus.`;
  }
  if (risks.length > wins.length) {
    return `Challenging ${typeLabel}. ${wins[0] ?? "Some progress made"}, but execution signals show friction that needs attention.`;
  }
  return `${type === "ANNUAL" ? "Full year" : "This " + typeLabel} in review: ${snap.projectsActive} active, ${snap.projectsShipped} shipped, ${snap.tasksCompleted} tasks done, ${snap.decisionsLogged} decisions logged.`;
}

function buildRecommendation(snap: ReviewSnapshot, risks: string[]): string {
  if (snap.stalledProjects.length > 0 && snap.projectsActive > 3) {
    return `Archive or scope-cut ${snap.stalledProjects.length} stalled project${snap.stalledProjects.length > 1 ? "s" : ""} before starting anything new. Depth beats breadth.`;
  }
  if (snap.weeklyReviews === 0) {
    return "Start a weekly review habit on your most important project. Even 10 minutes of written reflection prevents drift.";
  }
  if (snap.avgMomentumScore < 25 && snap.projectsActive > 0) {
    return "Momentum is low across the board. Pick ONE project, cut its scope, and ship something in the next 2 weeks.";
  }
  if (snap.projectsShipped > 0 && snap.ideasCreated > 3) {
    return "You shipped — that's the most important habit. Now convert your best idea and repeat the cycle.";
  }
  if (risks.length === 0) {
    return "Strong execution pattern. Protect your focus, keep reviewing weekly, and look for scope to cut.";
  }
  return "Review stalled projects and make an explicit decision: restart with tighter scope, or archive with notes on why.";
}
