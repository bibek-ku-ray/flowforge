import { createTRPCRouter, protectedProcedure } from '../init';
import { prisma } from '@/lib/prisma';

export const appRouter = createTRPCRouter({
  getWorkflows: protectedProcedure.query(({ ctx }) => {
      return prisma.workflow.findMany();
    }
  ),
  createWorkflow: protectedProcedure.mutation(() => {
    return prisma.workflow.create({
      data: {
        name: "test-workflow"
      }
    })
  })
});

export type AppRouter = typeof appRouter;