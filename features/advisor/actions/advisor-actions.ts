"use server";

import { requireSession } from "@/lib/auth/get-session";
import {
  getAdvisorOutput,
  getProjectNarrative,
  persistNarrative,
} from "../advisor.service";
import { analyzeThinking } from "../thinking-assist";
import type { AdvisorOutput, ExecutionNarrative, ThinkingAssistResult } from "../types";
import type { ThinkingAssistInput } from "../thinking-assist";

export async function getAdvisorOutputAction(): Promise<AdvisorOutput> {
  const { profile } = await requireSession();
  return getAdvisorOutput(profile.id);
}

export async function getProjectNarrativeAction(
  projectId: string
): Promise<ExecutionNarrative | null> {
  const { profile } = await requireSession();
  const narrative = await getProjectNarrative(projectId, profile.id);
  if (narrative) {
    await persistNarrative(projectId, profile.id, narrative);
  }
  return narrative;
}

export async function analyzeIdeaThinkingAction(
  input: ThinkingAssistInput
): Promise<ThinkingAssistResult> {
  await requireSession();
  return analyzeThinking(input);
}
