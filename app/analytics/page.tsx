import { AppShell } from "@/components/AppShell";
import { AnalyticsClient } from "@/components/AnalyticsClient";
import { getDashboardData } from "@/lib/supabase/data";

export default async function AnalyticsPage() {
  const data = await getDashboardData();
  return (
    <AppShell>
      <AnalyticsClient data={data} />
    </AppShell>
  );
}
