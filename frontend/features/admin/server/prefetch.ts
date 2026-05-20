import { prefetch, trpc } from "@/trpc/server";
import { inferInput } from "@trpc/tanstack-react-query";

type UsersInput = inferInput<typeof trpc.admin.users.list>;

export const prefetchAdminUsers = (params: UsersInput) => {
  return prefetch(trpc.admin.users.list.queryOptions(params));
};

export const prefetchTriggerSettings = () => {
  return prefetch(trpc.admin.triggers.list.queryOptions());
};
