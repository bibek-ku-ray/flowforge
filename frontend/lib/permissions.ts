import { UserRole } from "@/generated/prisma/enums";

export const ADMIN_ROLE = UserRole.ADMIN;
export const DEFAULT_USER_ROLE = UserRole.USER;

export const ADMIN_ROLES = [ADMIN_ROLE] as const;

export function isAdminRole(role: string | null | undefined): boolean {
  return role === UserRole.ADMIN || role === "ADMIN";
}

export function parseUserRole(role: string | null | undefined): UserRole {
  if (role === UserRole.ADMIN || role === "ADMIN") {
    return UserRole.ADMIN;
  }
  return UserRole.USER;
}
