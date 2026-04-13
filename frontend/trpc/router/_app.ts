import {createTRPCRouter, protectedProcedure} from '../init';
import {prisma} from '@/lib/prisma';

export const appRouter = createTRPCRouter({
  getUsers: protectedProcedure.query(({ctx}) =>
    prisma.user.findMany({
      where: {
        id: ctx.auth.user.id,
      },
    })
  ),
});

export type AppRouter = typeof appRouter;