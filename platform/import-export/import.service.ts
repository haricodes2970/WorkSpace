/**
 * Workspace Import Service — re-hydrates a WorkspaceExport into the database.
 * Idempotent by external ID where possible. Skips existing records.
 * Server-only.
 */

import "server-only";
import { prisma } from "@/lib/prisma/client";
import type { WorkspaceExport, ImportResult } from "./types";
import type { BlockType, ScopeBucket, RiskSeverity, Priority, TaskStatus } from "@prisma/client";

// ─── Main entry point ─────────────────────────────────────────────────────────

export async function importWorkspace(
  userId: string,
  data: WorkspaceExport
): Promise<ImportResult> {
  const result: ImportResult = {
    success:  true,
    imported: {},
    errors:   [],
    warnings: [],
  };

  try {
    result.imported.ideas    = await importIdeas(userId, data.ideas);
    result.imported.projects = await importProjects(userId, data.projects);
    result.imported.memories = await importMemories(userId, data.memories);
    result.imported.strategicReviews = await importStrategicReviews(userId, data.strategicReviews);
  } catch (err) {
    result.success = false;
    result.errors.push(err instanceof Error ? err.message : String(err));
  }

  return result;
}

// ─── Ideas ────────────────────────────────────────────────────────────────────

async function importIdeas(
  userId: string,
  ideas: WorkspaceExport["ideas"]
): Promise<number> {
  let count = 0;
  for (const idea of ideas) {
    // Skip if already imported (same external ID)
    const exists = await prisma.idea.findUnique({ where: { id: idea.id }, select: { id: true } });
    if (exists) continue;

    await prisma.idea.create({
      data: {
        id:              idea.id,
        userId,
        title:           idea.title,
        description:     idea.description,
        status:          idea.status as never,
        readinessStatus: idea.readinessStatus as never,
        readinessScore:  idea.readinessScore,
        tags:            idea.tags,
        pinned:          idea.pinned,
        convertedAt:     idea.convertedAt ? new Date(idea.convertedAt) : null,
        createdAt:       new Date(idea.createdAt),
        blocks: {
          create: idea.blocks.map((b, i) => ({
            type:     b.type as BlockType,
            content:  b.content,
            position: i,
          })),
        },
      },
    });
    count++;
  }
  return count;
}

// ─── Projects ─────────────────────────────────────────────────────────────────

async function importProjects(
  userId: string,
  projects: WorkspaceExport["projects"]
): Promise<number> {
  let count = 0;
  for (const project of projects) {
    const exists = await prisma.project.findUnique({ where: { id: project.id }, select: { id: true } });
    if (exists) continue;

    await prisma.project.create({
      data: {
        id:             project.id,
        userId,
        title:          project.title,
        description:    project.description,
        status:         project.status as never,
        executionState: project.executionState as never,
        momentumScore:  project.momentumScore,
        tags:           project.tags,
        startDate:      project.startDate  ? new Date(project.startDate)  : null,
        targetDate:     project.targetDate ? new Date(project.targetDate) : null,
        shippedAt:      project.shippedAt  ? new Date(project.shippedAt)  : null,
        createdAt:      new Date(project.createdAt),
        tasks: {
          create: project.tasks.map((t, i) => ({
            userId,
            title:       t.title,
            status:      t.status as TaskStatus,
            priority:    t.priority as Priority,
            tags:        t.tags,
            dueDate:     t.dueDate     ? new Date(t.dueDate)     : null,
            completedAt: t.completedAt ? new Date(t.completedAt) : null,
            position:    i,
          })),
        },
        milestones: {
          create: project.milestones.map((m, i) => ({
            userId,
            title:       m.title,
            status:      m.status as never,
            targetDate:  m.targetDate  ? new Date(m.targetDate)  : null,
            completedAt: m.completedAt ? new Date(m.completedAt) : null,
            position:    i,
          })),
        },
        decisions: {
          create: project.decisions.map((d) => ({
            userId,
            title:        d.title,
            decision:     d.decision,
            context:      d.context,
            alternatives: d.alternatives,
            tradeoffs:    d.tradeoffs,
            reversed:     d.reversed,
            reversalNote: d.reversalNote,
            createdAt:    new Date(d.createdAt),
          })),
        },
        scopeItems: {
          create: project.scopeItems.map((s, i) => ({
            userId,
            title:    s.title,
            bucket:   s.bucket as ScopeBucket,
            notes:    s.notes,
            position: i,
          })),
        },
        risks: {
          create: project.risks.map((r) => ({
            userId,
            title:     r.title,
            severity:  r.severity as RiskSeverity,
            mitigated: r.mitigated,
          })),
        },
        blockers: {
          create: project.blockers.map((b) => ({
            userId,
            title:    b.title,
            resolved: b.resolved,
          })),
        },
      },
    });
    count++;
  }
  return count;
}

// ─── Memories ─────────────────────────────────────────────────────────────────

async function importMemories(
  userId: string,
  memories: WorkspaceExport["memories"]
): Promise<number> {
  let count = 0;
  for (const m of memories) {
    const exists = await prisma.knowledgeMemory.findUnique({ where: { id: m.id }, select: { id: true } });
    if (exists) continue;

    await prisma.knowledgeMemory.create({
      data: {
        id:           m.id,
        userId,
        type:         m.type as never,
        title:        m.title,
        body:         m.body,
        tags:         m.tags,
        significance: m.significance,
        pinned:       m.pinned,
        createdAt:    new Date(m.createdAt),
      },
    });
    count++;
  }
  return count;
}

// ─── Strategic reviews ────────────────────────────────────────────────────────

async function importStrategicReviews(
  userId: string,
  reviews: WorkspaceExport["strategicReviews"]
): Promise<number> {
  let count = 0;
  for (const r of reviews) {
    const exists = await prisma.strategicReview.findUnique({ where: { id: r.id }, select: { id: true } });
    if (exists) continue;

    await prisma.strategicReview.create({
      data: {
        id:          r.id,
        userId,
        type:        r.type as never,
        period:      r.period,
        periodStart: new Date(r.periodStart),
        periodEnd:   new Date(r.periodEnd),
        wins:        r.wins,
        struggles:   r.struggles,
        patterns:    r.patterns,
        nextFocus:   r.nextFocus,
        snapshot:    r.snapshot ?? undefined,
        createdAt:   new Date(r.createdAt),
      },
    });
    count++;
  }
  return count;
}

// ─── JSON validation ──────────────────────────────────────────────────────────

export function validateExportJson(raw: unknown): { valid: boolean; error?: string } {
  if (typeof raw !== "object" || raw === null) return { valid: false, error: "Not a valid object" };
  const obj = raw as Record<string, unknown>;
  if (obj.meta === undefined)     return { valid: false, error: "Missing meta field" };
  if (!Array.isArray(obj.ideas))  return { valid: false, error: "Missing ideas array" };
  if (!Array.isArray(obj.projects)) return { valid: false, error: "Missing projects array" };
  const meta = obj.meta as Record<string, unknown>;
  if (meta.version !== "1.0")    return { valid: false, error: `Unsupported version: ${meta.version}` };
  return { valid: true };
}
