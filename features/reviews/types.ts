/**
 * Strategic Review types — long-horizon reflection models.
 * Used by both service and UI layers.
 */

export type StrategicReviewKind =
  | "MONTHLY"
  | "QUARTERLY"
  | "ANNUAL"
  | "PORTFOLIO"
  | "EXECUTION_HEALTH"
  | "IDEA_CEMETERY";

export interface StrategicReviewRecord {
  id:          string;
  userId:      string;
  type:        StrategicReviewKind;
  period:      string;
  periodStart: Date;
  periodEnd:   Date;
  wins:        string;
  struggles:   string;
  patterns:    string;
  nextFocus:   string;
  snapshot:    ReviewSnapshot | null;
  createdAt:   Date;
  updatedAt:   Date;
}

// ─── Snapshot — system-generated stats frozen at review time ─────────────────

export interface ReviewSnapshot {
  projectsActive:    number;
  projectsShipped:   number;
  projectsArchived:  number;
  ideasCreated:      number;
  ideasConverted:    number;
  tasksCompleted:    number;
  decisionsLogged:   number;
  memoriesCapured:   number;
  weeklyReviews:     number;
  avgMomentumScore:  number;
  topProjects:       Array<{ id: string; title: string; status: string; momentumScore: number }>;
  shippedProjects:   Array<{ id: string; title: string; shippedAt: string }>;
  stalledProjects:   Array<{ id: string; title: string; stalledWeeks: number }>;
  abandonedIdeas:    number;
  generatedAt:       string;
}

// ─── Analysis output ──────────────────────────────────────────────────────────

export interface ReviewAnalysis {
  period:         string;
  periodType:     StrategicReviewKind;
  summary:        string;
  wins:           string[];
  risks:          string[];
  patterns:       string[];
  recommendation: string;
  snapshot:       ReviewSnapshot;
}

// ─── Create input ─────────────────────────────────────────────────────────────

export interface CreateStrategicReviewInput {
  type:        StrategicReviewKind;
  period:      string;
  periodStart: Date;
  periodEnd:   Date;
  wins:        string;
  struggles:   string;
  patterns:    string;
  nextFocus:   string;
}

// ─── Period helpers ───────────────────────────────────────────────────────────

export function buildMonthlyPeriod(year: number, month: number): {
  period: string;
  periodStart: Date;
  periodEnd: Date;
} {
  const start = new Date(year, month - 1, 1);
  const end   = new Date(year, month, 0);
  const label = start.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  return {
    period:      `${year}-${String(month).padStart(2, "0")}`,
    periodStart: start,
    periodEnd:   end,
  };
  void label; // suppress unused warning for the label variable
}

export function buildQuarterlyPeriod(year: number, quarter: 1 | 2 | 3 | 4): {
  period: string;
  periodStart: Date;
  periodEnd: Date;
} {
  const startMonth = (quarter - 1) * 3;
  const start      = new Date(year, startMonth, 1);
  const end        = new Date(year, startMonth + 3, 0);
  return {
    period:      `${year}-Q${quarter}`,
    periodStart: start,
    periodEnd:   end,
  };
}

export function buildAnnualPeriod(year: number): {
  period: string;
  periodStart: Date;
  periodEnd: Date;
} {
  return {
    period:      `${year}`,
    periodStart: new Date(year, 0, 1),
    periodEnd:   new Date(year, 11, 31),
  };
}

export function getCurrentPeriods(): {
  monthly:   ReturnType<typeof buildMonthlyPeriod>;
  quarterly: ReturnType<typeof buildQuarterlyPeriod>;
  annual:    ReturnType<typeof buildAnnualPeriod>;
} {
  const now     = new Date();
  const year    = now.getFullYear();
  const month   = now.getMonth() + 1;
  const quarter = Math.ceil(month / 3) as 1 | 2 | 3 | 4;
  return {
    monthly:   buildMonthlyPeriod(year, month),
    quarterly: buildQuarterlyPeriod(year, quarter),
    annual:    buildAnnualPeriod(year),
  };
}
