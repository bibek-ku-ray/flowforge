"use client";

import { getAuthApiBaseUrl } from "@/lib/app-url";
import { polarClient } from "@polar-sh/better-auth";
import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Must be absolute (better-auth rejects "/api/auth"). Same-origin in the browser.
  baseURL: getAuthApiBaseUrl(),
  plugins: [adminClient(), polarClient()],
});
