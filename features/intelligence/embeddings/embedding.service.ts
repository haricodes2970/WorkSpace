import { openai } from "@ai-sdk/openai";
import { embed } from "ai";
import { prisma } from "@/lib/prisma/client";
import type { EntityType } from "@prisma/client";

// Vector formatted as pgvector literal: '[0.1, 0.2, ...]'
function vectorToLiteral(v: number[]): string {
  return `[${v.join(",")}]`;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!process.env.OPENAI_API_KEY) {
    return new Array(1536).fill(0);
  }
  const { embedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: text.slice(0, 8000), // token budget safety
  });
  return embedding;
}

export async function upsertEmbedding(
  entityType: EntityType,
  entityId: string,
  content: string
): Promise<void> {
  const vector = await generateEmbedding(content);
  const literal = vectorToLiteral(vector);

  await prisma.$executeRaw`
    INSERT INTO embeddings (id, entity_type, entity_id, content, vector, model, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      ${entityType}::"EntityType",
      ${entityId}::uuid,
      ${content},
      ${literal}::vector,
      'text-embedding-3-small',
      now(),
      now()
    )
    ON CONFLICT (entity_type, entity_id) DO UPDATE
      SET content    = EXCLUDED.content,
          vector     = EXCLUDED.vector,
          updated_at = now()
  `;
}

export interface SimilarityResult {
  entityType: EntityType;
  entityId: string;
  content: string;
  similarity: number;
}

export async function findSimilar(
  queryText: string,
  opts: {
    entityTypes?: EntityType[];
    limit?: number;
    minSimilarity?: number;
  } = {}
): Promise<SimilarityResult[]> {
  if (!process.env.OPENAI_API_KEY) return [];

  const vector = await generateEmbedding(queryText);
  const literal = vectorToLiteral(vector);
  const limit = opts.limit ?? 10;
  const minSim = opts.minSimilarity ?? 0.5;

  if (opts.entityTypes && opts.entityTypes.length > 0) {
    const types = opts.entityTypes;
    const rows = await prisma.$queryRaw<SimilarityResult[]>`
      SELECT
        entity_type   AS "entityType",
        entity_id     AS "entityId",
        content,
        1 - (vector <=> ${literal}::vector) AS similarity
      FROM embeddings
      WHERE entity_type = ANY(${types}::"EntityType"[])
        AND 1 - (vector <=> ${literal}::vector) >= ${minSim}
      ORDER BY vector <=> ${literal}::vector
      LIMIT ${limit}
    `;
    return rows;
  }

  const rows = await prisma.$queryRaw<SimilarityResult[]>`
    SELECT
      entity_type   AS "entityType",
      entity_id     AS "entityId",
      content,
      1 - (vector <=> ${literal}::vector) AS similarity
    FROM embeddings
    WHERE 1 - (vector <=> ${literal}::vector) >= ${minSim}
    ORDER BY vector <=> ${literal}::vector
    LIMIT ${limit}
  `;
  return rows;
}
