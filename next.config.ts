import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    proxyClientMaxBodySize: "96mb",
  },
  devIndicators: false,
};

export default nextConfig;
