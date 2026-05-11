import type { Project, ProjectStatus, ExecutionState } from "@prisma/client";
import type { CreateProject, UpdateProject } from "@/types";
import { BaseRepository } from "./base.repository";

export class ProjectRepository extends BaseRepository {
  async findById(id: string, userId: string): Promise<Project | null> {
    return this.db.project.findFirst({
      where: { id, userId, deletedAt: null },
    });
  }

  async findByIdWithRelations(id: string, userId: string) {
    return this.db.project.findFirst({
      where: { id, userId, deletedAt: null },
      include: {
        tasks:      { where: { deletedAt: null }, orderBy: { position: "asc" } },
        milestones: {
          where:   { deletedAt: null },
          orderBy: { position: "asc" },
          include: { tasks: { where: { deletedAt: null } } },
        },
        notes:         { where: { deletedAt: null }, orderBy: { updatedAt: "desc" } },
        links:         { where: { deletedAt: null } },
        idea:          { select: { id: true, title: true } },
        scopeItems:    { where: { deletedAt: null }, orderBy: [{ bucket: "asc" }, { position: "asc" }] },
        weeklyReviews: { orderBy: { weekStarting: "desc" } },
        decisions:     { where: { deletedAt: null }, orderBy: { createdAt: "desc" } },
        timelineEvents: { orderBy: { occurredAt: "desc" }, take: 100 },
        blockers:       { orderBy: { createdAt: "desc" } },
      },
    });
  }

  async findAllByUser(userId: string, opts: { status?: ProjectStatus; executionState?: ExecutionState } = {}) {
    return this.db.project.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(opts.status && { status: opts.status }),
        ...(opts.executionState && { executionState: opts.executionState }),
      },
      include: {
        tasks: { where: { deletedAt: null }, select: { id: true, status: true } },
        idea:  { select: { id: true, title: true } },
      },
      orderBy: [{ updatedAt: "desc" }],
    });
  }

  async create(data: CreateProject): Promise<Project> {
    return this.db.project.create({ data });
  }

  async update(id: string, userId: string, data: UpdateProject): Promise<Project> {
    return this.db.project.update({ where: { id, userId }, data });
  }

  async updateMomentum(
    id: string,
    momentumScore: number,
    executionState: ExecutionState
  ): Promise<void> {
    await this.db.project.update({
      where: { id },
      data: { momentumScore, executionState },
    });
  }

  async softDelete(id: string, userId: string): Promise<void> {
    await this.db.project.update({
      where: { id, userId },
      data: { deletedAt: new Date() },
    });
  }

  async ship(id: string, userId: string): Promise<Project> {
    return this.db.project.update({
      where: { id, userId },
      data: {
        status:         "SHIPPED",
        executionState: "MAINTAINING",
        shippedAt:      new Date(),
      },
    });
  }
}

export const projectRepository = new ProjectRepository();
