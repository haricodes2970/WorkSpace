/**
 * Strategic Review Service — fetch, create, and analyze strategic reviews.
 * Server-only.
 */

import "server-only";
import { prisma } from "@/lib/prisma/client";
import { generateReviewAnalysis, buildReviewSnapshot } from "./review.calculator";
import type {
  StrategicReviewRecord,
  StrategicReviewKind,
  CreateStrategicReviewInput,
  ReviewAnalysis,
} from "./types";
import type { StrategicReviewType } from "@prisma/client";

// ─── Fetch ────────────────────────────────────────────────────────────────────

export async function getStrategicReviews(
  userId: string,
  type?: StrategicReviewKind
): Promise<StrategicReviewRecord[]> {
  const rows = await prisma.strategicReview.findMany({
    where:   { userId, ...(type && { type: type as StrategicReviewType }) },
    orderBy: { periodStart: "desc" },
  });
  return rows.map(toRecord);
}

export async function getStrategicReview(
  id:     string,
  userId: string
): Promise<StrategicReviewRecord | null> {
  const row = await prisma.strategicReview.findFirst({ where: { id, userId } });
  return row ? toRecord(row) : null;
}

// ─── Generate analysis (pre-fill for review creation) ────────────────────────

export async function generateReviewPreview(
  userId:      string,
  periodType:  StrategicReviewKind,
  periodStart: Date,
  periodEnd:   Date,
  period:      string
): Promise<ReviewAnalysis> {
  const [projects, ideas, memories, taskAgg, decisionAgg, reviewAgg] = await Promise.all([
    prisma.project.findMany({
      where: { userId, deletedAt: null },
      select: {
        id: true, title: true, status: true,
        momentumScore: true, shippedAt: true, createdAt: true,
        tasks:         { where: { deletedAt: null }, select: { status: true } },
        decisions:     { where: { deletedAt: null }, select: { id: true } },
        weeklyReviews: { select: { id: true } },
      },
    }),
    prisma.idea.findMany({
      where:  { userId, deletedAt: null },
      select: { id: true, status: true, createdAt: true, convertedAt: true },
    }),
    prisma.knowledgeMemory.findMany({
      where:  { userId, deletedAt: null, createdAt: { gte: periodStart, lte: periodEnd } },
      select: { id: true, createdAt: true },
    }),
    prisma.task.count({
      where: { userId, deletedAt: null, status: "DONE", completedAt: { gte: periodStart, lte: periodEnd } },
    }),
    prisma.decision.count({
      where: { userId, deletedAt: null, createdAt: { gte: periodStart, lte: periodEnd } },
    }),
    prisma.weeklyReview.count({
      where: { userId, weekStarting: { gte: periodStart, lte: periodEnd } },
    }),
  ]);

  return generateReviewAnalysis({
    userId,
    periodType,
    periodStart,
    periodEnd,
    period,
    projects: projects.map((p) => ({
      id:            p.id,
      title:         p.title,
      status:        p.status,
      momentumScore: p.momentumScore,
      shippedAt:     p.shippedAt,
      createdAt:     p.createdAt,
      taskCount:     p.tasks.length,
      taskDone:      p.tasks.filter((t) => t.status === "DONE").length,
      weeklyReviews: p.weeklyReviews.length,
      decisions:     p.decisions.length,
    })),
    ideas:           ideas.map((i) => ({ id: i.id, status: i.status, createdAt: i.createdAt, convertedAt: i.convertedAt })),
    memories:        memories.map((m) => ({ id: m.id, createdAt: m.createdAt })),
    tasksCompleted:  taskAgg,
    decisionsLogged: decisionAgg,
    weeklyReviews:   reviewAgg,
  });
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createStrategicReview(
  userId: string,
  input:  CreateStrategicReviewInput
): Promise<StrategicReviewRecord> {
  const snapshot = await buildSnapshotForPeriod(userId, input.type, input.periodStart, input.periodEnd, input.period);

  const row = await prisma.strategicReview.upsert({
    where:  { userId_type_period: { userId, type: input.type as StrategicReviewType, period: input.period } },
    create: {
      userId,
      type:        input.type as StrategicReviewType,
      period:      input.period,
      periodStart: input.periodStart,
      periodEnd:   input.periodEnd,
      wins:        input.wins,
      struggles:   input.struggles,
      patterns:    input.patterns,
      nextFocus:   input.nextFocus,
      snapshot:    snapshot as object,
    },
    update: {
      wins:        input.wins,
      struggles:   input.struggles,
      patterns:    input.patterns,
      nextFocus:   input.nextFocus,
      snapshot:    snapshot as object,
    },
  });
  return toRecord(row);
}

// ─── List periods with completion status ──────────────────────────────────────

export async function getReviewCompletionStatus(
  userId: string,
  type:   StrategicReviewKind,
  periods: string[]
): Promise<Map<string, boolean>> {
  const existing = await prisma.strategicReview.findMany({
    where:  { userId, type: type as StrategicReviewType, period: { in: periods } },
    select: { period: true },
  });
  const done = new Set(existing.map((r) => r.period));
  return new Map(periods.map((p) => [p, done.has(p)]));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function buildSnapshotForPeriod(
  userId:      string,
  type:        StrategicReviewKind,
  periodStart: Date,
  periodEnd:   Date,
  period:      string
) {
  const analysis = await generateReviewPreview(userId, type, periodStart, periodEnd, period);
  return analysis.snapshot;
}

function toRecord(row: {
  id: string; userId: string; type: string; period: string;
  periodStart: Date; periodEnd: Date; wins: string; struggles: string;
  patterns: string; nextFocus: string; snapshot: unknown;
  createdAt: Date; updatedAt: Date;
}): StrategicReviewRecord {
  return {
    id:          row.id,
    userId:      row.userId,
    type:        row.type as StrategicReviewKind,
    period:      row.period,
    periodStart: row.periodStart,
    periodEnd:   row.periodEnd,
    wins:        row.wins,
    struggles:   row.struggles,
    patterns:    row.patterns,
    nextFocus:   row.nextFocus,
    snapshot:    row.snapshot as StrategicReviewRecord["snapshot"],
    createdAt:   row.createdAt,
    updatedAt:   row.updatedAt,
  };
}
