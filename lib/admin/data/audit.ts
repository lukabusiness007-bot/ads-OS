import type { AdminAuditEntry, AdminProfile } from "@/lib/types";
import type { User } from "@supabase/supabase-js";
import { assertAdmin, db, pageRange, type Paginated } from "./shared";

export type AdminAuditEntryWithTarget = AdminAuditEntry & { target_name: string | null };

export async function recordAuditEvent(
  admin: User,
  {
    action,
    targetType,
    targetId,
    metadata
  }: { action: string; targetType: string; targetId?: string; metadata?: Record<string, unknown> }
): Promise<void> {
  const supabase = db();
  await supabase.from("admin_audit_log").insert({
    actor_id: admin.id,
    action,
    target_type: targetType,
    target_id: targetId ?? null,
    metadata: metadata ?? {}
  });
}

export async function listAuditLog(
  admin: User,
  {
    action,
    targetType,
    targetId,
    actorId,
    dateFrom,
    dateTo,
    page = 1,
    pageSize = 50
  }: {
    action?: string;
    targetType?: string;
    targetId?: string;
    actorId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<Paginated<AdminAuditEntryWithTarget>> {
  assertAdmin(admin);
  const supabase = db();

  let query = supabase
    .from("admin_audit_log")
    .select("*, actor:actor_id(id, full_name, email, username)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(...pageRange(page, pageSize));

  if (action) query = query.eq("action", action);
  if (targetType) query = query.eq("target_type", targetType);
  if (targetId) query = query.eq("target_id", targetId);
  if (actorId) query = query.eq("actor_id", actorId);
  if (dateFrom) query = query.gte("created_at", `${dateFrom}T00:00:00.000Z`);
  if (dateTo) query = query.lte("created_at", `${dateTo}T23:59:59.999Z`);

  const { data, count, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as AdminAuditEntry[];
  const targetNames = await resolveAuditTargetNames(supabase, rows);

  return {
    rows: rows.map((row) => ({ ...row, target_name: row.target_id ? targetNames.get(row.target_id) ?? null : null })),
    total: count ?? 0
  };
}

/** Batches one capped lookup per target type so the audit list can read as sentences without N+1 queries. */
async function resolveAuditTargetNames(
  supabase: ReturnType<typeof db>,
  rows: AdminAuditEntry[]
): Promise<Map<string, string>> {
  const idsByType = new Map<string, Set<string>>();
  for (const row of rows) {
    if (!row.target_id) continue;
    const set = idsByType.get(row.target_type) ?? new Set<string>();
    set.add(row.target_id);
    idsByType.set(row.target_type, set);
  }

  const names = new Map<string, string>();

  const productIds = [...(idsByType.get("product") ?? [])];
  const userIds = [...(idsByType.get("user") ?? [])];
  const orgIds = [...(idsByType.get("organization") ?? [])];

  const [productRows, userRows, orgRows] = await Promise.all([
    productIds.length ? supabase.from("products").select("id, name").in("id", productIds) : null,
    userIds.length ? supabase.from("profiles").select("id, full_name, email, username").in("id", userIds) : null,
    orgIds.length ? supabase.from("organizations").select("id, name").in("id", orgIds) : null
  ]);

  for (const product of (productRows?.data ?? []) as Array<{ id: string; name: string }>) {
    names.set(product.id, product.name);
  }
  for (const org of (orgRows?.data ?? []) as Array<{ id: string; name: string }>) {
    names.set(org.id, org.name);
  }
  for (const user of (userRows?.data ?? []) as Array<Pick<AdminProfile, "id" | "full_name" | "email" | "username">>) {
    names.set(user.id, user.full_name ?? user.username ?? user.email ?? user.id);
  }

  return names;
}

/** Capped roster of platform admins for the audit log's actor filter — small, fixed set, no pagination needed. */
export async function listAuditActors(admin: User): Promise<Array<Pick<AdminProfile, "id" | "full_name" | "email" | "username">>> {
  assertAdmin(admin);
  const supabase = db();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, username")
    .eq("is_platform_admin", true)
    .order("full_name", { ascending: true })
    .limit(100);

  if (error) throw error;
  return (data ?? []) as Array<Pick<AdminProfile, "id" | "full_name" | "email" | "username">>;
}

export async function startImpersonation(admin: User, targetUserId: string): Promise<string> {
  assertAdmin(admin);
  // Issues a short-lived token stored server-side in admin_audit_log; the UI
  // reads org data via the service role on behalf of the target user.
  // Never creates real credentials for the target user.
  const token = crypto.randomUUID();

  await recordAuditEvent(admin, {
    action: "impersonate_start",
    targetType: "user",
    targetId: targetUserId,
    metadata: { token }
  });

  return token;
}

export async function stopImpersonation(admin: User, targetUserId: string): Promise<void> {
  assertAdmin(admin);
  await recordAuditEvent(admin, {
    action: "impersonate_stop",
    targetType: "user",
    targetId: targetUserId,
    metadata: {}
  });
}
