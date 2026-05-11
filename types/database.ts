import type {
  User,
  Idea,
  Project,
  Task,
  Milestone,
  Note,
  Link,
  IdeaStatus,
  ProjectStatus,
  TaskStatus,
  Priority,
  MilestoneStatus,
  Visibility,
} from "@prisma/client";

export type {
  User,
  Idea,
  Project,
  Task,
  Milestone,
  Note,
  Link,
  IdeaStatus,
  ProjectStatus,
  TaskStatus,
  Priority,
  MilestoneStatus,
  Visibility,
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
  milestones: Milestone[];
  notes: Note[];
  links: Link[];
  idea: Idea | null;
};

export type TaskWithRelations = Task & {
  subtasks: Task[];
  notes: Note[];
  milestone: Milestone | null;
};
