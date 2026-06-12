import type { AdminUserRow, AdminProfile, AdminOrg, AdminSubscription, AdminProduct, AdminAuditEntry } from "@/lib/types";
import type { User } from "@supabase/supabase-js";
import { assertAdmin, db, escapeIlike, pageRange, type Paginated } from "./shared";
import { recordAuditEvent } from "./audit";

export async function listUsers(
  admin: User,
  { search = "", status = "all", page = 1, pageSize = 25 }: { search?: string; status?: "all" | "active" | "suspended"; page?: number; pageSize?: number } = {}
): Promise<Paginated<AdminUserRow>> {
  assertAdmin(admin);
  const supabase = db();

  let query = supabase
    .from("profiles")
    .select(
      `id, full_name, email, username, suspended_at, created_at,
       organization_members!inner(
         organization_id, role,
         organizations!inner(name, plan_key, subscriptions(plan_key, status))
       )`,
      { count: "exact" }
    )
    .eq("is_platform_admin", false)
    .order("created_at", { ascending: false })
    .range(...pageRange(page, pageSize))
    // Only ship the first membership row — the UI only uses [0].
    // !inner above already excludes users with no org.
    .limit(1, { foreignTable: "organization_members" });

  if (search) {
    const q = escapeIlike(search);
    query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,username.ilike.%${q}%`);
  }
  if (status === "suspended") {
    query = query.not("suspended_at", "is", null);
  } else if (status === "active") {
    query = query.is("suspended_at", null);
  }

  const { data, count, error } = await query;
  if (error) throw error;

  const rows: AdminUserRow[] = (data ?? []).map((p: Record<string, unknown>) => {
    const member = Array.isArray(p.organization_members) ? (p.organization_members[0] as Record<string, unknown>) : null;
    const org = member ? (member.organizations as Record<string, unknown>) : null;
    const subs = org && Array.isArray(org.subscriptions) ? (org.subscriptions[0] as Record<string, unknown>) : null;

    return {
      id: p.id as string,
      full_name: p.full_name as string | null,
      email: p.email as string | null,
      username: p.username as string | null,
      suspended_at: p.suspended_at as string | null,
      created_at: p.created_at as string,
      org_name: org ? (org.name as string) : null,
      org_id: member ? (member.organization_id as string) : null,
      plan_key: subs ? (subs.plan_key as string) : (org ? (org.plan_key as string) : null),
      subscription_status: subs ? (subs.status as string) : null
    };
  });

  return { rows, total: count ?? 0 };
}

export async function getUserDetail(
  admin: User,
  userId: string
): Promise<{
  profile: AdminProfile;
  orgs: Array<AdminOrg & { role: string; subscription: AdminSubscription | null }>;
  products: AdminProduct[];
  recentAudit: AdminAuditEntry[];
}> {
  assertAdmin(admin);
  const supabase = db();

  const [
    { data: profile, error: profileErr },
    { data: memberRows },
    { data: products }
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase
      .from("organization_members")
      .select("role, organization_id, organizations(*), subscriptions:organizations!inner(subscriptions(*))")
      .eq("user_id", userId),
    supabase
      .from("products")
      .select("*")
      .in(
        "organization_id",
        (
          await supabase
            .from("organization_members")
            .select("organization_id")
            .eq("user_id", userId)
        ).data?.map((r: Record<string, unknown>) => r.organization_id as string) ?? []
      )
      .order("updated_at", { ascending: false })
      .limit(50)
  ]);

  if (profileErr || !profile) throw new Error("User not found");

  const orgs = (memberRows ?? []).map((row: Record<string, unknown>) => {
    const org = row.organizations as Record<string, unknown>;
    const subs = Array.isArray(row.subscriptions)
      ? ((row.subscriptions[0] as Record<string, unknown>)?.subscriptions as unknown[] | null)
      : null;
    const sub = Array.isArray(subs) ? (subs[0] as AdminSubscription) : null;
    return { ...(org as AdminOrg), role: row.role as string, subscription: sub };
  });

  const { data: recentAudit } = await supabase
    .from("admin_audit_log")
    .select("*, actor:actor_id(id, full_name, email, username)")
    .eq("target_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  return {
    profile: profile as AdminProfile,
    orgs,
    products: (products ?? []) as AdminProduct[],
    recentAudit: (recentAudit ?? []) as AdminAuditEntry[]
  };
}

export async function suspendUser(admin: User, targetUserId: string, reason?: string): Promise<void> {
  assertAdmin(admin);
  const supabase = db();
  await supabase
    .from("profiles")
    .update({ suspended_at: new Date().toISOString() })
    .eq("id", targetUserId);

  await recordAuditEvent(admin, {
    action: "suspend",
    targetType: "user",
    targetId: targetUserId,
    metadata: { reason }
  });
}

export async function unsuspendUser(admin: User, targetUserId: string): Promise<void> {
  assertAdmin(admin);
  const supabase = db();
  await supabase
    .from("profiles")
    .update({ suspended_at: null })
    .eq("id", targetUserId);

  await recordAuditEvent(admin, {
    action: "unsuspend",
    targetType: "user",
    targetId: targetUserId,
    metadata: {}
  });
}

export async function setPlatformAdmin(admin: User, targetUserId: string, isAdmin: boolean): Promise<void> {
  assertAdmin(admin);
  const supabase = db();

  if (!isAdmin) {
    if (targetUserId === admin.id) {
      throw new Error("You cannot remove your own admin access.");
    }

    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_platform_admin", true);

    if ((count ?? 0) <= 1) {
      throw new Error("Cannot remove the last platform admin.");
    }
  }

  await supabase
    .from("profiles")
    .update({ is_platform_admin: isAdmin })
    .eq("id", targetUserId);

  await recordAuditEvent(admin, {
    action: isAdmin ? "grant_admin" : "revoke_admin",
    targetType: "user",
    targetId: targetUserId,
    metadata: {}
  });
}
