import { prisma } from "@/lib/prisma/client";
import { findSimilar } from "../embeddings/embedding.service";
import type { EntityType } from "@prisma/client";

export type SearchResultType = "idea" | "project" | "decision" | "note" | "memory" | "milestone";

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  sublabel: string | null;
  excerpt: string | null;
  url: string;
  score: number;
}

// ─── Text search (Prisma contains — no pgvector needed) ───────────────────

async function textSearchIdeas(query: string, userId: string): Promise<SearchResult[]> {
  const rows = await prisma.idea.findMany({
    where: { userId, deletedAt: null, title: { contains: query, mode: "insensitive" } },
    select: { id: true, title: true, readinessStatus: true, description: true },
    take: 8,
  });
  return rows.map((r) => ({
    type:     "idea" as const,
    id:       r.id,
    title:    r.title,
    sublabel: r.readinessStatus,
    excerpt:  r.description,
    url:      `/ideas/${r.id}`,
    score:    0.9,
  }));
}

async function textSearchProjects(query: string, userId: string): Promise<SearchResult[]> {
  const rows = await prisma.project.findMany({
    where: { userId, deletedAt: null, title: { contains: query, mode: "insensitive" } },
    select: { id: true, title: true, status: true, description: true },
    take: 8,
  });
  return rows.map((r) => ({
    type:     "project" as const,
    id:       r.id,
    title:    r.title,
    sublabel: r.status,
    excerpt:  r.description,
    url:      `/projects/${r.id}`,
    score:    0.9,
  }));
}

async function textSearchDecisions(query: string, userId: string): Promise<SearchResult[]> {
  const rows = await prisma.decision.findMany({
    where: {
      userId, deletedAt: null,
      OR: [
        { title:    { contains: query, mode: "insensitive" } },
        { decision: { contains: query, mode: "insensitive" } },
      ],
    },
    select: { id: true, title: true, decision: true, projectId: true },
    take: 6,
  });
  return rows.map((r) => ({
    type:     "decision" as const,
    id:       r.id,
    title:    r.title,
    sublabel: "Decision",
    excerpt:  r.decision.slice(0, 150),
    url:      `/projects/${r.projectId}`,
    score:    0.85,
  }));
}

async function textSearchNotes(query: string, userId: string): Promise<SearchResult[]> {
  const rows = await prisma.note.findMany({
    where: {
      userId, deletedAt: null,
      OR: [
        { title:   { contains: query, mode: "insensitive" } },
        { content: { contains: query, mode: "insensitive" } },
      ],
    },
    select: { id: true, title: true, content: true, projectId: true, ideaId: true },
    take: 6,
  });
  return rows.map((r) => ({
    type:     "note" as const,
    id:       r.id,
    title:    r.title ?? "Note",
    sublabel: "Note",
    excerpt:  r.content.slice(0, 150),
    url:      r.projectId ? `/projects/${r.projectId}` : r.ideaId ? `/ideas/${r.ideaId}` : "#",
    score:    0.8,
  }));
}

async function textSearchMemories(query: string, userId: string): Promise<SearchResult[]> {
  const rows = await prisma.knowledgeMemory.findMany({
    where: {
      userId, deletedAt: null,
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { body:  { contains: query, mode: "insensitive" } },
      ],
    },
    select: { id: true, title: true, type: true, body: true },
    take: 6,
  });
  return rows.map((r) => ({
    type:     "memory" as const,
    id:       r.id,
    title:    r.title,
    sublabel: r.type,
    excerpt:  r.body.slice(0, 150),
    url:      `/knowledge`,
    score:    0.8,
  }));
}

// ─── Semantic reranking (requires pgvector + API key) ─────────────────────

async function semanticSearch(query: string): Promise<Map<string, number>> {
  const ENTITY_TYPES: EntityType[] = ["IDEA", "PROJECT", "DECISION", "NOTE", "KNOWLEDGE_MEMORY"];
  try {
    const results = await findSimilar(query, { entityTypes: ENTITY_TYPES, limit: 20, minSimilarity: 0.4 });
    const scoreMap = new Map<string, number>();
    for (const r of results) {
      scoreMap.set(r.entityId, r.similarity);
    }
    return scoreMap;
  } catch {
    return new Map();
  }
}

// ─── Hybrid search: text candidates + semantic reranking ─────────────────

export async function search(query: string, userId: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const [ideas, projects, decisions, notes, memories, semanticScores] = await Promise.all([
    textSearchIdeas(query, userId),
    textSearchProjects(query, userId),
    textSearchDecisions(query, userId),
    textSearchNotes(query, userId),
    textSearchMemories(query, userId),
    semanticSearch(query),
  ]);

  const all = [...ideas, ...projects, ...decisions, ...notes, ...memories];

  // Apply semantic score boost if available
  const reranked = all.map((r) => {
    const sem = semanticScores.get(r.id);
    return sem ? { ...r, score: Math.max(r.score, sem) } : r;
  });

  // Also add semantic-only results not surfaced by text search
  const _existingIds = new Set(all.map((r) => r.id));
  // (semantic-only results would require a second lookup — skip for now; text candidates are sufficient)

  return reranked.sort((a, b) => b.score - a.score).slice(0, 20);
}
