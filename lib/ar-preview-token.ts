import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Stateless, signed tokens granting temporary access to a product's AR preview
 * page. Mirrors the unsubscribe token scheme in lib/email/unsubscribe.ts.
 */

export const AR_PREVIEW_TOKEN_TTL_SECONDS = 30 * 60;

function secret(): string {
  return process.env.AR_PREVIEW_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "augmenta-ar-preview";
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function sign(encodedPayload: string): string {
  return createHmac("sha256", secret()).update(encodedPayload).digest("base64url");
}

export function createArPreviewToken(productId: string, ttlSeconds: number = AR_PREVIEW_TOKEN_TTL_SECONDS): string {
  const payload = JSON.stringify({ pid: productId, exp: Math.floor(Date.now() / 1000) + ttlSeconds });
  const encodedPayload = b64url(payload);
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyArPreviewToken(token: string): string | null {
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

  if (
    !payload ||
    typeof payload !== "object" ||
    typeof (payload as Record<string, unknown>).pid !== "string" ||
    typeof (payload as Record<string, unknown>).exp !== "number"
  ) {
    return null;
  }

  const { pid, exp } = payload as { pid: string; exp: number };
  if (exp < Math.floor(Date.now() / 1000)) return null;

  return pid;
}
