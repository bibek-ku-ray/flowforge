import { requireAuth } from "@/lib/auth-utils";

const Page = async () => {
  await requireAuth();

  return <div>Cr Page</div>;
};

export default Page;
