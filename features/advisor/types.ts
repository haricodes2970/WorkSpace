// ─── Advisor Signal ───────────────────────────────────────────────────────────

export type AdvisorSignalType =
  | "REPEATED_FAILURE"
  | "SCOPE_INFLATION"
  | "MOMENTUM_DECAY_RISK"
  | "BLOCKER_RECURRENCE"
  | "REVIEW_INCONSISTENCY"
  | "EXECUTION_BOTTLENECK"
  | "FAILURE_RISK"
  | "MVP_DRIFT"
  | "MISSING_ASSUMPTION"
  | "SCOPE_COMPRESSION";

export type AdvisorSeverity = "info" | "warning" | "critical";

export interface AdvisorSignal {
  id:           string;
  type:         AdvisorSignalType;
  title:        string;
  body:         string;
  confidence:   number;   // 0–100
  severity:     AdvisorSeverity;
  projectId?:   string;
  projectTitle?: string;
  evidence:     Record<string, unknown>;
  dismissible:  boolean;
  actionLabel?: string;
  actionHref?:  string;
}

// ─── Survivability ────────────────────────────────────────────────────────────

export type ExecutionRisk = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export interface RiskFactor {
  label:       string;
  weight:      number;   // 0–100 contribution to abandonment score
  description: string;
}

export interface SurvivabilityResult {
  projectId:              string;
  projectTitle:           string;
  abandonmentProbability: number;   // 0–100
  executionRisk:          ExecutionRisk;
  survivabilityScore:     number;   // 100 - abandonmentProbability
  riskFactors:            RiskFactor[];
  primaryThreat:          string;
}

// ─── Compression Engine ───────────────────────────────────────────────────────

export type CompressionAction = "MOVE_TO_V1" | "MOVE_TO_LATER" | "CONSOLIDATE" | "CUT_EXPERIMENTAL";

export interface CompressionSuggestion {
  action:          CompressionAction;
  title:           string;
  rationale:       string;
  items:           string[];   // scope item titles
  estimatedImpact: "LOW" | "MEDIUM" | "HIGH";
  mvpReduction:    number;     // estimated # of items removed from MVP
}

export interface CompressionResult {
  projectId:       string;
  projectTitle:    string;
  currentMvpSize:  number;
  targetMvpSize:   number;
  suggestions:     CompressionSuggestion[];
  compressionScore: number;   // 0 = no compression needed, 100 = critical
}

// ─── Thinking Assist ─────────────────────────────────────────────────────────

export type ThinkingGapType =
  | "MISSING_ASSUMPTIONS"
  | "UNDEFINED_METRICS"
  | "WEAK_VALIDATION"
  | "UNCLEAR_USER"
  | "EXECUTION_AMBIGUITY"
  | "UNRESOLVED_RISKS";

export interface ThinkingGap {
  type:        ThinkingGapType;
  label:       string;
  prompt:      string;
  blockType:   string;   // which IdeaBlock is incomplete
  severity:    "hint" | "suggestion" | "warning";
}

export interface ThinkingAssistResult {
  ideaId:     string;
  ideaTitle:  string;
  gaps:       ThinkingGap[];
  clarity:    number;   // 0–100
  readiness:  string;   // textual description
}

// ─── Project DNA ─────────────────────────────────────────────────────────────

export type VelocityTendency  = "SPRINTER" | "STEADY" | "SLOW_BURN" | "INCONSISTENT";
export type ScopeHabit        = "DISCIPLINED" | "EXPANDER" | "INFLATOR" | "CUTTER";
export type ReviewConsistency = "HIGH" | "MODERATE" | "LOW" | "ABSENT";
export type ShippingBehavior  = "SHIPS_FAST" | "SHIPS_SLOW" | "STALLS" | "RESTARTS";
export type MomentumResilience = "RESILIENT" | "FRAGILE" | "VOLATILE";

export interface BuilderDNA {
  userId:               string;
  velocityTendency:     VelocityTendency;
  scopeHabit:           ScopeHabit;
  reviewConsistency:    ReviewConsistency;
  blockerFrequency:     "RARE" | "OCCASIONAL" | "FREQUENT" | "CHRONIC";
  shippingBehavior:     ShippingBehavior;
  momentumResilience:   MomentumResilience;
  executionTendencies:  string[];
  strategicProfile:     string;
  strengths:            string[];
  watchOuts:            string[];
  projectsAnalyzed:     number;
  generatedAt:          Date;
}

// ─── Execution Narrative ──────────────────────────────────────────────────────

export interface NarrativeChapter {
  phase:       string;
  title:       string;
  description: string;
  sentiment:   "positive" | "neutral" | "negative" | "pivotal";
  timeframe:   string;
}

export interface ExecutionNarrative {
  projectId:   string;
  projectTitle: string;
  summary:     string;
  currentChapter: string;
  currentPhase:   string;
  chapters:    NarrativeChapter[];
  keyMoments:  string[];
  trajectory:  "ascending" | "descending" | "plateauing" | "recovering";
}

// ─── Advisor Full Output ──────────────────────────────────────────────────────

export interface AdvisorOutput {
  signals:       AdvisorSignal[];
  survivability: SurvivabilityResult[];
  compression:   CompressionResult[];
  dna:           BuilderDNA | null;
  generatedAt:   Date;
}
