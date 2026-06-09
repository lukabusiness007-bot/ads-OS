import { AppShell } from "@/components/AppShell";
import { PublishedLinksClient } from "@/components/PublishedLinksClient";
import { getDashboardData } from "@/lib/supabase/data";

export default async function PublishedLinksPage() {
  const data = await getDashboardData();
  return (
    <AppShell>
      <PublishedLinksClient data={data} />
    </AppShell>
  );
}
