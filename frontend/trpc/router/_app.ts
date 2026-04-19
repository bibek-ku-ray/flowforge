import { createTRPCRouter, protectedProcedure } from '../init';
import { prisma } from '@/lib/prisma';
import { inngest } from "@/inngest/client";

export const appRouter = createTRPCRouter({
  getWorkflows: protectedProcedure.query(({ ctx }) => {
      return prisma.workflow.findMany();
    }
  ),
  createWorkflow: protectedProcedure.mutation( async () => {

    await  inngest.send({
      name: "test/helloworld",
      data: {
        email: "hello@world.cmo"
      }
    })

    return {
      success: true,
      message: "Job queued"
    }
  })
});

export type AppRouter = typeof appRouter;