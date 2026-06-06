import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MarketingNav } from "@/components/marketing-nav"
import { BackToTop } from "@/components/BackToTop"
import { billingTiers, modelCreationAddons, overagePrices } from "@/lib/mock-data"
import { CheckCircle2, ArrowRight } from "lucide-react"
import {
  breadcrumbJsonLd,
  buildSeoMetadata,
  faqPageJsonLd,
  jsonLd,
  marketingAlternates,
  webApplicationJsonLd
} from "@/lib/seo"

export const metadata: Metadata = buildSeoMetadata({
  title: "Furniture AR Pricing For 3D Product Pages",
  description:
    "Start with 10 furniture products and prove shopper engagement before scaling. Augmenta pricing combines hosted AR pages with approved model creation.",
  path: "/pricing",
  lang: "en",
  alternates: marketingAlternates("/pricing", "/sr/pricing")
})

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(webApplicationJsonLd("en", "/pricing"))} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Pricing", path: "/pricing" }
          ])
        )}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(faqPageJsonLd([
          {
            question: "Is model creation billed separately from hosting?",
            answer: "Yes. The monthly subscription covers hosted pages, AR viewer, and analytics. Model creation is a separate one-time fee per approved SKU.",
          },
          {
            question: "What if a model fails quality review?",
            answer: "The page stays unpublished and we revise or regenerate the model. You are only charged for approved, published models.",
          },
          {
            question: "Can I start with fewer SKUs?",
            answer: "Absolutely. The Starter plan covers up to 5 published SKUs. You can upgrade at any time as your catalog grows.",
          },
        ]))}
      />
      <MarketingNav lang="en" />

      <main className="pt-24">
        {/* ─── Header ─────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-6 py-20 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-4">
            Pricing
          </p>
          <h1 className="text-4xl font-semibold md:text-5xl text-zinc-900 text-balance leading-tight mb-5">
            Start with 10 furniture products. Prove engagement before scaling.
          </h1>
          <p className="text-lg text-zinc-500 max-w-xl mx-auto leading-relaxed">
            A monthly subscription for hosted AR pages plus a per-approved-model fee for 3D creation. Simple enough to test before you roll it across the catalog.
          </p>
        </section>

        {/* ─── Subscription Plans ──────────────────────────────────────── */}
        <section className="bg-zinc-50 border-y border-dashed border-zinc-200">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <div className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-3">
                Monthly subscription
              </p>
              <h2 className="text-3xl font-semibold text-zinc-900 mb-3">
                Pick the plan that fits your catalog
              </h2>
              <p className="text-zinc-500 max-w-lg mx-auto">
                All plans include hosted product pages, 3D viewer, app-free AR, and engagement analytics.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {billingTiers.map((tier) => (
                <article
                  key={tier.id}
                  className={`relative flex flex-col rounded-2xl border p-6 shadow-sm transition-shadow hover:shadow-md ${
                    tier.recommended
                      ? "border-emerald-400 bg-emerald-950 text-white"
                      : "border-zinc-200 bg-white"
                  }`}
                >
                  {tier.recommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-emerald-400 text-emerald-950 text-xs font-bold px-3 py-1 rounded-full">
                        Most popular
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className={`font-bold text-lg mb-1 ${tier.recommended ? "text-white" : "text-zinc-900"}`}>
                      {tier.name}
                    </h3>
                    <p className={`text-xs leading-relaxed ${tier.recommended ? "text-emerald-200" : "text-zinc-500"}`}>
                      {tier.positioning}
                    </p>
                  </div>

                  <div className="mb-6">
                    {tier.monthlyUsd ? (
                      <>
                        <span className={`text-4xl font-bold ${tier.recommended ? "text-white" : "text-zinc-900"}`}>
                          €{tier.monthlyUsd}
                        </span>
                        <span className={`text-sm ml-1 ${tier.recommended ? "text-emerald-300" : "text-zinc-400"}`}>
                          / month
                        </span>
                      </>
                    ) : (
                      <span className={`text-2xl font-bold ${tier.recommended ? "text-white" : "text-zinc-900"}`}>
                        Custom quote
                      </span>
                    )}
                  </div>

                  {/* Limits */}
                  <div className={`grid grid-cols-1 gap-2 mb-6 p-3 rounded-xl text-xs ${tier.recommended ? "bg-emerald-900" : "bg-zinc-50 border border-zinc-100"}`}>
                    {tier.publishedSkuLimit && (
                      <div className="flex justify-between">
                        <span className={tier.recommended ? "text-emerald-300" : "text-zinc-500"}>Published SKUs</span>
                        <span className={`font-bold ${tier.recommended ? "text-white" : "text-zinc-800"}`}>{tier.publishedSkuLimit}</span>
                      </div>
                    )}
                    {tier.monthlyViewLimit && (
                      <div className="flex justify-between">
                        <span className={tier.recommended ? "text-emerald-300" : "text-zinc-500"}>Monthly views</span>
                        <span className={`font-bold ${tier.recommended ? "text-white" : "text-zinc-800"}`}>{tier.monthlyViewLimit.toLocaleString()}</span>
                      </div>
                    )}
                    {tier.storageGb && (
                      <div className="flex justify-between">
                        <span className={tier.recommended ? "text-emerald-300" : "text-zinc-500"}>Storage</span>
                        <span className={`font-bold ${tier.recommended ? "text-white" : "text-zinc-800"}`}>{tier.storageGb} GB</span>
                      </div>
                    )}
                    {!tier.publishedSkuLimit && (
                      <div className="flex justify-between">
                        <span className={tier.recommended ? "text-emerald-300" : "text-zinc-500"}>SKUs / Views</span>
                        <span className={`font-bold ${tier.recommended ? "text-white" : "text-zinc-800"}`}>Custom</span>
                      </div>
                    )}
                  </div>

                  {/* Features list */}
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {tier.includes.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${tier.recommended ? "text-emerald-400" : "text-emerald-600"}`} />
                        <span className={`text-sm ${tier.recommended ? "text-emerald-100" : "text-zinc-600"}`}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    asChild
                    className={
                      tier.recommended
                        ? "bg-white text-emerald-950 hover:bg-emerald-50"
                        : tier.id === "business"
                        ? "bg-zinc-900 text-white hover:bg-zinc-800"
                        : ""
                    }
                    variant={tier.recommended || tier.id === "business" ? "default" : "outline"}
                  >
                    <Link href={getPricingCtaHref(tier.id, Boolean(tier.monthlyUsd))}>
                      {tier.monthlyUsd ? "Get started" : "Contact us"}
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Model Creation Add-ons ──────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-3">
              Per-model fee
            </p>
            <h2 className="text-3xl font-semibold text-zinc-900 mb-3">
              3D model creation add-ons
            </h2>
            <p className="text-zinc-500 max-w-lg mx-auto">
              Charged once per approved model. Pick the level that matches your product complexity and visual quality needs.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {modelCreationAddons.map((addon, i) => (
              <article
                key={addon.id}
                className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-100 text-xs font-bold text-zinc-700">
                    {i + 1}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-1">
                    {addon.buyerFit}
                  </span>
                </div>
                <h3 className="font-bold text-zinc-900 mb-2">{addon.name}</h3>
                <p className="text-2xl font-bold text-zinc-900 mb-1">{addon.priceUsd}</p>
                <p className="text-sm text-zinc-500 leading-relaxed">{addon.useCase}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ─── Overage Pricing ─────────────────────────────────────────── */}
        <section className="bg-zinc-50 border-y border-dashed border-zinc-200">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <div className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-3">
                Usage overages
              </p>
              <h2 className="text-3xl font-semibold text-zinc-900 mb-3">
                Go beyond your plan when needed
              </h2>
              <p className="text-zinc-500 max-w-lg mx-auto">
                Overages are billed predictably so you are never blocked and never surprised.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 max-w-3xl mx-auto">
              {overagePrices.map((overage) => (
                <div
                  key={overage.id}
                  className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm"
                >
                  <h3 className="font-semibold text-zinc-900 mb-1 text-sm">{overage.name}</h3>
                  <p className="text-2xl font-bold text-zinc-900 mb-1">€{overage.priceUsd}</p>
                  <p className="text-xs text-emerald-700 font-semibold mb-3">{overage.unit}</p>
                  <p className="text-xs text-zinc-500 leading-relaxed">{overage.guardrail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Typical Pilot Estimate ──────────────────────────────────── */}
        <section className="mx-auto max-w-3xl px-6 py-20">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-3">
              Typical pilot estimate
            </p>
            <h2 className="text-2xl font-semibold text-zinc-900">
              15 SKUs on Growth — what does month one actually cost?
            </h2>
          </div>
          <div className="rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-zinc-100 bg-white">
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-zinc-600 text-sm">Growth plan (hosting)</span>
                <span className="font-semibold text-zinc-900">€89</span>
              </div>
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-zinc-600 text-sm">15 × Commerce-ready model creation</span>
                <span className="font-semibold text-zinc-900">15 × €149 = €2,235</span>
              </div>
              <div className="flex items-center justify-between px-6 py-4 bg-zinc-50">
                <span className="font-bold text-zinc-900 text-sm">First-month total</span>
                <span className="font-bold text-zinc-900 text-xl">€2,324</span>
              </div>
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-zinc-500 text-sm">From month 2 onwards</span>
                <span className="font-semibold text-zinc-400">€89 / month</span>
              </div>
            </div>
            <div className="px-6 py-5 bg-emerald-50 border-t border-emerald-100">
              <p className="text-sm text-emerald-800 leading-relaxed">
                <strong>ROI context:</strong> A single avoided return on a €500 sofa saves €75–125 in logistics and handling.
                The pilot typically recoups model creation cost within 2–4 avoided returns.
              </p>
            </div>
          </div>
          <p className="text-xs text-zinc-400 mt-4 text-center">
            Model creation is a one-time fee per approved SKU. Hosting renews monthly.
          </p>
        </section>

        {/* ─── FAQ row ─────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-6 py-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-semibold text-zinc-900">Common pricing questions</h2>
          </div>
          <div className="space-y-3 max-w-2xl mx-auto">
            {[
              {
                q: "Is model creation billed separately from hosting?",
                a: "Yes. The monthly subscription covers hosted pages, AR viewer, and analytics. Model creation is a separate one-time fee per approved SKU.",
              },
              {
                q: "What if a model fails quality review?",
                a: "The page stays unpublished and we revise or regenerate the model. You are only charged for approved, published models.",
              },
              {
                q: "Can I start with fewer SKUs?",
                a: "Absolutely. The Starter plan covers up to 5 published SKUs. You can upgrade at any time as your catalog grows.",
              },
            ].map((item) => (
              <details
                key={item.q}
                className="group bg-white border border-zinc-200 rounded-xl px-6 py-5 shadow-sm open:shadow-md transition-shadow"
              >
                <summary className="cursor-pointer font-semibold text-zinc-900 list-none flex items-center justify-between gap-4 text-sm">
                  {item.q}
                  <span className="shrink-0 text-zinc-400 group-open:rotate-180 transition-transform text-lg leading-none">
                    ↓
                  </span>
                </summary>
                <p className="mt-4 text-zinc-500 leading-relaxed text-sm">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ─── Final CTA ───────────────────────────────────────────────── */}
        <section className="bg-emerald-950 text-white">
          <div className="mx-auto max-w-3xl px-6 py-24 text-center space-y-6">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Ready to start?
            </p>
            <h2 className="text-3xl font-semibold leading-snug">
              Book a pilot demo for your first 10–25 products
            </h2>
            <p className="text-emerald-200 leading-relaxed max-w-lg mx-auto">
              See how guided photo upload, human review, hosted links, and analytics fit into your current ecommerce workflow.
            </p>
            <div className="flex flex-wrap gap-3 justify-center pt-2">
              <Button asChild size="lg" className="bg-white text-emerald-900 hover:bg-emerald-50">
                <Link href="/contact/demo?source=pricing">Book a pilot demo</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-emerald-700 bg-transparent text-white hover:bg-emerald-900"
              >
                <Link href="/p/northline-home/arc-oak-dining-chair">
                  See a furniture demo
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <BackToTop />
    </div>
  )
}

function getPricingCtaHref(tierId: string, isSelfServe: boolean) {
  if (!isSelfServe || tierId === "business") {
    return `/contact/demo?plan=${encodeURIComponent(tierId)}`;
  }

  return `/login?intent=${encodeURIComponent(tierId)}`;
}
