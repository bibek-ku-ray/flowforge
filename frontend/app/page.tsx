"use client"

import { requireAuth } from "@/lib/auth-utils";
import { caller } from "@/trpc/server";
import SignoutButton from "@/features/auth/components/signout-button";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

export default function Home() {
  // await requireAuth();
  //
  // const data = await caller.getUsers();

  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const { data } = useQuery(trpc.getWorkflows.queryOptions())

  const mutation = useMutation(trpc.createWorkflow.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries(trpc.getWorkflows.queryOptions())
    }
  }))

  return (
    <div>
      <p>workflow</p>
      <pre className="p-4">{ JSON.stringify(data, null, 2) }</pre>

      {/* Create workflow*/ }

      <Button disabled={ mutation.isPending } variant={ "secondary" } onClick={ () => mutation.mutate() }>Create
        workflow</Button>
      <SignoutButton/>
    </div>
  );
}
