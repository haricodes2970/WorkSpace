import type {
  WeeklyReview, Decision, TimelineEvent, ScopeItem,
  ProjectRisk, Blocker, ScopeBucket, TimelineEventType, RiskSeverity,
} from "@prisma/client";
import { BaseRepository } from "@/repositories/base.repository";

// ─── WeeklyReview ─────────────────────────────────────────────────────────

export class WeeklyReviewRepository extends BaseRepository {
  async findAllByProject(projectId: string): Promise<WeeklyReview[]> {
    return this.db.weeklyReview.findMany({
      where: { projectId },
      orderBy: { weekStarting: "desc" },
    });
  }

  async upsert(data: {
    projectId: string;
    userId: string;
    weekStarting: Date;
    movedForward: string;
    stalled: string;
    changed: string;
    assumptionsFailed: string;
    shouldCut: string;
    worthContinuing: boolean;
    overallRating: number;
  }): Promise<WeeklyReview> {
    return this.db.weeklyReview.upsert({
      where: {
        projectId_weekStarting: {
          projectId: data.projectId,
          weekStarting: data.weekStarting,
        },
      },
      create: data,
      update: {
        movedForward:      data.movedForward,
        stalled:           data.stalled,
        changed:           data.changed,
        assumptionsFailed: data.assumptionsFailed,
        shouldCut:         data.shouldCut,
        worthContinuing:   data.worthContinuing,
        overallRating:     data.overallRating,
      },
    });
  }
}

// ─── Decision ─────────────────────────────────────────────────────────────

export class DecisionRepository extends BaseRepository {
  async findAllByProject(projectId: string): Promise<Decision[]> {
    return this.db.decision.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(data: {
    projectId: string;
    userId: string;
    title: string;
    context: string;
    decision: string;
    alternatives: string;
    tradeoffs: string;
  }): Promise<Decision> {
    return this.db.decision.create({ data });
  }

  async reverse(id: string, reversalNote: string): Promise<Decision> {
    return this.db.decision.update({
      where: { id },
      data: { reversed: true, reversalNote },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.db.decision.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

// ─── TimelineEvent ────────────────────────────────────────────────────────

export class TimelineEventRepository extends BaseRepository {
  async findAllByProject(projectId: string, limit = 100): Promise<TimelineEvent[]> {
    return this.db.timelineEvent.findMany({
      where: { projectId },
      orderBy: { occurredAt: "desc" },
      take: limit,
    });
  }

  async create(data: {
    projectId: string;
    userId: string;
    type: TimelineEventType;
    title: string;
    description?: string;
    metadata?: object;
    occurredAt?: Date;
  }): Promise<TimelineEvent> {
    return this.db.timelineEvent.create({
      data: {
        projectId:   data.projectId,
        userId:      data.userId,
        type:        data.type,
        title:       data.title,
        description: data.description ?? null,
        metadata:    data.metadata ?? undefined,
        occurredAt:  data.occurredAt ?? new Date(),
      },
    });
  }
}

// ─── ScopeItem ────────────────────────────────────────────────────────────

export class ScopeItemRepository extends BaseRepository {
  async findAllByProject(projectId: string): Promise<ScopeItem[]> {
    return this.db.scopeItem.findMany({
      where: { projectId, deletedAt: null },
      orderBy: [{ bucket: "asc" }, { position: "asc" }],
    });
  }

  async create(data: {
    projectId: string;
    userId: string;
    title: string;
    bucket: ScopeBucket;
  }): Promise<ScopeItem> {
    return this.db.scopeItem.create({ data });
  }

  async moveBucket(id: string, bucket: ScopeBucket): Promise<ScopeItem> {
    return this.db.scopeItem.update({ where: { id }, data: { bucket } });
  }

  async softDelete(id: string): Promise<void> {
    await this.db.scopeItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

// ─── ProjectRisk ──────────────────────────────────────────────────────────

export class ProjectRiskRepository extends BaseRepository {
  async findAllByProject(projectId: string): Promise<ProjectRisk[]> {
    return this.db.projectRisk.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { severity: "desc" },
    });
  }

  async create(data: {
    projectId: string;
    userId: string;
    title: string;
    description?: string;
    severity: RiskSeverity;
  }): Promise<ProjectRisk> {
    return this.db.projectRisk.create({ data });
  }

  async setMitigated(id: string, mitigated: boolean): Promise<ProjectRisk> {
    return this.db.projectRisk.update({ where: { id }, data: { mitigated } });
  }

  async softDelete(id: string): Promise<void> {
    await this.db.projectRisk.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

// ─── Blocker ──────────────────────────────────────────────────────────────

export class BlockerRepository extends BaseRepository {
  async findAllByProject(projectId: string): Promise<Blocker[]> {
    return this.db.blocker.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(data: {
    projectId: string;
    userId: string;
    title: string;
    description?: string;
  }): Promise<Blocker> {
    return this.db.blocker.create({ data });
  }

  async resolve(id: string): Promise<Blocker> {
    return this.db.blocker.update({
      where: { id },
      data: { resolved: true, resolvedAt: new Date() },
    });
  }
}

// ─── Singletons ───────────────────────────────────────────────────────────

export const weeklyReviewRepository  = new WeeklyReviewRepository();
export const decisionRepository      = new DecisionRepository();
export const timelineEventRepository = new TimelineEventRepository();
export const scopeItemRepository     = new ScopeItemRepository();
export const projectRiskRepository   = new ProjectRiskRepository();
export const blockerRepository       = new BlockerRepository();
