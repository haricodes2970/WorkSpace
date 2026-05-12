"use server";

import { requireSession } from "@/lib/auth/get-session";
import { upsertContinuitySession, getLastActiveProject } from "@/features/continuity/continuity.service";
import type { WorkingSetEntry } from "@/lib/session-store";

export async function syncSessionAction(data: {
  lastActiveProjectId?:   string;
  lastVisitedEntityKind?: string;
  lastVisitedEntityId?:   string;
  workingSet?:            WorkingSetEntry[];
}) {
  const session = await requireSession();
  await upsertContinuitySession(session.profile.id, data);
}

export async function getLastActiveProjectAction() {
  const session = await requireSession();
  return getLastActiveProject(session.profile.id);
}
