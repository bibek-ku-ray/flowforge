import { createTRPCRouter, protectedProcedure, premiumProcedure } from '../init';
import { prisma } from '@/lib/prisma';
import { inngest } from "@/inngest/client";
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

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
  }),
  testAi: premiumProcedure.mutation(async () => {
    const {text} = await generateText({
      model: openai('gpt-5-nano'),
      prompt: 'How many time MI and CSK have won IPL',
    })
    return {
      success: true,
      message: text
    }
  }),
  testAiInngest: protectedProcedure.mutation(async () => {
    await inngest.send({
      name: "execute/ai",

    })
    return { success: true, message: "AI execution queued" }
  })

});

export type AppRouter = typeof appRouter;