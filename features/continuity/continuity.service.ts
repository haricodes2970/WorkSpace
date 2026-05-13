import "server-only";
import { prisma } from "@/lib/prisma/client";
import type { WorkingSetEntry } from "@/lib/session-store";

export interface ContinuitySession {
  lastActiveProjectId?:   string;
  lastVisitedEntityKind?: string;
  lastVisitedEntityId?:   string;
  workingSet:             WorkingSetEntry[];
}

export async function getContinuitySession(userId: string): Promise<ContinuitySession> {
  const row = await prisma.userSession.findUnique({ where: { userId } });
  if (!row) return { workingSet: [] };
  return {
    lastActiveProjectId:   row.lastActiveProjectId ?? undefined,
    lastVisitedEntityKind: row.lastVisitedEntityKind ?? undefined,
    lastVisitedEntityId:   row.lastVisitedEntityId ?? undefined,
    workingSet:            (row.workingSet as unknown as WorkingSetEntry[]) ?? [],
  };
}

export async function upsertContinuitySession(
  userId: string,
  data: Partial<ContinuitySession>
): Promise<void> {
  const workingSet = data.workingSet ?? undefined;
  await prisma.userSession.upsert({
    where:  { userId },
    create: {
      userId,
      lastActiveProjectId:   data.lastActiveProjectId,
      lastVisitedEntityKind: data.lastVisitedEntityKind,
      lastVisitedEntityId:   data.lastVisitedEntityId,
      workingSet:            (workingSet ?? []) as object[],
    },
    update: {
      ...(data.lastActiveProjectId   !== undefined && { lastActiveProjectId:   data.lastActiveProjectId   }),
      ...(data.lastVisitedEntityKind !== undefined && { lastVisitedEntityKind: data.lastVisitedEntityKind }),
      ...(data.lastVisitedEntityId   !== undefined && { lastVisitedEntityId:   data.lastVisitedEntityId   }),
      ...(workingSet                 !== undefined && { workingSet: workingSet as object[] }),
    },
  });
}

// Returns last active project with enough detail to render a "continue" prompt
export async function getLastActiveProject(userId: string) {
  const session = await getContinuitySession(userId);
  if (!session.lastActiveProjectId) return null;
  return prisma.project.findFirst({
    where:  { id: session.lastActiveProjectId, userId, deletedAt: null },
    select: { id: true, title: true, executionState: true, momentumScore: true },
  });
}
