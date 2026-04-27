
interface PageProp {
  params: Promise<{
    workflowId: string;
  }>
}

const page = async ({params}: PageProp) => {

  const {workflowId} = await params

  return (
    <div>Workflow Id: {workflowId}</div>
  )
}

export default page