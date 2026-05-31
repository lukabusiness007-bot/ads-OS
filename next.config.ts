import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    proxyClientMaxBodySize: "96mb",
  },
  async headers() {
    return [
      {
        source:
          "/:path(api|admin|analytics|analytics-billing|approval|billing|create|dashboard|expansion|hosted-page|launch|preview|published-links|status|upload)(.*)",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow"
          }
        ]
      }
    ];
  },
  devIndicators: false,
};

export default nextConfig;
