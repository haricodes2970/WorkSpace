import { prisma } from "@/lib/prisma/client";
import { upsertEmbedding } from "./embedding.service";
import type { EntityType } from "@prisma/client";

export async function enqueueEmbedding(
  userId: string,
  entityType: EntityType,
  entityId: string,
  content: string
): Promise<void> {
  await prisma.embeddingJob.upsert({
    where:  { entityType_entityId: { entityType, entityId } },
    create: { userId, entityType, entityId, content, status: "PENDING" },
    update: { content, status: "PENDING", lastError: null },
  });
}

export interface QueueStats {
  pending: number;
  processing: number;
  done: number;
  failed: number;
}

export async function getQueueStats(): Promise<QueueStats> {
  const groups = await prisma.embeddingJob.groupBy({
    by: ["status"],
    _count: { id: true },
  });
  const base: QueueStats = { pending: 0, processing: 0, done: 0, failed: 0 };
  for (const g of groups) {
    const k = g.status.toLowerCase() as keyof QueueStats;
    base[k] = g._count.id;
  }
  return base;
}

export async function processBatch(limit = 20): Promise<{ processed: number; failed: number }> {
  // Claim batch atomically
  const jobs = await prisma.$queryRaw<{ id: string; entity_type: EntityType; entity_id: string; content: string }[]>`
    UPDATE embedding_jobs
    SET status = 'PROCESSING', attempts = attempts + 1
    WHERE id IN (
      SELECT id FROM embedding_jobs
      WHERE status = 'PENDING'
      ORDER BY created_at ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id, entity_type, entity_id, content
  `;

  let processed = 0;
  let failed = 0;

  await Promise.allSettled(
    jobs.map(async (job: { id: string; entity_type: EntityType; entity_id: string; content: string }) => {
      try {
        await upsertEmbedding(job.entity_type, job.entity_id, job.content);
        await prisma.embeddingJob.update({
          where: { id: job.id },
          data:  { status: "DONE", processedAt: new Date() },
        });
        processed++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        await prisma.embeddingJob.update({
          where: { id: job.id },
          data:  { status: "FAILED", lastError: msg },
        });
        failed++;
      }
    })
  );

  return { processed, failed };
}
