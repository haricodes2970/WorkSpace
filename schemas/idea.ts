import { z } from "zod";
import { IdeaStatus } from "@prisma/client";

export const createIdeaSchema = z.object({
  title: z.string().min(1, "Title required").max(200, "Title too long").trim(),
  description: z.string().max(5000).trim().optional(),
  tags: z.array(z.string().max(50)).max(10).default([]),
  pinned: z.boolean().default(false),
});

export const updateIdeaSchema = createIdeaSchema.partial().extend({
  status: z.nativeEnum(IdeaStatus).optional(),
});

export type CreateIdeaInput = z.infer<typeof createIdeaSchema>;
export type UpdateIdeaInput = z.infer<typeof updateIdeaSchema>;
