"use client";

import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";

const Page = () => {
  const trpc = useTRPC();
  const testAi = useMutation(trpc.testAi.mutationOptions());

  const testAiInngest = useMutation(trpc.testAiInngest.mutationOptions());

  return (
    <div>
      Page.
      <Button onClick={() => testAi.mutate()}>Test AI</Button>
      <p>{JSON.stringify(testAi.data, null, 2)}</p>
      <Button onClick={() => testAiInngest.mutate()}>Test AI Inngest</Button>
    </div>
  );
};

export default Page;
