import type {
  User,
  Idea,
  IdeaBlock,
  IdeaRelationship,
  Project,
  Task,
  Milestone,
  Note,
  Link,
  WeeklyReview,
  Decision,
  TimelineEvent,
  ScopeItem,
  ProjectRisk,
  Blocker,
  IdeaStatus,
  ReadinessStatus,
  BlockType,
  RelationshipType,
  ProjectStatus,
  ExecutionState,
  TaskStatus,
  Priority,
  MilestoneStatus,
  Visibility,
  ScopeBucket,
  RiskSeverity,
  TimelineEventType,
} from "@prisma/client";

export type {
  User,
  Idea,
  IdeaBlock,
  IdeaRelationship,
  Project,
  Task,
  Milestone,
  Note,
  Link,
  WeeklyReview,
  Decision,
  TimelineEvent,
  ScopeItem,
  ProjectRisk,
  Blocker,
  IdeaStatus,
  ReadinessStatus,
  BlockType,
  RelationshipType,
  ProjectStatus,
  ExecutionState,
  TaskStatus,
  Priority,
  MilestoneStatus,
  Visibility,
  ScopeBucket,
  RiskSeverity,
  TimelineEventType,
};

// Rich relation for idea detail page
export type IdeaBlockWithIdea = IdeaBlock & { idea: Idea };
export type IdeaRelationshipWithTitles = IdeaRelationship & {
  source: { id: string; title: string };
  target: { id: string; title: string };
};

// Omit soft-delete and audit fields from create/update payloads
export type CreateUser = Omit<User, "id" | "createdAt" | "updatedAt" | "deletedAt">;
export type UpdateUser = Partial<Omit<User, "id" | "authId" | "createdAt" | "updatedAt" | "deletedAt">>;

export type CreateIdea = Omit<Idea, "id" | "createdAt" | "updatedAt" | "deletedAt" | "convertedAt" | "projectId">;
export type UpdateIdea = Partial<Omit<Idea, "id" | "userId" | "createdAt" | "updatedAt" | "deletedAt">>;

export type CreateProject = Omit<Project, "id" | "createdAt" | "updatedAt" | "deletedAt" | "shippedAt">;
export type UpdateProject = Partial<Omit<Project, "id" | "userId" | "createdAt" | "updatedAt" | "deletedAt">>;

export type CreateTask = Omit<Task, "id" | "createdAt" | "updatedAt" | "deletedAt" | "completedAt">;
export type UpdateTask = Partial<Omit<Task, "id" | "userId" | "createdAt" | "updatedAt" | "deletedAt">>;

// Rich relations
export type IdeaWithRelations = Idea & {
  notes: Note[];
  links: Link[];
  project: Project | null;
};

export type ProjectWithRelations = Project & {
  tasks: Task[];
  milestones: (Milestone & { tasks: Task[] })[];
  notes: Note[];
  links: Link[];
  idea: { id: string; title: string } | null;
  weeklyReviews?: WeeklyReview[];
  decisions?: Decision[];
  timelineEvents?: TimelineEvent[];
  scopeItems?: ScopeItem[];
  blockers?: Blocker[];
};

export type TaskWithRelations = Task & {
  subtasks: Task[];
  notes: Note[];
  milestone: Milestone | null;
};
