import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/supabase/auth-guard";
import { getAdminOverviewStats } from "@/lib/admin/data";
import { PageHeader } from "@/components/admin/PageHeader";
import { FilterControls } from "@/components/admin/FilterControls";
import type { AdminOverviewRange, ProductStatus } from "@/lib/types";

const RANGE_TABS = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" }
];

export default async function AdminOverviewPage({
  searchParams
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const admin = await requirePlatformAdmin("/admin");
  if (!admin) return null;

  const { range: rawRange } = await searchParams;
  const range: AdminOverviewRange = rawRange === "30d" || rawRange === "90d" ? rawRange : "7d";

  const stats = await getAdminOverviewStats(admin, { range });

  const signupDelta = stats.new_signups_in_range - stats.new_signups_prev_range;
  const signupTrend =
    signupDelta === 0
      ? `No change vs prior ${RANGE_TABS.find((tab) => tab.value === range)?.label}`
      : `${signupDelta > 0 ? "+" : ""}${signupDelta} vs prior ${RANGE_TABS.find((tab) => tab.value === range)?.label}`;

  const statCards = [
    {
      label: "Awaiting review",
      value: stats.awaiting_review,
      href: "/admin/review",
      badge: { tone: "warning", text: "Needs decision" }
    },
    {
      label: "Generating",
      value: stats.generating,
      href: "/admin/review?status=generating",
      badge: { tone: "neutral", text: "In progress" }
    },
    {
      label: "Generation failed",
      value: stats.generation_failed,
      href: "/admin/review?status=generation_failed",
      badge: { tone: "danger", text: "Blocked" }
    },
    {
      label: "Published",
      value: stats.published,
      href: "/admin/review?status=published",
      badge: { tone: "success", text: "Live" }
    },
    {
      label: "Total merchants",
      value: stats.total_merchants,
      href: "/admin/users",
      badge: { tone: "neutral", text: "All-time" }
    },
    {
      label: "New signups",
      value: stats.new_signups_in_range,
      href: "/admin/users",
      badge: { tone: "neutral", text: signupTrend }
    }
  ] as const;

  const actionableQueues = [
    { status: "awaiting_review" as ProductStatus, count: stats.awaiting_review, label: "awaiting review", href: "/admin/review" },
    { status: "generation_failed" as ProductStatus, count: stats.generation_failed, label: "failed generations", href: "/admin/review?status=generation_failed" }
  ];
  const busiestQueue = actionableQueues.reduce((max, queue) => (queue.count > max.count ? queue : max));

  const oldestByStatus = (status: ProductStatus) => stats.needs_attention.find((item) => item.status === status);

  return (
    <>
      <PageHeader
        eyebrow="Platform admin"
        title="Overview"
        subtitle="Track merchant health, generation throughput, and what needs your attention across the whole platform."
        action={
          busiestQueue.count > 0 ? (
            <Link className="button accent" href={busiestQueue.href}>
              Review {busiestQueue.count} {busiestQueue.label} →
            </Link>
          ) : (
            <Link className="button secondary" href="/admin/review">
              Open review queue →
            </Link>
          )
        }
      />

      <FilterControls tabs={RANGE_TABS} tabParam="range" />

      <section className="grid four" style={{ gap: 12, marginBottom: 32 }}>
        {statCards.map((card) => (
          <Link key={card.label} href={card.href} style={{ textDecoration: "none", color: "inherit" }}>
            <article className="card metric">
              <span className="sectionLabel">{card.label}</span>
              <strong>{card.value}</strong>
              <span className={`badge ${card.badge.tone}`}>{card.badge.text}</span>
            </article>
          </Link>
        ))}
      </section>

      <section className="panel stack">
        <div className="row">
          <div>
            <h2 style={{ margin: 0 }}>Needs your attention</h2>
            <p className="muted">The queues that are blocking merchants from going live.</p>
          </div>
          <Link href="/admin/review" className="button secondary sm">
            View all →
          </Link>
        </div>

        {stats.awaiting_review === 0 && stats.generation_failed === 0 ? (
          <div className="emptyTableState">
            <strong>All clear</strong>
            <p className="muted">Nothing pending review or failed generation right now. New submissions will appear here.</p>
          </div>
        ) : (
          <ul className="actionList">
            {stats.awaiting_review > 0 && (
              <li>
                <strong>
                  {stats.awaiting_review} product{stats.awaiting_review !== 1 ? "s" : ""} awaiting review
                </strong>
                <span>
                  <Link href="/admin/review" style={{ color: "var(--accent)", fontWeight: 700 }}>
                    Open review queue →
                  </Link>
                  {oldestByStatus("awaiting_review") && (
                    <>
                      {" "}Oldest: {oldestByStatus("awaiting_review")!.name} ({oldestByStatus("awaiting_review")!.org_name}), updated{" "}
                      {new Date(oldestByStatus("awaiting_review")!.updated_at).toLocaleDateString()}.
                    </>
                  )}
                </span>
              </li>
            )}
            {stats.generation_failed > 0 && (
              <li>
                <strong>
                  {stats.generation_failed} generation{stats.generation_failed !== 1 ? "s" : ""} failed
                </strong>
                <span>
                  <Link href="/admin/review?status=generation_failed" style={{ color: "var(--accent)", fontWeight: 700 }}>
                    Review failures →
                  </Link>
                  {oldestByStatus("generation_failed") && (
                    <>
                      {" "}Oldest: {oldestByStatus("generation_failed")!.name} ({oldestByStatus("generation_failed")!.org_name}), updated{" "}
                      {new Date(oldestByStatus("generation_failed")!.updated_at).toLocaleDateString()}.
                    </>
                  )}
                </span>
              </li>
            )}
          </ul>
        )}
      </section>
    </>
  );
}
