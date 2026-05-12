import "server-only";
import { prisma } from "@/lib/prisma";
import type { UsageAggregate } from "@/platform/telemetry/telemetry-types";
import {
  buildExecutionSeason,
  detectSeasonRuns,
  buildEvolutionNarrative,
  type ExecutionSeason,
} from "./execution-seasons";

export type { ExecutionSeason, SeasonKind } from "./execution-seasons";

export interface TemporalIntelligence {
  seasons:        ExecutionSeason[];
  narrative:      string;
  yearStats:      YearStats;
}

export interface YearStats {
  year:             number;
  shippedProjects:  number;
  capturedIdeas:    number;
  deepWorkMinutes:  number;
  strategicReviews: number;
  memoriesCreated:  number;
}

export async function getTemporalIntelligence(userId: string): Promise<TemporalIntelligence> {
  const year     = new Date().getFullYear();
  const yearStart = new Date(`${year}-01-01`);

  const [snapshots, yearProjects, yearIdeas, yearReviews, yearMemories] = await Promise.all([
    prisma.usageSnapshot.findMany({
      where:   { userId },
      orderBy: { createdAt: "desc" },
      take:    12,
    }),
    prisma.project.count({ where: { userId, phase: "SHIPPED", updatedAt: { gte: yearStart } } }),
    prisma.idea.count({ where: { userId, createdAt: { gte: yearStart } } }),
    prisma.strategicReview.count({ where: { userId, createdAt: { gte: yearStart } } }),
    prisma.memory.count({ where: { userId, createdAt: { gte: yearStart } } }),
  ]);

  const seasons: ExecutionSeason[] = snapshots.map((s) => {
    const d = s.data as UsageAggregate;
    return buildExecutionSeason({
      period:          s.period,
      shippedProjects: 0,   // snapshot doesn't track this directly; would need DB join
      newIdeas:        Object.values(d.createCounts ?? {}).reduce((a, b) => a + b, 0),
      reviews:         0,
      deepWorkMinutes: d.deepWorkMinutes ?? 0,
      sessionCount:    d.sessionCount    ?? 0,
    });
  });

  const runs      = detectSeasonRuns(seasons);
  const narrative = buildEvolutionNarrative(seasons);

  return {
    seasons: runs.map((r) => ({ ...r })),
    narrative,
    yearStats: {
      year,
      shippedProjects:  yearProjects,
      capturedIdeas:    yearIdeas,
      deepWorkMinutes:  snapshots.reduce((s, r) => s + ((r.data as UsageAggregate).deepWorkMinutes ?? 0), 0),
      strategicReviews: yearReviews,
      memoriesCreated:  yearMemories,
    },
  };
}
