"use client";

import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";

const Page = () => {
  const trpc = useTRPC();
  const testAi = useMutation(trpc.testAi.mutationOptions());

  return (
    <div>
      Page.
      <Button onClick={() => testAi.mutate()}>Test AI</Button>
      <p>{JSON.stringify(testAi.data, null, 2)}</p>
    </div>
  );
};

export default Page;
