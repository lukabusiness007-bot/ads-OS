import Link from "next/link";
import { MarketingNav } from "@/components/marketing-nav";
import { BackToTop } from "@/components/BackToTop";
import type { SeoContentPage as SeoContentPageType } from "@/lib/seo-content";
import {
  getSeoContentPath
} from "@/lib/seo-content";
import { breadcrumbJsonLd, faqPageJsonLd, jsonLd } from "@/lib/seo";

type SeoContentPageProps = {
  page: SeoContentPageType;
};

export function SeoContentPage({ page }: SeoContentPageProps) {
  const currentPath = getSeoContentPath(page);
  const homePath = page.lang === "sr" ? "/sr" : "/";
  const homeLabel = page.lang === "sr" ? "Pocetna" : "Home";

  return (
    <div className="min-h-screen bg-[#fbfaf6]">
      <MarketingNav lang={page.lang} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(
          breadcrumbJsonLd([
            { name: homeLabel, path: homePath },
            { name: page.h1, path: currentPath }
          ])
        )}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(faqPageJsonLd(page.faqs))}
      />

      <main className="pt-24">
        <section className="mx-auto max-w-5xl px-6 py-20">
          <div className="max-w-3xl">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.14em] text-[#1f6f5b]">{page.eyebrow}</p>
            <h1 className="mb-6 text-4xl font-medium leading-tight text-[#17201a] text-balance md:text-5xl tracking-[-0.02em]" style={{ fontFamily: "var(--font-display)" }}>
              {page.h1}
            </h1>
            <p className="mb-8 max-w-2xl text-lg leading-relaxed text-[#697266]">{page.intro}</p>
            <div className="flex flex-wrap gap-3">
              <Link className="button accent" href="/contact/demo?source=seo-page">
                {page.cta}
              </Link>
              <Link className="button secondary" href="/p/northline-home/arc-oak-dining-chair">
                {page.secondaryCta}
              </Link>
            </div>
          </div>
        </section>

        <section className="border-y border-[#dce2d5] bg-[#f7f8f4]">
          <div className="mx-auto grid max-w-5xl gap-4 px-6 py-16 md:grid-cols-3">
            {page.sections.map((section) => (
              <article className="rounded-xl border border-[#dce2d5] bg-white p-6 shadow-[var(--shadow-card)]" key={section.heading}>
                <h2 className="mb-3 text-xl font-medium leading-snug text-[#17201a] tracking-[-0.02em]" style={{ fontFamily: "var(--font-display)" }}>{section.heading}</h2>
                <p className="text-sm leading-relaxed text-[#697266]">{section.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-16">
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#1f6f5b]">
                {page.lang === "sr" ? "Cesta pitanja" : "FAQ"}
              </p>
              <h2 className="text-3xl font-medium text-[#17201a] tracking-[-0.02em]" style={{ fontFamily: "var(--font-display)" }}>
                {page.lang === "sr" ? "Sta prodavci najcesce pitaju" : "What store owners usually ask"}
              </h2>
            </div>
            <div className="space-y-3">
              {page.faqs.map((faq) => (
                <details
                  className="group rounded-xl border border-[#dce2d5] bg-white px-6 py-5 shadow-[var(--shadow-card)] open:shadow-[var(--shadow-raised)]"
                  key={faq.question}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-[#17201a]">
                    {faq.question}
                    <span className="shrink-0 text-lg leading-none text-[#697266] transition-transform group-open:rotate-180">
                      ↓
                    </span>
                  </summary>
                  <p className="mt-4 text-sm leading-relaxed text-[#697266]">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#17201a] text-white">
          <div className="mx-auto flex max-w-5xl flex-col gap-5 px-6 py-14 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="mb-2 text-2xl font-medium tracking-[-0.02em]" style={{ fontFamily: "var(--font-display)" }}>
                {page.lang === "sr" ? "Pocnite sa jednim proizvodom." : "Start with one product."}
              </h2>
              <p className="max-w-xl text-white/60">
                {page.lang === "sr"
                  ? "Pokazite kupcu kako proizvod izgleda u prostoru, zatim pratite da li se vraca ka prodavnici."
                  : "Show shoppers what the product looks like in their room, then track whether they return to your store."}
              </p>
            </div>
            <Link
              className="button"
              href="/contact/demo?source=seo-final"
              style={{ background: "#ffffff", borderColor: "#ffffff", color: "#0c3b2e" }}
            >
              {page.cta}
            </Link>
          </div>
        </section>
      </main>
      <BackToTop />
    </div>
  );
}
