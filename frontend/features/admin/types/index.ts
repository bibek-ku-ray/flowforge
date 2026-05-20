import type { TriggerKind, UserRole } from "@/generated/prisma/enums";

export type AdminUserDto = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  banned: boolean;
  createdAt: Date;
};

export type AdminUsersListDto = {
  items: AdminUserDto[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type TriggerSettingDto = {
  kind: TriggerKind;
  enabled: boolean;
  updatedAt: Date;
};

export type AdminSessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};
