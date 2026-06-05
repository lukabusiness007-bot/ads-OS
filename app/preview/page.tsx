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
          <p className="eyebrow">Generated model</p>
          <h1>{product?.name ?? "No generated model yet"}</h1>
          <p className="muted">
            Inspect the generated 3D model, launch AR on supported devices, then send the best version to quality review.
          </p>
        </div>
        <div className="row">
          <Link className="button secondary" href="/create">
            Regenerate
          </Link>
          <Link className={asset ? "button accent" : "button secondary"} href={asset ? "/approval" : statusHref}>
            {asset ? "Send to quality review" : "Back to status"}
          </Link>
        </div>
      </header>

      <section className="grid two">
        <div className="panel stack">
          <ModelViewer asset={asset} alt={`${product?.name ?? "Generated product"} 3D model`} />
          <div className="row">
            <span className={asset?.glbUrl ? "badge success" : "badge neutral"}>GLB {asset?.glbUrl ? "ready" : "missing"}</span>
            <span className={asset?.usdzUrl ? "badge success" : "badge neutral"}>USDZ {asset?.usdzUrl ? "ready" : "missing"}</span>
            <span className={asset?.posterUrl ? "badge success" : "badge neutral"}>Poster {asset?.posterUrl ? "ready" : "missing"}</span>
          </div>
        </div>

        <aside className="panel stack">
          <h2>Asset checks</h2>
          <p className="muted">
            Generated output is copied into storage before the quality review gate, so the viewer never depends on
            temporary provider URLs.
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
            <div className="assumptionNote">Wait for generation to finish before opening the model preview.</div>
          )}
          <div className="assetGrid">
            <span className="badge neutral">Triangles {asset?.triangleCount ? asset.triangleCount.toLocaleString() : "unknown"}</span>
            <span className="badge neutral">Metadata {asset?.metadataUrl ? "stored" : "pending"}</span>
            <span className="badge neutral">Scale 1 unit = 1 meter</span>
          </div>
          <div className="row">
            <a className="button secondary" href={asset?.glbUrl ?? "#"} aria-disabled={!asset?.glbUrl}>
              Open GLB
            </a>
            <a className="button secondary" href={asset?.usdzUrl ?? "#"} aria-disabled={!asset?.usdzUrl}>
              Open AR file
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
        <p className="eyebrow">Generated model</p>
        <h1>Loading preview</h1>
        <p className="muted">Preparing the model viewer.</p>
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
