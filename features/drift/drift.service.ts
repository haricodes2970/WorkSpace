import "server-only";
import { prisma } from "@/lib/prisma/client";
import { computeDrift, type DriftResult } from "./drift.calculator";

export type { DriftResult, DriftLevel, OverFocusItem, NeglectedItem, AbandonedItem, AllocationItem } from "./drift.calculator";

export async function getStrategicDrift(userId: string): Promise<DriftResult> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000);

  const [projects, highScoreIdeas, activityEvents, latestReview] = await Promise.all([
    prisma.project.findMany({
      where:  { userId, archived: false },
      select: { id: true, title: true, phase: true, momentum: true, updatedAt: true, ideaId: true },
    }),
    prisma.idea.findMany({
      where:  { userId, archived: false, score: { gte: 7 } },
      select: { id: true, title: true, score: true, updatedAt: true },
      orderBy: { score: "desc" },
      take:   20,
    }),
    prisma.activityEvent.findMany({
      where:  { userId, occurredAt: { gte: thirtyDaysAgo }, entityType: "PROJECT" },
      select: { entityId: true },
    }),
    prisma.strategicReview.findFirst({
      where:   { userId },
      orderBy: { createdAt: "desc" },
      select:  { period: true, wins: true, risks: true, patterns: true },
    }),
  ]);

  // Build activity map: projectId → event count
  const activityMap: Record<string, number> = {};
  for (const e of activityEvents) {
    activityMap[e.entityId] = (activityMap[e.entityId] ?? 0) + 1;
  }

  return computeDrift({
    projects,
    highScoreIdeas: highScoreIdeas.map((i) => ({
      ...i,
      score:     i.score ?? 0,
      updatedAt: i.updatedAt,
    })),
    activityMap,
    latestReview: latestReview
      ? {
          period:   latestReview.period,
          wins:     latestReview.wins as string[],
          risks:    latestReview.risks as string[],
          patterns: latestReview.patterns as string[],
        }
      : null,
  });
}
