import "server-only";

import {
  createTRPCOptionsProxy,
  TRPCQueryOptions,
} from "@trpc/tanstack-react-query";
import { headers } from "next/headers";
import React from "react";
import { createTRPCContext, getQueryClient } from "./init";
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

export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {props.children}
    </HydrationBoundary>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- tRPC query options require loose typing for prefetch helper
export function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(
  queryOptions: T,
) {
  const queryClient = getQueryClient();
  if (queryOptions.queryKey[1]?.type === "infinite") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- infinite query prefetch options are not fully typed
    return queryClient.prefetchInfiniteQuery(queryOptions as any);
  } else {
    return queryClient.prefetchQuery(queryOptions);
  }
}
