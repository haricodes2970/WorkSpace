/**
 * Contextual Thinking Assist — detects quality gaps in idea thinking blocks.
 * Evaluates completeness, specificity, and strategic clarity.
 * Pure functions. No I/O.
 */

import type { ThinkingAssistResult, ThinkingGap, ThinkingGapType } from "./types";

// ─── Input shape ──────────────────────────────────────────────────────────────

export interface IdeaBlockInput {
  type:    string;
  content: string;
}

export interface ThinkingAssistInput {
  ideaId:   string;
  ideaTitle: string;
  blocks:   IdeaBlockInput[];
}

// ─── Content analysis helpers ─────────────────────────────────────────────────

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

function hasSpecificNumbers(text: string): boolean {
  return /\d+/.test(text);
}

function hasQuestionWords(text: string): boolean {
  return /\b(who|what|when|where|why|how|whether)\b/i.test(text);
}

function lacksSpecificity(text: string): boolean {
  const vagueTerms = ["something", "somehow", "anyone", "everyone", "people", "users", "things"];
  const lower = text.toLowerCase();
  return vagueTerms.filter((t) => lower.includes(t)).length >= 2 && wordCount(text) < 40;
}

function getBlock(blocks: IdeaBlockInput[], type: string): IdeaBlockInput | undefined {
  return blocks.find((b) => b.type === type);
}

function isSubstantive(content: string, minWords = 15): boolean {
  return wordCount(content) >= minWords && content.trim().length > 0;
}

// ─── Gap detectors ────────────────────────────────────────────────────────────

function detectMissingAssumptions(blocks: IdeaBlockInput[]): ThinkingGap | null {
  const block = getBlock(blocks, "ASSUMPTIONS");
  if (!block || !isSubstantive(block.content, 10)) {
    return {
      type:      "MISSING_ASSUMPTIONS",
      label:     "Assumptions not listed",
      prompt:    "What are you assuming to be true that hasn't been validated yet? List 3–5 explicit assumptions.",
      blockType: "ASSUMPTIONS",
      severity:  "warning",
    };
  }

  if (!hasQuestionWords(block.content) && wordCount(block.content) < 30) {
    return {
      type:      "MISSING_ASSUMPTIONS",
      label:     "Assumptions lack depth",
      prompt:    "Assumptions should be framed as testable statements, not assertions. Try: 'We assume that [X] because [Y], and we'd know this is wrong if [Z].'",
      blockType: "ASSUMPTIONS",
      severity:  "hint",
    };
  }

  return null;
}

function detectUndefinedMetrics(blocks: IdeaBlockInput[]): ThinkingGap | null {
  const block = getBlock(blocks, "SUCCESS_METRICS");
  if (!block || !isSubstantive(block.content, 8)) {
    return {
      type:      "UNDEFINED_METRICS",
      label:     "Success metrics undefined",
      prompt:    "How will you know this worked? Define at least one measurable outcome: a number, a behavior change, or a threshold.",
      blockType: "SUCCESS_METRICS",
      severity:  "warning",
    };
  }

  if (!hasSpecificNumbers(block.content)) {
    return {
      type:      "UNDEFINED_METRICS",
      label:     "Metrics lack numbers",
      prompt:    "Metrics without numbers are goals, not metrics. Replace 'more users' with '100 active users in 30 days.'",
      blockType: "SUCCESS_METRICS",
      severity:  "suggestion",
    };
  }

  return null;
}

function detectWeakValidation(blocks: IdeaBlockInput[]): ThinkingGap | null {
  const block = getBlock(blocks, "VALIDATION_STRATEGY");
  if (!block || !isSubstantive(block.content, 10)) {
    return {
      type:      "WEAK_VALIDATION",
      label:     "No validation strategy",
      prompt:    "How will you test whether this idea is worth building before fully building it? Describe the cheapest experiment that could change your mind.",
      blockType: "VALIDATION_STRATEGY",
      severity:  "suggestion",
    };
  }
  return null;
}

function detectUnclearUser(blocks: IdeaBlockInput[]): ThinkingGap | null {
  const painBlock = getBlock(blocks, "USER_PAIN");
  if (!painBlock || !isSubstantive(painBlock.content, 10)) {
    return {
      type:      "UNCLEAR_USER",
      label:     "User pain not articulated",
      prompt:    "Who specifically experiences this problem? Describe one real person: their role, what they're trying to do, and why the current way fails them.",
      blockType: "USER_PAIN",
      severity:  "warning",
    };
  }

  if (lacksSpecificity(painBlock.content)) {
    return {
      type:      "UNCLEAR_USER",
      label:     "User description too vague",
      prompt:    "Avoid 'people' or 'users' — name a specific type of person. Vague users produce vague products.",
      blockType: "USER_PAIN",
      severity:  "hint",
    };
  }

  return null;
}

function detectExecutionAmbiguity(blocks: IdeaBlockInput[]): ThinkingGap | null {
  const block = getBlock(blocks, "EXECUTION_PLAN");
  if (!block || !isSubstantive(block.content, 15)) {
    return {
      type:      "EXECUTION_AMBIGUITY",
      label:     "Execution plan missing",
      prompt:    "What are the first 3 concrete actions required to move this forward? Specificity matters: not 'build the app' but 'design the data model for user accounts.'",
      blockType: "EXECUTION_PLAN",
      severity:  "suggestion",
    };
  }
  return null;
}

function detectUnresolvedRisks(blocks: IdeaBlockInput[]): ThinkingGap | null {
  const block = getBlock(blocks, "RISKS");
  if (!block || !isSubstantive(block.content, 8)) {
    return {
      type:      "UNRESOLVED_RISKS",
      label:     "Risks not documented",
      prompt:    "What could cause this to fail? List 2–3 realistic failure modes. Documented risks are managed risks.",
      blockType: "RISKS",
      severity:  "hint",
    };
  }
  return null;
}

// ─── Clarity score ────────────────────────────────────────────────────────────

function calculateClarity(blocks: IdeaBlockInput[], gaps: ThinkingGap[]): number {
  const totalBlocks = 6; // key blocks
  const warningGaps = gaps.filter((g) => g.severity === "warning").length;
  const suggestionGaps = gaps.filter((g) => g.severity === "suggestion").length;
  const hintGaps = gaps.filter((g) => g.severity === "hint").length;

  const penalty = warningGaps * 15 + suggestionGaps * 8 + hintGaps * 3;
  const filledBlocks = blocks.filter((b) => isSubstantive(b.content, 10)).length;
  const fillScore = Math.round((filledBlocks / totalBlocks) * 60);

  return Math.max(0, Math.min(100, fillScore + 40 - penalty));
}

function readinessLabel(clarity: number): string {
  if (clarity >= 80) return "Well-defined — ready to scope";
  if (clarity >= 60) return "Reasonably clear — a few gaps to resolve";
  if (clarity >= 40) return "In progress — core questions unanswered";
  if (clarity >= 20) return "Early stage — needs significant thinking";
  return "Underdeveloped — start with the user problem";
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export function analyzeThinking(input: ThinkingAssistInput): ThinkingAssistResult {
  const gaps: ThinkingGap[] = [
    detectMissingAssumptions(input.blocks),
    detectUndefinedMetrics(input.blocks),
    detectWeakValidation(input.blocks),
    detectUnclearUser(input.blocks),
    detectExecutionAmbiguity(input.blocks),
    detectUnresolvedRisks(input.blocks),
  ].filter((g): g is ThinkingGap => g !== null);

  const clarity = calculateClarity(input.blocks, gaps);

  return {
    ideaId:    input.ideaId,
    ideaTitle: input.ideaTitle,
    gaps,
    clarity,
    readiness: readinessLabel(clarity),
  };
}
