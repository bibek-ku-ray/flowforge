import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import type { AdminUserDto } from "@/features/admin/types";

function toDto(user: {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  banned: boolean;
  createdAt: Date;
}): AdminUserDto {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    banned: user.banned,
    createdAt: user.createdAt,
  };
}

export const adminUserRepository = {
  async findMany(params: {
    page: number;
    pageSize: number;
    search: string;
  }): Promise<{ items: AdminUserDto[]; totalCount: number }> {
    const { page, pageSize, search } = params;
    const where: Prisma.UserWhereInput = search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" } },
            { name: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          banned: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      items: users.map(toDto),
      totalCount,
    };
  },

  async findById(userId: string): Promise<AdminUserDto | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        banned: true,
        createdAt: true,
      },
    });

    return user ? toDto(user) : null;
  },

  async countByRole(role: UserRole): Promise<number> {
    return prisma.user.count({ where: { role } });
  },

  async deleteById(userId: string): Promise<void> {
    await prisma.user.delete({ where: { id: userId } });
  },
};
