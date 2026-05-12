/**
 * Entity Resolver — resolves entity IDs to typed refs and metadata.
 * Single lookup point for cross-entity navigation and graph population.
 * Server-only. No I/O outside Prisma.
 */

import "server-only";
import { prisma } from "@/lib/prisma/client";
import type { EntityKind, EntityRef } from "./types";
import { buildEntityHref } from "./types";

// ─── Batch resolution ─────────────────────────────────────────────────────────

export interface EntityRefRequest {
  kind: EntityKind;
  id:   string;
}

export async function resolveEntityRefs(
  requests: EntityRefRequest[]
): Promise<Map<string, EntityRef>> {
  const result = new Map<string, EntityRef>();
  if (requests.length === 0) return result;

  const byKind = new Map<EntityKind, string[]>();
  for (const r of requests) {
    const ids = byKind.get(r.kind) ?? [];
    ids.push(r.id);
    byKind.set(r.kind, ids);
  }

  const resolvers: Promise<void>[] = [];

  if (byKind.has("idea")) {
    resolvers.push(
      prisma.idea
        .findMany({ where: { id: { in: byKind.get("idea")! } }, select: { id: true, title: true } })
        .then((rows) => {
          for (const r of rows) {
            result.set(r.id, { kind: "idea", id: r.id, title: r.title, href: buildEntityHref("idea", r.id) });
          }
        })
    );
  }

  if (byKind.has("project")) {
    resolvers.push(
      prisma.project
        .findMany({ where: { id: { in: byKind.get("project")! } }, select: { id: true, title: true } })
        .then((rows) => {
          for (const r of rows) {
            result.set(r.id, { kind: "project", id: r.id, title: r.title, href: buildEntityHref("project", r.id) });
          }
        })
    );
  }

  if (byKind.has("task")) {
    resolvers.push(
      prisma.task
        .findMany({ where: { id: { in: byKind.get("task")! } }, select: { id: true, title: true } })
        .then((rows) => {
          for (const r of rows) {
            result.set(r.id, { kind: "task", id: r.id, title: r.title, href: buildEntityHref("task", r.id) });
          }
        })
    );
  }

  if (byKind.has("knowledge_memory")) {
    resolvers.push(
      prisma.knowledgeMemory
        .findMany({ where: { id: { in: byKind.get("knowledge_memory")! } }, select: { id: true, title: true } })
        .then((rows) => {
          for (const r of rows) {
            result.set(r.id, { kind: "knowledge_memory", id: r.id, title: r.title, href: buildEntityHref("knowledge_memory", r.id) });
          }
        })
    );
  }

  if (byKind.has("decision")) {
    resolvers.push(
      prisma.decision
        .findMany({ where: { id: { in: byKind.get("decision")! } }, select: { id: true, title: true } })
        .then((rows) => {
          for (const r of rows) {
            result.set(r.id, { kind: "decision", id: r.id, title: r.title, href: buildEntityHref("decision", r.id) });
          }
        })
    );
  }

  if (byKind.has("milestone")) {
    resolvers.push(
      prisma.milestone
        .findMany({ where: { id: { in: byKind.get("milestone")! } }, select: { id: true, title: true } })
        .then((rows) => {
          for (const r of rows) {
            result.set(r.id, { kind: "milestone", id: r.id, title: r.title, href: buildEntityHref("milestone", r.id) });
          }
        })
    );
  }

  await Promise.all(resolvers);
  return result;
}

export async function resolveEntityRef(
  kind: EntityKind,
  id: string
): Promise<EntityRef | null> {
  const map = await resolveEntityRefs([{ kind, id }]);
  return map.get(id) ?? null;
}
