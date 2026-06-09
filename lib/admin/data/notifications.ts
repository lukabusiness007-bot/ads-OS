import type { AdminNotification } from "@/lib/types";
import type { User } from "@supabase/supabase-js";
import { assertAdmin, db } from "./shared";

export async function listAdminNotifications(
  admin: User,
  { unreadOnly = false }: { unreadOnly?: boolean } = {}
): Promise<AdminNotification[]> {
  assertAdmin(admin);
  const supabase = db();

  let query = supabase
    .from("admin_notifications")
    .select("*, product:product_id(id, name, status)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (unreadOnly) {
    query = query.eq("read", false);
  }

  const { data } = await query;
  return (data ?? []) as AdminNotification[];
}

export async function markNotificationsRead(admin: User, ids: string[]): Promise<void> {
  assertAdmin(admin);
  const supabase = db();
  await supabase.from("admin_notifications").update({ read: true }).in("id", ids);
}
