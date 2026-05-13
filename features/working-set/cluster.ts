// Pure adaptive working-set cluster logic — no I/O

import type { WorkingSetEntry } from "@/lib/session-store";

export interface WorkingSetCluster {
  id:      string;
  label:   string;
  entries: WorkingSetEntry[];
  kind:    "project" | "topic" | "temporal" | "mixed";
}

// Group working set entries into coherent clusters
// Clustering logic: same entityKind → kind cluster; recent pinnedAt → temporal; else mixed
export function clusterWorkingSet(entries: WorkingSetEntry[]): WorkingSetCluster[] {
  if (!entries.length) return [];

  // Group by entityKind
  const byKind: Record<string, WorkingSetEntry[]> = {};
  for (const e of entries) {
    if (!byKind[e.entityKind]) byKind[e.entityKind] = [];
    byKind[e.entityKind]!.push(e);
  }

  const clusters: WorkingSetCluster[] = [];

  for (const [kind, items] of Object.entries(byKind)) {
    if (items.length >= 2) {
      clusters.push({
        id:      `cluster-${kind}`,
        label:   labelForKind(kind),
        entries: items,
        kind:    kind === "project" ? "project" : "topic",
      });
    }
  }

  // Remaining singletons form a "mixed" cluster
  const clustered = new Set(clusters.flatMap((c) => c.entries.map((e) => e.entityId)));
  const singles   = entries.filter((e) => !clustered.has(e.entityId));
  if (singles.length > 0) {
    clusters.push({
      id:      "cluster-misc",
      label:   "Context",
      entries: singles,
      kind:    "mixed",
    });
  }

  return clusters;
}

function labelForKind(kind: string): string {
  const MAP: Record<string, string> = {
    project:   "Projects",
    idea:      "Ideas",
    knowledge: "Knowledge",
    page:      "Pages",
  };
  return MAP[kind] ?? kind.charAt(0).toUpperCase() + kind.slice(1);
}

// Suggest entries to add based on working set gaps
// (e.g. if you have 2 project entries, suggest pinning related tasks)
export function suggestClusterAdditions(
  entries:     WorkingSetEntry[],
  recentRoutes: string[],
): string[] {
  const kinds = new Set(entries.map((e) => e.entityKind));
  const suggestions: string[] = [];

  if (kinds.has("project") && !kinds.has("idea")) {
    suggestions.push("Pin related ideas to this working set");
  }
  if (recentRoutes.some((r) => r.startsWith("/knowledge")) && !kinds.has("knowledge")) {
    suggestions.push("Pin recent knowledge entries for quick access");
  }
  return suggestions.slice(0, 2);
}
