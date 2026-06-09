import type { AdminOverviewRange, AdminOverviewStats } from "@/lib/types";
import type { User } from "@supabase/supabase-js";
import { assertAdmin, db } from "./shared";

const OVERVIEW_RANGE_DAYS: Record<AdminOverviewRange, number> = { "7d": 7, "30d": 30, "90d": 90 };

export async function getAdminOverviewStats(
  admin: User,
  { range = "7d" }: { range?: AdminOverviewRange } = {}
): Promise<AdminOverviewStats> {
  assertAdmin(admin);
  const supabase = db();
  const now = new Date();
  const days = OVERVIEW_RANGE_DAYS[range];
  const rangeStart = new Date(now.getTime() - days * 86400_000).toISOString();
  const prevRangeStart = new Date(now.getTime() - days * 2 * 86400_000).toISOString();

  const [
    { count: awaiting_review },
    { count: generating },
    { count: generation_failed },
    { count: published },
    { count: total_merchants },
    { count: new_signups_in_range },
    { count: new_signups_prev_range },
    { data: attentionProducts }
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }).eq("status", "awaiting_review"),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("status", "generating"),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("status", "generation_failed"),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_platform_admin", false),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", rangeStart).eq("is_platform_admin", false),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", prevRangeStart).lt("created_at", rangeStart).eq("is_platform_admin", false),
    supabase
      .from("products")
      .select("id, name, status, updated_at, organizations!inner(name)")
      .in("status", ["awaiting_review", "generation_failed"])
      .order("updated_at", { ascending: true })
      .limit(10)
  ]);

  const needs_attention = (attentionProducts ?? []).map((p: Record<string, unknown>) => ({
    id: p.id as string,
    name: p.name as string,
    status: p.status as AdminOverviewStats["needs_attention"][number]["status"],
    org_name: ((p.organizations as Record<string, unknown>)?.name as string) ?? "",
    updated_at: p.updated_at as string
  }));

  return {
    awaiting_review: awaiting_review ?? 0,
    generating: generating ?? 0,
    generation_failed: generation_failed ?? 0,
    published: published ?? 0,
    total_merchants: total_merchants ?? 0,
    range,
    new_signups_in_range: new_signups_in_range ?? 0,
    new_signups_prev_range: new_signups_prev_range ?? 0,
    needs_attention
  };
}
