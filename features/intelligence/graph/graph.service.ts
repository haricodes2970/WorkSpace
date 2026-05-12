import { prisma } from "@/lib/prisma/client";
import { graphRepository, type GraphEdge } from "./graph.repository";
import type { EntityType, GraphRelationshipType } from "@prisma/client";

// Resolve human-readable label for any entity type
async function resolveLabel(
  entityType: EntityType,
  entityId: string
): Promise<{ label: string; sublabel?: string }> {
  switch (entityType) {
    case "IDEA": {
      const r = await prisma.idea.findUnique({ where: { id: entityId }, select: { title: true, status: true } });
      return { label: r?.title ?? "Idea", sublabel: r?.status };
    }
    case "PROJECT": {
      const r = await prisma.project.findUnique({ where: { id: entityId }, select: { title: true, status: true } });
      return { label: r?.title ?? "Project", sublabel: r?.status };
    }
    case "DECISION": {
      const r = await prisma.decision.findUnique({ where: { id: entityId }, select: { title: true } });
      return { label: r?.title ?? "Decision" };
    }
    case "NOTE": {
      const r = await prisma.note.findUnique({ where: { id: entityId }, select: { title: true } });
      return { label: r?.title ?? "Note" };
    }
    case "MILESTONE": {
      const r = await prisma.milestone.findUnique({ where: { id: entityId }, select: { title: true } });
      return { label: r?.title ?? "Milestone" };
    }
    case "BLOCKER": {
      const r = await prisma.blocker.findUnique({ where: { id: entityId }, select: { title: true } });
      return { label: r?.title ?? "Blocker" };
    }
    case "KNOWLEDGE_MEMORY": {
      const r = await prisma.knowledgeMemory.findUnique({ where: { id: entityId }, select: { title: true, type: true } });
      return { label: r?.title ?? "Memory", sublabel: r?.type };
    }
    case "WEEKLY_REVIEW": {
      const r = await prisma.weeklyReview.findUnique({ where: { id: entityId }, select: { weekStarting: true } });
      return { label: r ? `Review ${r.weekStarting.toLocaleDateString()}` : "Review" };
    }
  }
}

export async function getEdgesWithLabels(
  entityType: EntityType,
  entityId: string
): Promise<GraphEdge[]> {
  const raw = await graphRepository.findEdges(entityType, entityId);

  return Promise.all(
    raw.map(async (rel) => {
      const isOutgoing = rel.sourceType === entityType && rel.sourceId === entityId;
      const peerType = isOutgoing ? rel.targetType : rel.sourceType;
      const peerId   = isOutgoing ? rel.targetId   : rel.sourceId;
      const { label, sublabel } = await resolveLabel(peerType, peerId);

      return {
        id:        rel.id,
        type:      rel.type,
        note:      rel.note,
        direction: isOutgoing ? ("outgoing" as const) : ("incoming" as const),
        peer: { entityType: peerType, entityId: peerId, label, sublabel },
      };
    })
  );
}

export async function linkEntities(params: {
  userId: string;
  sourceType: EntityType;
  sourceId: string;
  targetType: EntityType;
  targetId: string;
  type: GraphRelationshipType;
  note?: string;
}) {
  const alreadyExists = await graphRepository.exists(
    params.sourceType,
    params.sourceId,
    params.targetType,
    params.targetId
  );
  if (alreadyExists) return null;
  return graphRepository.create(params);
}

export async function unlinkEntities(id: string, userId: string) {
  return graphRepository.delete(id, userId);
}

// Lightweight entity suggestions — find entities with matching tags (no LLM required)
export async function suggestLinks(
  entityType: EntityType,
  entityId: string,
  userId: string,
  limit = 5
): Promise<Array<{ entityType: EntityType; entityId: string; label: string; reason: string }>> {
  const suggestions: Array<{ entityType: EntityType; entityId: string; label: string; reason: string }> = [];

  if (entityType === "PROJECT") {
    const project = await prisma.project.findUnique({
      where: { id: entityId },
      select: { tags: true, title: true },
    });
    if (!project) return [];

    const related = await prisma.idea.findMany({
      where: {
        userId,
        deletedAt: null,
        id: { not: entityId },
        tags: project.tags.length > 0 ? { hasSome: project.tags } : undefined,
      },
      take: limit,
      select: { id: true, title: true },
    });
    suggestions.push(
      ...related.map((r) => ({
        entityType: "IDEA" as EntityType,
        entityId:   r.id,
        label:      r.title,
        reason:     "Shared tags",
      }))
    );
  }

  if (entityType === "IDEA") {
    const idea = await prisma.idea.findUnique({
      where: { id: entityId },
      select: { tags: true },
    });
    if (!idea) return [];

    const related = await prisma.project.findMany({
      where: {
        userId,
        deletedAt: null,
        id: { not: entityId },
        tags: idea.tags.length > 0 ? { hasSome: idea.tags } : undefined,
      },
      take: limit,
      select: { id: true, title: true },
    });
    suggestions.push(
      ...related.map((r) => ({
        entityType: "PROJECT" as EntityType,
        entityId:   r.id,
        label:      r.title,
        reason:     "Shared tags",
      }))
    );
  }

  return suggestions.slice(0, limit);
}
