/**
 * Universal Entity Architecture — typed entity references and metadata.
 * Foundation for cross-entity linking, search indexing, and graph navigation.
 */

// ─── Entity kinds ─────────────────────────────────────────────────────────────

export type EntityKind =
  | "idea"
  | "project"
  | "task"
  | "milestone"
  | "decision"
  | "weekly_review"
  | "note"
  | "scope_item"
  | "risk"
  | "blocker"
  | "knowledge_memory"
  | "retrospective"
  | "strategic_review";

// Maps EntityKind to Prisma EntityType enum value
export const ENTITY_KIND_TO_TYPE: Record<EntityKind, string> = {
  idea:             "IDEA",
  project:          "PROJECT",
  task:             "TASK",
  milestone:        "MILESTONE",
  decision:         "DECISION",
  weekly_review:    "WEEKLY_REVIEW",
  note:             "NOTE",
  scope_item:       "SCOPE_ITEM",
  risk:             "RISK",
  blocker:          "BLOCKER",
  knowledge_memory: "KNOWLEDGE_MEMORY",
  retrospective:    "RETROSPECTIVE",
  strategic_review: "STRATEGIC_REVIEW",
};

export const ENTITY_TYPE_TO_KIND: Record<string, EntityKind> = Object.fromEntries(
  Object.entries(ENTITY_KIND_TO_TYPE).map(([k, v]) => [v, k as EntityKind])
);

// ─── Entity reference ─────────────────────────────────────────────────────────

export interface EntityRef {
  kind:    EntityKind;
  id:      string;
  title:   string;
  href:    string;
  userId?: string;
}

// ─── Entity metadata ──────────────────────────────────────────────────────────

export interface EntityMetadata {
  ref:         EntityRef;
  description: string | null;
  tags:        string[];
  createdAt:   Date;
  updatedAt:   Date;
  deletedAt:   Date | null;
  status:      string | null;
  parentRef:   EntityRef | null;   // e.g. task → project, milestone → project
}

// ─── Entity descriptor (static config per kind) ───────────────────────────────

export interface EntityDescriptor {
  kind:       EntityKind;
  label:      string;
  labelPlural: string;
  baseHref:   string;   // e.g. "/ideas", "/projects"
  searchable: boolean;
  embeddable: boolean;
  taggable:   boolean;
  linkable:   boolean;
}

export const ENTITY_DESCRIPTORS: Record<EntityKind, EntityDescriptor> = {
  idea: {
    kind: "idea", label: "Idea", labelPlural: "Ideas",
    baseHref: "/ideas", searchable: true, embeddable: true, taggable: true, linkable: true,
  },
  project: {
    kind: "project", label: "Project", labelPlural: "Projects",
    baseHref: "/projects", searchable: true, embeddable: true, taggable: true, linkable: true,
  },
  task: {
    kind: "task", label: "Task", labelPlural: "Tasks",
    baseHref: "/tasks", searchable: true, embeddable: false, taggable: true, linkable: true,
  },
  milestone: {
    kind: "milestone", label: "Milestone", labelPlural: "Milestones",
    baseHref: "/projects", searchable: true, embeddable: false, taggable: false, linkable: true,
  },
  decision: {
    kind: "decision", label: "Decision", labelPlural: "Decisions",
    baseHref: "/projects", searchable: true, embeddable: true, taggable: false, linkable: true,
  },
  weekly_review: {
    kind: "weekly_review", label: "Weekly Review", labelPlural: "Weekly Reviews",
    baseHref: "/projects", searchable: false, embeddable: false, taggable: false, linkable: false,
  },
  note: {
    kind: "note", label: "Note", labelPlural: "Notes",
    baseHref: "/knowledge", searchable: true, embeddable: true, taggable: false, linkable: true,
  },
  scope_item: {
    kind: "scope_item", label: "Scope Item", labelPlural: "Scope Items",
    baseHref: "/projects", searchable: false, embeddable: false, taggable: false, linkable: false,
  },
  risk: {
    kind: "risk", label: "Risk", labelPlural: "Risks",
    baseHref: "/projects", searchable: false, embeddable: false, taggable: false, linkable: false,
  },
  blocker: {
    kind: "blocker", label: "Blocker", labelPlural: "Blockers",
    baseHref: "/projects", searchable: false, embeddable: false, taggable: false, linkable: false,
  },
  knowledge_memory: {
    kind: "knowledge_memory", label: "Memory", labelPlural: "Memories",
    baseHref: "/knowledge", searchable: true, embeddable: true, taggable: true, linkable: true,
  },
  retrospective: {
    kind: "retrospective", label: "Retrospective", labelPlural: "Retrospectives",
    baseHref: "/knowledge", searchable: false, embeddable: false, taggable: false, linkable: false,
  },
  strategic_review: {
    kind: "strategic_review", label: "Strategic Review", labelPlural: "Strategic Reviews",
    baseHref: "/reviews", searchable: false, embeddable: false, taggable: false, linkable: false,
  },
};

export function getEntityDescriptor(kind: EntityKind): EntityDescriptor {
  return ENTITY_DESCRIPTORS[kind];
}

export function buildEntityHref(kind: EntityKind, id: string): string {
  const desc = ENTITY_DESCRIPTORS[kind];
  const basePaths: Partial<Record<EntityKind, (id: string) => string>> = {
    idea:             (id) => `/ideas/${id}`,
    project:          (id) => `/projects/${id}`,
    task:             (id) => `/tasks?id=${id}`,
    knowledge_memory: (id) => `/knowledge?memory=${id}`,
    strategic_review: (id) => `/reviews/${id}`,
  };
  return basePaths[kind]?.(id) ?? `${desc.baseHref}/${id}`;
}
