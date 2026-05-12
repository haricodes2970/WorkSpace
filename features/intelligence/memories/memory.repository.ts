import { BaseRepository } from "@/repositories/base.repository";
import type { KnowledgeMemory, MemoryType } from "@prisma/client";

export class MemoryRepository extends BaseRepository {
  async findAllByUser(
    userId: string,
    opts: { type?: MemoryType; projectId?: string; ideaId?: string; pinned?: boolean; limit?: number } = {}
  ): Promise<KnowledgeMemory[]> {
    return this.db.knowledgeMemory.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(opts.type      && { type:      opts.type }),
        ...(opts.projectId && { projectId: opts.projectId }),
        ...(opts.ideaId    && { ideaId:    opts.ideaId }),
        ...(opts.pinned !== undefined && { pinned: opts.pinned }),
      },
      orderBy: [{ pinned: "desc" }, { significance: "desc" }, { createdAt: "desc" }],
      take:    opts.limit ?? 100,
    });
  }

  async findByProject(projectId: string): Promise<KnowledgeMemory[]> {
    return this.db.knowledgeMemory.findMany({
      where:   { projectId, deletedAt: null },
      orderBy: [{ pinned: "desc" }, { significance: "desc" }, { createdAt: "desc" }],
    });
  }

  async findByIdea(ideaId: string): Promise<KnowledgeMemory[]> {
    return this.db.knowledgeMemory.findMany({
      where:   { ideaId, deletedAt: null },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    });
  }

  async create(data: {
    userId: string;
    projectId?: string | null;
    ideaId?: string | null;
    type: MemoryType;
    title: string;
    body: string;
    tags: string[];
    significance: number;
  }): Promise<KnowledgeMemory> {
    return this.db.knowledgeMemory.create({ data });
  }

  async update(
    id: string,
    userId: string,
    data: { title?: string; body?: string; tags?: string[]; significance?: number; pinned?: boolean }
  ): Promise<KnowledgeMemory> {
    return this.db.knowledgeMemory.update({ where: { id, userId }, data });
  }

  async softDelete(id: string, userId: string): Promise<void> {
    await this.db.knowledgeMemory.update({
      where: { id, userId },
      data:  { deletedAt: new Date() },
    });
  }

  async pin(id: string, userId: string, pinned: boolean): Promise<KnowledgeMemory> {
    return this.db.knowledgeMemory.update({ where: { id, userId }, data: { pinned } });
  }
}

export const memoryRepository = new MemoryRepository();
