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
  const { data } = await supabase.auth.exchangeCodeForSession(code);

  if (data.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_platform_admin")
      .eq("id", data.user.id)
      .single();

    if (profile?.is_platform_admin) {
      return NextResponse.redirect(new URL("/admin", url.origin));
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
