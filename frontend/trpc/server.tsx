import 'server-only';

import {createTRPCOptionsProxy} from '@trpc/tanstack-react-query';
import {headers} from 'next/headers';
import {cache} from 'react';
import { createTRPCContext, getQueryClient, createCallerFactory } from './init';
import {appRouter} from "@/trpc/router/_app";

export { getQueryClient };

// React Query proxy for client-side use
export const trpc = createTRPCOptionsProxy({
  ctx: async () =>
    createTRPCContext({
      headers: await headers(),
    }),
  router: appRouter,
  queryClient: getQueryClient,
});

// Server-side caller for RSC
const getCaller = cache(async () => {
  const createCaller = createCallerFactory(appRouter);
  return createCaller(
    await createTRPCContext({ headers: await headers() })
  );
});

export const caller = {
  async getUsers() {
    const callerInstance = await getCaller();
    return callerInstance.getUsers();
  },
};
