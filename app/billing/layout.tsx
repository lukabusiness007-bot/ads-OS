import type { ReactNode } from "react";
import { noIndexMetadata } from "@/lib/seo";
import { requireAuthenticatedUser } from "@/lib/supabase/auth-guard";

export const metadata = noIndexMetadata;

export default async function BillingLayout({ children }: { children: ReactNode }) {
  await requireAuthenticatedUser("/billing");

  return children;
}
