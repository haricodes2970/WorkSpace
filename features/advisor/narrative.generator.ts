/**
 * Execution Narrative Engine — deterministic project evolution summaries.
 * Produces reflective, strategic narratives from execution data.
 * Template-based. No LLM calls.
 * Pure functions. No I/O.
 */

import type { ExecutionNarrative, NarrativeChapter } from "./types";

// ─── Input shape ──────────────────────────────────────────────────────────────

export interface NarrativeTimelineEvent {
  type:      string;
  title:     string;
  occurredAt: Date;
}

export interface NarrativeProjectInput {
  id:            string;
  title:         string;
  description:   string | null;
  status:        string;
  executionState: string;
  momentumScore: number;
  createdAt:     Date;
  shippedAt:     Date | null;
  ageDays:       number;
  taskCount:     number;
  taskDone:      number;
  milestoneCount: number;
  milestoneDone:  number;
  decisionCount: number;
  reviewCount:   number;
  blockerCount:  number;
  weeklyReviewRatings: number[];
  timelineEvents: NarrativeTimelineEvent[];
  momentumHistory: number[];   // momentum score snapshots, chronological
}

// ─── Phase classification ─────────────────────────────────────────────────────

type ExecutionPhase =
  | "inception"
  | "early_momentum"
  | "building"
  | "plateauing"
  | "recovery"
  | "shipping"
  | "shipped"
  | "stalled"
  | "archived";

function classifyPhase(p: NarrativeProjectInput): ExecutionPhase {
  if (p.status === "SHIPPED")   return "shipped";
  if (p.status === "ARCHIVED")  return "archived";
  if (p.status === "PAUSED")    return "stalled";

  const completionRate = p.taskCount > 0 ? p.taskDone / p.taskCount : 0;

  if (p.ageDays <= 7)                                return "inception";
  if (p.ageDays <= 30 && p.momentumScore >= 50)      return "early_momentum";
  if (completionRate >= 0.7 && p.momentumScore >= 50) return "shipping";
  if (p.momentumScore < 20)                          return p.ageDays > 21 ? "stalled" : "plateauing";
  if (completionRate >= 0.3 && p.momentumScore >= 35) return "building";
  if (completionRate >= 0.1)                         return "plateauing";
  return "early_momentum";
}

// ─── Trajectory ───────────────────────────────────────────────────────────────

function deriveTrajectory(
  p: NarrativeProjectInput
): ExecutionNarrative["trajectory"] {
  const history = p.momentumHistory;
  if (history.length < 2) return "plateauing";

  const recent  = history.slice(-3);
  const earlier = history.slice(0, Math.max(1, history.length - 3));
  const recentAvg  = recent.reduce((s, x) => s + x, 0)  / recent.length;
  const earlierAvg = earlier.reduce((s, x) => s + x, 0) / earlier.length;

  if (recentAvg > earlierAvg + 10) return "ascending";
  if (recentAvg < earlierAvg - 10) {
    return recentAvg > 35 ? "recovering" : "descending";
  }
  return "plateauing";
}

// ─── Chapter builder ──────────────────────────────────────────────────────────

function buildChapters(p: NarrativeProjectInput): NarrativeChapter[] {
  const chapters: NarrativeChapter[] = [];

  // Chapter 1: Origin
  chapters.push({
    phase:       "inception",
    title:       "How it started",
    description: p.description
      ? `The project began with a clear problem: ${p.description.slice(0, 120)}${p.description.length > 120 ? "…" : ""}`
      : `"${p.title}" was created ${p.ageDays} days ago and entered the planning phase.`,
    sentiment:   "neutral",
    timeframe:   `Day 1`,
  });

  // Chapters from timeline events (key moments)
  const keyEvents = p.timelineEvents
    .filter((e) =>
      ["MILESTONE_REACHED", "DECISION_MADE", "SHIPPED", "STATUS_CHANGED", "SCOPE_CHANGED"].includes(e.type)
    )
    .slice(0, 4);

  for (const event of keyEvents) {
    const dayOffset = Math.floor(
      (event.occurredAt.getTime() - p.createdAt.getTime()) / 86_400_000
    );

    const descriptionMap: Record<string, string> = {
      MILESTONE_REACHED: `A significant milestone was reached: "${event.title}".`,
      DECISION_MADE:     `A key decision was made: "${event.title}".`,
      SHIPPED:           `The project shipped: "${event.title}".`,
      STATUS_CHANGED:    `Execution status changed — ${event.title}.`,
      SCOPE_CHANGED:     `Scope was adjusted: ${event.title}.`,
    };

    chapters.push({
      phase:       event.type.toLowerCase(),
      title:       event.title,
      description: descriptionMap[event.type] ?? event.title,
      sentiment:   event.type === "SHIPPED" ? "positive"
                   : event.type === "STATUS_CHANGED" ? "pivotal"
                   : "neutral",
      timeframe:   `Day ${dayOffset}`,
    });
  }

  // Chapter: current state
  const phase    = classifyPhase(p);
  const currentDesc = buildCurrentStateDescription(p, phase);
  chapters.push({
    phase,
    title:       "Where it stands now",
    description: currentDesc,
    sentiment:   p.momentumScore >= 50 ? "positive" : p.momentumScore >= 25 ? "neutral" : "negative",
    timeframe:   `Day ${p.ageDays} (now)`,
  });

  return chapters;
}

function buildCurrentStateDescription(
  p: NarrativeProjectInput,
  phase: ExecutionPhase
): string {
  const completionRate = p.taskCount > 0 ? Math.round((p.taskDone / p.taskCount) * 100) : 0;

  const phaseDescriptions: Record<ExecutionPhase, string> = {
    inception:      `The project is in its earliest days. Patterns haven't yet formed.`,
    early_momentum: `Early momentum is strong — ${completionRate}% of tasks done, momentum at ${Math.round(p.momentumScore)}.`,
    building:       `Active execution phase: ${completionRate}% complete across ${p.taskCount} tasks with ${p.reviewCount} reviews written.`,
    plateauing:     `Progress has slowed. ${completionRate}% complete but momentum has dropped to ${Math.round(p.momentumScore)}. The project needs a scope decision.`,
    recovery:       `Recovering from a stall. Recent activity shows renewed commitment after a quiet period.`,
    shipping:       `Approaching completion: ${completionRate}% done and momentum is high. Focus on the remaining ${p.taskCount - p.taskDone} tasks.`,
    shipped:        `Successfully shipped${p.shippedAt ? ` on ${p.shippedAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` : ""}. This is a completed chapter.`,
    stalled:        `Execution stalled at ${completionRate}% with momentum at ${Math.round(p.momentumScore)}. The project needs a deliberate decision: restart with reduced scope, or archive.`,
    archived:       `Archived after ${p.ageDays} days. ${completionRate}% of tasks were completed before closure.`,
  };

  return phaseDescriptions[phase];
}

// ─── Summary sentence ─────────────────────────────────────────────────────────

function buildSummary(p: NarrativeProjectInput, phase: ExecutionPhase, trajectory: ExecutionNarrative["trajectory"]): string {
  const completionRate = p.taskCount > 0 ? Math.round((p.taskDone / p.taskCount) * 100) : 0;
  const age = p.ageDays < 7 ? `${p.ageDays} days` : p.ageDays < 30 ? `${Math.round(p.ageDays / 7)} weeks` : `${Math.round(p.ageDays / 30)} months`;

  const trajectoryLabel: Record<ExecutionNarrative["trajectory"], string> = {
    ascending:   "momentum is building",
    descending:  "momentum is declining",
    plateauing:  "execution is plateauing",
    recovering:  "the project is recovering",
  };

  if (phase === "shipped") {
    return `"${p.title}" shipped after ${age} with ${completionRate}% task completion and ${p.decisionCount} decisions recorded.`;
  }
  if (phase === "stalled" || phase === "archived") {
    return `"${p.title}" has been in execution for ${age} — currently stalled at ${completionRate}% with ${Math.round(p.momentumScore)} momentum.`;
  }

  return `"${p.title}" is ${age} into execution, ${completionRate}% complete — ${trajectoryLabel[trajectory]}.`;
}

// ─── Key moments ─────────────────────────────────────────────────────────────

function buildKeyMoments(p: NarrativeProjectInput): string[] {
  const moments: string[] = [];

  if (p.milestoneDone > 0) {
    moments.push(`${p.milestoneDone} milestone${p.milestoneDone > 1 ? "s" : ""} reached`);
  }
  if (p.decisionCount > 0) {
    moments.push(`${p.decisionCount} decision${p.decisionCount > 1 ? "s" : ""} logged`);
  }
  if (p.reviewCount > 0) {
    moments.push(`${p.reviewCount} weekly review${p.reviewCount > 1 ? "s" : ""} written`);
  }
  if (p.blockerCount > 0) {
    moments.push(`${p.blockerCount} blocker${p.blockerCount > 1 ? "s" : ""} encountered`);
  }
  if (p.taskDone > 0) {
    moments.push(`${p.taskDone} task${p.taskDone > 1 ? "s" : ""} completed`);
  }

  return moments;
}

// ─── Current chapter label ────────────────────────────────────────────────────

function currentChapterLabel(phase: ExecutionPhase): string {
  const labels: Record<ExecutionPhase, string> = {
    inception:      "Starting out",
    early_momentum: "Early momentum",
    building:       "Active execution",
    plateauing:     "Slowing down",
    recovery:       "Recovering",
    shipping:       "Final stretch",
    shipped:        "Completed",
    stalled:        "Stalled",
    archived:       "Archived",
  };
  return labels[phase];
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export function generateNarrative(p: NarrativeProjectInput): ExecutionNarrative {
  const phase      = classifyPhase(p);
  const trajectory = deriveTrajectory(p);
  const chapters   = buildChapters(p);
  const summary    = buildSummary(p, phase, trajectory);
  const keyMoments = buildKeyMoments(p);

  return {
    projectId:      p.id,
    projectTitle:   p.title,
    summary,
    currentChapter: currentChapterLabel(phase),
    currentPhase:   phase,
    chapters,
    keyMoments,
    trajectory,
  };
}
