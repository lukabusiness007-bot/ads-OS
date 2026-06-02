import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/dashboard";

  if (!isSupabaseConfigured() || !code) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const supabase = await createServerSupabaseClient();
  await supabase.auth.exchangeCodeForSession(code);

  return NextResponse.redirect(new URL(next, url.origin));
}
