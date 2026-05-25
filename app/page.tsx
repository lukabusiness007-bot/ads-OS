import Link from "next/link";
import { ProductTable } from "@/components/ProductTable";
import { ViewerMock } from "@/components/ViewerMock";
import { pricingPackages, products } from "@/lib/mock-data";

const workflow = ["Add product", "Upload photos", "Review model", "Publish link", "Track results"];
const trustItems = [
  "Built for furniture and home decor",
  "Human-reviewed models",
  "Hosted product links",
  "AR and store-click analytics"
];

export default function LandingPage() {
  const sampleProduct = products[0];

  return (
    <main className="marketingPage">
      <header className="marketingNav">
        <Link className="brandLockup" href="/">
          <span className="brandMark">AR</span>
          <span>Veridian AR Commerce</span>
        </Link>
        <nav aria-label="Public navigation">
          <Link href="/p/northline-home/arc-oak-dining-chair">Sample page</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link className="button accent" href="/dashboard">
            Book pilot demo
          </Link>
        </nav>
      </header>

      <section className="heroSection">
        <div className="heroCopy">
          <p className="eyebrow">Without hiring a 3D team</p>
          <h1>Verified AR product pages for furniture stores</h1>
          <p className="heroLead">
            Upload product photos, get a quality-checked 3D/AR product page, and give shoppers a clearer way to
            understand size, scale, and detail before they buy.
          </p>
          <div className="ctaRow">
            <Link className="button accent" href="/dashboard">
              Book pilot demo
            </Link>
            <Link className="button secondary" href="/p/northline-home/arc-oak-dining-chair">
              See sample product page
            </Link>
          </div>
          <div className="trustStrip" aria-label="Trust signals">
            {trustItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>

        <div className="heroVisual" aria-label="Sample hosted product page preview">
          <div className="browserBar">
            <span />
            <span />
            <span />
            <strong>veridian.page/northline/arc-oak-chair</strong>
          </div>
          <div className="productPreview">
            <ViewerMock />
            <div className="previewCopy">
              <span className="badge success">3D preview generated and verified</span>
              <h2>{sampleProduct.name}</h2>
              <p className="muted">Solid oak dining chair with curved back support.</p>
              <div className="miniStats">
                <div>
                  <dt>AR clicks</dt>
                  <dd>{sampleProduct.analytics?.arButtonClicks}</dd>
                </div>
                <div>
                  <dt>Store clicks</dt>
                  <dd>{sampleProduct.analytics?.ctaClicks}</dd>
                </div>
              </div>
              <Link className="button" href="/p/northline-home/arc-oak-dining-chair">
                View sample
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="contentBand twoColumn">
        <div>
          <p className="eyebrow">The merchant problem</p>
          <h2>Shoppers want to understand furniture spatially before they commit.</h2>
        </div>
        <div className="stack">
          <p className="muted">
            Static photos do not always communicate scale, depth, fit, or material detail. For many SMB stores, hiring
            a 3D team or managing model files adds too much operational overhead for a 10 to 25 SKU pilot.
          </p>
          <p className="muted">
            Veridian keeps the offer narrow: Upload photos. We generate, check, and host the AR product page.
          </p>
        </div>
      </section>

      <section className="contentBand">
        <div className="sectionHeader">
          <p className="eyebrow">How it works</p>
          <h2>A simple path from product photos to a live hosted page.</h2>
        </div>
        <div className="workflowGrid">
          {workflow.map((step, index) => (
            <article className="workflowStep" key={step}>
              <span>{index + 1}</span>
              <h3>{step}</h3>
              <p className="muted">{workflowCopy[index]}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="contentBand twoColumn">
        <div>
          <p className="eyebrow">What you get</p>
          <h2>Hosted links you can add to your store, ads, emails, or QR codes.</h2>
          <p className="muted">
            Give shoppers a clearer sense of size, scale, and detail before they buy, then track whether they engage and
            click back to your store.
          </p>
        </div>
        <div className="featureList">
          {[
            "Hosted public product page",
            "3D viewer and AR launch where supported",
            "Merchant CTA back to store",
            "3D preview generated and verified",
            "Product-level analytics"
          ].map((item) => (
            <div className="checkCard" key={item}>
              <span className="checkDot" />
              <strong>{item}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="contentBand qualityBand">
        <div className="sectionHeader">
          <p className="eyebrow">Quality and trust</p>
          <h2>Human-reviewed before publishing.</h2>
          <p className="muted">
            Veridian checks model resemblance, scale, orientation, file loading, and AR readiness before a page goes
            live. The promise is a verified visual AR preview, not exact CAD or manufacturing geometry.
          </p>
        </div>
        <div className="qualityGrid">
          {["Resemblance", "Scale", "Orientation", "File loading", "AR readiness"].map((item) => (
            <article className="qualityItem" key={item}>
              <strong>{item}</strong>
              <span className="badge success">Checked</span>
            </article>
          ))}
        </div>
      </section>

      <section className="contentBand">
        <div className="sectionHeader">
          <p className="eyebrow">Dashboard preview</p>
          <h2>Pilot Command Center</h2>
          <p className="muted">
            Catalog status, next actions, published pages, AR clicks, CTA clicks, and plan usage stay visible on one
            merchant workspace.
          </p>
        </div>
        <div className="dashboardPreview">
          <div className="grid four">
            <article className="metricTile">
              <span>Published pages</span>
              <strong>1 / 25</strong>
            </article>
            <article className="metricTile">
              <span>AR clicks</span>
              <strong>188</strong>
            </article>
            <article className="metricTile">
              <span>Store clicks</span>
              <strong>94</strong>
            </article>
            <article className="metricTile">
              <span>Next actions</span>
              <strong>2</strong>
            </article>
          </div>
          <ProductTable />
        </div>
      </section>

      <section className="contentBand twoColumn">
        <div>
          <p className="eyebrow">Pilot offer</p>
          <h2>Built for the first 10 to 25 furniture or home decor SKUs.</h2>
          <p className="muted">
            Pricing is predictable: a per-approved-model fee plus a monthly hosted-page subscription.
          </p>
        </div>
        <div className="pricingGrid compactPricing">
          {pricingPackages.slice(0, 3).map((item) => (
            <article className="priceTile" key={item.id}>
              <h3>{item.name}</h3>
              <strong>{item.priceRangeEur}</strong>
              <span>{item.billingUnit}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="contentBand faqSection">
        <div className="sectionHeader">
          <p className="eyebrow">FAQ</p>
          <h2>Answers for a paid pilot decision.</h2>
        </div>
        {faqItems.map((item) => (
          <details key={item.question}>
            <summary>{item.question}</summary>
            <p className="muted">{item.answer}</p>
          </details>
        ))}
      </section>

      <section className="finalCta">
        <p className="eyebrow">Ready for a focused pilot?</p>
        <h2>Book a pilot demo for your first 10-25 products</h2>
        <p className="muted">
          See how guided photo upload, human review, hosted links, and analytics fit into your current ecommerce
          workflow.
        </p>
        <div className="ctaRow">
          <Link className="button accent" href="/dashboard">
            Book a pilot demo
          </Link>
          <Link className="button secondary" href="/p/northline-home/arc-oak-dining-chair">
            See sample product page
          </Link>
        </div>
      </section>
    </main>
  );
}

const workflowCopy = [
  "Enter the product name, dimensions, category, and store URL.",
  "Use a guided checklist for front, back, side, angled, detail, and scale photos.",
  "Review the visual preview after Veridian generation and manual quality checks.",
  "Publish a hosted product link after approval.",
  "Track page views, AR clicks, and clicks back to your store."
];

const faqItems = [
  {
    question: "Will this increase buyer confidence enough to matter?",
    answer:
      "The pilot is designed to test clearer product understanding: size and scale confidence, 3D viewer engagement, AR clicks, and clicks back to your store. We do not promise guaranteed conversion lift."
  },
  {
    question: "How hard is setup for my team?",
    answer:
      "Your team adds a product, uploads guided photos, reviews the preview, publishes the link, and tracks results. No internal 3D team is required."
  },
  {
    question: "What happens if the model quality is bad?",
    answer:
      "A human reviewer checks each model before publishing. If resemblance, scale, orientation, loading, or AR readiness is not acceptable, the page stays unpublished while the model is revised or regenerated."
  },
  {
    question: "How predictable is pricing?",
    answer:
      "A typical pilot uses a per-approved-model fee and a monthly hosted-page subscription. Starter models are 30 to 50 EUR, standard verified models are 70 to 120 EUR, and hosted pages are 49 to 99 EUR per month."
  },
  {
    question: "How do I prove this is working?",
    answer:
      "The dashboard tracks page views, viewer interactions, AR clicks, store CTA clicks, and device mix by product, so you can compare engagement across pilot SKUs."
  },
  {
    question: "Doesn't Shopify already display 3D models?",
    answer:
      "Shopify can display 3D models if you already have the right files. Veridian helps create, check, host, publish, and measure AR product pages without asking your team to manage a 3D pipeline."
  }
];
