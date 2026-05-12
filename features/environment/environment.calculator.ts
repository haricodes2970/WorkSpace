// Pure environment health calculator — no I/O

export interface EnvironmentInput {
  activeProjects:     number;
  unresolvedBlockers: number;
  openIdeaCount:      number;
  staleDecisions:     number;   // decisions older than 14d without follow-up
  workingSetSize:     number;
  archivedRatio:      number;   // 0-1: archived / total entities (higher = cleaner)
  hasRecentReview:    boolean;  // strategic review in last 60d
  totalEntities:      number;   // rough indicator of workspace size
  orphanedNotes:      number;   // notes with no project link
}

export type HealthGrade = "A" | "B" | "C" | "D";

export interface EnvironmentHealth {
  score:        number;     // 0-100 (higher = healthier)
  grade:        HealthGrade;
  dimensions:   HealthDimension[];
  cleanupItems: CleanupItem[];
  archiveSuggestions: ArchiveSuggestion[];
}

export interface HealthDimension {
  label:  string;
  score:  number;   // 0-100
  detail: string;
}

export interface CleanupItem {
  kind:     "blocker" | "decision" | "note" | "idea";
  count:    number;
  message:  string;
  href:     string;
}

export interface ArchiveSuggestion {
  kind:     "project" | "idea";
  message:  string;
  href:     string;
}

export function computeEnvironmentHealth(input: EnvironmentInput): EnvironmentHealth {
  // ─── Dimension scores ──────────────────────────────────────────────────────

  // Execution clarity: few blockers + reasonable project count
  const executionClarity = Math.max(0, 100
    - input.unresolvedBlockers * 15
    - Math.max(0, input.activeProjects - 4) * 8
  );

  // Context hygiene: working set not fragmented, stale decisions cleared
  const contextHygiene = Math.max(0, 100
    - Math.max(0, input.workingSetSize - 4) * 10
    - input.staleDecisions * 5
  );

  // Knowledge density: ideas and notes have homes
  const knowledgeDensity = Math.max(0, 100
    - Math.max(0, input.openIdeaCount - 20) * 1
    - input.orphanedNotes * 3
  );

  // Strategic clarity: recent review, good archive ratio
  const strategicClarity = Math.min(100,
    (input.hasRecentReview ? 40 : 0)
    + Math.round(input.archivedRatio * 40)
    + 20
  );

  const dimensions: HealthDimension[] = [
    { label: "Execution clarity",  score: Math.min(100, executionClarity),  detail: `${input.unresolvedBlockers} blockers, ${input.activeProjects} active projects` },
    { label: "Context hygiene",    score: Math.min(100, contextHygiene),    detail: `${input.workingSetSize} working set items, ${input.staleDecisions} stale decisions` },
    { label: "Knowledge density",  score: Math.min(100, knowledgeDensity),  detail: `${input.openIdeaCount} open ideas, ${input.orphanedNotes} orphaned notes` },
    { label: "Strategic clarity",  score: Math.min(100, strategicClarity),  detail: input.hasRecentReview ? "Recent review on file" : "No recent review" },
  ];

  const score = Math.round(dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length);
  const grade: HealthGrade = score >= 85 ? "A" : score >= 70 ? "B" : score >= 50 ? "C" : "D";

  // ─── Cleanup items ─────────────────────────────────────────────────────────
  const cleanupItems: CleanupItem[] = [];

  if (input.unresolvedBlockers > 0) {
    cleanupItems.push({
      kind: "blocker", count: input.unresolvedBlockers,
      message: `${input.unresolvedBlockers} unresolved blocker${input.unresolvedBlockers > 1 ? "s" : ""}`,
      href: "/projects",
    });
  }
  if (input.staleDecisions > 3) {
    cleanupItems.push({
      kind: "decision", count: input.staleDecisions,
      message: `${input.staleDecisions} old decisions without follow-up`,
      href: "/projects",
    });
  }
  if (input.orphanedNotes > 5) {
    cleanupItems.push({
      kind: "note", count: input.orphanedNotes,
      message: `${input.orphanedNotes} notes not linked to any project`,
      href: "/knowledge",
    });
  }

  // ─── Archive suggestions ───────────────────────────────────────────────────
  const archiveSuggestions: ArchiveSuggestion[] = [];

  if (input.openIdeaCount > 30) {
    archiveSuggestions.push({
      kind: "idea",
      message: `Idea backlog at ${input.openIdeaCount} — archive ideas that no longer resonate`,
      href: "/ideas",
    });
  }
  if (input.archivedRatio < 0.3 && input.totalEntities > 20) {
    archiveSuggestions.push({
      kind: "project",
      message: "Low archive ratio — consider archiving completed or abandoned work",
      href: "/projects",
    });
  }

  return { score, grade, dimensions, cleanupItems, archiveSuggestions };
}
