import { requireAuth } from "@/lib/auth-utils";

interface PageProp {
  params: Promise<{
    workflowId: string;
  }>;
}

const page = async ({ params }: PageProp) => {
  await requireAuth();

  const { workflowId } = await params;

  return <div>Workflow Id: {workflowId}</div>;
};

export default page;
