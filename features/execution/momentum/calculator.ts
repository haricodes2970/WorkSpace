/**
 * Momentum Calculator — pure function, zero side-effects.
 * Operates on task completion timestamps + milestone data.
 */

import type { TaskStatus, MilestoneStatus } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────

export type MomentumState =
  | "ACCELERATING"
  | "ACTIVE"
  | "STABLE"
  | "SLOWING"
  | "STALLED"
  | "ABANDONED";

export interface MomentumInput {
  tasks: {
    status: TaskStatus;
    completedAt: Date | null;
    updatedAt: Date;
  }[];
  milestones: {
    status: MilestoneStatus;
    completedAt: Date | null;
  }[];
  projectCreatedAt: Date;
}

export interface MomentumResult {
  score: number;               // 0–100
  state: MomentumState;
  thisWeekCompletions: number;
  lastWeekCompletions: number;
  trend: "up" | "down" | "flat";
  inactiveDays: number;        // days since last task completion/update
  completionRate: number;      // 0–100 % of actionable tasks done
  sparkline: number[];         // 7 values: completions per day (today - 6 → today)
}

// ─── Calculator ───────────────────────────────────────────────────────────

export function calculateMomentum(input: MomentumInput): MomentumResult {
  const now = new Date();
  const ms = (d: Date) => d.getTime();

  const DAY = 86_400_000;
  const WEEK = 7 * DAY;

  const weekStart = new Date(now.getTime() - WEEK);
  const twoWeekStart = new Date(now.getTime() - 2 * WEEK);

  // Completions per window
  const completedTasks = input.tasks.filter(
    (t) => t.status === "DONE" && t.completedAt
  );

  const thisWeek = completedTasks.filter(
    (t) => t.completedAt && ms(t.completedAt) >= ms(weekStart)
  ).length;

  const lastWeek = completedTasks.filter(
    (t) =>
      t.completedAt &&
      ms(t.completedAt) >= ms(twoWeekStart) &&
      ms(t.completedAt) < ms(weekStart)
  ).length;

  // Sparkline: completions per day for last 7 days
  const sparkline: number[] = Array(7).fill(0);
  for (const t of completedTasks) {
    if (!t.completedAt) continue;
    const daysAgo = Math.floor((ms(now) - ms(t.completedAt)) / DAY);
    if (daysAgo < 7) {
      const idx = 6 - daysAgo;
      sparkline[idx] = (sparkline[idx] ?? 0) + 1;
    }
  }

  // Inactive days: days since most recent completion or active task update
  const recentActivity = [
    ...completedTasks.map((t) => t.completedAt!),
    ...input.tasks
      .filter((t) => t.status === "IN_PROGRESS")
      .map((t) => t.updatedAt),
    ...input.milestones
      .filter((m) => m.status === "COMPLETED" && m.completedAt)
      .map((m) => m.completedAt!),
  ].sort((a, b) => ms(b) - ms(a));

  const lastActivity = recentActivity[0] ?? input.projectCreatedAt;
  const inactiveDays = Math.floor((ms(now) - ms(lastActivity)) / DAY);

  // Completion rate
  const actionable = input.tasks.filter(
    (t) => t.status !== "CANCELLED"
  ).length;
  const done = input.tasks.filter((t) => t.status === "DONE").length;
  const completionRate = actionable > 0 ? Math.round((done / actionable) * 100) : 0;

  // Milestone bonus
  const recentMilestone = input.milestones.some(
    (m) =>
      m.status === "COMPLETED" &&
      m.completedAt &&
      ms(m.completedAt) >= ms(weekStart)
  );

  // Trend
  const trend: "up" | "down" | "flat" =
    thisWeek > lastWeek ? "up" : thisWeek < lastWeek ? "down" : "flat";

  // Score calculation
  let score = 0;

  // Velocity component (0–40 pts)
  const velocityPts = Math.min(40, thisWeek * 8 + (recentMilestone ? 10 : 0));
  score += velocityPts;

  // Consistency component (0–30 pts) — both weeks had completions
  if (thisWeek > 0 && lastWeek > 0) score += 30;
  else if (thisWeek > 0 || lastWeek > 0) score += 15;

  // Recency component (0–20 pts)
  if (inactiveDays === 0) score += 20;
  else if (inactiveDays <= 2) score += 16;
  else if (inactiveDays <= 5) score += 10;
  else if (inactiveDays <= 10) score += 4;

  // Completion rate component (0–10 pts)
  score += Math.round((completionRate / 100) * 10);

  score = Math.min(100, Math.round(score));

  // State
  const state = deriveState(score, inactiveDays, trend, thisWeek);

  return {
    score,
    state,
    thisWeekCompletions: thisWeek,
    lastWeekCompletions: lastWeek,
    trend,
    inactiveDays,
    completionRate,
    sparkline,
  };
}

function deriveState(
  score: number,
  inactiveDays: number,
  trend: "up" | "down" | "flat",
  thisWeek: number
): MomentumState {
  if (inactiveDays >= 30) return "ABANDONED";
  if (inactiveDays >= 14) return "STALLED";
  if (score >= 75 && trend === "up") return "ACCELERATING";
  if (score >= 50 && thisWeek > 0) return "ACTIVE";
  if (score >= 30) return trend === "down" ? "SLOWING" : "STABLE";
  if (inactiveDays >= 7) return "STALLED";
  return "SLOWING";
}

// ─── Scope health ─────────────────────────────────────────────────────────

export interface ScopeHealthInput {
  totalMvpItems: number;
  totalV1Items: number;
  totalLaterItems: number;
  doneTasks: number;
  totalTasks: number;
}

export interface ScopeHealthResult {
  score: number;           // 0–100 (100 = healthy)
  pressure: "HEALTHY" | "MODERATE" | "HIGH" | "CRITICAL";
  mvpItemCount: number;
  overloadWarning: boolean;
}

export function calculateScopeHealth(input: ScopeHealthInput): ScopeHealthResult {
  const { totalMvpItems, doneTasks, totalTasks } = input;

  // MVP should have ≤10 items ideally
  const mvpPressure =
    totalMvpItems <= 5 ? 0
    : totalMvpItems <= 10 ? 20
    : totalMvpItems <= 20 ? 50
    : 80;

  // Task backlog growth vs completion
  const openTasks = totalTasks - doneTasks;
  const backlogPressure =
    openTasks <= 10 ? 0
    : openTasks <= 25 ? 15
    : openTasks <= 50 ? 35
    : 60;

  const pressureTotal = Math.min(100, mvpPressure + backlogPressure);
  const score = 100 - pressureTotal;

  const pressure: ScopeHealthResult["pressure"] =
    pressureTotal >= 70 ? "CRITICAL"
    : pressureTotal >= 50 ? "HIGH"
    : pressureTotal >= 25 ? "MODERATE"
    : "HEALTHY";

  return {
    score,
    pressure,
    mvpItemCount: totalMvpItems,
    overloadWarning: totalMvpItems > 10,
  };
}
