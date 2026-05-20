import "server-only";

import { TRPCError } from "@trpc/server";
import { headers } from "next/headers";
import { UserRole } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { ADMIN_ROLE, isAdminRole } from "@/lib/permissions";
import { logger } from "@/lib/logger";
import { adminUserRepository } from "@/features/admin/repositories/admin-user.repository";
import type { AdminUsersListDto } from "@/features/admin/types";
import type {
  adminDeleteUserInputSchema,
  adminSetRoleInputSchema,
  adminUsersListInputSchema,
} from "@/features/admin/validation/schemas";
import type z from "zod";

type ListInput = z.infer<typeof adminUsersListInputSchema>;
type SetRoleInput = z.infer<typeof adminSetRoleInputSchema>;
type DeleteInput = z.infer<typeof adminDeleteUserInputSchema>;

async function getRequestHeaders() {
  return await headers();
}

async function assertAtLeastOneAdminRemains(excludingUserId?: string) {
  const adminCount = await adminUserRepository.countByRole(ADMIN_ROLE);

  if (excludingUserId) {
    const target = await adminUserRepository.findById(excludingUserId);
    if (target && isAdminRole(target.role) && adminCount <= 1) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot remove the last administrator",
      });
    }
    return;
  }

  if (adminCount <= 1) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Cannot remove the last administrator",
    });
  }
}

export const adminUserService = {
  async listUsers(input: ListInput): Promise<AdminUsersListDto> {
    const { page, pageSize, search } = input;
    const { items, totalCount } = await adminUserRepository.findMany({
      page,
      pageSize,
      search,
    });

    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    return {
      items,
      page,
      pageSize,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  },

  async setUserRole(
    actorId: string,
    input: SetRoleInput,
  ): Promise<{ success: true }> {
    const target = await adminUserRepository.findById(input.userId);

    if (!target) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    if (actorId === input.userId && input.role !== UserRole.ADMIN) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "You cannot remove your own administrator access",
      });
    }

    const demotingAdmin =
      isAdminRole(target.role) && input.role !== UserRole.ADMIN;

    if (demotingAdmin) {
      await assertAtLeastOneAdminRemains(input.userId);
    }

    await auth.api.setRole({
      body: {
        userId: input.userId,
        role: input.role,
      },
      headers: await getRequestHeaders(),
    });

    logger.info("admin.user.role_updated", {
      actorId,
      userId: input.userId,
      role: input.role,
    });

    return { success: true };
  },

  async deleteUser(
    actorId: string,
    input: DeleteInput,
  ): Promise<{ success: true }> {
    if (actorId === input.userId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "You cannot delete your own account from the admin panel",
      });
    }

    const target = await adminUserRepository.findById(input.userId);

    if (!target) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    if (isAdminRole(target.role)) {
      await assertAtLeastOneAdminRemains(input.userId);
    }

    await auth.api.removeUser({
      body: { userId: input.userId },
      headers: await getRequestHeaders(),
    });

    logger.info("admin.user.deleted", {
      actorId,
      userId: input.userId,
    });

    return { success: true };
  },
};
