import { Prisma } from "@prisma/client";
import { BaseRepository } from "@/repositories/base.repository";
import type { InsightSnapshot, InsightType } from "@prisma/client";

export class InsightRepository extends BaseRepository {
  async findActive(userId: string): Promise<InsightSnapshot[]> {
    return this.db.insightSnapshot.findMany({
      where:   { userId, dismissed: false },
      orderBy: [{ severity: "desc" }, { generatedAt: "desc" }],
      take:    10,
    });
  }

  async findAll(userId: string): Promise<InsightSnapshot[]> {
    return this.db.insightSnapshot.findMany({
      where:   { userId },
      orderBy: { generatedAt: "desc" },
      take:    50,
    });
  }

  async upsert(data: {
    userId: string;
    type: InsightType;
    title: string;
    body: string;
    evidence: Record<string, unknown>;
    severity: "INFO" | "WARNING" | "CRITICAL";
    expiresAt?: Date;
  }): Promise<InsightSnapshot> {
    return this.db.insightSnapshot.create({
      data: {
        userId:    data.userId,
        type:      data.type,
        title:     data.title,
        body:      data.body,
        evidence:  data.evidence as Prisma.InputJsonValue,
        severity:  data.severity,
        expiresAt: data.expiresAt,
        dismissed: false,
      },
    });
  }

  async dismiss(id: string, userId: string): Promise<void> {
    await this.db.insightSnapshot.update({
      where: { id, userId },
      data:  { dismissed: true },
    });
  }

  async deleteExpired(): Promise<number> {
    const result = await this.db.insightSnapshot.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }

  async clearByType(userId: string, type: InsightType): Promise<void> {
    await this.db.insightSnapshot.deleteMany({ where: { userId, type } });
  }
}

export const insightRepository = new InsightRepository();
