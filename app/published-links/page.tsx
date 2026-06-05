import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { CopyButton } from "@/components/CopyButton";
import { StatusBadge } from "@/components/StatusBadge";
import { getDashboardData } from "@/lib/supabase/data";

export default async function PublishedLinksPage() {
  const data = await getDashboardData();

  return (
    <AppShell>
      <header className="topbar">
        <div>
          <p className="eyebrow">Published links</p>
          <h1>Hosted AR product pages</h1>
          <p className="muted">Copy verified product links for your store pages, ads, emails, or QR codes.</p>
        </div>
        <Link className="button accent" href="/create">
          Create AR product
        </Link>
      </header>

      <section className="panel linkGrid">
        {data.products.length === 0 ? (
          <div className="emptyTableState">
            <strong>No products yet</strong>
            <p className="muted">Create and publish a product to get its hosted link.</p>
          </div>
        ) : (
          data.products.map((product) => (
            <article className="publishedItem" key={product.id}>
              <div>
                <h2>{product.name}</h2>
                <p className="muted">{product.customerUrl}</p>
                <div className="assetGrid">
                  <StatusBadge status={product.status} />
                  <span className={product.hostedPage?.status === "published" ? "badge success" : "badge neutral"}>
                    {product.hostedPage?.status === "published" ? "Verified live" : "Not published"}
                  </span>
                </div>
              </div>
              <div className="rightStack">
                <span className="sectionLabel">Hosted link</span>
                {product.hostedPage?.status === "published" ? (
                  <>
                    <Link className="textLink" href={product.hostedPage.publicUrl}>
                      {product.hostedPage.publicUrl}
                    </Link>
                    <div className="assetGrid">
                      <Link className="button secondary sm" href={product.hostedPage.publicUrl}>
                        Preview
                      </Link>
                      <CopyButton value={product.hostedPage.publicUrl} />
                    </div>
                  </>
                ) : (
                  <span className="muted">Available after approval and publish.</span>
                )}
                <span className="muted">CTA destination: {product.customerUrl}</span>
              </div>
            </article>
          ))
        )}
      </section>
    </AppShell>
  );
}
