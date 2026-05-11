import { z } from "zod";

export const convertIdeaSchema = z.object({
  ideaId:             z.string().uuid(),
  projectName:        z.string().min(1, "Project name required").max(200).trim(),
  projectDescription: z.string().max(5000).trim().optional(),
  taskTitles:         z.array(z.string().min(1).max(300)).max(50).default([]),
});

export type ConvertIdeaInput = z.infer<typeof convertIdeaSchema>;
