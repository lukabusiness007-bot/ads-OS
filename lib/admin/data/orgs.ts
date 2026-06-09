import type { AdminOrg, AdminOrgMember, AdminSubscription, AdminProduct, AdminAuditEntry } from "@/lib/types";
import type { User } from "@supabase/supabase-js";
import { assertAdmin, db, escapeIlike, pageRange, type Paginated } from "./shared";
import { recordAuditEvent } from "./audit";

export async function listOrganizations(
  admin: User,
  { search = "", page = 1, pageSize = 25 }: { search?: string; page?: number; pageSize?: number } = {}
): Promise<Paginated<AdminOrg & { member_count: number; product_count: number }>> {
  assertAdmin(admin);
  const supabase = db();

  let query = supabase
    .from("organizations")
    .select("*, organization_members(count), products(count)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(...pageRange(page, pageSize));

  if (search) {
    query = query.ilike("name", `%${escapeIlike(search)}%`);
  }

  const { data, count, error } = await query;
  if (error) throw error;

  const rows = (data ?? []).map((o: Record<string, unknown>) => {
    const memberCount = (o.organization_members as Array<{ count: number }> | null)?.[0]?.count ?? 0;
    const productCount = (o.products as Array<{ count: number }> | null)?.[0]?.count ?? 0;
    return {
      ...(o as AdminOrg),
      member_count: memberCount,
      product_count: productCount
    };
  });

  return { rows, total: count ?? 0 };
}

export async function getOrganizationDetail(
  admin: User,
  orgId: string
): Promise<{
  org: AdminOrg;
  members: AdminOrgMember[];
  subscription: AdminSubscription | null;
  products: AdminProduct[];
  recentAudit: AdminAuditEntry[];
}> {
  assertAdmin(admin);
  const supabase = db();

  const [
    { data: org, error: orgErr },
    { data: members },
    { data: subscription },
    { data: products }
  ] = await Promise.all([
    supabase.from("organizations").select("*").eq("id", orgId).single(),
    supabase
      .from("organization_members")
      .select("*, profile:user_id(id, full_name, email, username, suspended_at)")
      .eq("organization_id", orgId),
    supabase
      .from("subscriptions")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("products")
      .select("*")
      .eq("organization_id", orgId)
      .order("updated_at", { ascending: false })
  ]);

  if (orgErr || !org) throw new Error("Organization not found");

  const { data: recentAudit } = await supabase
    .from("admin_audit_log")
    .select("*, actor:actor_id(id, full_name, email, username)")
    .eq("target_id", orgId)
    .order("created_at", { ascending: false })
    .limit(20);

  return {
    org: org as AdminOrg,
    members: (members ?? []) as AdminOrgMember[],
    subscription: subscription as AdminSubscription | null,
    products: (products ?? []) as AdminProduct[],
    recentAudit: (recentAudit ?? []) as AdminAuditEntry[]
  };
}

export async function suspendOrg(admin: User, orgId: string, reason?: string): Promise<void> {
  assertAdmin(admin);
  const supabase = db();
  await supabase
    .from("organizations")
    .update({ suspended_at: new Date().toISOString() })
    .eq("id", orgId);

  await recordAuditEvent(admin, {
    action: "suspend",
    targetType: "organization",
    targetId: orgId,
    metadata: { reason }
  });
}

export async function unsuspendOrg(admin: User, orgId: string): Promise<void> {
  assertAdmin(admin);
  const supabase = db();
  await supabase
    .from("organizations")
    .update({ suspended_at: null })
    .eq("id", orgId);

  await recordAuditEvent(admin, {
    action: "unsuspend",
    targetType: "organization",
    targetId: orgId,
    metadata: {}
  });
}

export async function editOrgPlan(
  admin: User,
  orgId: string,
  planKey: string,
  reason?: string
): Promise<void> {
  assertAdmin(admin);
  const supabase = db();
  await supabase
    .from("organizations")
    .update({ plan_key: planKey })
    .eq("id", orgId);

  await recordAuditEvent(admin, {
    action: "edit_plan",
    targetType: "organization",
    targetId: orgId,
    metadata: { planKey, reason }
  });
}
