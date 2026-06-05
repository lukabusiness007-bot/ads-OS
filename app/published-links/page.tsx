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
          <p className="eyebrow">Objavljeni linkovi</p>
          <h1>Hostovane AR stranice proizvoda</h1>
          <p className="muted">Kopirajte verifikovane linkove proizvoda za stranice prodavnice, oglase, emailove ili QR kodove.</p>
        </div>
        <Link className="button accent" href="/create">
          Kreiraj AR proizvod
        </Link>
      </header>

      <section className="panel linkGrid">
        {data.products.length === 0 ? (
          <div className="emptyTableState">
            <strong>Još nema proizvoda</strong>
            <p className="muted">Kreirajte i objavite proizvod da biste dobili njegov hostovani link.</p>
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
                    {product.hostedPage?.status === "published" ? "Verifikovano aktivno" : "Nije objavljeno"}
                  </span>
                </div>
              </div>
              <div className="rightStack">
                <span className="sectionLabel">Hostovani link</span>
                {product.hostedPage?.status === "published" ? (
                  <>
                    <Link className="textLink" href={product.hostedPage.publicUrl}>
                      {product.hostedPage.publicUrl}
                    </Link>
                    <div className="assetGrid">
                      <Link className="button secondary sm" href={product.hostedPage.publicUrl}>
                        Pregled
                      </Link>
                      <CopyButton value={product.hostedPage.publicUrl} />
                    </div>
                  </>
                ) : (
                  <span className="muted">Dostupno nakon odobrenja i objavljivanja.</span>
                )}
                <span className="muted">CTA odredište: {product.customerUrl}</span>
              </div>
            </article>
          ))
        )}
      </section>
    </AppShell>
  );
}
