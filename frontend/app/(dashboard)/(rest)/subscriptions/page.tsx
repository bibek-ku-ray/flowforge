import { SubscriptionsView } from "@/features/subscriptions/components/subscriptions-view";
import { requireAuth } from "@/lib/auth-utils";

const Page = async () => {
  await requireAuth();

  return (
    <div className="p-4 md:px-10 md:py-6 h-full">
      <SubscriptionsView />
    </div>
  );
};

export default Page;
