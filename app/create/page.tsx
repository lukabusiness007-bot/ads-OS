import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { organization } from "@/lib/mock-data";

const categories = ["chair", "table", "sofa", "lamp", "shelf", "small_decor"];
const steps = ["Product details", "Dimensions", "Store URL", "Guided photo upload", "Submit for review"];
const photoChecklist = [
  ["Front", "Straight-on product photo"],
  ["Back", "Rear view with the full outline visible"],
  ["Left side", "Side profile for depth and legs or arms"],
  ["Right side", "Opposite side profile"],
  ["Top or angled view", "Shows depth, seat, surface, or shade shape"],
  ["Material/detail shots", "Close-ups of fabric, wood grain, hardware, or texture"],
  ["Scale/context shot", "Optional room or hand-scale photo when useful"]
];

export default function CreateProductPage() {
  return (
    <AppShell>
      <header className="topbar">
        <div>
          <p className="eyebrow">Create AR Page</p>
          <h1>Guided product setup</h1>
          <p className="muted">
            Add the product, upload the required photos, then submit it for generation and human quality review.
          </p>
        </div>
        <Link className="button secondary" href="/dashboard">
          Back to products
        </Link>
      </header>

      <section className="flowProgress" aria-label="Create AR page progress">
        {steps.map((step, index) => (
          <div className={index < 3 ? "flowStep complete" : index === 3 ? "flowStep active" : "flowStep"} key={step}>
            <span>{index + 1}</span>
            <strong>{step}</strong>
          </div>
        ))}
      </section>

      <section className="grid two">
        <form className="panel form">
          <h2>Product details</h2>
          <div className="field">
            <label htmlFor="product-name">Product name</label>
            <input id="product-name" defaultValue="Arc Oak Dining Chair" />
          </div>
          <div className="field">
            <label htmlFor="category">Product category</label>
            <select id="category" defaultValue="chair">
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="description">Short product description</label>
            <textarea id="description" defaultValue="Solid oak dining chair with curved back support." />
          </div>

          <h2>Dimensions</h2>
          <div className="grid three">
            <div className="field">
              <label htmlFor="width">Width cm</label>
              <input id="width" inputMode="decimal" defaultValue="48" />
            </div>
            <div className="field">
              <label htmlFor="height">Height cm</label>
              <input id="height" inputMode="decimal" defaultValue="82" />
            </div>
            <div className="field">
              <label htmlFor="depth">Depth cm</label>
              <input id="depth" inputMode="decimal" defaultValue="52" />
            </div>
          </div>

          <h2>Store URL</h2>
          <div className="field">
            <label htmlFor="customer-url">Product page on your store</label>
            <input id="customer-url" defaultValue="https://northline.example/products/arc-oak-chair" />
          </div>
          <div className="field">
            <label htmlFor="price">Display price optional</label>
            <input id="price" defaultValue="89 EUR" />
          </div>

          <button className="button accent" type="button">
            Submit for generation and review
          </button>
        </form>

        <aside className="panel stack">
          <div>
            <p className="eyebrow">Guided photo upload</p>
            <h2>Photos needed before generation</h2>
            <p className="muted">
              Use clear, well-lit photos against a simple background. Your page will not publish until the model passes
              review.
            </p>
          </div>
          <div className="photoChecklist">
            {photoChecklist.map(([title, detail], index) => (
              <div className={index < 5 ? "uploadSlot ready" : "uploadSlot"} key={title}>
                <span>{index < 5 ? "Ready" : "Needed"}</span>
                <strong>{title}</strong>
                <p className="muted">{detail}</p>
              </div>
            ))}
          </div>
          <div className="assumptionNote">
            {organization.name} has enough core angles to start, but material/detail and scale photos improve the
            reviewer confidence score.
          </div>
        </aside>
      </section>
    </AppShell>
  );
}
