/**
 * Readiness Calculator — pure function, zero side-effects.
 * Safe to call on client and server.
 */

import type { BlockType, ReadinessStatus } from "@prisma/client";

// ─── Weights (must sum to 100) ────────────────────────────────────────────

export const READINESS_FACTORS = {
  PROBLEM:             { weight: 20, minLength: 60 },
  USER_PAIN:           { weight: 15, minLength: 40 },
  EXECUTION_PLAN:      { weight: 20, minLength: 50 },
  MVP_SCOPE:           { weight: 10, minLength: 40 },
  MARKET_GAP:          { weight: 15, minLength: 40 },
  SUCCESS_METRICS:     { weight: 10, minLength: 30 },
  RISKS:               { weight: 10, minLength: 20 },
} as const satisfies Partial<Record<BlockType, { weight: number; minLength: number }>>;

export type ScoredFactor = keyof typeof READINESS_FACTORS;

// Blocks required before conversion is allowed
export const CONVERSION_REQUIRED: ScoredFactor[] = [
  "PROBLEM",
  "USER_PAIN",
  "MVP_SCOPE",
  "EXECUTION_PLAN",
];

export const CONVERSION_THRESHOLD = 60;

// ─── Output types ─────────────────────────────────────────────────────────

export interface FactorScore {
  factor: ScoredFactor;
  weight: number;
  earned: number;
  filled: boolean;
  contentLength: number;
  minLength: number;
  pct: number; // 0–100, how full this factor is
}

export interface ReadinessScore {
  total: number; // 0–100 integer
  status: ReadinessStatus;
  factors: FactorScore[];
  canConvert: boolean;
  missingRequired: ScoredFactor[];
}

// ─── Calculator ───────────────────────────────────────────────────────────

export function calculateReadiness(
  blocks: { type: BlockType; content: string }[]
): ReadinessScore {
  const blockMap = new Map(blocks.map((b) => [b.type as string, b.content]));

  let total = 0;
  const factors: FactorScore[] = [];

  for (const [factor, cfg] of Object.entries(READINESS_FACTORS) as [
    ScoredFactor,
    { weight: number; minLength: number },
  ][]) {
    const content = (blockMap.get(factor) ?? "").trim();
    const pct = Math.min(100, Math.round((content.length / cfg.minLength) * 100));
    const earned = cfg.weight * (pct / 100);

    total += earned;
    factors.push({
      factor,
      weight: cfg.weight,
      earned,
      filled: content.length >= cfg.minLength,
      contentLength: content.length,
      minLength: cfg.minLength,
      pct,
    });
  }

  const roundedTotal = Math.round(total);
  const status = scoreToStatus(roundedTotal);
  const missingRequired = CONVERSION_REQUIRED.filter(
    (r) => !(blockMap.get(r) ?? "").trim().length
  );

  return {
    total: roundedTotal,
    status,
    factors,
    canConvert: roundedTotal >= CONVERSION_THRESHOLD && missingRequired.length === 0,
    missingRequired,
  };
}

export function scoreToStatus(score: number): ReadinessStatus {
  if (score < 20) return "CAPTURED";
  if (score < 40) return "EXPLORING";
  if (score < 55) return "VALIDATING";
  if (score < 70) return "PLANNING";
  return "READY";
}

// ─── Health metrics (derived from block content) ──────────────────────────

export interface IdeaHealthMetrics {
  completeness: number;     // 0–100 (= readiness total)
  riskDensity: number;      // 0–100 (risk items / total content lines)
  scopeComplexity: number;  // count of line items in MVP_SCOPE
  executionConfidence: number; // avg of EXECUTION_PLAN + SUCCESS_METRICS pcts
  validationReadiness: number; // avg of VALIDATION_STRATEGY + ASSUMPTIONS pcts
}

export function calculateHealthMetrics(
  blocks: { type: BlockType; content: string }[],
  readiness: ReadinessScore
): IdeaHealthMetrics {
  const get = (t: BlockType) =>
    (blocks.find((b) => b.type === t)?.content ?? "").trim();

  const risksContent = get("RISKS");
  const riskLines = risksContent
    ? risksContent.split("\n").filter((l) => l.trim()).length
    : 0;
  const totalContentLines = blocks
    .map((b) => b.content.split("\n").filter((l) => l.trim()).length)
    .reduce((a, b) => a + b, 0);
  const riskDensity =
    totalContentLines > 0
      ? Math.min(100, Math.round((riskLines / totalContentLines) * 200))
      : 0;

  const mvpContent = get("MVP_SCOPE");
  const scopeComplexity = mvpContent
    ? mvpContent
        .split("\n")
        .filter((l) => /^[-*\d]/.test(l.trim())).length
    : 0;

  const execFactor = readiness.factors.find((f) => f.factor === "EXECUTION_PLAN");
  const metricsFactor = readiness.factors.find((f) => f.factor === "SUCCESS_METRICS");
  const executionConfidence = Math.round(
    ((execFactor?.pct ?? 0) + (metricsFactor?.pct ?? 0)) / 2
  );

  const validationContent = get("VALIDATION_STRATEGY");
  const assumptionsContent = get("ASSUMPTIONS");
  const validationReadiness = Math.round(
    (Math.min(100, (validationContent.length / 40) * 100) +
      Math.min(100, (assumptionsContent.length / 30) * 100)) /
      2
  );

  return {
    completeness: readiness.total,
    riskDensity,
    scopeComplexity,
    executionConfidence,
    validationReadiness,
  };
}

// ─── MVP scope parser (feeds task seeds in conversion gate) ───────────────

export function parseMvpScopeToTasks(mvpContent: string): string[] {
  return mvpContent
    .split("\n")
    .map((line) => line.replace(/^[-*•]\s*|\d+\.\s*|\[.\]\s*/g, "").trim())
    .filter((line) => line.length > 2 && line.length < 300);
}
