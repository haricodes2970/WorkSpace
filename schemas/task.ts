import { z } from "zod";
import { TaskStatus, Priority } from "@prisma/client";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title required").max(500).trim(),
  description: z.string().max(5000).trim().optional(),
  projectId: z.string().uuid().optional(),
  milestoneId: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(),
  status: z.nativeEnum(TaskStatus).default("TODO"),
  priority: z.nativeEnum(Priority).default("MEDIUM"),
  dueDate: z.coerce.date().optional(),
  tags: z.array(z.string().max(50)).max(10).default([]),
});

export const updateTaskSchema = createTaskSchema.partial();

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
