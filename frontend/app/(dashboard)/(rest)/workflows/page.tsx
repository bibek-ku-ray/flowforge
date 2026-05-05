import {
  WorkflowContainer,
  WorkflowList,
} from "@/features/workflows/components/workflows";
import { workflowsParamsLoader } from "@/features/workflows/server/params-loader";
import { prefetchWorkflow } from "@/features/workflows/server/prefetch";
import { requireAuth } from "@/lib/auth-utils";
import { HydrateClient } from "@/trpc/server";
import type { SearchParams } from "nuqs/server";


type Props = {
  searchParams: Promise<SearchParams>;
};

const Page = async ({ searchParams }: Props) => {
  await requireAuth();

  const params = await workflowsParamsLoader(searchParams);

  await prefetchWorkflow(params);

  return (
    <WorkflowContainer>
      <HydrateClient>
        <WorkflowList />
      </HydrateClient>
    </WorkflowContainer>
  );
};

export default Page;
