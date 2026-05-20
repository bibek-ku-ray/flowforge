import { createLoader } from "nuqs/server";
import { adminUsersParams } from "@/features/admin/params";

export const adminUsersParamsLoader = createLoader(adminUsersParams);
