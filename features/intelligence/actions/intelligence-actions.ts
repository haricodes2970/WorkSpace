"use server";

import { requireAuthUser } from "@/services/auth.service";
import { memoryRepository } from "../memories/memory.repository";
import { insightRepository } from "../insights/insight.repository";
import { graphRepository } from "../graph/graph.repository";
import { retrospectiveRepository } from "../retrospectives/retrospective.repository";
import { linkEntities, unlinkEntities } from "../graph/graph.service";
import { refreshInsights } from "../insights/insight.service";
import { enqueueEmbedding } from "../embeddings/embedding.queue";
import { search } from "../search/search.service";
import type { ActionResult } from "@/types/api";
import type { KnowledgeMemory, GraphRelationship, InsightSnapshot, Retrospective } from "@prisma/client";
import { z } from "zod";

// ─── Memory ───────────────────────────────────────────────────────────────

const memorySchema = z.object({
  projectId:    z.string().uuid().optional(),
  ideaId:       z.string().uuid().optional(),
  type:         z.enum(["INSIGHT", "MISTAKE", "DISCOVERY", "PATTERN", "CONSTRAINT", "LEARNING", "BREAKTHROUGH", "PIVOT"]),
  title:        z.string().min(1).max(300),
  body:         z.string().max(5000).default(""),
  tags:         z.array(z.string().max(50)).max(10).default([]),
  significance: z.number().int().min(1).max(10).default(5),
});

export async function addMemoryAction(input: unknown): Promise<ActionResult<KnowledgeMemory>> {
  const parsed = memorySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

  try {
    const { profile } = await requireAuthUser();
    const memory = await memoryRepository.create({ ...parsed.data, userId: profile.id });

    // Async embedding (fire and forget)
    await enqueueEmbedding(
      profile.id,
      "KNOWLEDGE_MEMORY",
      memory.id,
      `${memory.title}\n${memory.body}`
    );

    return { success: true, data: memory };
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
    return { success: false, error: "Failed to add memory" };
  }
}

export async function updateMemoryAction(
  id: string,
  data: { title?: string; body?: string; tags?: string[]; significance?: number; pinned?: boolean }
): Promise<ActionResult<KnowledgeMemory>> {
  try {
    const { profile } = await requireAuthUser();
    const memory = await memoryRepository.update(id, profile.id, data);
    return { success: true, data: memory };
  } catch {
    return { success: false, error: "Failed to update memory" };
  }
}

export async function deleteMemoryAction(id: string): Promise<ActionResult> {
  try {
    const { profile } = await requireAuthUser();
    await memoryRepository.softDelete(id, profile.id);
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to delete memory" };
  }
}

export async function pinMemoryAction(id: string, pinned: boolean): Promise<ActionResult<KnowledgeMemory>> {
  try {
    const { profile } = await requireAuthUser();
    const memory = await memoryRepository.pin(id, profile.id, pinned);
    return { success: true, data: memory };
  } catch {
    return { success: false, error: "Failed to pin memory" };
  }
}

// ─── Insights ─────────────────────────────────────────────────────────────

export async function refreshInsightsAction(): Promise<ActionResult<{ count: number }>> {
  try {
    const { profile } = await requireAuthUser();
    const count = await refreshInsights(profile.id);
    return { success: true, data: { count } };
  } catch {
    return { success: false, error: "Failed to refresh insights" };
  }
}

export async function dismissInsightAction(id: string): Promise<ActionResult> {
  try {
    const { profile } = await requireAuthUser();
    await insightRepository.dismiss(id, profile.id);
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to dismiss insight" };
  }
}

// ─── Graph ────────────────────────────────────────────────────────────────

const graphSchema = z.object({
  sourceType: z.enum(["IDEA", "PROJECT", "DECISION", "WEEKLY_REVIEW", "NOTE", "KNOWLEDGE_MEMORY", "MILESTONE", "BLOCKER"]),
  sourceId:   z.string().uuid(),
  targetType: z.enum(["IDEA", "PROJECT", "DECISION", "WEEKLY_REVIEW", "NOTE", "KNOWLEDGE_MEMORY", "MILESTONE", "BLOCKER"]),
  targetId:   z.string().uuid(),
  type:       z.enum(["RELATED_TO", "INSPIRED_BY", "BLOCKED_BY", "DUPLICATES", "EVOLVED_INTO", "REFERENCES", "CONTRADICTS", "DEPENDS_ON", "VALIDATES", "REPLACES"]),
  note:       z.string().max(500).optional(),
});

export async function linkEntitiesAction(input: unknown): Promise<ActionResult<GraphRelationship | null>> {
  const parsed = graphSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

  try {
    const { profile } = await requireAuthUser();
    const rel = await linkEntities({ ...parsed.data, userId: profile.id });
    return { success: true, data: rel };
  } catch {
    return { success: false, error: "Failed to link entities" };
  }
}

export async function unlinkEntitiesAction(id: string): Promise<ActionResult> {
  try {
    const { profile } = await requireAuthUser();
    await unlinkEntities(id, profile.id);
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to unlink entities" };
  }
}

// ─── Retrospective ────────────────────────────────────────────────────────

const retroSchema = z.object({
  projectId:   z.string().uuid().optional(),
  type:        z.enum(["WEEKLY", "MONTHLY", "PROJECT_CLOSE", "IDEA_AUDIT", "DECISION_REVIEW", "QUARTERLY"]),
  title:       z.string().min(1).max(300),
  period:      z.string().max(20).optional(),
  wentWell:    z.string().max(5000).default(""),
  wentPoorly:  z.string().max(5000).default(""),
  learned:     z.string().max(5000).default(""),
  nextActions: z.string().max(5000).default(""),
});

export async function saveRetrospectiveAction(input: unknown): Promise<ActionResult<Retrospective>> {
  const parsed = retroSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };

  try {
    const { profile } = await requireAuthUser();
    const retro = await retrospectiveRepository.create({ ...parsed.data, userId: profile.id });
    return { success: true, data: retro };
  } catch {
    return { success: false, error: "Failed to save retrospective" };
  }
}

export async function deleteRetrospectiveAction(id: string): Promise<ActionResult> {
  try {
    const { profile } = await requireAuthUser();
    await retrospectiveRepository.delete(id, profile.id);
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to delete retrospective" };
  }
}

// ─── Search ───────────────────────────────────────────────────────────────

export async function searchAction(query: string) {
  try {
    const { profile } = await requireAuthUser();
    if (!query.trim()) return { success: true as const, data: [] };
    const results = await search(query, profile.id);
    return { success: true as const, data: results };
  } catch {
    return { success: false as const, error: "Search failed" };
  }
}
