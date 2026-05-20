import { requireAuth } from "@/lib/auth-utils";

const Page = async () => {
  await requireAuth();

  return <div>Subscriptions</div>;
};

export default Page;
