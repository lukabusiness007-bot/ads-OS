import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Stateless, signed tokens that grant temporary access to a product's private
 * GLB/USDZ model via the /api/model-access/<token> signing endpoint.
 *
 * The token is an *access grant*, not a file URL: the endpoint validates it,
 * confirms the hosted page is still published, binds the request origin, and
 * only then mints a fresh ~5 minute R2 presigned URL. So a leaked token is
 * useless once the page is unpublished or the token's own TTL lapses, and it
 * never exposes a permanent, hotlinkable file URL.
 *
 * Mirrors the AR-preview token scheme in lib/ar-preview-token.ts.
 */

export const MODEL_ACCESS_TOKEN_TTL_SECONDS = 30 * 60;

export type ModelFormat = "glb" | "usdz";

export type ModelAccessGrant = {
  productId: string;
  format: ModelFormat;
};

function secret(): string {
  return (
    process.env.MODEL_ACCESS_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "augmenta-model-access"
  );
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function sign(encodedPayload: string): string {
  return createHmac("sha256", secret()).update(encodedPayload).digest("base64url");
}

export function createModelAccessToken(
  productId: string,
  format: ModelFormat,
  ttlSeconds: number = MODEL_ACCESS_TOKEN_TTL_SECONDS
): string {
  const payload = JSON.stringify({
    pid: productId,
    fmt: format,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds
  });
  const encodedPayload = b64url(payload);
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyModelAccessToken(token: string): ModelAccessGrant | null {
  const [encodedPayload, sig] = token.split(".");
  if (!encodedPayload || !sig) return null;

  const expected = sign(encodedPayload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (!payload || typeof payload !== "object") return null;
  const { pid, fmt, exp } = payload as Record<string, unknown>;

  if (typeof pid !== "string" || typeof exp !== "number") return null;
  if (fmt !== "glb" && fmt !== "usdz") return null;
  if (exp < Math.floor(Date.now() / 1000)) return null;

  return { productId: pid, format: fmt };
}

/** Build the relative access-endpoint path that stands in for a raw model URL. */
export function modelAccessPath(productId: string, format: ModelFormat): string {
  return `/api/model-access/${createModelAccessToken(productId, format)}`;
}
