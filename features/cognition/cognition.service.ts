import "server-only";
import { prisma } from "@/lib/prisma";
import { computeAge } from "@/features/temporal/aging";
import {
  computeCognitionScore,
  type CognitionInput,
  type CognitionResult,
} from "./cognition.calculator";

export type { CognitionResult, PressureLevel, Suggestion, PressureFactor } from "./cognition.calculator";

export async function getCognitionLoad(userId: string): Promise<CognitionResult> {
  const [projects, ideas, blockers, decisions, workingSetRow] = await Promise.all([
    prisma.project.findMany({
      where:   { userId, archived: false },
      select:  { id: true, phase: true, updatedAt: true },
    }),
    prisma.idea.count({ where: { userId, archived: false } }),
    prisma.blocker.count({ where: { userId, resolved: false } }),
    prisma.decision.count({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 14 * 86_400_000) },
      },
    }),
    prisma.userSession.findUnique({ where: { userId }, select: { workingSet: true } }),
  ]);

  const activeProjects    = projects.filter((p) => p.phase !== "SHIPPED").length;
  const staleProjectCount = projects.filter(
    (p) => p.phase !== "SHIPPED" && computeAge(p.updatedAt).daysSince >= 21
  ).length;
  const workingSetSize = Array.isArray(workingSetRow?.workingSet)
    ? (workingSetRow!.workingSet as unknown[]).length
    : 0;

  const input: CognitionInput = {
    activeProjects,
    unresolvedBlockers:  blockers,
    workingSetSize,
    staleProjectCount,
    openIdeaCount:       ideas,
    unreviewedCount:     decisions,
    switchCount:         0,      // populated by client-side attention tracker
    deepWorkMinutes:     0,      // populated by client-side flow state
  };

  return computeCognitionScore(input);
}
