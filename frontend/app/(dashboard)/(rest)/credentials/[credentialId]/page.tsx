interface PageProp {
  params: Promise<{
    credentialId: string;
  }>;
}

const page = async ({ params }: PageProp) => {
  const { credentialId } = await params;

  return <div>Cr ID: {credentialId}</div>;
};

export default page;
