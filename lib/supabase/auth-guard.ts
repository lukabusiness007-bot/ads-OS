import { redirect } from "next/navigation";
import { getOptionalServerSupabaseClient, createServiceRoleSupabaseClient, isSupabaseServiceRoleConfigured } from "./server";

export async function requireAuthenticatedUser(nextPath: string) {
  const supabase = await getOptionalServerSupabaseClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  return user;
}

export async function requirePlatformAdmin(nextPath: string) {
  const supabase = await getOptionalServerSupabaseClient();

  if (!supabase) {
    redirect("/login");
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  // Verify admin flag via service role to bypass RLS
  if (!isSupabaseServiceRoleConfigured()) {
    redirect("/login");
  }

  const admin = createServiceRoleSupabaseClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_platform_admin) {
    redirect("/dashboard");
  }

  return user;
}
