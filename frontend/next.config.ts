import type { NextConfig } from "next";
import { getAllowedDevOrigins } from "./lib/app-url";

const nextConfig: NextConfig = {
  /* config options here */

  devIndicators: false,

  async redirects() {
    return [
      {
        source: "/",
        destination: "/workflows",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/workflows/google-form",
        destination: "/api/webhooks/google-form",
      },
    ];
  },
  allowedDevOrigins: getAllowedDevOrigins(),
};

export default nextConfig;
