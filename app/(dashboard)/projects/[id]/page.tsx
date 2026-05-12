import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAuthUser } from "@/services/auth.service";
import { projectRepository } from "@/repositories/project.repository";
import { ProjectCommandCenter } from "@/features/projects/components/project-command-center";
import type { ProjectDetailData } from "@/features/projects/components/project-command-center";
import {
  saveWeeklyReviewAction,
  addDecisionAction,
  reverseDecisionAction,
  deleteDecisionAction,
  addScopeItemAction,
  moveScopeItemAction,
  deleteScopeItemAction,
  resolveBlockerAction,
} from "@/features/execution/actions/execution-actions";
import {
  addMemoryAction,
  deleteMemoryAction,
  pinMemoryAction,
  dismissInsightAction,
  refreshInsightsAction,
} from "@/features/intelligence/actions/intelligence-actions";
import { memoryRepository } from "@/features/intelligence/memories/memory.repository";
import { insightRepository } from "@/features/intelligence/insights/insight.repository";
import type { ReviewFormData } from "@/features/execution/reviews/review-form";
import type { DecisionFormInput } from "@/features/execution/decisions/decision-log";
import type { MemoryFormInput } from "@/features/intelligence/memories/memory-panel";
import type { ScopeBucket } from "@prisma/client";

export const metadata: Metadata = { title: "Project" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;
  const { profile } = await requireAuthUser();

  const [raw, projectMemories, projectInsights] = await Promise.all([
    projectRepository.findByIdWithRelations(id, profile.id),
    memoryRepository.findByProject(id),
    insightRepository.findActive(profile.id),
  ]);
  if (!raw) notFound();

  // ── Map DB rows to UI shape ──────────────────────────────────────────────

  const project: ProjectDetailData = {
    id:             raw.id,
    title:          raw.title,
    description:    raw.description,
    status:         raw.status,
    tags:           raw.tags ?? [],
    targetDate:     raw.targetDate ?? null,
    shippedAt:      raw.shippedAt ?? null,
    updatedAt:      raw.updatedAt,
    createdAt:      raw.createdAt,
    momentumScore:  raw.momentumScore,
    linkedIdeaId:   raw.idea?.id ?? null,
    linkedIdeaTitle: raw.idea?.title ?? null,

    tasks: raw.tasks.map((t) => ({
      id:          t.id,
      title:       t.title,
      status:      t.status,
      priority:    t.priority,
      dueDate:     t.dueDate ?? null,
      completedAt: t.completedAt ?? null,
      updatedAt:   t.updatedAt,
      milestoneId: t.milestoneId ?? null,
    })),

    milestones: raw.milestones.map((m) => ({
      id:          m.id,
      title:       m.title,
      status:      m.status,
      targetDate:  m.targetDate ?? null,
      completedAt: m.completedAt ?? null,
      taskCount:   m.tasks.length,
      taskDone:    m.tasks.filter((t) => t.status === "DONE").length,
    })),

    notes: raw.notes.map((n) => ({
      id:        n.id,
      title:     n.title,
      content:   n.content,
      updatedAt: n.updatedAt,
    })),

    links: raw.links.map((l) => ({
      id:    l.id,
      label: l.label,
      url:   l.url,
    })),

    scopeItems: (raw.scopeItems ?? []).map((s) => ({
      id:       s.id,
      title:    s.title,
      notes:    s.notes,
      bucket:   s.bucket,
      position: s.position,
    })),

    reviews: (raw.weeklyReviews ?? []).map((r) => ({
      id:                r.id,
      weekStarting:      r.weekStarting,
      movedForward:      r.movedForward,
      stalled:           r.stalled,
      changed:           r.changed,
      assumptionsFailed: r.assumptionsFailed,
      shouldCut:         r.shouldCut,
      worthContinuing:   r.worthContinuing,
      overallRating:     r.overallRating,
      createdAt:         r.createdAt,
    })),

    decisions: (raw.decisions ?? []).map((d) => ({
      id:           d.id,
      title:        d.title,
      context:      d.context,
      decision:     d.decision,
      alternatives: d.alternatives,
      tradeoffs:    d.tradeoffs,
      reversed:     d.reversed,
      reversalNote: d.reversalNote,
      createdAt:    d.createdAt,
    })),

    timelineEvents: (raw.timelineEvents ?? []).map((e) => ({
      id:          e.id,
      type:        e.type,
      title:       e.title,
      description: e.description,
      occurredAt:  e.occurredAt,
    })),

    blockers: (raw.blockers ?? []).map((b) => ({
      id:          b.id,
      title:       b.title,
      description: b.description,
      resolved:    b.resolved,
      createdAt:   b.createdAt,
    })),

    memories: projectMemories.map((m) => ({
      id:           m.id,
      type:         m.type,
      title:        m.title,
      body:         m.body,
      tags:         m.tags,
      significance: m.significance,
      pinned:       m.pinned,
      createdAt:    m.createdAt,
    })),

    insights: projectInsights.map((i) => ({
      id:          i.id,
      type:        i.type,
      title:       i.title,
      body:        i.body,
      severity:    i.severity,
      generatedAt: i.generatedAt,
    })),
  };

  // ── Server action handlers ───────────────────────────────────────────────

  async function handleSaveReview(data: ReviewFormData) {
    "use server";
    await saveWeeklyReviewAction({ ...data, projectId: id });
    revalidatePath(`/projects/${id}`);
  }

  async function handleAddDecision(data: DecisionFormInput) {
    "use server";
    await addDecisionAction({ ...data, projectId: id });
    revalidatePath(`/projects/${id}`);
  }

  async function handleReverseDecision(decisionId: string, note: string) {
    "use server";
    await reverseDecisionAction(decisionId, note);
    revalidatePath(`/projects/${id}`);
  }

  async function handleDeleteDecision(decisionId: string) {
    "use server";
    await deleteDecisionAction(decisionId);
    revalidatePath(`/projects/${id}`);
  }

  async function handleAddScopeItem(title: string, bucket: ScopeBucket) {
    "use server";
    await addScopeItemAction({ title, bucket, projectId: id });
    revalidatePath(`/projects/${id}`);
  }

  async function handleMoveScopeItem(scopeItemId: string, bucket: ScopeBucket) {
    "use server";
    await moveScopeItemAction(scopeItemId, bucket);
    revalidatePath(`/projects/${id}`);
  }

  async function handleRemoveScopeItem(scopeItemId: string) {
    "use server";
    await deleteScopeItemAction(scopeItemId);
    revalidatePath(`/projects/${id}`);
  }

  async function handleResolveBlocker(blockerId: string) {
    "use server";
    await resolveBlockerAction(blockerId);
    revalidatePath(`/projects/${id}`);
  }

  async function handleShip() {
    "use server";
    await projectRepository.ship(id, profile.id);
    revalidatePath(`/projects/${id}`);
    redirect(`/projects/${id}`);
  }

  async function handleAddMemory(data: MemoryFormInput) {
    "use server";
    await addMemoryAction({ ...data, projectId: id });
    revalidatePath(`/projects/${id}`);
  }

  async function handleDeleteMemory(memId: string) {
    "use server";
    await deleteMemoryAction(memId);
    revalidatePath(`/projects/${id}`);
  }

  async function handlePinMemory(memId: string, pinned: boolean) {
    "use server";
    await pinMemoryAction(memId, pinned);
    revalidatePath(`/projects/${id}`);
  }

  async function handleDismissInsight(insightId: string) {
    "use server";
    await dismissInsightAction(insightId);
    revalidatePath(`/projects/${id}`);
  }

  async function handleRefreshInsights() {
    "use server";
    await refreshInsightsAction();
    revalidatePath(`/projects/${id}`);
  }

  return (
    <ProjectCommandCenter
      project={project}
      onAddTask={() => {}}
      onShip={handleShip}
      onSaveReview={handleSaveReview}
      onAddDecision={handleAddDecision}
      onReverseDecision={handleReverseDecision}
      onDeleteDecision={handleDeleteDecision}
      onAddScopeItem={handleAddScopeItem}
      onMoveScopeItem={handleMoveScopeItem}
      onRemoveScopeItem={handleRemoveScopeItem}
      onResolveBlocker={handleResolveBlocker}
      onAddMemory={handleAddMemory}
      onDeleteMemory={handleDeleteMemory}
      onPinMemory={handlePinMemory}
      onDismissInsight={handleDismissInsight}
      onRefreshInsights={handleRefreshInsights}
    />
  );
}
