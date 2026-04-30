import { requireAuth } from "@/lib/auth-utils";

const Page = async () => {
  await requireAuth();

  return <main>Workflow</main>;
};

export default Page;
 