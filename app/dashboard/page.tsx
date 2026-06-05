import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ProductTable } from "@/components/ProductTable";
import { getDashboardData } from "@/lib/supabase/data";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const usagePct = Math.min(100, Math.round((data.totals.published / 25) * 100));
  const hasProducts = data.products.length > 0;

  return (
    <AppShell>
      <header className="topbar">
        <div>
          <p className="eyebrow">{data.organization?.name ?? "Pilot radni prostor"}</p>
          <h1 style={{ marginBottom: 6 }}>Pregled</h1>
          <p className="muted" style={{ maxWidth: 560 }}>
            Pratite proizvode, napredak generisanja, objavljene stranice, korišćenje plana i angažovanost kupaca na jednom mestu.
          </p>
        </div>
        <Link className="button accent" href="/create">
          Kreiraj AR proizvod
        </Link>
      </header>

      {!data.isConfigured && (
        <div className="assumptionNote">
          Skladište radnog prostora još nije povezano. Završite produkcijsko podešavanje pre pozivanja pilot prodavaca.
        </div>
      )}

      {data.setupErrorMessage && (
        <div className="assumptionNote">
          Podešavanje radnog prostora zahteva pažnju pre nego što se podaci o proizvodima mogu sačuvati.
        </div>
      )}

      <section className="grid four">
        <article className="card metric">
          <span className="sectionLabel">Ukupno proizvoda</span>
          <strong>{data.totals.products}</strong>
          <span className="badge neutral">Katalog</span>
        </article>
        <article className="card metric">
          <span className="sectionLabel">Objavljene stranice</span>
          <strong>
            {data.totals.published}
            <span style={{ fontSize: 16, fontWeight: 500, color: "var(--muted)" }}>/25</span>
          </strong>
          <span className="badge neutral">Aktivno hostovano</span>
        </article>
        <article className="card metric">
          <span className="sectionLabel">AR klikovi</span>
          <strong>{data.totals.arClicks}</strong>
          <span className="badge neutral">Pogledaj u prostoriji</span>
        </article>
        <article className="card metric">
          <span className="sectionLabel">Klikovi na prodavnicu</span>
          <strong>{data.totals.storeClicks}</strong>
          <span className="badge neutral">Nazad u prodavnicu</span>
        </article>
      </section>

      <section className="grid two">
        <article className="panel stack">
          <div className="row">
            <div>
              <h2>Sledeće akcije</h2>
              <p className="muted">Fokusirajte se na proizvode kojima trebaju fotografije, pregled ili objavljivanje.</p>
            </div>
            <Link className="button secondary sm" href="/create">
              Dodaj proizvod
            </Link>
          </div>
          <ul className="actionList">
            {hasProducts ? (
              <li>
                <strong>{data.totals.processing} proizvoda u generisanju</strong>
                <span>{data.totals.published} objavljenih stranica je aktivno.</span>
              </li>
            ) : (
              <>
                <li>
                  <strong>1. Kreirajte prvi proizvod</strong>
                  <span>Unesite naziv proizvoda, kategoriju, URL prodavnice, cenu i stvarne dimenzije.</span>
                </li>
                <li>
                  <strong>2. Otpremite 4 jasne fotografije</strong>
                  <span>Koristite prednji, bočni ili tročetvrtinski, zadnji i gornji ili detaljni pogled.</span>
                </li>
                <li>
                  <strong>3. Pregledajte generisani prikaz</strong>
                  <span>Proverite sličnost, razmeru, orijentaciju, učitavanje i AR spremnost pre objavljivanja.</span>
                </li>
                <li>
                  <strong>4. Objavite i merite</strong>
                  <span>Dodajte hostovani link u svoju prodavnicu, zatim pratite AR i klikove na prodavnicu ovde.</span>
                </li>
              </>
            )}
          </ul>
        </article>

        <article className="panel stack">
          <h2>Korišćenje plana</h2>
          <div>
            <div className="usageBar" aria-label={`${data.totals.published} / 25`}>
              <span style={{ width: `${usagePct}%` }} />
            </div>
            <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
              {data.totals.published} / 25 objavljenih stranica iskorišćeno
            </p>
          </div>
          <Link className="button ghost" href="/billing">
            Pogledaj detalje naplate
          </Link>
        </article>
      </section>

      <section className="panel">
        <div className="row">
          <div>
            <h2>Proizvodi</h2>
            <p className="muted">Vaš pilot katalog će ovde prikazati status proizvoda, hostovane linkove i metrike angažovanosti.</p>
          </div>
          <Link className="button secondary sm" href="/published-links">
            Objavljeni linkovi
          </Link>
        </div>
        <ProductTable
          items={data.products}
          emptyTitle="Još nema proizvoda"
          emptyDescription="Kreirajte prvi AR proizvod da biste započeli pilot tok rada."
        />
      </section>
    </AppShell>
  );
}
