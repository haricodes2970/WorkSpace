/**
 * Execution Compression Engine — scope reduction heuristics.
 * Detects duplicate scope, non-essential features, MVP drift, excessive milestones.
 * Pure functions. No I/O.
 */

import type { CompressionResult, CompressionSuggestion, CompressionAction } from "./types";

// ─── Input shape ──────────────────────────────────────────────────────────────

export interface ScopeItemInput {
  id:    string;
  title: string;
  bucket: "MVP" | "V1" | "LATER" | "EXPERIMENTAL";
  notes?: string | null;
}

export interface CompressionProjectInput {
  id:              string;
  title:           string;
  status:          string;
  mvpItems:        ScopeItemInput[];
  v1Items:         ScopeItemInput[];
  laterItems:      ScopeItemInput[];
  experimentalItems: ScopeItemInput[];
  milestoneCount:  number;
  taskCount:       number;
  ageDays:         number;
  momentumScore:   number;
}

// ─── Compression score thresholds ────────────────────────────────────────────

const MVP_IDEAL        = 5;
const MVP_ACCEPTABLE   = 8;
const MVP_OVERLOADED   = 12;
const MVP_CRITICAL     = 18;
const MILESTONE_MAX    = 5;

// ─── Detect MVP overload ──────────────────────────────────────────────────────

function detectMvpOverload(p: CompressionProjectInput): CompressionSuggestion | null {
  if (p.mvpItems.length <= MVP_ACCEPTABLE) return null;

  const excess = p.mvpItems.length - MVP_IDEAL;
  // Take the last N items (likely added via scope creep) as candidates
  const candidates = p.mvpItems.slice(MVP_IDEAL).map((i) => i.title);

  const action: CompressionAction =
    p.v1Items.length < p.mvpItems.length * 0.3 ? "MOVE_TO_V1" : "MOVE_TO_LATER";

  const label = action === "MOVE_TO_V1" ? "Move to V1" : "Defer to Later";

  return {
    action,
    title:           `${label} ${excess} MVP items`,
    rationale:       `MVP has ${p.mvpItems.length} items — ideal is ≤${MVP_IDEAL}. The last ${excess} items added are most likely scope creep. A minimal MVP tests the core assumption faster.`,
    items:           candidates.slice(0, 6),
    estimatedImpact: p.mvpItems.length >= MVP_CRITICAL ? "HIGH" : "MEDIUM",
    mvpReduction:    excess,
  };
}

// ─── Detect experimental items in MVP ────────────────────────────────────────

function detectExperimentalInMvp(p: CompressionProjectInput): CompressionSuggestion | null {
  // Heuristic: items with experimental keywords in MVP
  const experimentalKeywords = [
    "experiment", "maybe", "possibly", "consider", "explore",
    "investigate", "try", "prototype", "spike", "poc",
  ];

  const suspects = p.mvpItems.filter((item) => {
    const lower = item.title.toLowerCase();
    return experimentalKeywords.some((kw) => lower.includes(kw));
  });

  if (suspects.length === 0) return null;

  return {
    action:          "CUT_EXPERIMENTAL",
    title:           `${suspects.length} speculative item${suspects.length > 1 ? "s" : ""} in MVP`,
    rationale:       `Items with exploratory framing ("explore", "maybe", "investigate") don't belong in MVP scope — they belong in a backlog or a separate spike. Remove them to clarify what MVP actually ships.`,
    items:           suspects.map((i) => i.title),
    estimatedImpact: "MEDIUM",
    mvpReduction:    suspects.length,
  };
}

// ─── Detect near-duplicate scope items ────────────────────────────────────────

function detectPotentialDuplicates(p: CompressionProjectInput): CompressionSuggestion | null {
  const allItems = [...p.mvpItems, ...p.v1Items];
  if (allItems.length < 4) return null;

  // Simple word-overlap duplicate detection
  const duplicatePairs: [string, string][] = [];
  for (let i = 0; i < allItems.length; i++) {
    for (let j = i + 1; j < allItems.length; j++) {
      const a = (allItems[i]?.title ?? "").toLowerCase().split(/\s+/);
      const b = (allItems[j]?.title ?? "").toLowerCase().split(/\s+/);
      const sharedWords = a.filter((w) => w.length > 4 && b.includes(w));
      if (sharedWords.length >= 2) {
        duplicatePairs.push([allItems[i]!.title, allItems[j]!.title]);
      }
    }
  }

  if (duplicatePairs.length === 0) return null;

  return {
    action:          "CONSOLIDATE",
    title:           `${duplicatePairs.length} potentially duplicate scope item${duplicatePairs.length > 1 ? "s" : ""}`,
    rationale:       `Several scope items share significant terminology, suggesting overlap or duplication. Consolidating redundant scope reduces cognitive load and execution ambiguity.`,
    items:           duplicatePairs.slice(0, 4).map(([a, b]) => `"${a}" / "${b}"`),
    estimatedImpact: "LOW",
    mvpReduction:    duplicatePairs.length,
  };
}

// ─── Detect milestone overload ────────────────────────────────────────────────

function detectMilestoneOverload(p: CompressionProjectInput): CompressionSuggestion | null {
  if (p.milestoneCount <= MILESTONE_MAX) return null;

  return {
    action:          "MOVE_TO_LATER",
    title:           `${p.milestoneCount} milestones — consider consolidating`,
    rationale:       `More than ${MILESTONE_MAX} milestones signals over-planning. Each milestone creates checkpoint overhead. Merge adjacent milestones to reduce planning drag.`,
    items:           [],
    estimatedImpact: "LOW",
    mvpReduction:    0,
  };
}

// ─── Main calculator ──────────────────────────────────────────────────────────

export function calculateCompression(p: CompressionProjectInput): CompressionResult {
  if (p.status === "SHIPPED" || p.status === "ARCHIVED") {
    return {
      projectId:        p.id,
      projectTitle:     p.title,
      currentMvpSize:   p.mvpItems.length,
      targetMvpSize:    p.mvpItems.length,
      suggestions:      [],
      compressionScore: 0,
    };
  }

  const suggestions: CompressionSuggestion[] = [
    detectMvpOverload(p),
    detectExperimentalInMvp(p),
    detectPotentialDuplicates(p),
    detectMilestoneOverload(p),
  ].filter((s): s is CompressionSuggestion => s !== null);

  const mvpReduction = suggestions.reduce((s, x) => s + x.mvpReduction, 0);
  const targetMvpSize = Math.max(MVP_IDEAL, p.mvpItems.length - mvpReduction);

  const compressionScore =
    p.mvpItems.length >= MVP_CRITICAL ? 100
    : p.mvpItems.length >= MVP_OVERLOADED ? 70
    : p.mvpItems.length >= MVP_ACCEPTABLE ? 40
    : 0;

  return {
    projectId:        p.id,
    projectTitle:     p.title,
    currentMvpSize:   p.mvpItems.length,
    targetMvpSize,
    suggestions,
    compressionScore,
  };
}

export function calculateAllCompression(
  projects: CompressionProjectInput[]
): CompressionResult[] {
  return projects
    .filter((p) => p.status !== "SHIPPED" && p.status !== "ARCHIVED")
    .map(calculateCompression)
    .filter((r) => r.suggestions.length > 0)
    .sort((a, b) => b.compressionScore - a.compressionScore);
}
