import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isSupabaseConfigured, getSupabaseConfig } from "@/lib/supabase/config";

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

export async function middleware(request: NextRequest) {
  const srPath = SR_DEFAULT_REDIRECTS[request.nextUrl.pathname];
  if (srPath && request.cookies.get("lang")?.value !== "en") {
    return NextResponse.redirect(new URL(srPath, request.url));
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.next();
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

  if (!user && isProtectedPath(request.nextUrl.pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
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
     * - Hosted AR product pages: /hosted-page
     */
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|glb|usdz)$|login|auth/callback|hosted-page|api/public|api/analytics|api/auth|api/diagnostics).*)",
  ],
};
