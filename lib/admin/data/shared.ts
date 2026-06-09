import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export function db() {
  return createServiceRoleSupabaseClient();
}

export function assertAdmin(user: User | null) {
  if (!user) throw new Error("Unauthorized: no user");
}

// Strip characters that break PostgREST filter syntax inside .or() / .ilike() calls.
export function escapeIlike(s: string): string {
  return s.replace(/[%,()]/g, "");
}

export type Paginated<T> = { rows: T[]; total: number };

export function pageRange(page: number, pageSize: number): [number, number] {
  return [(page - 1) * pageSize, page * pageSize - 1];
}
