// Serverless-safe, DB-backed fixed-window rate limiter (security review #7).
// Backed by the `rate_limit_hits` table + `bump_rate_limit()` function created in
// supabase/migrations/008_rate_limit.sql.
//
// Fails OPEN: if the service-role store isn't configured or the limiter query
// errors, requests are allowed through — a broken limiter must never take down
// legitimate traffic. The limiter is defense-in-depth, not the auth boundary.

import { createServiceRoleSupabaseClient, isSupabaseServiceRoleConfigured } from "@/lib/supabase/server";

export type RateLimitResult = { allowed: boolean; count: number };

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Increment the counter for `bucket` in the current fixed window and report
 * whether the caller is still within `max` requests per `windowSeconds`.
 */
export async function checkRateLimit(
  bucket: string,
  max: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  if (!isSupabaseServiceRoleConfigured()) {
    return { allowed: true, count: 0 };
  }

  const windowMs = windowSeconds * 1000;
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs).toISOString();

  try {
    const admin = createServiceRoleSupabaseClient();
    const { data, error } = await admin.rpc("bump_rate_limit", {
      p_bucket: bucket,
      p_window_start: windowStart
    });

    if (error) {
      return { allowed: true, count: 0 };
    }

    const count = typeof data === "number" ? data : 0;
    return { allowed: count <= max, count };
  } catch {
    return { allowed: true, count: 0 };
  }
}
