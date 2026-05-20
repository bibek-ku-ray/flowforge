import { describe, expect, it, vi, beforeEach } from "vitest";
import { UserRole } from "@/generated/prisma/enums";
import { TRPCError } from "@trpc/server";

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      setRole: vi.fn(),
      removeUser: vi.fn(),
    },
  },
}));

vi.mock("@/features/admin/repositories/admin-user.repository", () => ({
  adminUserRepository: {
    findMany: vi.fn(),
    findById: vi.fn(),
    countByRole: vi.fn(),
    deleteById: vi.fn(),
  },
}));

import { adminUserService } from "@/features/admin/services/admin-user.service";
import { adminUserRepository } from "@/features/admin/repositories/admin-user.repository";

describe("adminUserService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks deleting the last administrator", async () => {
    vi.mocked(adminUserRepository.findById).mockResolvedValue({
      id: "admin-1",
      email: "ops@flowforge.dev",
      name: "Ops",
      role: UserRole.ADMIN,
      banned: false,
      createdAt: new Date(),
    });
    vi.mocked(adminUserRepository.countByRole).mockResolvedValue(1);

    await expect(
      adminUserService.deleteUser("actor-1", { userId: "admin-1" }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Cannot remove the last administrator",
    } satisfies Partial<TRPCError>);
  });

  it("blocks self-demotion", async () => {
    vi.mocked(adminUserRepository.findById).mockResolvedValue({
      id: "actor-1",
      email: "ops@flowforge.dev",
      name: "Ops",
      role: UserRole.ADMIN,
      banned: false,
      createdAt: new Date(),
    });

    await expect(
      adminUserService.setUserRole("actor-1", {
        userId: "actor-1",
        role: UserRole.USER,
      }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "You cannot remove your own administrator access",
    } satisfies Partial<TRPCError>);
  });
});
