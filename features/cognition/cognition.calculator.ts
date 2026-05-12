// Pure cognitive load calculator — no I/O, fully deterministic

export interface CognitionInput {
  activeProjects:     number;
  unresolvedBlockers: number;
  workingSetSize:     number;
  staleProjectCount:  number;
  openIdeaCount:      number;
  unreviewedCount:    number;   // decisions/ideas awaiting review
  switchCount:        number;   // entity type switches in last session
  deepWorkMinutes:    number;   // minutes in deep work today
}

export type PressureLevel = "calm" | "moderate" | "high" | "overloaded";

export interface CognitionResult {
  score:         number;       // 0-100 (higher = more cognitive load)
  level:         PressureLevel;
  factors:       PressureFactor[];
  suggestions:   Suggestion[];
}

export interface PressureFactor {
  label:  string;
  value:  number;   // contribution to score 0-25
  detail: string;
}

export interface Suggestion {
  kind:     "archive" | "focus" | "review" | "block" | "rest";
  message:  string;
  priority: "low" | "medium" | "high";
}

const WEIGHTS = {
  activeProjects:     3.5,    // per project above 3
  blockers:           8,      // per unresolved blocker
  workingSetSize:     2,      // per item above 4
  staleProjects:      2,      // per stale project
  openIdeas:          0.5,    // per idea above 20
  unreviewed:         3,      // per item awaiting review above 5
  contextSwitches:    1.5,    // per switch above 5
  deepWorkBonus:     -0.2,    // per minute in deep work (reduces load)
};

export function computeCognitionScore(input: CognitionInput): CognitionResult {
  const factors: PressureFactor[] = [];
  let score = 0;

  // Active projects overload (baseline 3)
  if (input.activeProjects > 3) {
    const contrib = Math.min(25, (input.activeProjects - 3) * WEIGHTS.activeProjects);
    score += contrib;
    factors.push({
      label:  "Active projects",
      value:  contrib,
      detail: `${input.activeProjects} active (recommended ≤ 3)`,
    });
  }

  // Unresolved blockers
  if (input.unresolvedBlockers > 0) {
    const contrib = Math.min(25, input.unresolvedBlockers * WEIGHTS.blockers);
    score += contrib;
    factors.push({
      label:  "Unresolved blockers",
      value:  contrib,
      detail: `${input.unresolvedBlockers} blocker${input.unresolvedBlockers > 1 ? "s" : ""} unresolved`,
    });
  }

  // Working set fragmentation
  if (input.workingSetSize > 4) {
    const contrib = Math.min(15, (input.workingSetSize - 4) * WEIGHTS.workingSetSize);
    score += contrib;
    factors.push({
      label:  "Context fragmentation",
      value:  contrib,
      detail: `${input.workingSetSize} items in working set (recommended ≤ 4)`,
    });
  }

  // Stale projects creating background noise
  if (input.staleProjectCount > 0) {
    const contrib = Math.min(15, input.staleProjectCount * WEIGHTS.staleProjects);
    score += contrib;
    factors.push({
      label:  "Stale projects",
      value:  contrib,
      detail: `${input.staleProjectCount} project${input.staleProjectCount > 1 ? "s" : ""} without recent activity`,
    });
  }

  // Idea backlog
  if (input.openIdeaCount > 20) {
    const contrib = Math.min(10, (input.openIdeaCount - 20) * WEIGHTS.openIdeas);
    score += contrib;
    factors.push({
      label:  "Idea backlog",
      value:  contrib,
      detail: `${input.openIdeaCount} unarchived ideas`,
    });
  }

  // Review accumulation
  if (input.unreviewedCount > 5) {
    const contrib = Math.min(15, (input.unreviewedCount - 5) * WEIGHTS.unreviewed);
    score += contrib;
    factors.push({
      label:  "Review accumulation",
      value:  contrib,
      detail: `${input.unreviewedCount} items awaiting review`,
    });
  }

  // Context switching
  if (input.switchCount > 5) {
    const contrib = Math.min(10, (input.switchCount - 5) * WEIGHTS.contextSwitches);
    score += contrib;
    factors.push({
      label:  "Context switching",
      value:  contrib,
      detail: `High context switching detected this session`,
    });
  }

  // Deep work bonus (reduces perceived load)
  const deepBonus = Math.min(15, input.deepWorkMinutes * Math.abs(WEIGHTS.deepWorkBonus));
  score = Math.max(0, score - deepBonus);

  score = Math.min(100, Math.round(score));

  const level: PressureLevel =
    score >= 70 ? "overloaded" :
    score >= 45 ? "high" :
    score >= 20 ? "moderate" :
    "calm";

  const suggestions = buildSuggestions(input, level);

  return { score, level, factors, suggestions };
}

function buildSuggestions(input: CognitionInput, level: PressureLevel): Suggestion[] {
  const s: Suggestion[] = [];

  if (input.unresolvedBlockers > 0) {
    s.push({
      kind:     "block",
      message:  `Resolve or document ${input.unresolvedBlockers} blocker${input.unresolvedBlockers > 1 ? "s" : ""} to clear cognitive background noise`,
      priority: "high",
    });
  }

  if (input.activeProjects > 5) {
    s.push({
      kind:     "focus",
      message:  "Consider pausing lower-priority projects to narrow focus",
      priority: "high",
    });
  }

  if (input.staleProjectCount > 2) {
    s.push({
      kind:     "archive",
      message:  `Archive or resume ${input.staleProjectCount} stale projects to reduce background load`,
      priority: "medium",
    });
  }

  if (input.openIdeaCount > 30) {
    s.push({
      kind:     "archive",
      message:  "Process your idea backlog — archive ideas that no longer resonate",
      priority: "medium",
    });
  }

  if (level === "overloaded" && input.deepWorkMinutes < 30) {
    s.push({
      kind:     "rest",
      message:  "High cognitive load detected — a focused deep work session can help restore clarity",
      priority: "low",
    });
  }

  return s;
}
