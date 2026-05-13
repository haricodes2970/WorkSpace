// Pure strategic drift calculator — no I/O

export interface DriftInput {
  // Active projects with metadata
  projects: Array<{
    id:        string;
    title:     string;
    phase:     string | null;
    momentum:  string | null;
    updatedAt: Date;
    ideaId:    string | null;   // origin idea, if promoted
  }>;

  // Ideas still not promoted
  highScoreIdeas: Array<{
    id:        string;
    title:     string;
    score:     number;
    updatedAt: Date;
  }>;

  // Time invested proxy: recent activity events per project
  activityMap: Record<string, number>;   // projectId → event count (last 30d)

  // Strategic reviews with goals
  latestReview: {
    period:     string;
    wins:       string[];
    risks:      string[];
    patterns:   string[];
  } | null;
}

export interface DriftResult {
  alignmentScore:   number;     // 0-100 (higher = better alignment)
  driftLevel:       DriftLevel;
  overFocusAreas:   OverFocusItem[];
  neglectedAreas:   NeglectedItem[];
  abandonedPriorities: AbandonedItem[];
  allocationMap:    AllocationItem[];
  summary:          string;
}

export type DriftLevel = "aligned" | "minor-drift" | "moderate-drift" | "significant-drift";

export interface OverFocusItem {
  projectId: string;
  title:     string;
  reason:    string;
  pct:       number;   // % of total activity
}

export interface NeglectedItem {
  projectId: string;
  title:     string;
  daysSince: number;
}

export interface AbandonedItem {
  id:    string;
  title: string;
  kind:  "project" | "idea";
  score?: number;
}

export interface AllocationItem {
  projectId: string;
  title:     string;
  activity:  number;   // raw event count
  pct:       number;   // % of total
}

export function computeDrift(input: DriftInput): DriftResult {
  const now = Date.now();
  const DAY = 86_400_000;

  // ─── Allocation map ────────────────────────────────────────────────────────
  const totalActivity = Object.values(input.activityMap).reduce((s, n) => s + n, 0) || 1;
  const allocationMap: AllocationItem[] = input.projects
    .filter((p) => p.phase !== "SHIPPED")
    .map((p) => {
      const activity = input.activityMap[p.id] ?? 0;
      return {
        projectId: p.id,
        title:     p.title,
        activity,
        pct:       Math.round((activity / totalActivity) * 100),
      };
    })
    .sort((a, b) => b.pct - a.pct);

  // ─── Over-focus: any single project > 60% of activity with others neglected ─
  const overFocus: OverFocusItem[] = allocationMap
    .filter((a) => a.pct >= 60 && allocationMap.length > 1)
    .map((a) => ({
      projectId: a.projectId,
      title:     a.title,
      pct:       a.pct,
      reason:    `${a.pct}% of recent activity concentrated here`,
    }));

  // ─── Neglected: active projects with no activity in 21+ days ──────────────
  const neglected: NeglectedItem[] = input.projects
    .filter((p) => {
      if (p.phase === "SHIPPED" || p.phase === "ARCHIVED") return false;
      const daysSince = Math.floor((now - new Date(p.updatedAt).getTime()) / DAY);
      return daysSince >= 21 && (input.activityMap[p.id] ?? 0) === 0;
    })
    .map((p) => ({
      projectId: p.id,
      title:     p.title,
      daysSince: Math.floor((now - new Date(p.updatedAt).getTime()) / DAY),
    }));

  // ─── Abandoned priorities: high-score ideas sitting idle 45+ days ─────────
  const abandoned: AbandonedItem[] = input.highScoreIdeas
    .filter((i) => {
      const days = Math.floor((now - new Date(i.updatedAt).getTime()) / DAY);
      return i.score >= 7 && days >= 45;
    })
    .slice(0, 5)
    .map((i) => ({
      id:    i.id,
      title: i.title,
      kind:  "idea" as const,
      score: i.score,
    }));

  // ─── Alignment score ───────────────────────────────────────────────────────
  let alignmentScore = 100;
  alignmentScore -= overFocus.length   * 20;
  alignmentScore -= neglected.length   * 10;
  alignmentScore -= abandoned.length   *  5;
  alignmentScore = Math.max(0, Math.min(100, alignmentScore));

  const driftLevel: DriftLevel =
    alignmentScore >= 80 ? "aligned" :
    alignmentScore >= 60 ? "minor-drift" :
    alignmentScore >= 40 ? "moderate-drift" :
    "significant-drift";

  const summary = buildSummary(driftLevel, overFocus, neglected, abandoned);

  return { alignmentScore, driftLevel, overFocusAreas: overFocus, neglectedAreas: neglected, abandonedPriorities: abandoned, allocationMap, summary };
}

function buildSummary(
  level:    DriftLevel,
  overFocus: OverFocusItem[],
  neglected: NeglectedItem[],
  abandoned: AbandonedItem[],
): string {
  if (level === "aligned") return "Execution is well-distributed across priorities.";

  const parts: string[] = [];
  if (overFocus.length)   parts.push(`Attention concentrated on "${overFocus[0]?.title ?? ""}"`);
  if (neglected.length)   parts.push(`${neglected.length} project${neglected.length > 1 ? "s" : ""} going stale`);
  if (abandoned.length)   parts.push(`${abandoned.length} high-value idea${abandoned.length > 1 ? "s" : ""} awaiting action`);
  return parts.join(" · ");
}
