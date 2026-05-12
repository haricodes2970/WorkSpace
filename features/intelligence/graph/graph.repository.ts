import { BaseRepository } from "@/repositories/base.repository";
import type { GraphRelationship, EntityType, GraphRelationshipType } from "@prisma/client";

export interface GraphNode {
  entityType: EntityType;
  entityId: string;
  label: string;
  sublabel?: string;
}

export interface GraphEdge {
  id: string;
  type: GraphRelationshipType;
  note: string | null;
  direction: "outgoing" | "incoming";
  peer: GraphNode;
}

export class GraphRepository extends BaseRepository {
  async findEdges(entityType: EntityType, entityId: string): Promise<GraphRelationship[]> {
    return this.db.graphRelationship.findMany({
      where: {
        OR: [
          { sourceType: entityType, sourceId: entityId },
          { targetType: entityType, targetId: entityId },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(data: {
    userId: string;
    sourceType: EntityType;
    sourceId: string;
    targetType: EntityType;
    targetId: string;
    type: GraphRelationshipType;
    note?: string;
  }): Promise<GraphRelationship> {
    return this.db.graphRelationship.create({ data });
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.db.graphRelationship.delete({ where: { id, userId } });
  }

  async findAllByUser(userId: string): Promise<GraphRelationship[]> {
    return this.db.graphRelationship.findMany({
      where:   { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async exists(
    sourceType: EntityType,
    sourceId: string,
    targetType: EntityType,
    targetId: string
  ): Promise<boolean> {
    const r = await this.db.graphRelationship.findUnique({
      where: {
        sourceType_sourceId_targetType_targetId: { sourceType, sourceId, targetType, targetId },
      },
      select: { id: true },
    });
    return r !== null;
  }
}

export const graphRepository = new GraphRepository();
