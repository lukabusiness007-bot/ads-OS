import { NextResponse } from "next/server";
import { verifyModelAccessToken } from "@/lib/model-access-token";
import { createPresignedModelGetUrl } from "@/lib/storage/r2";
import { checkRateLimit, clientIpFromHeaders } from "@/lib/rate-limit";
import {
  createServiceRoleSupabaseClient,
  isSupabaseServiceRoleConfigured
} from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ token: string }> };

/** A redirect that must never be cached — the target is a ~5 min presigned URL. */
function noStoreRedirect(url: string): NextResponse {
  return NextResponse.redirect(url, {
    status: 302,
    headers: { "Cache-Control": "private, no-store, max-age=0" }
  });
}

/** Generic 404 — never confirm whether a given token/product exists. */
function notFound(): NextResponse {
  return NextResponse.json(
    { error: "not_found" },
    { status: 404, headers: { "Cache-Control": "private, no-store" } }
  );
}

/**
 * GET /api/model-access/<token>
 *
 * The delivery kill switch. Replaces permanent, hotlinkable model URLs: it
 * validates a short-lived access token, re-confirms the hosted page is still
 * published (which is ALSO the billing kill switch — nonpayment flips the page
 * to 'unpublished' and this endpoint immediately stops minting), binds the
 * request origin against our domains plus the page's embed allowlist, and only
 * then 302-redirects to a freshly minted ~5 minute R2 presigned URL.
 */
export async function GET(request: Request, { params }: RouteParams) {
  const { token } = await params;

  // Rate-limit per IP. Generous, since one page view can legitimately fetch GLB
  // + USDZ and re-fetch on AR tap, but low enough to blunt bulk scraping.
  const ip = clientIpFromHeaders(request.headers);
  const { allowed } = await checkRateLimit(`model-access:${ip}`, 240, 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Cache-Control": "private, no-store" } }
    );
  }

  const grant = verifyModelAccessToken(token);
  if (!grant) return notFound();

  if (!isSupabaseServiceRoleConfigured()) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  const admin = createServiceRoleSupabaseClient();

  // The hosted page must be published. We enforce the status filter explicitly
  // rather than trusting RLS, because the service-role client bypasses it.
  const { data: page } = await admin
    .from("hosted_pages")
    .select("allowed_embed_domains")
    .eq("product_id", grant.productId)
    .eq("status", "published")
    .maybeSingle();

  if (!page) return notFound();

  const allowedEmbedDomains = Array.isArray(page.allowed_embed_domains)
    ? (page.allowed_embed_domains as string[])
    : [];

  if (!isOriginAllowed(request.headers, allowedEmbedDomains)) {
    return NextResponse.json(
      { error: "forbidden" },
      { status: 403, headers: { "Cache-Control": "private, no-store" } }
    );
  }

  // Step 3 (view-limit enforcement) slots in here: a cached per-org counter that
  // degrades to poster + upgrade prompt once monthlyViewLimit is exceeded.

  const { data: asset } = await admin
    .from("model_assets")
    .select("glb_r2_key, usdz_r2_key")
    .eq("product_id", grant.productId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const key = grant.format === "usdz" ? asset?.usdz_r2_key : asset?.glb_r2_key;
  if (!key || typeof key !== "string") return notFound();

  let signedUrl: string;
  try {
    signedUrl = await createPresignedModelGetUrl(key);
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }

  return noStoreRedirect(signedUrl);
}

/**
 * Origin binding. If the request advertises an Origin (or Referer), it must be
 * one of our own origins or a domain the merchant explicitly allowlisted for
 * embedding this page. A *missing* origin is allowed: native iOS Quick Look and
 * some direct GLB fetches send none, and a determined attacker can omit it
 * anyway — so the achievable win is killing hotlinks from a known third-party
 * site, not making the token unforgeable.
 */
function isOriginAllowed(headers: Headers, allowedEmbedDomains: string[]): boolean {
  const requestOrigin = originFromHeaders(headers);
  if (!requestOrigin) return true;

  const allowed = new Set<string>();
  for (const value of [process.env.NEXT_PUBLIC_SITE_URL, ...ownDevOrigins()]) {
    const origin = toOrigin(value);
    if (origin) allowed.add(origin);
  }
  for (const domain of allowedEmbedDomains) {
    const origin = toOrigin(domain);
    if (origin) allowed.add(origin);
  }

  return allowed.has(requestOrigin);
}

function originFromHeaders(headers: Headers): string | null {
  const origin = headers.get("origin");
  if (origin && origin !== "null") {
    return toOrigin(origin);
  }
  const referer = headers.get("referer");
  return referer ? toOrigin(referer) : null;
}

function ownDevOrigins(): string[] {
  return process.env.NODE_ENV === "development"
    ? ["http://localhost:3000", "http://127.0.0.1:3000"]
    : [];
}

/** Normalize a URL or bare host into a scheme://host[:port] origin. */
function toOrigin(value: string | undefined | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return new URL(trimmed).origin;
  } catch {
    // Bare host (e.g. "shop.example.com") — assume https.
    try {
      return new URL(`https://${trimmed}`).origin;
    } catch {
      return null;
    }
  }
}
