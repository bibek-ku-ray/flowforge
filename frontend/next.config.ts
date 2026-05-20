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
      {
        source: "/api/workflows/google-form",
        destination: "/api/webhooks/google-form",
        permanent: false,
      },
    ];
  },
  allowedDevOrigins: getAllowedDevOrigins(),
};

export default nextConfig;
