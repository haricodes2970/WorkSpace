"use server";

import { requireAuthUser } from "@/services/auth.service";
import { projectRepository } from "@/repositories/project.repository";
import {
  weeklyReviewRepository,
  decisionRepository,
  timelineEventRepository,
  scopeItemRepository,
  blockerRepository,
} from "../repositories/execution.repository";
import type { ActionResult } from "@/types/api";
import type { ScopeBucket, WeeklyReview, Decision, Blocker, ScopeItem } from "@prisma/client";
import { z } from "zod";

// ─── Helpers ──────────────────────────────────────────────────────────────

async function requireProjectOwnership(projectId: string, userId: string) {
  const project = await projectRepository.findById(projectId, userId);
  if (!project) throw new Error("NOT_FOUND");
  return project;
}

// ─── Weekly Review ────────────────────────────────────────────────────────

const reviewSchema = z.object({
  projectId:         z.string().uuid(),
  weekStarting:      z.coerce.date(),
  movedForward:      z.string().max(5000).default(""),
  stalled:           z.string().max(5000).default(""),
  changed:           z.string().max(5000).default(""),
  assumptionsFailed: z.string().max(5000).default(""),
  shouldCut:         z.string().max(5000).default(""),
  worthContinuing:   z.boolean().default(true),
  overallRating:     z.number().int().min(1).max(5).default(3),
});

export async function saveWeeklyReviewAction(
  input: unknown
): Promise<ActionResult<WeeklyReview>> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    const { profile } = await requireAuthUser();
    await requireProjectOwnership(parsed.data.projectId, profile.id);

    const review = await weeklyReviewRepository.upsert({
      ...parsed.data,
      userId: profile.id,
    });

    // Log timeline event
    await timelineEventRepository.create({
      projectId: parsed.data.projectId,
      userId:    profile.id,
      type:      "REVIEW_COMPLETED",
      title:     `Weekly review — week of ${parsed.data.weekStarting.toLocaleDateString()}`,
    });

    return { success: true, data: review };
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "UNAUTHORIZED") return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
      if (err.message === "NOT_FOUND")    return { success: false, error: "Project not found", code: "NOT_FOUND" };
    }
    return { success: false, error: "Failed to save review" };
  }
}

// ─── Decision ─────────────────────────────────────────────────────────────

const decisionSchema = z.object({
  projectId:    z.string().uuid(),
  title:        z.string().min(1).max(300),
  context:      z.string().max(5000).default(""),
  decision:     z.string().min(1).max(5000),
  alternatives: z.string().max(5000).default(""),
  tradeoffs:    z.string().max(5000).default(""),
});

export async function addDecisionAction(
  input: unknown
): Promise<ActionResult<Decision>> {
  const parsed = decisionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    const { profile } = await requireAuthUser();
    await requireProjectOwnership(parsed.data.projectId, profile.id);

    const decision = await decisionRepository.create({
      ...parsed.data,
      userId: profile.id,
    });

    await timelineEventRepository.create({
      projectId: parsed.data.projectId,
      userId:    profile.id,
      type:      "DECISION_MADE",
      title:     parsed.data.title,
    });

    return { success: true, data: decision };
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
    }
    return { success: false, error: "Failed to add decision" };
  }
}

export async function reverseDecisionAction(
  id: string,
  note: string
): Promise<ActionResult<Decision>> {
  try {
    const { profile } = await requireAuthUser();
    const decision = await decisionRepository.reverse(id, note);
    await timelineEventRepository.create({
      projectId: decision.projectId,
      userId:    profile.id,
      type:      "DECISION_MADE",
      title:     `Decision reversed: ${decision.title}`,
      description: note,
    });
    return { success: true, data: decision };
  } catch {
    return { success: false, error: "Failed to reverse decision" };
  }
}

export async function deleteDecisionAction(id: string): Promise<ActionResult> {
  try {
    await requireAuthUser();
    await decisionRepository.softDelete(id);
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to delete decision" };
  }
}

// ─── Scope Items ──────────────────────────────────────────────────────────

const scopeItemSchema = z.object({
  projectId: z.string().uuid(),
  title:     z.string().min(1).max(300),
  bucket:    z.enum(["MVP", "V1", "LATER", "EXPERIMENTAL"]),
});

export async function addScopeItemAction(
  input: unknown
): Promise<ActionResult<ScopeItem>> {
  const parsed = scopeItemSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    const { profile } = await requireAuthUser();
    await requireProjectOwnership(parsed.data.projectId, profile.id);

    const item = await scopeItemRepository.create({
      ...parsed.data,
      userId: profile.id,
      bucket: parsed.data.bucket as ScopeBucket,
    });

    await timelineEventRepository.create({
      projectId: parsed.data.projectId,
      userId:    profile.id,
      type:      "SCOPE_CHANGED",
      title:     `Scope item added to ${parsed.data.bucket}: ${parsed.data.title}`,
    });

    return { success: true, data: item };
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
    }
    return { success: false, error: "Failed to add scope item" };
  }
}

export async function moveScopeItemAction(
  id: string,
  bucket: ScopeBucket
): Promise<ActionResult<ScopeItem>> {
  try {
    await requireAuthUser();
    const item = await scopeItemRepository.moveBucket(id, bucket);
    return { success: true, data: item };
  } catch {
    return { success: false, error: "Failed to move scope item" };
  }
}

export async function deleteScopeItemAction(id: string): Promise<ActionResult> {
  try {
    await requireAuthUser();
    await scopeItemRepository.softDelete(id);
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to delete scope item" };
  }
}

// ─── Blockers ─────────────────────────────────────────────────────────────

const blockerSchema = z.object({
  projectId:   z.string().uuid(),
  title:       z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
});

export async function addBlockerAction(
  input: unknown
): Promise<ActionResult<Blocker>> {
  const parsed = blockerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    const { profile } = await requireAuthUser();
    await requireProjectOwnership(parsed.data.projectId, profile.id);

    const blocker = await blockerRepository.create({
      ...parsed.data,
      userId: profile.id,
    });

    await timelineEventRepository.create({
      projectId: parsed.data.projectId,
      userId:    profile.id,
      type:      "BLOCKED",
      title:     `Blocker: ${parsed.data.title}`,
    });

    return { success: true, data: blocker };
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
    }
    return { success: false, error: "Failed to add blocker" };
  }
}

export async function resolveBlockerAction(id: string): Promise<ActionResult<Blocker>> {
  try {
    const { profile } = await requireAuthUser();
    const blocker = await blockerRepository.resolve(id);
    await timelineEventRepository.create({
      projectId: blocker.projectId,
      userId:    profile.id,
      type:      "UNBLOCKED",
      title:     `Resolved: ${blocker.title}`,
    });
    return { success: true, data: blocker };
  } catch {
    return { success: false, error: "Failed to resolve blocker" };
  }
}
