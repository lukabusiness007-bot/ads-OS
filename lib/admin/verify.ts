/**
 * Shared helper: verify the caller is an authenticated platform admin.
 * Used at the top of every admin API route handler.
 */
import { createServerSupabaseClient, createServiceRoleSupabaseClient, isSupabaseServiceRoleConfigured } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { User } from "@supabase/supabase-js";

export type VerifyResult =
  | { ok: true; user: User }
  | { ok: false; status: number; error: string };

export async function verifyAdminRequest(): Promise<VerifyResult> {
  if (!isSupabaseConfigured() || !isSupabaseServiceRoleConfigured()) {
    return { ok: false, status: 503, error: "Not configured" };
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const admin = createServiceRoleSupabaseClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_platform_admin, suspended_at")
    .eq("id", user.id)
    .single();

  if (!profile?.is_platform_admin || profile.suspended_at) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  return { ok: true, user };
}
