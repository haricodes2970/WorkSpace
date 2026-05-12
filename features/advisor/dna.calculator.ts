/**
 * Project DNA — behavioral profiler.
 * Derives execution tendencies from historical project data.
 * Pure functions. No I/O.
 */

import type {
  BuilderDNA,
  VelocityTendency,
  ScopeHabit,
  ReviewConsistency,
  ShippingBehavior,
  MomentumResilience,
} from "./types";

// ─── Input shape ──────────────────────────────────────────────────────────────

export interface DnaProjectInput {
  id:                    string;
  status:                string;
  ageDays:               number;
  momentumScore:         number;
  taskCount:             number;
  taskDone:              number;
  mvpScopeCount:         number;
  laterScopeCount:       number;
  reviewCount:           number;
  blockerCount:          number;
  shippedAt:             Date | null;
  weeklyReviewRatings:   number[];
  decisionReversalCount: number;
  decisionCount:         number;
}

export interface DnaInput {
  userId:   string;
  projects: DnaProjectInput[];
}

// ─── Velocity tendency ────────────────────────────────────────────────────────

function deriveVelocityTendency(projects: DnaProjectInput[]): VelocityTendency {
  const finished = projects.filter((p) => p.status === "SHIPPED");
  const active   = projects.filter((p) => p.status === "ACTIVE");

  if (projects.length < 2) return "INCONSISTENT";

  // Sprinter: ships fast, high completion rate
  const fastShip = finished.filter((p) => p.ageDays < 60 && p.taskDone >= p.taskCount * 0.8);
  if (fastShip.length >= 2 && finished.length >= 3) return "SPRINTER";

  // Slow burn: ships but takes long
  if (finished.length >= 2 && finished.every((p) => p.ageDays > 90)) return "SLOW_BURN";

  // Steady: consistent across projects
  const avgMomentum = active.reduce((s, p) => s + p.momentumScore, 0) / Math.max(1, active.length);
  if (active.length >= 2 && avgMomentum >= 45) return "STEADY";

  return "INCONSISTENT";
}

// ─── Scope habit ──────────────────────────────────────────────────────────────

function deriveScopeHabit(projects: DnaProjectInput[]): ScopeHabit {
  const nonArchived = projects.filter((p) => p.status !== "ARCHIVED");
  if (nonArchived.length === 0) return "DISCIPLINED";

  const avgMvp = nonArchived.reduce((s, p) => s + p.mvpScopeCount, 0) / nonArchived.length;
  const avgLater = nonArchived.reduce((s, p) => s + p.laterScopeCount, 0) / nonArchived.length;

  // Inflator: MVP always grows large
  if (avgMvp > 12) return "INFLATOR";

  // Expander: lots of Later items, signals deferral habit
  if (avgLater > avgMvp * 2 && avgMvp <= 8) return "EXPANDER";

  // Cutter: actively moves things to Later
  if (avgLater > 5 && avgMvp <= 6) return "CUTTER";

  return "DISCIPLINED";
}

// ─── Review consistency ───────────────────────────────────────────────────────

function deriveReviewConsistency(projects: DnaProjectInput[]): ReviewConsistency {
  const activeOrShipped = projects.filter((p) => p.status === "ACTIVE" || p.status === "SHIPPED");
  if (activeOrShipped.length === 0) return "ABSENT";

  const avgReviews = activeOrShipped.reduce((s, p) => s + p.reviewCount, 0) / activeOrShipped.length;
  const avgAgeDays = activeOrShipped.reduce((s, p) => s + p.ageDays, 0) / activeOrShipped.length;

  // Expected reviews = weeks alive
  const expectedReviews = avgAgeDays / 7;
  const reviewRate = expectedReviews > 0 ? avgReviews / expectedReviews : 0;

  if (reviewRate >= 0.7)  return "HIGH";
  if (reviewRate >= 0.4)  return "MODERATE";
  if (reviewRate >= 0.1)  return "LOW";
  return "ABSENT";
}

// ─── Blocker frequency ────────────────────────────────────────────────────────

function deriveBlockerFrequency(
  projects: DnaProjectInput[]
): BuilderDNA["blockerFrequency"] {
  const total = projects.reduce((s, p) => s + p.blockerCount, 0);
  const count = projects.length;
  if (count === 0) return "RARE";

  const avgBlockers = total / count;
  if (avgBlockers >= 5) return "CHRONIC";
  if (avgBlockers >= 3) return "FREQUENT";
  if (avgBlockers >= 1) return "OCCASIONAL";
  return "RARE";
}

// ─── Shipping behavior ────────────────────────────────────────────────────────

function deriveShippingBehavior(projects: DnaProjectInput[]): ShippingBehavior {
  const shipped    = projects.filter((p) => p.status === "SHIPPED").length;
  const total      = projects.length;
  const restarters = projects.filter(
    (p) => (p.status === "ARCHIVED" || p.status === "PAUSED") && p.taskDone < 3
  ).length;

  if (total < 2) return "STALLS";

  const shipRate = shipped / total;
  if (shipRate >= 0.5 && shipped >= 2) {
    const avgAge = projects.filter((p) => p.status === "SHIPPED").reduce((s, p) => s + p.ageDays, 0) / shipped;
    return avgAge <= 90 ? "SHIPS_FAST" : "SHIPS_SLOW";
  }
  if (restarters >= 2 && restarters > shipped) return "RESTARTS";
  return "STALLS";
}

// ─── Momentum resilience ─────────────────────────────────────────────────────

function deriveMomentumResilience(projects: DnaProjectInput[]): MomentumResilience {
  const active = projects.filter((p) => p.status === "ACTIVE");
  if (active.length === 0) return "FRAGILE";

  const scores = active.map((p) => p.momentumScore);
  const avg    = scores.reduce((s, x) => s + x, 0) / scores.length;
  const variance = scores.reduce((s, x) => s + Math.pow(x - avg, 2), 0) / scores.length;
  const stdDev   = Math.sqrt(variance);

  if (avg >= 60 && stdDev < 20) return "RESILIENT";
  if (stdDev >= 30) return "VOLATILE";
  return "FRAGILE";
}

// ─── Tendency sentences ───────────────────────────────────────────────────────

function buildTendencies(dna: Omit<BuilderDNA, "executionTendencies" | "strategicProfile" | "strengths" | "watchOuts" | "generatedAt">): string[] {
  const tendencies: string[] = [];

  const velMap: Record<VelocityTendency, string> = {
    SPRINTER:     "Executes in focused bursts and ships fast when committed.",
    STEADY:       "Maintains consistent execution pace across projects.",
    SLOW_BURN:    "Works methodically over long horizons before shipping.",
    INCONSISTENT: "Execution pace varies significantly between projects.",
  };

  const scopeMap: Record<ScopeHabit, string> = {
    DISCIPLINED: "Keeps scope lean and resists feature additions.",
    EXPANDER:    "Tends to grow scope beyond initial boundaries.",
    INFLATOR:    "Consistently expands MVP beyond minimal definition.",
    CUTTER:      "Actively moves scope to backlog to protect MVP focus.",
  };

  const reviewMap: Record<ReviewConsistency, string> = {
    HIGH:     "Reviews work regularly and maintains strategic awareness.",
    MODERATE: "Reviews inconsistently — good periods followed by gaps.",
    LOW:      "Rarely reflects on progress in structured reviews.",
    ABSENT:   "Does not use weekly reviews as an execution tool.",
  };

  const shipMap: Record<ShippingBehavior, string> = {
    SHIPS_FAST: "Ships frequently and maintains a completing habit.",
    SHIPS_SLOW: "Eventually ships, but with extended timelines.",
    STALLS:     "Projects tend to plateau before completion.",
    RESTARTS:   "Frequently abandons projects early and starts new ones.",
  };

  tendencies.push(velMap[dna.velocityTendency]);
  tendencies.push(scopeMap[dna.scopeHabit]);
  tendencies.push(reviewMap[dna.reviewConsistency]);
  tendencies.push(shipMap[dna.shippingBehavior]);

  return tendencies;
}

function buildStrengths(dna: Omit<BuilderDNA, "executionTendencies" | "strategicProfile" | "strengths" | "watchOuts" | "generatedAt">): string[] {
  const s: string[] = [];
  if (dna.velocityTendency === "SPRINTER") s.push("Rapid execution in focused sprints");
  if (dna.velocityTendency === "STEADY")   s.push("Consistent long-term execution pace");
  if (dna.scopeHabit === "DISCIPLINED")    s.push("Scope discipline under pressure");
  if (dna.scopeHabit === "CUTTER")         s.push("Ruthless prioritization");
  if (dna.reviewConsistency === "HIGH")    s.push("Regular strategic reflection");
  if (dna.shippingBehavior === "SHIPS_FAST") s.push("Bias toward completion over perfection");
  if (dna.blockerFrequency === "RARE")     s.push("Navigates execution cleanly with few blockers");
  if (dna.momentumResilience === "RESILIENT") s.push("Maintains momentum under friction");
  return s.slice(0, 3);
}

function buildWatchOuts(dna: Omit<BuilderDNA, "executionTendencies" | "strategicProfile" | "strengths" | "watchOuts" | "generatedAt">): string[] {
  const w: string[] = [];
  if (dna.scopeHabit === "INFLATOR")         w.push("MVP scope consistently expands beyond minimal");
  if (dna.shippingBehavior === "STALLS")     w.push("Projects plateau before crossing the finish line");
  if (dna.shippingBehavior === "RESTARTS")   w.push("Pattern of abandonment before validation");
  if (dna.reviewConsistency === "ABSENT")    w.push("No reflection habit — drift goes undetected");
  if (dna.blockerFrequency === "CHRONIC")    w.push("Persistent blockers accumulate without resolution");
  if (dna.momentumResilience === "VOLATILE") w.push("Momentum swings widely — inconsistent execution windows");
  if (dna.velocityTendency === "INCONSISTENT") w.push("Execution pace unpredictable across projects");
  return w.slice(0, 3);
}

function buildStrategicProfile(dna: Omit<BuilderDNA, "executionTendencies" | "strategicProfile" | "strengths" | "watchOuts" | "generatedAt">): string {
  if (dna.velocityTendency === "SPRINTER" && dna.shippingBehavior === "SHIPS_FAST") {
    return "Execution-first builder. Ships fast, learns from real feedback, iterates quickly.";
  }
  if (dna.velocityTendency === "SLOW_BURN" && dna.reviewConsistency === "HIGH") {
    return "Strategic builder. Deep thinker who plans thoroughly before executing.";
  }
  if (dna.scopeHabit === "INFLATOR" && dna.shippingBehavior === "STALLS") {
    return "Idea accumulator. Strong at generating and expanding; needs help completing and shipping.";
  }
  if (dna.shippingBehavior === "RESTARTS") {
    return "Explorer builder. Learns through starting — needs intentional scope constraints to ship.";
  }
  if (dna.momentumResilience === "RESILIENT" && dna.reviewConsistency === "HIGH") {
    return "Sustained executor. Maintains progress through obstacles with regular course-correction.";
  }
  return "Mixed execution profile. Strengths and patterns best understood across a larger project history.";
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export function calculateDNA(input: DnaInput): BuilderDNA | null {
  if (input.projects.length < 2) return null;

  const base = {
    userId:              input.userId,
    velocityTendency:    deriveVelocityTendency(input.projects),
    scopeHabit:          deriveScopeHabit(input.projects),
    reviewConsistency:   deriveReviewConsistency(input.projects),
    blockerFrequency:    deriveBlockerFrequency(input.projects),
    shippingBehavior:    deriveShippingBehavior(input.projects),
    momentumResilience:  deriveMomentumResilience(input.projects),
    projectsAnalyzed:    input.projects.length,
  };

  return {
    ...base,
    executionTendencies: buildTendencies(base),
    strategicProfile:    buildStrategicProfile(base),
    strengths:           buildStrengths(base),
    watchOuts:           buildWatchOuts(base),
    generatedAt:         new Date(),
  };
}
