// Pure surface ranking — deterministic, no I/O

import type { UsageAggregate, AdaptationWeights } from "@/platform/telemetry/telemetry-types";

export interface RankedItem {
  id:     string;
  weight: number;
  reason: string;
}

const NAV_BASE: Record<string, number> = {
  "/today":     100,
  "/dashboard": 80,
  "/projects":  70,
  "/ideas":     60,
  "/tasks":     50,
  "/knowledge": 40,
  "/advisor":   30,
  "/reviews":   20,
  "/profile":   10,
};

// Decay existing weight toward base over time (7-day half-life)
function applyDecay(current: number, base: number, daysSinceUpdate: number): number {
  const halfLife   = 7;
  const decayRate  = Math.pow(0.5, daysSinceUpdate / halfLife);
  return base + (current - base) * decayRate;
}

// Compute fresh nav weights from usage aggregate + previous weights
export function computeNavWeights(
  aggregate: UsageAggregate,
  previous:  Record<string, number>,
  daysSinceUpdate = 0,
): Record<string, number> {
  const result: Record<string, number> = {};

  // Start from base or decayed previous
  for (const [route, base] of Object.entries(NAV_BASE)) {
    const prev   = previous[route] ?? base;
    const decayed = applyDecay(prev, base, daysSinceUpdate);
    const usage  = aggregate.navCounts[route] ?? 0;
    // Each visit adds 5 points, capped at base * 2
    result[route] = Math.min(base * 2, decayed + usage * 5);
  }

  return result;
}

// Rank nav items by weight — returns sorted array
export function rankNavItems(
  items:   Array<{ href: string; label: string }>,
  weights: Record<string, number>,
): Array<{ href: string; label: string; weight: number }> {
  return items
    .map((item) => ({
      ...item,
      weight: weights[item.href] ?? NAV_BASE[item.href] ?? 0,
    }))
    .sort((a, b) => b.weight - a.weight);
}

// Derive density preference from session patterns
export function deriveDensityPreference(
  aggregate: UsageAggregate,
): AdaptationWeights["density"] {
  const sessionsPerWeek = aggregate.sessionCount;
  const deepFocus       = aggregate.deepWorkMinutes > 120;

  if (deepFocus || sessionsPerWeek <= 2)  return "spacious";
  if (sessionsPerWeek >= 10)               return "compact";
  return "comfortable";
}

// Derive Today column order from usage
export function deriveTodayOrder(aggregate: UsageAggregate): string[] {
  const scores: Record<string, number> = {
    builds:    (aggregate.entityAccess["project"] ?? 0) * 3,
    tasks:     (aggregate.entityAccess["task"]    ?? 0) * 2,
    blockers:  (aggregate.entityAccess["blocker"] ?? 0) * 4,  // blockers always high priority
    decisions: (aggregate.entityAccess["decision"] ?? 0),
  };
  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .map(([k]) => k);
}

// Full weight computation from aggregate
export function computeAdaptationWeights(
  aggregate:        UsageAggregate,
  previous:         Partial<AdaptationWeights>,
  daysSinceUpdate:  number,
): AdaptationWeights {
  return {
    navWeights:  computeNavWeights(aggregate, previous.navWeights ?? {}, daysSinceUpdate),
    cmdWeights:  previous.cmdWeights ?? {},
    density:     deriveDensityPreference(aggregate),
    todayOrder:  deriveTodayOrder(aggregate),
    computedAt:  new Date().toISOString(),
    version:     (previous.version ?? 0) + 1,
  };
}

// Explain why a nav item has a given weight (for transparency)
export function explainNavWeight(route: string, weight: number): string {
  const base = NAV_BASE[route] ?? 0;
  if (weight > base * 1.5) return "Frequently visited";
  if (weight > base * 1.2) return "Often used";
  if (weight < base * 0.8) return "Rarely visited";
  return "Standard priority";
}
