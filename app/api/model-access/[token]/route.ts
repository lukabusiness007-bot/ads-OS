import { NextResponse } from "next/server";
import { verifyModelAccessToken } from "@/lib/model-access-token";
import { createPresignedModelGetUrl } from "@/lib/storage/r2";
import { checkRateLimit, clientIpFromHeaders } from "@/lib/rate-limit";
import { checkViewQuota } from "@/lib/billing/view-quota";
import { isOrgSuspended, type SubscriptionBillingRow } from "@/lib/billing/suspension";
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
    .select(
      "organization_id, allowed_embed_domains, organizations(plan_key, subscriptions(status, grace_period_ends_at))"
    )
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

  const organizationId =
    typeof page.organization_id === "string" ? page.organization_id : null;

  if (organizationId) {
    const org = Array.isArray(page.organizations)
      ? page.organizations[0]
      : page.organizations;
    const planKey = (org as { plan_key?: string | null } | null)?.plan_key ?? null;

    // Billing kill switch (Plan 2, step 4). When the org's payment has failed and
    // the grace window has elapsed (or the subscription is unpaid/canceled), stop
    // minting: the merchant's models — page and embeds — go dark until they pay.
    // Restores instantly once invoice.paid clears the grace clock. Fails OPEN:
    // see lib/billing/suspension.ts.
    const subscriptions = (org as { subscriptions?: SubscriptionBillingRow[] | null } | null)?.subscriptions;
    if (Array.isArray(subscriptions) && isOrgSuspended(subscriptions)) {
      return NextResponse.json(
        { error: "billing_suspended" },
        { status: 402, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    // View-limit enforcement (Plan 2, step 3). Once the org has spent its plan's
    // monthlyViewLimit for the calendar month, stop minting signed URLs: the viewer
    // keeps its poster and the merchant is nudged to upgrade. Backed by a cached
    // per-org counter (lib/billing/view-quota.ts) so this stays cheap per request,
    // and fails OPEN — a broken quota store must never dark a paying merchant.
    const quota = await checkViewQuota(organizationId, planKey);
    if (!quota.allowed) {
      return NextResponse.json(
        { error: "quota_exceeded" },
        { status: 402, headers: { "Cache-Control": "private, no-store" } }
      );
    }
  }

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
