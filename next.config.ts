import type { NextConfig } from "next";
import { buildContentSecurityPolicy } from "./lib/security/csp";

const nextConfig: NextConfig = {
  experimental: {
    proxyClientMaxBodySize: "96mb",
  },
  async headers() {
    return [
      {
        // Non-framing security headers — safe on every path, including /embed.
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
        ],
      },
      {
        // Framing lockdown for the whole app EXCEPT the public /embed/* route.
        // The negative lookahead keeps these off /embed so the route stays
        // framable cross-origin; middleware sets /embed's CSP (with a dynamic
        // frame-ancestors) at request time. Emitting a competing `frame-ancestors
        // 'self'` here would AND-combine with middleware's and block all embeds.
        source: "/((?!embed/).*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: buildContentSecurityPolicy("'self'") },
        ],
      },
      {
        source:
          "/:path(api|admin|analytics|analytics-billing|approval|ar-preview|billing|create|dashboard|embed|expansion|hosted-page|launch|preview|published-links|status|upload)(.*)",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
  devIndicators: false,
};

export default nextConfig;
