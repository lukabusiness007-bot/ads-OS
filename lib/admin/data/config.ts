import type { User } from "@supabase/supabase-js";
import { assertAdmin, db } from "./shared";
import { recordAuditEvent } from "./audit";

export type AdminConfig = {
  auto_review_enabled: boolean;
};

export async function getAdminConfig(admin: User): Promise<AdminConfig> {
  assertAdmin(admin);
  const supabase = db();

  const { data } = await supabase.from("admin_config").select("key, value");
  const values = new Map((data ?? []).map((row) => [row.key as string, row.value]));

  return {
    auto_review_enabled: values.get("auto_review_enabled") === true
  };
}

export async function setAutoReviewEnabled(admin: User, enabled: boolean): Promise<void> {
  assertAdmin(admin);
  const supabase = db();

  await supabase
    .from("admin_config")
    .upsert({ key: "auto_review_enabled", value: enabled, updated_at: new Date().toISOString() });

  await recordAuditEvent(admin, {
    action: "edit_config",
    targetType: "config",
    metadata: { key: "auto_review_enabled", value: enabled }
  });
}
