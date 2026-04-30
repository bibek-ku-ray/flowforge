import { requireAuth } from "@/lib/auth-utils";

interface PageProp {
  params: Promise<{
    credentialId: string;
  }>;
}

const page = async ({ params }: PageProp) => {
  await requireAuth();

  const { credentialId } = await params;

  return <div>Cr ID: {credentialId}</div>;
};

export default page;
