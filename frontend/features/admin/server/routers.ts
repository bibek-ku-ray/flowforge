import { createTRPCRouter, adminProcedure } from "@/trpc/init";
import { adminUserService } from "@/features/admin/services/admin-user.service";
import { triggerSettingsService } from "@/features/admin/services/trigger-settings.service";
import {
  adminDeleteUserInputSchema,
  adminSetRoleInputSchema,
  adminUpdateTriggersInputSchema,
  adminUsersListInputSchema,
} from "@/features/admin/validation/schemas";

export const adminRouter = createTRPCRouter({
  users: createTRPCRouter({
    list: adminProcedure
      .input(adminUsersListInputSchema)
      .query(({ input }) => adminUserService.listUsers(input)),

    setRole: adminProcedure
      .input(adminSetRoleInputSchema)
      .mutation(({ ctx, input }) =>
        adminUserService.setUserRole(ctx.auth.user.id, input),
      ),

    delete: adminProcedure
      .input(adminDeleteUserInputSchema)
      .mutation(({ ctx, input }) =>
        adminUserService.deleteUser(ctx.auth.user.id, input),
      ),
  }),

  triggers: createTRPCRouter({
    list: adminProcedure.query(() => triggerSettingsService.getSettings()),

    update: adminProcedure
      .input(adminUpdateTriggersInputSchema)
      .mutation(({ ctx, input }) =>
        triggerSettingsService.updateSettings(ctx.auth.user.id, input),
      ),
  }),
});
