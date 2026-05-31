"use client"

import { useRef, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { organization } from "@/lib/mock-data";
import { useLang } from "@/lib/lang";

const categories = ["chair", "table", "sofa", "lamp", "shelf", "small_decor"];

export default function CreateProductPage() {
  const { tr } = useLang();
  const c = tr.create;
  const [uploads, setUploads] = useState<(File | null)[]>(Array(7).fill(null));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handleFile(index: number, file: File | undefined) {
    setUploads(prev => prev.map((f, i) => i === index ? (file ?? null) : f));
  }

  return (
    <AppShell>
      <header className="topbar">
        <div>
          <p className="eyebrow">{c.eyebrow}</p>
          <h1>{c.heading}</h1>
          <p className="muted">{c.subtitle}</p>
        </div>
        <Link className="button secondary" href="/dashboard">
          {c.backBtn}
        </Link>
      </header>

      <section className="flowProgress" aria-label={c.eyebrow}>
        {c.steps.map((step, index) => (
          <div className={index < 3 ? "flowStep complete" : index === 3 ? "flowStep active" : "flowStep"} key={step}>
            <span>{index + 1}</span>
            <strong>{step}</strong>
          </div>
        ))}
      </section>

      <section className="grid two">
        <form className="panel form">
          <h2>{c.detailsHeading}</h2>
          <div className="field">
            <label htmlFor="product-name">{c.productName}</label>
            <input id="product-name" defaultValue="Arc Oak Dining Chair" />
          </div>
          <div className="field">
            <label htmlFor="category">{c.category}</label>
            <select id="category" defaultValue="chair">
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="description">{c.description}</label>
            <textarea id="description" defaultValue="Solid oak dining chair with curved back support." />
          </div>

          <h2>{c.dimensionsHeading}</h2>
          <div className="grid three">
            <div className="field">
              <label htmlFor="width">{c.width}</label>
              <input id="width" inputMode="decimal" defaultValue="48" />
            </div>
            <div className="field">
              <label htmlFor="height">{c.height}</label>
              <input id="height" inputMode="decimal" defaultValue="82" />
            </div>
            <div className="field">
              <label htmlFor="depth">{c.depth}</label>
              <input id="depth" inputMode="decimal" defaultValue="52" />
            </div>
          </div>

          <h2>{c.storeUrlHeading}</h2>
          <div className="field">
            <label htmlFor="customer-url">{c.storeUrl}</label>
            <input id="customer-url" defaultValue="https://northline.example/products/arc-oak-chair" />
          </div>
          <div className="field">
            <label htmlFor="price">{c.price}</label>
            <input id="price" defaultValue="89 EUR" />
          </div>

          <button className="button accent" type="button">
            {c.submitBtn}
          </button>
        </form>

        <aside className="panel stack">
          <div>
            <p className="eyebrow">{c.photoEyebrow}</p>
            <h2>{c.photoHeading}</h2>
            <p className="muted">{c.photoDesc}</p>
          </div>
          <div className="photoChecklist">
            {c.photoChecklist.map(([title, detail], index) => (
              <div className={index < 5 ? "uploadSlot ready" : "uploadSlot"} key={title}>
                <span>{index < 5 ? c.ready : c.needed}</span>
                <strong>{title}</strong>
                <p className="muted">{detail}</p>
                <input
                  ref={el => { inputRefs.current[index] = el; }}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: "none" }}
                  onChange={e => handleFile(index, e.target.files?.[0])}
                />
                <div className="uploadSlotActions">
                  {uploads[index] && (
                    <span className="uploadFileName">{uploads[index]!.name}</span>
                  )}
                  <button
                    type="button"
                    className="button secondary sm"
                    onClick={() => inputRefs.current[index]?.click()}
                  >
                    {uploads[index] ? c.changeBtn : c.uploadBtn}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="assumptionNote">
            {c.assumptionNote(organization.name)}
          </div>
        </aside>
      </section>
    </AppShell>
  );
}
