import { NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createServiceRoleSupabaseClient,
  isSupabaseServiceRoleConfigured
} from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { checkRateLimit, clientIpFromHeaders } from "@/lib/rate-limit";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const loginSchema = z.object({
  username: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(256)
});

// Server-side username login. The username -> email mapping is resolved here with
// the service role and the email is NEVER returned to the client, so this is not a
// username->email enumeration oracle. Credentials are verified server-side and the
// Supabase session cookie is set on the response; the client just redirects.
export async function POST(request: Request) {
  if (!isSupabaseConfigured() || !isSupabaseServiceRoleConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  // Throttle by IP to blunt credential stuffing / username probing.
  const ip = clientIpFromHeaders(request.headers);
  const { allowed } = await checkRateLimit(`login-username:${ip}`, 10, 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many sign-in attempts. Please wait a minute and try again." },
      { status: 429 }
    );
  }

  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 400 });
  }
  const { username, password } = parsed.data;

  // Resolve username -> email server-side. The email stays on the server.
  const admin = createServiceRoleSupabaseClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("email")
    .eq("username", username)
    .single();

  const email = profile?.email;

  // Generic failure for unknown username — no enumeration signal vs. a wrong password.
  if (!email) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  // Verify credentials on a cookie-bound server client so the session is set.
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  const { data: adminFlag } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", data.user.id)
    .single();

  return NextResponse.json({ ok: true, isAdmin: Boolean(adminFlag?.is_platform_admin) });
}
