import "server-only";
import { prisma } from "@/lib/prisma/client";
import { isStale, computeAge } from "@/features/temporal/aging";

export interface AmbientSurface {
  resurface:   ResurfaceItem[];
  nudges:      NudgeItem[];
}

export interface ResurfaceItem {
  id:        string;
  kind:      "memory" | "idea";
  title:     string;
  body:      string;
  updatedAt: Date;
  href:      string;
  reason:    string;
}

export interface NudgeItem {
  id:      string;
  kind:    "project" | "idea";
  title:   string;
  href:    string;
  message: string;
}

export async function getAmbientSurface(userId: string): Promise<AmbientSurface> {
  const [memories, ideas, projects] = await Promise.all([
    prisma.memory.findMany({
      where:   { userId },
      orderBy: { updatedAt: "desc" },
      take:    50,
      select:  { id: true, title: true, content: true, type: true, updatedAt: true },
    }),
    prisma.idea.findMany({
      where:   { userId, archived: false },
      orderBy: { updatedAt: "asc" },   // oldest first for surfacing
      take:    30,
      select:  { id: true, title: true, description: true, updatedAt: true, score: true },
    }),
    prisma.project.findMany({
      where:   { userId, archived: false },
      orderBy: { updatedAt: "asc" },
      take:    20,
      select:  { id: true, title: true, phase: true, updatedAt: true, momentum: true },
    }),
  ]);

  // Pick 3 memories to resurface — prefer those not updated in 7-30 days (sweet spot)
  const resurfaceMemories: ResurfaceItem[] = memories
    .filter((m) => {
      const days = computeAge(m.updatedAt).daysSince;
      return days >= 7 && days <= 90;
    })
    .slice(0, 2)
    .map((m) => ({
      id:        m.id,
      kind:      "memory" as const,
      title:     m.title,
      body:      m.content.slice(0, 120),
      updatedAt: m.updatedAt,
      href:      `/knowledge/${m.id}`,
      reason:    "Resurface — you haven't revisited this in a while",
    }));

  // Pick 1 stale idea to resurface
  const resurfaceIdea: ResurfaceItem[] = ideas
    .filter((i) => computeAge(i.updatedAt).daysSince >= 14)
    .slice(0, 1)
    .map((i) => ({
      id:        i.id,
      kind:      "idea" as const,
      title:     i.title,
      body:      i.description?.slice(0, 120) ?? "",
      updatedAt: i.updatedAt,
      href:      `/ideas/${i.id}`,
      reason:    "Old idea — promote, archive, or act on it",
    }));

  // Nudges for stale projects and high-scoring dormant ideas
  const nudges: NudgeItem[] = [];

  for (const p of projects) {
    if (isStale(p.updatedAt, 21) && p.phase !== "SHIPPED" && p.phase !== "ARCHIVED") {
      nudges.push({
        id:      p.id,
        kind:    "project",
        title:   p.title,
        href:    `/projects/${p.id}`,
        message: `No updates in ${computeAge(p.updatedAt).label} — add a check-in`,
      });
    }
    if (nudges.length >= 3) break;
  }

  if (nudges.length < 3) {
    for (const i of ideas) {
      if ((i.score ?? 0) >= 7 && isStale(i.updatedAt, 30)) {
        nudges.push({
          id:      i.id,
          kind:    "idea",
          title:   i.title,
          href:    `/ideas/${i.id}`,
          message: `High-score idea sitting idle — time to move it forward?`,
        });
      }
      if (nudges.length >= 3) break;
    }
  }

  return {
    resurface: [...resurfaceMemories, ...resurfaceIdea],
    nudges,
  };
}
