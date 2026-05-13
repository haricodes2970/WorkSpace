import "server-only";
import { prisma } from "@/lib/prisma/client";
import {
  computeAdaptationWeights,
} from "@/platform/adaptation/surface-ranker";
import type {
  AdaptationWeights,
  UsageAggregate,
} from "@/platform/telemetry/telemetry-types";

// ─── Snapshot I/O ─────────────────────────────────────────────────────────────

export async function getLatestSnapshot(userId: string): Promise<UsageAggregate | null> {
  const row = await prisma.usageSnapshot.findFirst({
    where:   { userId },
    orderBy: { createdAt: "desc" },
  });
  return row ? (row.data as unknown as UsageAggregate) : null;
}

export async function upsertSnapshot(userId: string, data: UsageAggregate): Promise<void> {
  await prisma.usageSnapshot.upsert({
    where:  { userId_period: { userId, period: data.period } },
    create: { userId, period: data.period, data: data as object },
    update: { data: data as object },
  });
}

export async function getSnapshotHistory(
  userId:   string,
  limitWeeks = 12,
): Promise<UsageAggregate[]> {
  const rows = await prisma.usageSnapshot.findMany({
    where:   { userId },
    orderBy: { createdAt: "desc" },
    take:    limitWeeks,
  });
  return rows.map((r) => r.data as unknown as UsageAggregate);
}

// ─── Adaptation weights I/O ───────────────────────────────────────────────────

export async function getAdaptationWeights(userId: string): Promise<AdaptationWeights | null> {
  const session = await prisma.userSession.findUnique({ where: { userId } });
  if (!session) return null;
  const data = session.adaptationData as Record<string, unknown>;
  if (!data || !data.version) return null;
  return data as unknown as AdaptationWeights;
}

export async function saveAdaptationWeights(
  userId: string,
  weights: AdaptationWeights,
): Promise<void> {
  await prisma.userSession.upsert({
    where:  { userId },
    create: { userId, adaptationData: weights as object },
    update: { adaptationData: weights as object },
  });
}

// ─── Main computation ─────────────────────────────────────────────────────────

export async function computeAndSaveWeights(
  userId:    string,
  aggregate: UsageAggregate,
): Promise<AdaptationWeights> {
  const previous = await getAdaptationWeights(userId);

  const daysSince = previous?.computedAt
    ? Math.floor((Date.now() - new Date(previous.computedAt).getTime()) / 86_400_000)
    : 0;

  const weights = computeAdaptationWeights(aggregate, previous ?? {}, daysSince);
  await saveAdaptationWeights(userId, weights);
  await upsertSnapshot(userId, aggregate);
  return weights;
}
