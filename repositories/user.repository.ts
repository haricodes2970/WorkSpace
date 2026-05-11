import type { User } from "@prisma/client";
import type { CreateUser, UpdateUser } from "@/types";
import { BaseRepository } from "./base.repository";

export class UserRepository extends BaseRepository {
  async findById(id: string): Promise<User | null> {
    return this.db.user.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByAuthId(authId: string): Promise<User | null> {
    return this.db.user.findFirst({
      where: { authId, deletedAt: null },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.db.user.findFirst({
      where: { email, deletedAt: null },
    });
  }

  async create(data: CreateUser): Promise<User> {
    return this.db.user.create({ data });
  }

  async update(id: string, data: UpdateUser): Promise<User> {
    return this.db.user.update({ where: { id }, data });
  }

  async upsertByAuthId(authId: string, data: Omit<CreateUser, "authId">): Promise<User> {
    return this.db.user.upsert({
      where: { authId },
      create: { authId, ...data },
      update: data,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.db.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export const userRepository = new UserRepository();
