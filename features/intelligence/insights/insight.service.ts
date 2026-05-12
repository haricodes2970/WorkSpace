import { prisma } from "@/lib/prisma/client";
import { insightRepository } from "./insight.repository";
import { runAllDetectors, type UserExecutionData } from "./pattern-detectors";

// Collect aggregated data needed by pattern detectors
async function collectExecutionData(userId: string): Promise<UserExecutionData> {
  const projects = await prisma.project.findMany({
    where: { userId, deletedAt: null },
    include: {
      tasks:      { where: { deletedAt: null }, select: { status: true } },
      blockers:   { select: { resolved: true } },
      weeklyReviews: { select: { id: true } },
      decisions:  { where: { deletedAt: null }, select: { reversed: true } },
      scopeItems: { where: { deletedAt: null, bucket: "MVP" }, select: { id: true } },
      _count:     { select: { scopeItems: { where: { deletedAt: null, bucket: "LATER" } } } },
    },
  });

  return {
    projects: projects.map((p) => ({
      id:                   p.id,
      title:                p.title,
      status:               p.status,
      momentumScore:        p.momentumScore,
      createdAt:            p.createdAt,
      shippedAt:            p.shippedAt,
      taskCount:            p.tasks.length,
      taskDone:             p.tasks.filter((t) => t.status === "DONE").length,
      blockerCount:         p.blockers.length,
      activeBlockerCount:   p.blockers.filter((b) => !b.resolved).length,
      reviewCount:          p.weeklyReviews.length,
      decisionCount:        p.decisions.length,
      decisionReversalCount: p.decisions.filter((d) => d.reversed).length,
      mvpScopeCount:        p.scopeItems.length,
      laterScopeCount:      p._count.scopeItems,
    })),
  };
}

// Run analysis and persist new insight snapshots (replaces old ones of same type)
export async function refreshInsights(userId: string): Promise<number> {
  const data       = await collectExecutionData(userId);
  const candidates = runAllDetectors(data);

  // Replace all existing insights with fresh ones (insights are re-derived, not appended)
  await prisma.insightSnapshot.deleteMany({ where: { userId, dismissed: false } });

  if (candidates.length === 0) return 0;

  const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await Promise.all(
    candidates.map((c) =>
      insightRepository.upsert({
        userId,
        type:      c.type,
        title:     c.title,
        body:      c.body,
        evidence:  c.evidence,
        severity:  c.severity,
        expiresAt: expiry,
      })
    )
  );

  return candidates.length;
}

export async function getActiveInsights(userId: string) {
  return insightRepository.findActive(userId);
}

export async function dismissInsight(id: string, userId: string) {
  return insightRepository.dismiss(id, userId);
}
