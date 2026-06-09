import { createHmac, timingSafeEqual } from "node:crypto";
import { getSiteUrl } from "./client";

/**
 * Stateless, signed unsubscribe tokens. Encodes the email + an HMAC so the
 * unsubscribe link can't be forged for arbitrary addresses.
 */

function secret(): string {
  return process.env.UNSUBSCRIBE_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "augmenta-unsubscribe";
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function sign(email: string): string {
  return createHmac("sha256", secret()).update(email).digest("base64url");
}

export function createUnsubscribeToken(email: string): string {
  return `${b64url(email)}.${sign(email)}`;
}

export function getUnsubscribeUrl(email: string): string {
  return `${getSiteUrl()}/unsubscribe?token=${encodeURIComponent(createUnsubscribeToken(email))}`;
}

export function verifyUnsubscribeToken(token: string): string | null {
  const [encodedEmail, sig] = token.split(".");
  if (!encodedEmail || !sig) return null;

  let email: string;
  try {
    email = Buffer.from(encodedEmail, "base64url").toString("utf8");
  } catch {
    return null;
  }

  const expected = sign(email);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  return email;
}
