import type { ReactNode } from "react";
import { noIndexMetadata } from "@/lib/seo";
import { requireAuthenticatedUser } from "@/lib/supabase/auth-guard";

export const metadata = noIndexMetadata;

export default async function ApprovalLayout({ children }: { children: ReactNode }) {
  await requireAuthenticatedUser("/approval");

  return children;
}
