import { z } from "zod";
import { BlockType, RelationshipType } from "@prisma/client";

export const saveBlockSchema = z.object({
  ideaId:  z.string().uuid(),
  type:    z.nativeEnum(BlockType),
  content: z.string().max(20_000),
});

export const addRelationshipSchema = z.object({
  sourceId:         z.string().uuid(),
  targetId:         z.string().uuid(),
  relationshipType: z.nativeEnum(RelationshipType),
});

export const removeRelationshipSchema = z.object({
  id: z.string().uuid(),
});

export type SaveBlockInput       = z.infer<typeof saveBlockSchema>;
export type AddRelationshipInput = z.infer<typeof addRelationshipSchema>;
