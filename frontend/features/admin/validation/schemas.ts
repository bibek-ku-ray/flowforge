import { TriggerKind, UserRole } from "@/generated/prisma/enums";
import { PAGINATION } from "@/config/constants";
import z from "zod";

export const adminUsersListInputSchema = z.object({
  page: z.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
  pageSize: z
    .number()
    .int()
    .min(PAGINATION.MIN_PAGE_SIZE)
    .max(PAGINATION.MAX_PAGE_SIZE)
    .default(PAGINATION.DEFAULT_PAGE_SIZE),
  search: z.string().trim().default(""),
});

export const adminUserIdSchema = z.object({
  userId: z.string().min(1),
});

export const adminSetRoleInputSchema = z.object({
  userId: z.string().min(1),
  role: z.nativeEnum(UserRole),
});

export const adminDeleteUserInputSchema = z.object({
  userId: z.string().min(1),
});

export const adminUpdateTriggerInputSchema = z.object({
  kind: z.nativeEnum(TriggerKind),
  enabled: z.boolean(),
});

export const adminUpdateTriggersInputSchema = z.object({
  settings: z.array(adminUpdateTriggerInputSchema).min(1),
});
