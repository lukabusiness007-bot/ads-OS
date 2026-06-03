import type { ReactNode } from "react";
import { noIndexMetadata } from "@/lib/seo";
import { requireAuthenticatedUser } from "@/lib/supabase/auth-guard";

export const metadata = noIndexMetadata;

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAuthenticatedUser("/admin");

  return children;
}
