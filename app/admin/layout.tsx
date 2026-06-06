import { requirePlatformAdmin } from "@/lib/supabase/auth-guard";
import { AdminShell } from "@/components/AdminShell";
import { noIndexMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Augmenta",
  ...noIndexMetadata
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requirePlatformAdmin("/admin");

  return <AdminShell>{children}</AdminShell>;
}
