import {requireAuth} from "@/lib/auth-utils";
import {caller} from "@/trpc/server";

export default async function Home() {
  await requireAuth();

  const data = await caller.getUsers();

  return (
    <div>
      <pre className="p-4">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
