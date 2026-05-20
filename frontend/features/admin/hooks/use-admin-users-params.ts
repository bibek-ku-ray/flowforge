"use client";

import { PAGINATION } from "@/config/constants";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";

export const useAdminUsersParams = () => {
  return useQueryStates({
    page: parseAsInteger.withDefault(PAGINATION.DEFAULT_PAGE),
    pageSize: parseAsInteger.withDefault(PAGINATION.DEFAULT_PAGE_SIZE),
    search: parseAsString.withDefault(""),
  });
};
