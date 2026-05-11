import { z } from "zod";
import { ProjectStatus, Visibility } from "@prisma/client";

export const createProjectSchema = z.object({
  title: z.string().min(1, "Title required").max(200).trim(),
  description: z.string().max(5000).trim().optional(),
  status: z.nativeEnum(ProjectStatus).default("PLANNING"),
  visibility: z.nativeEnum(Visibility).default("PRIVATE"),
  startDate: z.coerce.date().optional(),
  targetDate: z.coerce.date().optional(),
  tags: z.array(z.string().max(50)).max(10).default([]),
});

export const updateProjectSchema = createProjectSchema.partial();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
