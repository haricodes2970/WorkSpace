"use server";

import { requireAuthUser } from "@/services/auth.service";
import { saveBlockSchema, addRelationshipSchema, removeRelationshipSchema } from "@/schemas/idea-block";
import { readinessService } from "../services/readiness.service";
import { ideaRelationshipRepository } from "../repositories/idea-block.repository";
import { ideaRepository } from "@/repositories/idea.repository";
import type { ActionResult } from "@/types/api";
import type { IdeaBlock } from "@prisma/client";

export async function saveBlockAction(
  _prev: ActionResult<IdeaBlock>,
  formData: FormData
): Promise<ActionResult<IdeaBlock>> {
  const parsed = saveBlockSchema.safeParse({
    ideaId:  formData.get("ideaId"),
    type:    formData.get("type"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    const auth = await requireAuthUser();
    // Verify idea ownership
    const idea = await ideaRepository.findById(parsed.data.ideaId, auth.profile.id);
    if (!idea) return { success: false, error: "Idea not found", code: "NOT_FOUND" };

    const block = await readinessService.saveBlock(
      parsed.data.ideaId,
      auth.profile.id,
      parsed.data.type,
      parsed.data.content
    );

    return { success: true, data: block };
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
    }
    return { success: false, error: "Failed to save block" };
  }
}

export async function addRelationshipAction(
  input: unknown
): Promise<ActionResult> {
  const parsed = addRelationshipSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  try {
    const auth = await requireAuthUser();
    const idea = await ideaRepository.findById(parsed.data.sourceId, auth.profile.id);
    if (!idea) return { success: false, error: "Idea not found", code: "NOT_FOUND" };

    await ideaRelationshipRepository.create(
      parsed.data.sourceId,
      parsed.data.targetId,
      parsed.data.relationshipType
    );

    return { success: true, data: undefined };
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
    }
    return { success: false, error: "Failed to add relationship" };
  }
}

export async function removeRelationshipAction(
  input: unknown
): Promise<ActionResult> {
  const parsed = removeRelationshipSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  try {
    await requireAuthUser();
    await ideaRelationshipRepository.delete(parsed.data.id);
    return { success: true, data: undefined };
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
    }
    return { success: false, error: "Failed to remove relationship" };
  }
}
