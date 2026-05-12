import "server-only";
import { prisma } from "@/lib/prisma";
import { computeAge, agingScore } from "@/features/temporal/aging";

export interface BuilderProfile {
  // Identity stats
  totalIdeas:     number;
  shippedProjects: number;
  activeProjects:  number;
  totalMemories:  number;
  totalReviews:   number;

  // Behavioral patterns (pure calculation)
  ideaVelocity:   number;   // ideas created per 30-day window (last 90d)
  shipRate:       number;   // shipped / total projects (0-1)
  followThrough:  number;   // shipped / (shipped + stale) (0-1)
  knowledgeDensity: number; // memories per project

  // Execution traits
  traits: BuilderTrait[];

  // Momentum snapshot
  momentumScore: number;   // 0-100
  stagingProjects: { id: string; title: string; phase: string | null }[];
}

export type BuilderTrait =
  | "fast-ideator"
  | "deep-thinker"
  | "finisher"
  | "knowledge-builder"
  | "momentum-keeper"
  | "explorer"
  | "focused-builder"
  | "reflective";

function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }

export async function getBuilderProfile(userId: string): Promise<BuilderProfile> {
  const ninety = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const [ideas, projects, memories, reviews, recentIdeas] = await Promise.all([
    prisma.idea.count({ where: { userId } }),
    prisma.project.findMany({
      where:  { userId },
      select: { id: true, title: true, phase: true, archived: true, momentum: true, updatedAt: true },
    }),
    prisma.memory.count({ where: { userId } }),
    prisma.strategicReview.count({ where: { userId } }),
    prisma.idea.count({ where: { userId, createdAt: { gte: ninety } } }),
  ]);

  const shipped  = projects.filter((p) => p.phase === "SHIPPED").length;
  const active   = projects.filter((p) => !p.archived && p.phase !== "SHIPPED").length;
  const stale    = projects.filter((p) => !p.archived && computeAge(p.updatedAt).daysSince >= 21).length;
  const total    = projects.length;

  const ideaVelocity    = Math.round((recentIdeas / 3));      // per 30d average
  const shipRate        = total > 0 ? clamp01(shipped / total) : 0;
  const followThrough   = (shipped + stale) > 0 ? clamp01(shipped / (shipped + stale)) : 0;
  const knowledgeDensity = active > 0 ? memories / active : memories;
  const momentumScore   = Math.max(0, Math.min(100,
    Math.round(shipRate * 40 + followThrough * 30 + (ideaVelocity > 0 ? 20 : 0) + (reviews > 0 ? 10 : 0))
  ));

  // Derive traits
  const traits: BuilderTrait[] = [];
  if (ideaVelocity >= 5)                       traits.push("fast-ideator");
  if (ideaVelocity < 3 && memories > 20)       traits.push("deep-thinker");
  if (shipRate >= 0.4 && shipped >= 2)         traits.push("finisher");
  if (knowledgeDensity >= 5)                   traits.push("knowledge-builder");
  if (active >= 2 && stale === 0)              traits.push("momentum-keeper");
  if (ideas > 30 && shipRate < 0.2)            traits.push("explorer");
  if (active <= 3 && followThrough >= 0.6)     traits.push("focused-builder");
  if (reviews >= 3)                             traits.push("reflective");

  const stagingProjects = projects
    .filter((p) => !p.archived && p.phase !== "SHIPPED")
    .slice(0, 5)
    .map((p) => ({ id: p.id, title: p.title, phase: p.phase }));

  return {
    totalIdeas: ideas, shippedProjects: shipped, activeProjects: active,
    totalMemories: memories, totalReviews: reviews,
    ideaVelocity, shipRate, followThrough, knowledgeDensity,
    traits, momentumScore, stagingProjects,
  };
}
