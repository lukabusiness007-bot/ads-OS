import { NextResponse } from "next/server";
import { syncContactToResend } from "@/lib/email/contacts";
import { sendWelcomeEmail } from "@/lib/email/send";
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
      .select("is_platform_admin, full_name, email, welcome_email_sent_at, marketing_consent")
      .eq("id", data.user.id)
      .single();

    // First confirmed login: send the branded welcome + sync to the marketing audience.
    if (profile && !profile.welcome_email_sent_at) {
      await onFirstLogin(supabase, data.user.id, {
        email: profile.email ?? data.user.email ?? null,
        name: profile.full_name ?? null,
        marketingConsent: profile.marketing_consent ?? true
      });
    }

    if (profile?.is_platform_admin) {
      return NextResponse.redirect(new URL("/admin", url.origin));
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}

async function onFirstLogin(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  profile: { email: string | null; name: string | null; marketingConsent: boolean }
) {
  if (!profile.email) return;

  await sendWelcomeEmail(profile.email, profile.name ?? "there").catch(() => undefined);

  const contactId = await syncContactToResend({
    email: profile.email,
    name: profile.name,
    subscribed: profile.marketingConsent
  }).catch(() => null);

  await supabase
    .from("profiles")
    .update({
      welcome_email_sent_at: new Date().toISOString(),
      ...(contactId ? { resend_contact_id: contactId } : {})
    })
    .eq("id", userId);
}
