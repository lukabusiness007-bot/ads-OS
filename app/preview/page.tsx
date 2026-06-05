"use client"

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ModelViewer } from "@/components/ModelViewer";
import { GENERATED_PRODUCT_STORAGE_KEY, type StoredGeneratedProduct } from "@/lib/generated-product-storage";
import { runModelPackageChecks } from "@/lib/generation-pipeline";

export default function PreviewPage() {
  return (
    <Suspense fallback={<PreviewFallback />}>
      <PreviewPageContent />
    </Suspense>
  );
}

function PreviewPageContent() {
  const searchParams = useSearchParams();
  const [storedProduct, setStoredProduct] = useState<StoredGeneratedProduct | null>(null);

  // Read from localStorage only after mount so the server-rendered HTML and the
  // first client render match. Reading it in the useState initializer caused a
  // hydration mismatch (React error #418).
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setStoredProduct(readStoredProduct());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const requestedProductId = searchParams.get("productId");
  const product = !requestedProductId || storedProduct?.productId === requestedProductId ? storedProduct : null;
  const asset = product?.asset;
  const checks = asset ? runModelPackageChecks(asset) : [];
  const statusHref = product
    ? `/status?productId=${encodeURIComponent(product.productId)}&taskId=${encodeURIComponent(product.taskId)}`
    : "/status";

  return (
    <AppShell>
      <header className="topbar">
        <div>
          <p className="eyebrow">Generisani model</p>
          <h1>{product?.name ?? "Još nema generisanog modela"}</h1>
          <p className="muted">
            Pregledajte generisani 3D model, pokrenite AR na podržanim uređajima, zatim pošaljite najbolju verziju na proveru kvaliteta.
          </p>
        </div>
        <div className="row">
          <Link className="button secondary" href="/create">
            Regeneriši
          </Link>
          <Link className={asset ? "button accent" : "button secondary"} href={asset ? "/approval" : statusHref}>
            {asset ? "Pošalji na proveru kvaliteta" : "Nazad na status"}
          </Link>
        </div>
      </header>

      <section className="grid two">
        <div className="panel stack">
          <ModelViewer asset={asset} alt={`3D model: ${product?.name ?? "Generisani proizvod"}`} />
          <div className="row">
            <span className={asset?.glbUrl ? "badge success" : "badge neutral"}>GLB {asset?.glbUrl ? "spremno" : "nedostaje"}</span>
            <span className={asset?.usdzUrl ? "badge success" : "badge neutral"}>USDZ {asset?.usdzUrl ? "spremno" : "nedostaje"}</span>
            <span className={asset?.posterUrl ? "badge success" : "badge neutral"}>Poster {asset?.posterUrl ? "spremno" : "nedostaje"}</span>
          </div>
        </div>

        <aside className="panel stack">
          <h2>Provere fajlova</h2>
          <p className="muted">
            Generisani izlaz se kopira u skladište pre kapije za proveru kvaliteta, tako da pregledač nikada ne zavisi od
            privremenih URL-ova provajdera.
          </p>
          {checks.length ? (
            <ul className="checklist">
              {checks.map((check) => (
                <li key={check.id}>
                  <span className="checkDot" />
                  <span>
                    <strong>{check.label}:</strong> {check.detail}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="assumptionNote">Sačekajte da se generisanje završi pre otvaranja prikaza modela.</div>
          )}
          <div className="assetGrid">
            <span className="badge neutral">Trouglovi {asset?.triangleCount ? asset.triangleCount.toLocaleString() : "nepoznato"}</span>
            <span className="badge neutral">Metapodaci {asset?.metadataUrl ? "sačuvani" : "na čekanju"}</span>
            <span className="badge neutral">Razmera 1 jedinica = 1 metar</span>
          </div>
          <div className="row">
            <a className="button secondary" href={asset?.glbUrl ?? "#"} aria-disabled={!asset?.glbUrl}>
              Otvori GLB
            </a>
            <a className="button secondary" href={asset?.usdzUrl ?? "#"} aria-disabled={!asset?.usdzUrl}>
              Otvori AR fajl
            </a>
          </div>
        </aside>
      </section>
    </AppShell>
  );
}

function PreviewFallback() {
  return (
    <AppShell>
      <section className="panel stack">
        <p className="eyebrow">Generisani model</p>
        <h1>Učitavanje prikaza</h1>
        <p className="muted">Priprema pregledača modela.</p>
      </section>
    </AppShell>
  );
}

function readStoredProduct() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(GENERATED_PRODUCT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredGeneratedProduct) : null;
  } catch {
    return null;
  }
}
