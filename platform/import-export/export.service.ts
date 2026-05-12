/**
 * Workspace Export Service — full-fidelity JSON export preserving all relationships.
 * Produces a WorkspaceExport that can be re-imported or converted to markdown.
 * Server-only. No side effects.
 */

import "server-only";
import { prisma } from "@/lib/prisma/client";
import type { WorkspaceExport, ExportedIdea, ExportedProject, ExportedMemory, ExportedStrategicReview } from "./types";

// ─── Main export entry point ──────────────────────────────────────────────────

export async function exportWorkspace(userId: string): Promise<WorkspaceExport> {
  const [user, ideas, projects, memories, strategicReviews] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { id: true, email: true } }),
    exportIdeas(userId),
    exportProjects(userId),
    exportMemories(userId),
    exportStrategicReviews(userId),
  ]);

  const meta = {
    version:     "1.0" as const,
    exportedAt:  new Date().toISOString(),
    userId:      user.id,
    userEmail:   user.email,
    entityCounts: {
      ideas:           ideas.length,
      projects:        projects.length,
      memories:        memories.length,
      strategicReviews: strategicReviews.length,
    },
  };

  return { meta, ideas, projects, memories, strategicReviews };
}

// ─── Ideas ────────────────────────────────────────────────────────────────────

async function exportIdeas(userId: string): Promise<ExportedIdea[]> {
  const rows = await prisma.idea.findMany({
    where: { userId, deletedAt: null },
    include: {
      blocks: { where: { deletedAt: null }, select: { type: true, content: true }, orderBy: { position: "asc" } },
      notes:  { where: { deletedAt: null }, select: { title: true, content: true, createdAt: true } },
      links:  { where: { deletedAt: null }, select: { label: true, url: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return rows.map((r) => ({
    id:              r.id,
    title:           r.title,
    description:     r.description,
    status:          r.status,
    readinessStatus: r.readinessStatus,
    readinessScore:  r.readinessScore,
    tags:            r.tags,
    pinned:          r.pinned,
    convertedAt:     r.convertedAt?.toISOString() ?? null,
    createdAt:       r.createdAt.toISOString(),
    updatedAt:       r.updatedAt.toISOString(),
    blocks:          r.blocks.map((b) => ({ type: b.type, content: b.content })),
    notes:           r.notes.map((n) => ({ title: n.title, content: n.content, createdAt: n.createdAt.toISOString() })),
    links:           r.links.map((l) => ({ label: l.label, url: l.url })),
  }));
}

// ─── Projects ─────────────────────────────────────────────────────────────────

async function exportProjects(userId: string): Promise<ExportedProject[]> {
  const rows = await prisma.project.findMany({
    where: { userId, deletedAt: null },
    include: {
      tasks: {
        where: { deletedAt: null, parentId: null },
        include: { subtasks: { where: { deletedAt: null }, select: { title: true, status: true } } },
        orderBy: { position: "asc" },
      },
      milestones:    { where: { deletedAt: null }, orderBy: { position: "asc" } },
      decisions:     { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
      weeklyReviews: { orderBy: { weekStarting: "asc" } },
      scopeItems:    { where: { deletedAt: null }, orderBy: { position: "asc" } },
      risks:         { where: { deletedAt: null } },
      blockers:      true,
      notes:         { where: { deletedAt: null } },
      links:         { where: { deletedAt: null } },
      timelineEvents: { orderBy: { occurredAt: "asc" }, take: 200 },
    },
    orderBy: { createdAt: "asc" },
  });

  return rows.map((r): ExportedProject => ({
    id:             r.id,
    title:          r.title,
    description:    r.description,
    status:         r.status,
    executionState: r.executionState,
    momentumScore:  r.momentumScore,
    tags:           r.tags,
    startDate:      r.startDate?.toISOString() ?? null,
    targetDate:     r.targetDate?.toISOString() ?? null,
    shippedAt:      r.shippedAt?.toISOString() ?? null,
    createdAt:      r.createdAt.toISOString(),
    updatedAt:      r.updatedAt.toISOString(),
    tasks: r.tasks.map((t) => ({
      id:          t.id,
      title:       t.title,
      status:      t.status,
      priority:    t.priority,
      tags:        t.tags,
      dueDate:     t.dueDate?.toISOString() ?? null,
      completedAt: t.completedAt?.toISOString() ?? null,
      subtasks:    t.subtasks.map((s) => ({ title: s.title, status: s.status })),
    })),
    milestones: r.milestones.map((m) => ({
      title:       m.title,
      status:      m.status,
      targetDate:  m.targetDate?.toISOString() ?? null,
      completedAt: m.completedAt?.toISOString() ?? null,
    })),
    decisions: r.decisions.map((d) => ({
      title:        d.title,
      decision:     d.decision,
      context:      d.context,
      alternatives: d.alternatives,
      tradeoffs:    d.tradeoffs,
      reversed:     d.reversed,
      reversalNote: d.reversalNote,
      createdAt:    d.createdAt.toISOString(),
    })),
    weeklyReviews: r.weeklyReviews.map((w) => ({
      weekStarting:      w.weekStarting.toISOString(),
      movedForward:      w.movedForward,
      stalled:           w.stalled,
      changed:           w.changed,
      assumptionsFailed: w.assumptionsFailed,
      shouldCut:         w.shouldCut,
      worthContinuing:   w.worthContinuing,
      overallRating:     w.overallRating,
    })),
    scopeItems: r.scopeItems.map((s) => ({ title: s.title, bucket: s.bucket, notes: s.notes })),
    risks:      r.risks.map((r) => ({ title: r.title, severity: r.severity, mitigated: r.mitigated })),
    blockers:   r.blockers.map((b) => ({ title: b.title, resolved: b.resolved })),
    notes:      r.notes.map((n) => ({ title: n.title, content: n.content })),
    links:      r.links.map((l) => ({ label: l.label, url: l.url })),
    timelineEvents: r.timelineEvents.map((e) => ({
      type:       e.type,
      title:      e.title,
      occurredAt: e.occurredAt.toISOString(),
    })),
  }));
}

// ─── Memories ─────────────────────────────────────────────────────────────────

async function exportMemories(userId: string): Promise<ExportedMemory[]> {
  const rows = await prisma.knowledgeMemory.findMany({
    where: { userId, deletedAt: null },
    include: {
      project: { select: { title: true } },
      idea:    { select: { title: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return rows.map((r) => ({
    id:           r.id,
    type:         r.type,
    title:        r.title,
    body:         r.body,
    tags:         r.tags,
    significance: r.significance,
    pinned:       r.pinned,
    projectTitle: r.project?.title ?? null,
    ideaTitle:    r.idea?.title ?? null,
    createdAt:    r.createdAt.toISOString(),
  }));
}

// ─── Strategic Reviews ────────────────────────────────────────────────────────

async function exportStrategicReviews(userId: string): Promise<ExportedStrategicReview[]> {
  const rows = await prisma.strategicReview.findMany({
    where:   { userId },
    orderBy: { periodStart: "asc" },
  });

  return rows.map((r) => ({
    id:          r.id,
    type:        r.type,
    period:      r.period,
    periodStart: r.periodStart.toISOString(),
    periodEnd:   r.periodEnd.toISOString(),
    wins:        r.wins,
    struggles:   r.struggles,
    patterns:    r.patterns,
    nextFocus:   r.nextFocus,
    snapshot:    r.snapshot,
    createdAt:   r.createdAt.toISOString(),
  }));
}
