import { prisma } from "@/lib/prisma/client";
import type { PrismaClient } from "@prisma/client";

export abstract class BaseRepository {
  protected readonly db: PrismaClient;

  constructor() {
    this.db = prisma;
  }
}
