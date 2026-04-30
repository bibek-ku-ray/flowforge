interface PageProp {
  params: Promise<{
    workflowId: string;
  }>;
}

const Page = async ({ params }: PageProp) => {
  const { workflowId } = await params;

  return <div>Editor workflowId: {workflowId}</div>;
};

export default Page;
