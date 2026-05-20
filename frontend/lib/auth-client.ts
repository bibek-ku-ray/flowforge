"use client";

import { getAuthApiBaseUrl } from "@/lib/app-url";
import { polarClient } from "@polar-sh/better-auth";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Must be absolute (better-auth rejects "/api/auth"). Same-origin in the browser.
  baseURL: getAuthApiBaseUrl(),
  plugins: [polarClient()],
});
