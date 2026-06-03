import type { ReactNode } from "react";
import { noIndexMetadata } from "@/lib/seo";
import { requireAuthenticatedUser } from "@/lib/supabase/auth-guard";

export const metadata = noIndexMetadata;

export default async function PreviewLayout({ children }: { children: ReactNode }) {
  await requireAuthenticatedUser("/preview");

  return children;
}
