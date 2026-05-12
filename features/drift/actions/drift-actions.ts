"use server";

import { requireSession } from "@/lib/auth/get-session";
import { getStrategicDrift } from "@/features/drift/drift.service";

export async function getStrategicDriftAction() {
  const session = await requireSession();
  return getStrategicDrift(session.profile.id);
}
