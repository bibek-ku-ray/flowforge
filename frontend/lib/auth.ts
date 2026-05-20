import { PrismaClient } from "@/generated/prisma/client";
import "@/lib/suppress-pg-warning";
import { PrismaPg } from "@prisma/adapter-pg";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins/admin";
import { defaultRoles } from "better-auth/plugins/admin/access";
import { nextCookies } from "better-auth/next-js";
import { ADMIN_ROLE, DEFAULT_USER_ROLE } from "@/lib/permissions";
import {
  polar,
  checkout,
  portal,
  usage,
} from "@polar-sh/better-auth";
import {
  getAllowedHosts,
  getAppUrlFallback,
  getPolarSuccessUrl,
  getTrustedOrigins,
} from "./app-url";
import { polarClient } from "./polar";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

export const auth = betterAuth({
  baseURL: {
    allowedHosts: getAllowedHosts(),
    fallback: getAppUrlFallback(),
    protocol: "auto",
  },
  trustedOrigins: getTrustedOrigins(),
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  plugins: [
    admin({
      defaultRole: DEFAULT_USER_ROLE,
      adminRoles: [ADMIN_ROLE],
      roles: {
        [DEFAULT_USER_ROLE]: defaultRoles.user,
        [ADMIN_ROLE]: defaultRoles.admin,
      },
    }),
    nextCookies(),
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            {
              productId: "b9f135a2-99b8-43d0-a0f5-d9bb5a7bf44d", // ID of Product from Polar Dashboard
              slug: "pro", // Custom slug for easy reference in Checkout URL, e.g. /checkout/pro
            },
          ],
          successUrl: getPolarSuccessUrl(),
          authenticatedUsersOnly: true,
        }),
        portal(),
        usage(),
      ],
    }),
  ],
});
