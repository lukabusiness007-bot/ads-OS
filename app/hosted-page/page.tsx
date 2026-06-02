import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ModelViewer } from "@/components/ModelViewer";
import { products } from "@/lib/mock-data";
import { formatMeters } from "@/lib/ui";

export default function HostedPageSettingsPage() {
  const product = products[0];
  const hostedPage = product.hostedPage;

  return (
    <AppShell>
      <header>
        <p className="eyebrow">Hosted page settings</p>
        <h1>Prepare the public product page</h1>
        <p className="muted">The link is ready to configure, but publishing remains locked until approval.</p>
      </header>

      <section className="grid two">
        <form className="panel form">
          <h2>Page content</h2>
          <div className="field">
            <label htmlFor="page-title">Product title</label>
            <input id="page-title" defaultValue={product.name} />
          </div>
          <div className="field">
            <label htmlFor="page-description">Description</label>
            <textarea id="page-description" defaultValue={product.description} />
          </div>
          <div className="field">
            <label htmlFor="cta">CTA button</label>
            <select id="cta" defaultValue={hostedPage?.ctaLabel}>
              <option>View on store</option>
              <option>Buy on merchant site</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="url">Public URL</label>
            <input id="url" readOnly value={hostedPage?.publicUrl ?? "Locked until approval"} />
          </div>
          <Link className="button secondary" href="/p/northline-home/arc-oak-dining-chair">
            Preview hosted page
          </Link>
        </form>

        <aside className="panel stack">
          <h2>Public preview</h2>
          <ModelViewer asset={product.modelAsset} alt={`${product.name} hosted 3D model`} />
          <h3>{product.name}</h3>
          <p className="muted">{product.description}</p>
          <p className="muted">
            {formatMeters(product.dimensions.width)} x {formatMeters(product.dimensions.height)} x{" "}
            {formatMeters(product.dimensions.depth)}
          </p>
          <span className="badge success">3D preview generated and verified</span>
        </aside>
      </section>

      {product.analytics && (
        <section className="panel stack">
          <div>
            <h2>Analytics v1</h2>
            <p className="muted">Product-level engagement tracked from the hosted page.</p>
          </div>
          <div className="analyticsList">
            <div>
              <span className="muted">Page views</span>
              <strong>{product.analytics.pageViews.toLocaleString()}</strong>
            </div>
            <div>
              <span className="muted">Viewer interactions</span>
              <strong>{product.analytics.viewerInteractions.toLocaleString()}</strong>
            </div>
            <div>
              <span className="muted">AR button clicks</span>
              <strong>{product.analytics.arButtonClicks.toLocaleString()}</strong>
            </div>
            <div>
              <span className="muted">CTA clicks</span>
              <strong>{product.analytics.ctaClicks.toLocaleString()}</strong>
            </div>
          </div>
          <div className="assetGrid">
            {product.analytics.topDevices.map((device) => (
              <span className="badge neutral" key={device.type}>
                {device.type}: {device.share}%
              </span>
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}
