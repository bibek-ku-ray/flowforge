import { getQueryClient, trpc } from '@/trpc/server';
import {dehydrate, HydrationBoundary} from "@tanstack/react-query";
import Client from "@/components/client";

export default async function Home() {
  const queryClient = getQueryClient();
  // const users = await queryClient.fetchQuery(trpc.users.queryOptions());

  void queryClient.prefetchQuery(trpc.users.queryOptions());

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 p-6 font-sans dark:bg-black">

       <HydrationBoundary state={dehydrate(queryClient)}>
        <Client />
       </HydrationBoundary>

    </div>
  );
}
