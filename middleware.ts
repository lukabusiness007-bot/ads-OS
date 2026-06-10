import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isSupabaseConfigured, getSupabaseConfig } from "@/lib/supabase/config";
import { buildContentSecurityPolicy } from "@/lib/security/csp";

type EmbedSupabaseClient = ReturnType<typeof createServerClient>;

const PROTECTED_PREFIXES = [
  "/admin",
  "/dashboard",
  "/analytics",
  "/analytics-billing",
  "/approval",
  "/billing",
  "/create",
  "/expansion",
  "/launch",
  "/preview",
  "/published-links",
  "/status",
  "/upload",
];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
}

// Marketing pages default to Serbian. Visitors stay on the English routes
// only after explicitly choosing EN (the nav switcher sets the "lang" cookie).
const SR_DEFAULT_REDIRECTS: Record<string, string> = {
  "/": "/sr",
  "/pricing": "/sr/pricing",
};

// Only allow hosts that look like a bare domain or an https origin into the CSP
// header, so a malicious/garbled `allowed_embed_domains` value can't inject
// extra directives. Anything else is dropped.
const EMBED_HOST_PATTERN = /^[a-zA-Z0-9.-]+(:\d+)?$/;

function normalizeEmbedDomain(raw: string): string | null {
  const value = raw.trim();
  if (!value) {
    return null;
  }

  // Accept either `https://host[:port]` or a bare `host[:port]`; force https.
  let host = value;
  if (value.includes("://")) {
    try {
      const parsed = new URL(value);
      if (parsed.protocol !== "https:") {
        return null;
      }
      host = parsed.host;
    } catch {
      return null;
    }
  }

  return EMBED_HOST_PATTERN.test(host) ? `https://${host}` : null;
}

/**
 * Resolve the `frame-ancestors` directive for an `/embed/{merchant}/{product}`
 * request. Empty/missing allowlist = free-tier `*` (anyone can embed); a
 * populated allowlist = `'self'` plus the sanitized https origins. Built only
 * from the DB row, never from request input. Fails open to `*` on any error —
 * framing control is a paid feature, not the auth boundary.
 */
async function resolveEmbedFrameAncestors(
  supabase: EmbedSupabaseClient,
  pathname: string
): Promise<string> {
  const segments = pathname.split("/").filter(Boolean); // ["embed", merchant, product]
  const merchantSlug = segments[1] ? decodeURIComponent(segments[1]) : "";
  const productSlug = segments[2] ? decodeURIComponent(segments[2]) : "";

  if (!merchantSlug || !productSlug) {
    return "*";
  }

  try {
    const { data } = await supabase
      .from("hosted_pages")
      .select("allowed_embed_domains, organizations!inner(slug)")
      .eq("status", "published")
      .eq("slug", productSlug)
      .eq("organizations.slug", merchantSlug)
      .maybeSingle();

    const domains = (data?.allowed_embed_domains as string[] | null | undefined) ?? [];
    const allowed = domains
      .map(normalizeEmbedDomain)
      .filter((value): value is string => value !== null);

    if (allowed.length === 0) {
      return "*";
    }

    return ["'self'", ...allowed].join(" ");
  } catch {
    return "*";
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const srPath = SR_DEFAULT_REDIRECTS[pathname];
  if (srPath && request.cookies.get("lang")?.value !== "en") {
    return NextResponse.redirect(new URL(srPath, request.url));
  }

  const isEmbed = pathname.startsWith("/embed/");

  if (!isSupabaseConfigured()) {
    const response = NextResponse.next();
    if (isEmbed) {
      // No DB to read an allowlist from — fall back to free-tier framing so the
      // route still works, and keep its CSP self-consistent.
      response.headers.set("Content-Security-Policy", buildContentSecurityPolicy("*"));
      response.headers.delete("X-Frame-Options");
    }
    return response;
  }

  const { url, anonKey } = getSupabaseConfig();
  const response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Refreshes the session and validates the token — must await before redirecting
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isEmbed) {
    // Public route — never redirected. Set a per-page CSP whose frame-ancestors
    // come from the hosted page's allowlist. next.config deliberately omits the
    // frame headers for /embed so this one isn't AND-combined with a stricter one.
    const frameAncestors = await resolveEmbedFrameAncestors(supabase, pathname);
    response.headers.set("Content-Security-Policy", buildContentSecurityPolicy(frameAncestors));
    response.headers.delete("X-Frame-Options");
    return response;
  }

  if (!user && isProtectedPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on all paths except:
     * - _next/static  (static assets)
     * - _next/image   (image optimisation)
     * - favicon.ico / sitemap.xml / robots.txt
     * - common image extensions
     * - Public auth surface: /login, /auth/callback
     * - Public APIs: /api/public, /api/analytics, /api/auth, /api/diagnostics
     * - Public model delivery: /api/model-access (self-gating; needs no session)
     * - Hosted AR product pages: /hosted-page
     */
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|glb|usdz)$|login|auth/callback|hosted-page|api/public|api/analytics|api/auth|api/diagnostics|api/model-access).*)",
  ],
};
