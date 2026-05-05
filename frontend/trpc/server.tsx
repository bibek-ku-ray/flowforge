import "server-only";

import {
  createTRPCOptionsProxy,
  TRPCQueryOptions,
} from "@trpc/tanstack-react-query";
import { headers } from "next/headers";
import React, { cache } from "react";
import { createTRPCContext, getQueryClient, createCallerFactory } from "./init";
import { appRouter } from "@/trpc/router/_app";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

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
  return createCaller(await createTRPCContext({ headers: await headers() }));
});

export const caller = {
  async getUsers() {
    const callerInstance = await getCaller();
    return callerInstance.getUsers();
  },
};

export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {props.children}
    </HydrationBoundary>
  );
}

export function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(
  queryOptions: T,
) {
  const queryClient = getQueryClient();
  if (queryOptions.queryKey[1]?.type === "infinite") {
    return queryClient.prefetchInfiniteQuery(queryOptions as any);
  } else {
    return queryClient.prefetchQuery(queryOptions);
  }
}
