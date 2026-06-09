import { cache } from "react";
import { redirect } from "next/navigation";
import { getOptionalServerSupabaseClient, createServiceRoleSupabaseClient, isSupabaseServiceRoleConfigured } from "./server";
import type { User } from "@supabase/supabase-js";

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

/**
 * Cached per-request: layout + page both call requirePlatformAdmin but only
 * one getUser + one profile DB round-trip fires per render tree.
 * Returns null if supabase/service-role is not configured, or the user is not
 * authenticated, or the profile row is missing.
 * Returns the profile (including is_platform_admin + suspended_at) so callers
 * can decide on 401 vs 403 without a second query.
 */
export const loadAdminProfile = cache(async (): Promise<{
  user: User;
  is_platform_admin: boolean;
  suspended_at: string | null;
} | null> => {
  const supabase = await getOptionalServerSupabaseClient();
  if (!supabase || !isSupabaseServiceRoleConfigured()) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createServiceRoleSupabaseClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_platform_admin, suspended_at")
    .eq("id", user.id)
    .single();

  if (!profile) return null;
  return {
    user,
    is_platform_admin: Boolean(profile.is_platform_admin),
    suspended_at: profile.suspended_at as string | null
  };
});

export async function requirePlatformAdmin(nextPath: string) {
  const profile = await loadAdminProfile();

  if (!profile) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  // Suspended admins lose page access — same check already enforced in API routes.
  if (!profile.is_platform_admin || profile.suspended_at) {
    redirect("/dashboard");
  }

  return profile.user;
}
