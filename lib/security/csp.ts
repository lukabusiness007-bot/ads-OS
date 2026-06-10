// Single source of truth for the app's Content-Security-Policy.
//
// The whole CSP is identical across the app EXCEPT for `frame-ancestors`, which
// controls who may iframe a given response:
//   - The rest of the app is locked to `'self'` (emitted statically in
//     next.config.ts for every path except `/embed/*`).
//   - The public `/embed/*` route is framable cross-origin; middleware computes
//     its `frame-ancestors` per hosted page from `allowed_embed_domains` and
//     sets the CSP at request time.
//
// Keeping one builder here guarantees the embed route inherits every other
// directive (script/worker/connect/img/...) the 3D viewer needs — only the
// framing rule differs.

function getOrigin(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

/**
 * Build the full CSP header value.
 *
 * @param frameAncestors the value for the `frame-ancestors` directive, e.g.
 *   `'self'`, `*`, or `'self' https://shop.example.com`. Callers MUST sanitize
 *   any host they interpolate (see middleware) — this function trusts its input.
 */
export function buildContentSecurityPolicy(frameAncestors: string): string {
  const isDev = process.env.NODE_ENV === "development";

  const connectSrc = [
    "'self'",
    // three.js GLTFLoader fetches embedded GLB textures via blob: object URLs.
    "blob:",
    "https://*.supabase.co",
    "https://*.supabase.in",
    "https://accounts.google.com",
    // Public R2 bucket domains for GLB/USDZ/poster assets.
    "https://*.r2.dev",
    // R2 S3 API endpoint for presigned uploads.
    "https://*.r2.cloudflarestorage.com",
    getOrigin(process.env.R2_PUBLIC_BASE_URL),
    "wss://*.supabase.co",
  ]
    .filter((source): source is string => Boolean(source))
    .filter((source, index, sources) => sources.indexOf(source) === index)
    .join(" ");

  return [
    "default-src 'self'",
    // 'wasm-unsafe-eval' is required by @google/model-viewer's WebAssembly engine.
    // 'unsafe-eval' is required by React in development mode only.
    // blob: lets model-viewer spawn its Draco/KTX2 texture-decoder workers.
    `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob:${isDev ? " 'unsafe-eval'" : ""}`,
    // model-viewer decodes KTX2/Basis-compressed textures in a blob: web worker.
    "worker-src 'self' blob:",
    // child-src fallback for older browsers that don't honor worker-src
    "child-src 'self' blob:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    `connect-src ${connectSrc}`,
    "frame-src 'self' https://accounts.google.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    `frame-ancestors ${frameAncestors}`,
  ].join("; ");
}
