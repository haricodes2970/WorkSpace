import "server-only";
import { prisma } from "@/lib/prisma/client";
import { computeDrift, type DriftResult } from "./drift.calculator";

export type { DriftResult, DriftLevel, OverFocusItem, NeglectedItem, AbandonedItem, AllocationItem } from "./drift.calculator";

export async function getStrategicDrift(userId: string): Promise<DriftResult> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000);

  const [projects, highScoreIdeas, activityEvents, latestReview] = await Promise.all([
    prisma.project.findMany({
      where:  { userId, deletedAt: null },
      select: { id: true, title: true, executionState: true, momentumScore: true, updatedAt: true },
    }),
    prisma.idea.findMany({
      where:  { userId, deletedAt: null, readinessScore: { gte: 7 } },
      select: { id: true, title: true, readinessScore: true, updatedAt: true },
      orderBy: { readinessScore: "desc" },
      take:   20,
    }),
    prisma.activityEvent.findMany({
      where:  { userId, occurredAt: { gte: thirtyDaysAgo }, entityType: "PROJECT" },
      select: { entityId: true },
    }),
    prisma.strategicReview.findFirst({
      where:   { userId },
      orderBy: { createdAt: "desc" },
      select:  { period: true, wins: true, struggles: true, patterns: true },
    }),
  ]);

  // Build activity map: projectId → event count
  const activityMap: Record<string, number> = {};
  for (const e of activityEvents) {
    activityMap[e.entityId] = (activityMap[e.entityId] ?? 0) + 1;
  }

  return computeDrift({
    projects: projects.map((p) => ({
      id:        p.id,
      title:     p.title,
      phase:     p.executionState,
      momentum:  String(p.momentumScore),
      updatedAt: p.updatedAt,
      ideaId:    null,
    })),
    highScoreIdeas: highScoreIdeas.map((i: { id: string; title: string; readinessScore: number; updatedAt: Date }) => ({
      id:        i.id,
      title:     i.title,
      score:     i.readinessScore ?? 0,
      updatedAt: i.updatedAt,
    })),
    activityMap,
    latestReview: latestReview
      ? {
          period:   latestReview.period,
          wins:     [latestReview.wins],
          risks:    [latestReview.struggles],
          patterns: [latestReview.patterns],
        }
      : null,
  });
}
