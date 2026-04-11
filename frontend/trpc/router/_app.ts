import { baseProcedure, createTRPCRouter } from '../init';
import { prisma } from '@/lib/prisma';

export const appRouter = createTRPCRouter({
    users: baseProcedure.query(async () => {
        return prisma.user.findMany({});
    }),
});

// export type definition of API
export type AppRouter = typeof appRouter;