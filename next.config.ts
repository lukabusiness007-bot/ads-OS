import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const CSP = [
  "default-src 'self'",
  // 'wasm-unsafe-eval' is required by @google/model-viewer's WebAssembly engine
  // 'unsafe-eval' is required by React in development mode only
  // blob: lets model-viewer spawn its Draco/KTX2 texture-decoder workers
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob:${isDev ? " 'unsafe-eval'" : ""}`,
  // model-viewer decodes KTX2/Basis-compressed textures in a blob: web worker.
  // Without an explicit worker-src this falls back to default-src 'self', which
  // blocks the worker and leaves the mesh untextured (renders all white).
  "worker-src 'self' blob:",
  // child-src fallback for older browsers that don't honor worker-src
  "child-src 'self' blob:",
  // fonts.googleapis.com is loaded by model-viewer's AR UI
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  // https://*.r2.dev  — public R2 bucket for GLB/USDZ/poster assets
  // wss://*.supabase.co — Supabase Realtime WebSocket
  "connect-src 'self' https://*.supabase.co https://*.supabase.in https://accounts.google.com https://*.r2.dev wss://*.supabase.co",
  "frame-src 'self' https://accounts.google.com",
  // fonts.gstatic.com is loaded by model-viewer's AR UI
  "font-src 'self' data: https://fonts.gstatic.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join("; ");

const nextConfig: NextConfig = {
  experimental: {
    proxyClientMaxBodySize: "96mb",
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
      {
        source:
          "/:path(api|admin|analytics|analytics-billing|approval|billing|create|dashboard|expansion|hosted-page|launch|preview|published-links|status|upload)(.*)",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
  devIndicators: false,
};

export default nextConfig;
