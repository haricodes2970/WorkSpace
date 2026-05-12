import "server-only";
import { prisma } from "@/lib/prisma";
import { computeEnvironmentHealth, type EnvironmentHealth } from "./environment.calculator";

export type { EnvironmentHealth, HealthGrade, HealthDimension, CleanupItem, ArchiveSuggestion } from "./environment.calculator";

export async function getEnvironmentHealth(userId: string): Promise<EnvironmentHealth> {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86_400_000);
  const sixtyDaysAgo    = new Date(Date.now() - 60 * 86_400_000);

  const [
    projectStats, ideaStats, blockerCount, staleDecisions,
    workingSetRow, orphanedNotes, recentReview,
  ] = await Promise.all([
    prisma.project.aggregate({
      where: { userId },
      _count: { _all: true },
    }).then(async (total) => {
      const archived = await prisma.project.count({ where: { userId, archived: true } });
      const active   = await prisma.project.count({ where: { userId, archived: false, NOT: { phase: "SHIPPED" } } });
      return { total: total._count._all, archived, active };
    }),
    prisma.idea.aggregate({ where: { userId }, _count: { _all: true } }).then(async (total) => {
      const open = await prisma.idea.count({ where: { userId, archived: false } });
      return { total: total._count._all, open };
    }),
    prisma.blocker.count({ where: { userId, resolved: false } }),
    prisma.decision.count({
      where: { userId, createdAt: { lt: fourteenDaysAgo } },
    }),
    prisma.userSession.findUnique({ where: { userId }, select: { workingSet: true } }),
    prisma.note.count({ where: { userId, projectId: null } }),
    prisma.strategicReview.findFirst({
      where: { userId, createdAt: { gte: sixtyDaysAgo } },
      select: { id: true },
    }),
  ]);

  const workingSetSize = Array.isArray(workingSetRow?.workingSet)
    ? (workingSetRow!.workingSet as unknown[]).length
    : 0;

  const totalEntities = projectStats.total + ideaStats.total;
  const archivedRatio = totalEntities > 0
    ? projectStats.archived / totalEntities
    : 0;

  return computeEnvironmentHealth({
    activeProjects:     projectStats.active,
    unresolvedBlockers: blockerCount,
    openIdeaCount:      ideaStats.open,
    staleDecisions,
    workingSetSize,
    archivedRatio,
    hasRecentReview:    !!recentReview,
    totalEntities,
    orphanedNotes,
  });
}
