import { AppShell } from "@/components/AppShell";
import { ViewerMock } from "@/components/ViewerMock";
import { runModelPackageChecks } from "@/lib/generation-pipeline";
import { getReviewQueue } from "@/lib/mock-data";

export default function AdminReviewPage() {
  const queue = getReviewQueue();

  return (
    <AppShell>
      <header>
        <p className="eyebrow">Interna admin provera</p>
        <h1>Pregled generisanih modela</h1>
        <p className="muted">Odobri, odbij ili zatraži regeneraciju pre nego što se hostovana stranica objavi.</p>
      </header>

      <section className="grid two">
        {queue.map((item) => (
          <article className="panel stack" key={item.id}>
            <div className="row">
              <div>
                <h2>{item.product?.name}</h2>
                <p className="muted">{item.product?.customerUrl}</p>
              </div>
              <span className="badge warning">{item.status}</span>
            </div>
            <ViewerMock />
            <ul className="checklist">
              {item.product?.modelAsset &&
                runModelPackageChecks(item.product.modelAsset).map((check) => (
                  <li key={check.id}>
                    <span className="checkDot" />
                    <span>
                      {check.label}: {check.status}
                    </span>
                  </li>
                ))}
              <li>
                <span className="checkDot" />
                <span>Liči na proizvod</span>
              </li>
              <li>
                <span className="checkDot" />
                <span>Orijentacija ispravna</span>
              </li>
              <li>
                <span className="checkDot" />
                <span>Razmera verodostojna</span>
              </li>
              <li>
                <span className="checkDot" />
                <span>AR test pokretanja na čekanju</span>
              </li>
            </ul>
            <div className="row">
              <button className="button accent" type="button">
                Odobri
              </button>
              <button className="button secondary" type="button">
                Zatraži regeneraciju
              </button>
              <button className="button secondary" type="button">
                Odbij
              </button>
            </div>
          </article>
        ))}

        <aside className="panel stack">
          <h2>Pravila pregleda</h2>
          <p className="muted">
            Odobrenje proverava vizuelni prodajni kvalitet, a ne CAD preciznost. Neuspeli modeli ostaju privatni i ne mogu biti otvoreni
            na javnom URL-u.
          </p>
          <span className="badge success">Ručna kapija aktivna</span>
        </aside>
      </section>
    </AppShell>
  );
}
