import { Prisma } from "@prisma/client";
import { BaseRepository } from "@/repositories/base.repository";
import type { Retrospective, RetrospectiveType } from "@prisma/client";

export class RetrospectiveRepository extends BaseRepository {
  async findAllByUser(userId: string, opts: { projectId?: string } = {}): Promise<Retrospective[]> {
    return this.db.retrospective.findMany({
      where: { userId, ...(opts.projectId && { projectId: opts.projectId }) },
      orderBy: { createdAt: "desc" },
      take:    50,
    });
  }

  async findByProject(projectId: string): Promise<Retrospective[]> {
    return this.db.retrospective.findMany({
      where:   { projectId },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(data: {
    userId: string;
    projectId?: string | null;
    type: RetrospectiveType;
    title: string;
    period?: string | null;
    wentWell: string;
    wentPoorly: string;
    learned: string;
    nextActions: string;
    snapshot?: Record<string, unknown> | null;
  }): Promise<Retrospective> {
    const { snapshot, ...rest } = data;
    return this.db.retrospective.create({
      data: {
        ...rest,
        snapshot: snapshot === null ? Prisma.JsonNull : (snapshot as Prisma.InputJsonValue),
      },
    });
  }

  async update(
    id: string,
    userId: string,
    data: { wentWell?: string; wentPoorly?: string; learned?: string; nextActions?: string }
  ): Promise<Retrospective> {
    return this.db.retrospective.update({ where: { id, userId }, data });
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.db.retrospective.delete({ where: { id, userId } });
  }
}

export const retrospectiveRepository = new RetrospectiveRepository();
