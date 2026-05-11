"use server";

import { redirect } from "next/navigation";
import { requireAuthUser } from "@/services/auth.service";
import { convertIdeaSchema } from "@/schemas/conversion";
import { ideaRepository } from "@/repositories/idea.repository";
import { ideaBlockRepository } from "../repositories/idea-block.repository";
import { calculateReadiness, CONVERSION_THRESHOLD, CONVERSION_REQUIRED } from "../readiness/calculator";
import { prisma } from "@/lib/prisma/client";
import type { ActionResult } from "@/types/api";
import type { BlockType } from "@prisma/client";

export async function convertIdeaAction(
  input: unknown
): Promise<ActionResult<{ projectId: string }>> {
  const parsed = convertIdeaSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const { ideaId, projectName, projectDescription, taskTitles } = parsed.data;

  try {
    const auth = await requireAuthUser();

    // Verify ownership
    const idea = await ideaRepository.findById(ideaId, auth.profile.id);
    if (!idea) return { success: false, error: "Idea not found", code: "NOT_FOUND" };

    // Verify readiness gate
    const blocks = await ideaBlockRepository.findAllByIdea(ideaId);
    const score = calculateReadiness(
      blocks.map((b) => ({ type: b.type as BlockType, content: b.content }))
    );

    if (!score.canConvert) {
      const reason =
        score.total < CONVERSION_THRESHOLD
          ? `Score too low (${score.total}/100 — need ${CONVERSION_THRESHOLD}+)`
          : `Missing required blocks: ${score.missingRequired.join(", ")}`;
      return { success: false, error: reason, code: "READINESS_GATE" };
    }

    // Atomic: create project + tasks + update idea
    const result = await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          userId:      auth.profile.id,
          title:       projectName,
          description: projectDescription ?? null,
          status:      "PLANNING",
          visibility:  "PRIVATE",
        },
      });

      if (taskTitles.length > 0) {
        await tx.task.createMany({
          data: taskTitles.map((title, i) => ({
            userId:    auth.profile.id,
            projectId: project.id,
            title,
            status:    "TODO" as const,
            position:  i,
          })),
        });
      }

      await tx.idea.update({
        where: { id: ideaId },
        data: {
          status:         "CONVERTED",
          readinessStatus: "CONVERTED",
          projectId:      project.id,
          convertedAt:    new Date(),
        },
      });

      return project;
    });

    return { success: true, data: { projectId: result.id } };
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
    }
    console.error("[convertIdeaAction]", err);
    return { success: false, error: "Conversion failed" };
  }
}
