import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getDashboardData } from "@/lib/supabase/data";

export default async function AnalyticsPage() {
  const data = await getDashboardData();

  return (
    <AppShell>
      <header className="topbar">
        <div>
          <p className="eyebrow">Analitika</p>
          <h1>Učinak hostovanih stranica</h1>
          <p className="muted">Pratite preglede stranica, interakcije sa pregledačem, AR klikove i klikove na prodavnicu za svaki objavljeni proizvod.</p>
        </div>
        <Link className="button secondary" href="/billing">
          Pogledaj naplatu
        </Link>
      </header>

      <section className="grid four">
        <article className="card metric">
          <span className="sectionLabel">Pregledi stranica</span>
          <strong>{data.totals.pageViews}</strong>
          <span className="badge neutral">Svi proizvodi</span>
        </article>
        <article className="card metric">
          <span className="sectionLabel">Interakcije</span>
          <strong>{data.totals.viewerInteractions}</strong>
          <span className="badge neutral">3D pregledač</span>
        </article>
        <article className="card metric">
          <span className="sectionLabel">AR klikovi</span>
          <strong>{data.totals.arClicks}</strong>
          <span className="badge neutral">Pogledaj u prostoriji</span>
        </article>
        <article className="card metric">
          <span className="sectionLabel">CTA na prodavnicu</span>
          <strong>{data.totals.storeClicks}</strong>
          <span className="badge success">Nazad u prodavnicu</span>
        </article>
      </section>

      <section className="panel">
        <div style={{ marginBottom: 16 }}>
          <h2>Pregled po proizvodu</h2>
          <p className="muted">Metrike angažovanosti za svaku objavljenu stranicu proizvoda.</p>
        </div>
        <div className="responsiveTable">
          <table className="table">
            <thead>
              <tr>
                <th>Proizvod</th>
                <th>Pregledi stranica</th>
                <th>Interakcije</th>
                <th>AR klikovi</th>
                <th>Klikovi na prodavnicu</th>
              </tr>
            </thead>
            <tbody>
              {data.products.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="emptyTableState">
                      <strong>Još nema analitike</strong>
                      <p className="muted">Objavite stranicu proizvoda i događaji kupaca će se pojaviti ovde.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.products.map((product) => (
                  <tr key={product.id}>
                    <td data-label="Proizvod">
                      <strong>{product.name}</strong>
                      <p className="muted" style={{ marginBottom: 0, fontSize: 13 }}>
                        {product.category.replace("_", " ")}
                      </p>
                    </td>
                    <td data-label="Pregledi stranica">{product.analytics?.pageViews ?? 0}</td>
                    <td data-label="Interakcije">{product.analytics?.viewerInteractions ?? 0}</td>
                    <td data-label="AR klikovi">{product.analytics?.arButtonClicks ?? 0}</td>
                    <td data-label="Klikovi na prodavnicu">{product.analytics?.ctaClicks ?? 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
