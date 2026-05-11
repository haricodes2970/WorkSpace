import type { Idea, IdeaStatus } from "@prisma/client";
import type { CreateIdea, UpdateIdea, IdeaWithRelations } from "@/types";
import { BaseRepository } from "./base.repository";

export class IdeaRepository extends BaseRepository {
  async findById(id: string, userId: string): Promise<Idea | null> {
    return this.db.idea.findFirst({
      where: { id, userId, deletedAt: null },
    });
  }

  async findByIdWithRelations(id: string, userId: string): Promise<IdeaWithRelations | null> {
    return this.db.idea.findFirst({
      where: { id, userId, deletedAt: null },
      include: { notes: true, links: true, project: true },
    });
  }

  async findAllByUser(
    userId: string,
    opts: { status?: IdeaStatus; pinned?: boolean } = {}
  ): Promise<Idea[]> {
    return this.db.idea.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(opts.status && { status: opts.status }),
        ...(opts.pinned !== undefined && { pinned: opts.pinned }),
      },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    });
  }

  async create(data: CreateIdea): Promise<Idea> {
    return this.db.idea.create({ data });
  }

  async update(id: string, userId: string, data: UpdateIdea): Promise<Idea> {
    return this.db.idea.update({
      where: { id, userId },
      data,
    });
  }

  async softDelete(id: string, userId: string): Promise<void> {
    await this.db.idea.update({
      where: { id, userId },
      data: { deletedAt: new Date() },
    });
  }

  async convertToProject(ideaId: string, userId: string, projectId: string): Promise<Idea> {
    return this.db.idea.update({
      where: { id: ideaId, userId },
      data: {
        status: "CONVERTED",
        projectId,
        convertedAt: new Date(),
      },
    });
  }
}

export const ideaRepository = new IdeaRepository();
