"use server";

import { requireSession } from "@/lib/auth/get-session";
import {
  computeAndSaveWeights,
  getAdaptationWeights,
} from "@/features/adaptive/adaptive.service";
import type { UsageAggregate } from "@/platform/telemetry/telemetry-types";

export async function syncUsageAction(aggregate: UsageAggregate) {
  const session = await requireSession();
  const weights = await computeAndSaveWeights(session.profile.id, aggregate);
  return { success: true as const, weights };
}

export async function getAdaptationWeightsAction() {
  const session = await requireSession();
  const weights = await getAdaptationWeights(session.profile.id);
  return { success: true as const, weights };
}
