/**
 * Activity Event Service — append-only event stream for all entities.
 * Write path is fire-and-forget (non-blocking). Read path supports cursor pagination.
 * Server-only. Pure Prisma. No side effects beyond DB writes.
 */

import "server-only";
import { prisma } from "@/lib/prisma/client";
import { ENTITY_KIND_TO_TYPE } from "@/platform/entities/types";
import type {
  AppendActivityEventInput,
  ActivityEventRecord,
  ActivityEventQueryOptions,
} from "./types";
import type { ActivityKind, EntityType } from "@prisma/client";

// ─── Append ───────────────────────────────────────────────────────────────────

export async function appendActivityEvent(
  input: AppendActivityEventInput
): Promise<void> {
  await prisma.activityEvent.create({
    data: {
      userId:     input.userId,
      entityType: ENTITY_KIND_TO_TYPE[input.entityKind] as EntityType,
      entityId:   input.entityId,
      kind:       input.kind as ActivityKind,
      payload:    (input.payload ?? undefined) as object | undefined,
      occurredAt: input.occurredAt ?? new Date(),
    },
  });
}

// Fire-and-forget variant — safe for server action call sites
export function appendActivityEventAsync(
  input: AppendActivityEventInput
): void {
  void appendActivityEvent(input).catch((err) => {
    console.error("[ActivityEvent] append failed:", err);
  });
}

// ─── Query ────────────────────────────────────────────────────────────────────

export async function queryActivityEvents(
  userId: string,
  opts: ActivityEventQueryOptions = {}
): Promise<{ events: ActivityEventRecord[]; nextCursor: string | null }> {
  const limit = Math.min(opts.limit ?? 50, 200);

  const where: NonNullable<Parameters<typeof prisma.activityEvent.findMany>[0]>["where"] = {
    userId,
    ...(opts.entityKind && { entityType: ENTITY_KIND_TO_TYPE[opts.entityKind] as EntityType }),
    ...(opts.entityId   && { entityId: opts.entityId }),
    ...(opts.kinds      && { kind: { in: opts.kinds as ActivityKind[] } }),
    ...(opts.since || opts.until) && {
      occurredAt: {
        ...(opts.since && { gte: opts.since }),
        ...(opts.until && { lte: opts.until }),
      },
    },
    ...(opts.cursor && { occurredAt: { lt: await getCursorDate(opts.cursor) } }),
  };

  const rows = await prisma.activityEvent.findMany({
    where,
    orderBy: { occurredAt: "desc" },
    take: limit + 1,
  });

  const hasMore = rows.length > limit;
  const items   = hasMore ? rows.slice(0, limit) : rows;

  return {
    events:     items.map(toRecord),
    nextCursor: hasMore ? items[items.length - 1]!.id : null,
  };
}

// Per-entity history
export async function getEntityHistory(
  userId: string,
  entityKind: AppendActivityEventInput["entityKind"],
  entityId: string,
  limit = 20
): Promise<ActivityEventRecord[]> {
  const rows = await prisma.activityEvent.findMany({
    where: {
      userId,
      entityType: ENTITY_KIND_TO_TYPE[entityKind] as EntityType,
      entityId,
    },
    orderBy: { occurredAt: "desc" },
    take: limit,
  });
  return rows.map(toRecord);
}

// Recent activity feed across all entities
export async function getRecentActivity(
  userId: string,
  limit = 30
): Promise<ActivityEventRecord[]> {
  const rows = await prisma.activityEvent.findMany({
    where:   { userId },
    orderBy: { occurredAt: "desc" },
    take:    limit,
  });
  return rows.map(toRecord);
}

// Activity count in a time window — for strategic review snapshots
export async function countActivityInWindow(
  userId: string,
  since:  Date,
  until:  Date
): Promise<Record<string, number>> {
  const rows = await prisma.activityEvent.groupBy({
    by:     ["kind"],
    where:  { userId, occurredAt: { gte: since, lte: until } },
    _count: { kind: true },
  });
  return Object.fromEntries(rows.map((r) => [r.kind, r._count.kind]));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

import type { EntityKind } from "@/platform/entities/types";
import { ENTITY_TYPE_TO_KIND } from "@/platform/entities/types";
import type { ActivityEventKind } from "./types";

function toRecord(row: {
  id: string; userId: string; entityType: string; entityId: string;
  kind: string; payload: unknown; occurredAt: Date;
}): ActivityEventRecord {
  return {
    id:         row.id,
    userId:     row.userId,
    entityKind: ENTITY_TYPE_TO_KIND[row.entityType] ?? "note" as EntityKind,
    entityId:   row.entityId,
    kind:       row.kind as ActivityEventKind,
    payload:    row.payload as ActivityEventRecord["payload"],
    occurredAt: row.occurredAt,
  };
}

async function getCursorDate(cursorId: string): Promise<Date> {
  const row = await prisma.activityEvent.findUnique({
    where: { id: cursorId },
    select: { occurredAt: true },
  });
  return row?.occurredAt ?? new Date(0);
}
