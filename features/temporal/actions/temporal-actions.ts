"use server";

import { requireSession } from "@/lib/auth/get-session";
import { getTemporalIntelligence } from "@/features/temporal/temporal.service";

export async function getTemporalIntelligenceAction() {
  const session = await requireSession();
  return getTemporalIntelligence(session.profile.id);
}
