import { prisma } from "@/lib/prisma/client";
import { runAdvisorDetectors } from "./advisor.calculator";
import { calculateAllSurvivability } from "./failure-prediction";
import { calculateAllCompression }   from "./compression.calculator";
import { calculateDNA }              from "./dna.calculator";
import { generateNarrative }         from "./narrative.generator";
import type { AdvisorOutput, ExecutionNarrative } from "./types";
import type { AdvisorProjectInput }   from "./advisor.calculator";
import type { CompressionProjectInput } from "./compression.calculator";
import type { DnaProjectInput }       from "./dna.calculator";
import type { NarrativeProjectInput } from "./narrative.generator";

// ─── Data collection ──────────────────────────────────────────────────────────

async function fetchProjectData(userId: string) {
  return prisma.project.findMany({
    where: { userId, deletedAt: null },
    include: {
      tasks:         { where: { deletedAt: null }, select: { status: true, completedAt: true, updatedAt: true } },
      milestones:    { where: { deletedAt: null }, select: { status: true, completedAt: true } },
      weeklyReviews: { select: { overallRating: true, stalled: true, weekStarting: true }, orderBy: { weekStarting: "asc" } },
      decisions:     { where: { deletedAt: null }, select: { id: true, reversed: true } },
      scopeItems:    { where: { deletedAt: null }, select: { id: true, title: true, notes: true, bucket: true } },
      risks:         { where: { deletedAt: null }, select: { severity: true, mitigated: true } },
      blockers:      { select: { id: true, resolved: true } },
      timelineEvents: {
        orderBy: { occurredAt: "asc" },
        select: { type: true, title: true, occurredAt: true },
        take: 50,
      },
    },
  });
}

function ageDays(createdAt: Date): number {
  return Math.floor((Date.now() - createdAt.getTime()) / 86_400_000);
}

function stalledWeeks(reviews: { stalled: string; weekStarting: Date }[]): number {
  const sorted = [...reviews].sort((a, b) => b.weekStarting.getTime() - a.weekStarting.getTime());
  let count = 0;
  for (const r of sorted) {
    if (r.stalled && r.stalled.trim().length > 5) break;
    count++;
  }
  return count;
}

// ─── Projection transforms ────────────────────────────────────────────────────

function toAdvisorInput(p: Awaited<ReturnType<typeof fetchProjectData>>[number]): AdvisorProjectInput {
  return {
    id:                    p.id,
    title:                 p.title,
    status:                p.status,
    momentumScore:         p.momentumScore,
    createdAt:             p.createdAt,
    shippedAt:             p.shippedAt,
    taskCount:             p.tasks.length,
    taskDone:              p.tasks.filter((t) => t.status === "DONE").length,
    blockerCount:          p.blockers.length,
    activeBlockerCount:    p.blockers.filter((b) => !b.resolved).length,
    reviewCount:           p.weeklyReviews.length,
    decisionCount:         p.decisions.length,
    decisionReversalCount: p.decisions.filter((d) => d.reversed).length,
    mvpScopeCount:         p.scopeItems.filter((s) => s.bucket === "MVP").length,
    laterScopeCount:       p.scopeItems.filter((s) => s.bucket === "LATER").length,
    weeklyReviewRatings:   p.weeklyReviews.map((r) => r.overallRating),
    stalledWeeks:          stalledWeeks(p.weeklyReviews),
    milestoneCount:        p.milestones.length,
    milestoneMissed:       p.milestones.filter((m) => m.status === "MISSED").length,
    openRiskCount:         p.risks.filter((r) => !r.mitigated).length,
    criticalRiskCount:     p.risks.filter((r) => r.severity === "CRITICAL" && !r.mitigated).length,
    ageDays:               ageDays(p.createdAt),
    inactiveDays:          0, // derived from momentum calculator — not needed here at advisor level
  };
}

function toCompressionInput(p: Awaited<ReturnType<typeof fetchProjectData>>[number]): CompressionProjectInput {
  return {
    id:           p.id,
    title:        p.title,
    status:       p.status,
    mvpItems:     p.scopeItems.filter((s) => s.bucket === "MVP").map((s) => ({ id: s.id, title: s.title, bucket: "MVP" as const, notes: s.notes })),
    v1Items:      p.scopeItems.filter((s) => s.bucket === "V1").map((s) => ({ id: s.id, title: s.title, bucket: "V1" as const, notes: s.notes })),
    laterItems:   p.scopeItems.filter((s) => s.bucket === "LATER").map((s) => ({ id: s.id, title: s.title, bucket: "LATER" as const, notes: s.notes })),
    experimentalItems: p.scopeItems.filter((s) => s.bucket === "EXPERIMENTAL").map((s) => ({ id: s.id, title: s.title, bucket: "EXPERIMENTAL" as const, notes: s.notes })),
    milestoneCount: p.milestones.length,
    taskCount:    p.tasks.length,
    ageDays:      ageDays(p.createdAt),
    momentumScore: p.momentumScore,
  };
}

function toDnaInput(p: Awaited<ReturnType<typeof fetchProjectData>>[number]): DnaProjectInput {
  return {
    id:                    p.id,
    status:                p.status,
    ageDays:               ageDays(p.createdAt),
    momentumScore:         p.momentumScore,
    taskCount:             p.tasks.length,
    taskDone:              p.tasks.filter((t) => t.status === "DONE").length,
    mvpScopeCount:         p.scopeItems.filter((s) => s.bucket === "MVP").length,
    laterScopeCount:       p.scopeItems.filter((s) => s.bucket === "LATER").length,
    reviewCount:           p.weeklyReviews.length,
    blockerCount:          p.blockers.length,
    shippedAt:             p.shippedAt,
    weeklyReviewRatings:   p.weeklyReviews.map((r) => r.overallRating),
    decisionReversalCount: p.decisions.filter((d) => d.reversed).length,
    decisionCount:         p.decisions.length,
  };
}

function toNarrativeInput(p: Awaited<ReturnType<typeof fetchProjectData>>[number]): NarrativeProjectInput {
  return {
    id:              p.id,
    title:           p.title,
    description:     p.description,
    status:          p.status,
    executionState:  p.executionState,
    momentumScore:   p.momentumScore,
    createdAt:       p.createdAt,
    shippedAt:       p.shippedAt,
    ageDays:         ageDays(p.createdAt),
    taskCount:       p.tasks.length,
    taskDone:        p.tasks.filter((t) => t.status === "DONE").length,
    milestoneCount:  p.milestones.length,
    milestoneDone:   p.milestones.filter((m) => m.status === "COMPLETED").length,
    decisionCount:   p.decisions.length,
    reviewCount:     p.weeklyReviews.length,
    blockerCount:    p.blockers.length,
    weeklyReviewRatings: p.weeklyReviews.map((r) => r.overallRating),
    timelineEvents:  p.timelineEvents.map((e) => ({ type: e.type, title: e.title, occurredAt: e.occurredAt })),
    momentumHistory: [], // populated from saved momentum scores if available
  };
}

// ─── Public service methods ───────────────────────────────────────────────────

export async function getAdvisorOutput(userId: string): Promise<AdvisorOutput> {
  const projects = await fetchProjectData(userId);

  const advisorInputs    = projects.map(toAdvisorInput);
  const compressionInputs = projects.map(toCompressionInput);
  const dnaInputs        = projects.map(toDnaInput);

  const signals      = runAdvisorDetectors({ projects: advisorInputs, userId });
  const survivability = calculateAllSurvivability(advisorInputs);
  const compression  = calculateAllCompression(compressionInputs);
  const dna          = calculateDNA({ userId, projects: dnaInputs });

  return {
    signals,
    survivability,
    compression,
    dna,
    generatedAt: new Date(),
  };
}

export async function getProjectNarrative(
  projectId: string,
  userId: string
): Promise<ExecutionNarrative | null> {
  const p = await prisma.project.findFirst({
    where:   { id: projectId, userId, deletedAt: null },
    include: {
      tasks:          { where: { deletedAt: null }, select: { status: true } },
      milestones:     { where: { deletedAt: null }, select: { status: true } },
      weeklyReviews:  { select: { overallRating: true }, orderBy: { weekStarting: "asc" } },
      decisions:      { where: { deletedAt: null }, select: { id: true } },
      blockers:       { select: { id: true } },
      timelineEvents: { orderBy: { occurredAt: "asc" }, select: { type: true, title: true, occurredAt: true } },
    },
  });

  if (!p) return null;

  return generateNarrative(toNarrativeInput(p));
}

export async function persistNarrative(
  projectId: string,
  userId: string,
  narrative: ExecutionNarrative
): Promise<void> {
  await prisma.projectNarrative.upsert({
    where:  { projectId },
    create: {
      projectId,
      userId,
      summary: narrative.summary,
      chapter: narrative.currentChapter,
      phase:   narrative.currentPhase,
    },
    update: {
      summary: narrative.summary,
      chapter: narrative.currentChapter,
      phase:   narrative.currentPhase,
      generatedAt: new Date(),
    },
  });
}
