import type { BlockType } from "@prisma/client";
import { ideaBlockRepository } from "../repositories/idea-block.repository";
import { ideaRepository } from "@/repositories/idea.repository";
import {
  calculateReadiness,
  scoreToStatus,
} from "../readiness/calculator";

export class ReadinessService {
  /**
   * Recalculate readiness score from persisted blocks and update the idea row.
   * Call this after any block upsert.
   */
  async syncReadiness(ideaId: string, userId: string): Promise<number> {
    const blocks = await ideaBlockRepository.findAllByIdea(ideaId);

    const score = calculateReadiness(
      blocks.map((b) => ({ type: b.type as BlockType, content: b.content }))
    );

    await ideaRepository.update(ideaId, userId, {
      readinessScore: score.total,
      readinessStatus: scoreToStatus(score.total),
    });

    return score.total;
  }

  /**
   * Upsert a block and immediately sync readiness on the idea.
   */
  async saveBlock(
    ideaId: string,
    userId: string,
    type: BlockType,
    content: string
  ) {
    const block = await ideaBlockRepository.upsert(ideaId, type, content);
    await this.syncReadiness(ideaId, userId);
    return block;
  }
}

export const readinessService = new ReadinessService();
