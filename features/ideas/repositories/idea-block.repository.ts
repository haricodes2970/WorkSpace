import type { IdeaBlock, BlockType, RelationshipType } from "@prisma/client";
import { BaseRepository } from "@/repositories/base.repository";

export class IdeaBlockRepository extends BaseRepository {
  async findAllByIdea(ideaId: string): Promise<IdeaBlock[]> {
    return this.db.ideaBlock.findMany({
      where: { ideaId, deletedAt: null },
      orderBy: { createdAt: "asc" },
    });
  }

  async upsert(
    ideaId: string,
    type: BlockType,
    content: string
  ): Promise<IdeaBlock> {
    return this.db.ideaBlock.upsert({
      where: { ideaId_type: { ideaId, type } },
      create: { ideaId, type, content },
      update: { content, updatedAt: new Date() },
    });
  }

  async setCompleted(
    ideaId: string,
    type: BlockType,
    completed: boolean
  ): Promise<IdeaBlock> {
    return this.db.ideaBlock.update({
      where: { ideaId_type: { ideaId, type } },
      data: { completed },
    });
  }

  async softDelete(ideaId: string, type: BlockType): Promise<void> {
    await this.db.ideaBlock.update({
      where: { ideaId_type: { ideaId, type } },
      data: { deletedAt: new Date() },
    });
  }
}

export class IdeaRelationshipRepository extends BaseRepository {
  async findAllByIdea(ideaId: string) {
    return this.db.ideaRelationship.findMany({
      where: {
        OR: [{ sourceId: ideaId }, { targetId: ideaId }],
      },
      include: {
        source: { select: { id: true, title: true } },
        target: { select: { id: true, title: true } },
      },
    });
  }

  async create(sourceId: string, targetId: string, type: RelationshipType) {
    return this.db.ideaRelationship.create({
      data: { sourceId, targetId, type },
    });
  }

  async delete(id: string) {
    return this.db.ideaRelationship.delete({ where: { id } });
  }
}

export const ideaBlockRepository = new IdeaBlockRepository();
export const ideaRelationshipRepository = new IdeaRelationshipRepository();
