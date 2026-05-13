// Execution season detection — pure functions, no I/O
// Seasons are behavioral periods in a builder's work rhythm

export type SeasonKind =
  | "sprint"      // high-velocity, lots of shipping
  | "exploration" // idea-heavy, low execution
  | "recovery"    // low activity across the board
  | "building"    // steady sustained work
  | "reflection"; // review-heavy, planning phase

export interface ExecutionSeason {
  kind:        SeasonKind;
  label:       string;
  description: string;
  startPeriod: string;
  endPeriod?:  string;
  metrics:     SeasonMetrics;
}

export interface SeasonMetrics {
  shippedCount:    number;
  ideaCount:       number;
  reviewCount:     number;
  deepWorkMinutes: number;
  sessionCount:    number;
}

export interface SeasonInput {
  period:          string;
  shippedProjects: number;
  newIdeas:        number;
  reviews:         number;
  deepWorkMinutes: number;
  sessionCount:    number;
}

const SEASON_LABELS: Record<SeasonKind, { label: string; description: string }> = {
  sprint:      { label: "Sprint",      description: "High velocity — shipping fast" },
  exploration: { label: "Exploration", description: "Ideating and mapping new territory" },
  recovery:    { label: "Recovery",    description: "Quieter pace — recharging" },
  building:    { label: "Building",    description: "Steady sustained execution" },
  reflection:  { label: "Reflection",  description: "Reviewing and planning ahead" },
};

export function detectSeason(input: SeasonInput): SeasonKind {
  const { shippedProjects, newIdeas, reviews, deepWorkMinutes, sessionCount } = input;

  if (shippedProjects >= 2 && deepWorkMinutes >= 120)        return "sprint";
  if (reviews >= 2 && sessionCount <= 5)                     return "reflection";
  if (newIdeas >= 8 && shippedProjects === 0)                return "exploration";
  if (sessionCount <= 3 && deepWorkMinutes < 30)             return "recovery";
  return "building";
}

export function buildExecutionSeason(input: SeasonInput): ExecutionSeason {
  const kind = detectSeason(input);
  const meta = SEASON_LABELS[kind];

  return {
    kind,
    label:       meta.label,
    description: meta.description,
    startPeriod: input.period,
    metrics: {
      shippedCount:    input.shippedProjects,
      ideaCount:       input.newIdeas,
      reviewCount:     input.reviews,
      deepWorkMinutes: input.deepWorkMinutes,
      sessionCount:    input.sessionCount,
    },
  };
}

// Detect consecutive season runs (e.g. "3-week sprint")
export function detectSeasonRuns(
  seasons: ExecutionSeason[],
): Array<ExecutionSeason & { runLength: number }> {
  if (!seasons.length) return [];
  const result: Array<ExecutionSeason & { runLength: number }> = [];
  let run = 1;

  for (let i = 0; i < seasons.length; i++) {
    if (i + 1 < seasons.length && seasons[i + 1]?.kind === seasons[i]?.kind) {
      run++;
    } else {
      result.push({ ...seasons[i]!, runLength: run });
      run = 1;
    }
  }
  return result;
}

// Long-horizon narrative from season history
export function buildEvolutionNarrative(seasons: ExecutionSeason[]): string {
  if (!seasons.length) return "Not enough history to build a narrative.";

  const recent    = seasons.slice(0, 4);
  const sprintCount  = recent.filter((s) => s.kind === "sprint").length;
  const recoverCount = recent.filter((s) => s.kind === "recovery").length;
  const exploreCount = recent.filter((s) => s.kind === "exploration").length;

  if (sprintCount >= 3)  return "On a sustained sprint — high momentum, high output.";
  if (recoverCount >= 2) return "In a recovery cycle — lighter pace, building back up.";
  if (exploreCount >= 2) return "Exploring broadly — idea-heavy period before next execution push.";
  if (sprintCount >= 1 && recoverCount >= 1) return "Alternating sprint and recovery — natural rhythm.";
  return "Steady, consistent building pace.";
}
