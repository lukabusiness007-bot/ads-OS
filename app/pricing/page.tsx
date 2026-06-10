import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MarketingNav } from "@/components/marketing-nav"
import { BackToTop } from "@/components/BackToTop"
import { billingTiers, generationTopUps, modelCreationAddons, overagePrices, SETUP_FEE_EUR } from "@/lib/mock-data"
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
    <div className="min-h-screen bg-[#fbfaf6]">
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
            question: "How do model generations and top-ups work?",
            answer: "Each plan includes a set number of model generations per month — upload a product's photos and we generate its 3D/AR model. Need more than your plan includes? Buy a generation top-up pack; the credits carry over and never expire.",
          },
          {
            question: "Do you charge a fee on my sales?",
            answer: "No. Pricing is a flat monthly plan plus optional top-ups. We never take a percentage of your revenue.",
          },
          {
            question: "What is the setup fee for?",
            answer: "A one-time €99 onboarding: account setup, embed install help, and your first models reviewed with you. It is waived when you pay annually.",
          },
        ]))}
      />
      <MarketingNav lang="en" />

      <main className="pt-24">
        {/* ─── Header ─────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-6 py-20 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1f6f5b] mb-4">
            Pricing
          </p>
          <h1 className="text-4xl font-medium md:text-5xl text-[#17201a] text-balance leading-tight tracking-[-0.02em] mb-5" style={{ fontFamily: "var(--font-display)" }}>
            Self-serve AR for your products. Upload photos, go live in days.
          </h1>
          <p className="text-lg text-[#697266] max-w-xl mx-auto leading-relaxed">
            Every plan includes monthly model generations, hosted AR pages, and analytics. Need more models? Add a top-up pack anytime. Flat price — we never take a cut of your sales.
          </p>
        </section>

        {/* ─── Subscription Plans ──────────────────────────────────────── */}
        <section className="bg-[#f7f8f4] border-y border-[#dce2d5]">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <div className="text-center mb-12">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1f6f5b] mb-3">
                Monthly subscription
              </p>
              <h2 className="text-3xl font-medium text-[#17201a] mb-3 tracking-[-0.02em]" style={{ fontFamily: "var(--font-display)" }}>
                Pick the plan that fits your catalog
              </h2>
              <p className="text-[#697266] max-w-lg mx-auto">
                All plans include hosted product pages, 3D viewer, app-free AR, and engagement analytics.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {billingTiers.map((tier) => (
                <article
                  key={tier.id}
                  className={`relative flex flex-col rounded-2xl border p-6 transition-shadow hover:shadow-[var(--shadow-raised)] ${
                    tier.recommended
                      ? "border-[#1f6f5b] bg-[#17201a] text-white"
                      : "border-[#dce2d5] bg-white shadow-[var(--shadow-card)]"
                  }`}
                >
                  {tier.recommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-[#6ee7b7] text-[#0c3b2e] text-xs font-bold px-3 py-1 rounded-full">
                        Most popular
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className={`font-semibold text-lg mb-1 ${tier.recommended ? "text-white" : "text-[#17201a]"}`}>
                      {tier.name}
                    </h3>
                    <p className={`text-xs leading-relaxed ${tier.recommended ? "text-[#6ee7b7]/70" : "text-[#697266]"}`}>
                      {tier.positioning}
                    </p>
                  </div>

                  <div className="mb-6">
                    {tier.monthlyUsd ? (
                      <>
                        <span className={`text-4xl font-bold ${tier.recommended ? "text-white" : "text-[#17201a]"}`}>
                          €{tier.monthlyUsd}
                        </span>
                        <span className={`text-sm ml-1 ${tier.recommended ? "text-[#6ee7b7]/80" : "text-[#697266]/70"}`}>
                          / month
                        </span>
                      </>
                    ) : (
                      <span className={`text-2xl font-bold ${tier.recommended ? "text-white" : "text-[#17201a]"}`}>
                        Custom quote
                      </span>
                    )}
                    {tier.monthlyUsd && (
                      <p className={`text-xs mt-1.5 ${tier.recommended ? "text-[#6ee7b7]/70" : "text-[#697266]/70"}`}>
                        {tier.setupFeeEur ? `+ €${tier.setupFeeEur} one-time setup` : "Setup included"}
                        {tier.setupFeeEur ? " · waived on annual" : ""}
                      </p>
                    )}
                  </div>

                  {/* Limits */}
                  <div className={`grid grid-cols-1 gap-2 mb-6 p-3 rounded-xl text-xs ${tier.recommended ? "bg-white/8" : "bg-[#f7f8f4] border border-[#dce2d5]"}`}>
                    {tier.includedGenerations != null && (
                      <div className="flex justify-between">
                        <span className={tier.recommended ? "text-[#6ee7b7]/80" : "text-[#697266]"}>Generations / mo</span>
                        <span className={`font-bold ${tier.recommended ? "text-white" : "text-[#17201a]"}`}>{tier.includedGenerations}</span>
                      </div>
                    )}
                    {tier.publishedSkuLimit && (
                      <div className="flex justify-between">
                        <span className={tier.recommended ? "text-[#6ee7b7]/80" : "text-[#697266]"}>Published products</span>
                        <span className={`font-bold ${tier.recommended ? "text-white" : "text-[#17201a]"}`}>{tier.publishedSkuLimit}</span>
                      </div>
                    )}
                    {tier.monthlyViewLimit && (
                      <div className="flex justify-between">
                        <span className={tier.recommended ? "text-[#6ee7b7]/80" : "text-[#697266]"}>Monthly views</span>
                        <span className={`font-bold ${tier.recommended ? "text-white" : "text-[#17201a]"}`}>{tier.monthlyViewLimit.toLocaleString()}</span>
                      </div>
                    )}
                    {tier.storageGb && (
                      <div className="flex justify-between">
                        <span className={tier.recommended ? "text-[#6ee7b7]/80" : "text-[#697266]"}>Storage</span>
                        <span className={`font-bold ${tier.recommended ? "text-white" : "text-[#17201a]"}`}>{tier.storageGb} GB</span>
                      </div>
                    )}
                    {!tier.publishedSkuLimit && (
                      <div className="flex justify-between">
                        <span className={tier.recommended ? "text-[#6ee7b7]/80" : "text-[#697266]"}>SKUs / Views</span>
                        <span className={`font-bold ${tier.recommended ? "text-white" : "text-[#17201a]"}`}>Custom</span>
                      </div>
                    )}
                  </div>

                  {/* Features list */}
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {tier.includes.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${tier.recommended ? "text-[#6ee7b7]" : "text-[#1f6f5b]"}`} />
                        <span className={`text-sm ${tier.recommended ? "text-white/85" : "text-[#697266]"}`}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    asChild
                    className={
                      tier.recommended
                        ? "bg-white text-[#0c3b2e] hover:bg-[#f7f8f4]"
                        : tier.id === "business"
                        ? "bg-[#17201a] text-white hover:bg-[#17201a]/90"
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

        {/* ─── Generation Top-Up Packs ─────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1f6f5b] mb-3">
              Need more models?
            </p>
            <h2 className="text-3xl font-medium text-[#17201a] mb-3 tracking-[-0.02em]" style={{ fontFamily: "var(--font-display)" }}>
              Generation top-up packs
            </h2>
            <p className="text-[#697266] max-w-lg mx-auto">
              Used up your monthly generations? Add a pack — credits never expire and carry over to next month. No plan change required.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3 max-w-3xl mx-auto">
            {generationTopUps.map((pack) => (
              <article
                key={pack.id}
                className={`relative rounded-2xl border p-6 transition-all ${
                  pack.recommended
                    ? "border-[#1f6f5b] bg-[#1f6f5b]/5 shadow-[var(--shadow-raised)]"
                    : "border-[#dce2d5] bg-white shadow-[var(--shadow-card)] hover:border-[#1f6f5b]/30"
                }`}
              >
                {pack.recommended && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1f6f5b] text-white text-xs font-bold px-3 py-1 rounded-full">
                    Best value
                  </span>
                )}
                <h3 className="font-semibold text-[#17201a] mb-1">{pack.name}</h3>
                <p className="text-3xl font-bold text-[#17201a]">€{pack.priceEur}</p>
                <p className="text-xs font-semibold text-[#1f6f5b] mb-3">€{pack.perModelEur.toFixed(2)} / generation</p>
                <p className="text-sm text-[#697266] leading-relaxed">{pack.note}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ─── Optional Premium Finishing ──────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1f6f5b] mb-3">
              Optional · done-for-you
            </p>
            <h2 className="text-3xl font-medium text-[#17201a] mb-3 tracking-[-0.02em]" style={{ fontFamily: "var(--font-display)" }}>
              Premium model finishing
            </h2>
            <p className="text-[#697266] max-w-lg mx-auto">
              Self-serve generation covers most products. For complex or luxury pieces, our team can hand-finish a model — charged once, only when you ask.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {modelCreationAddons.map((addon, i) => (
              <article
                key={addon.id}
                className="bg-white border border-[#dce2d5] rounded-2xl p-6 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-raised)] hover:border-[#1f6f5b]/30 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#f7f8f4] text-xs font-bold text-[#697266]">
                    {i + 1}
                  </span>
                  <span className="text-xs font-semibold text-[#1f6f5b] bg-[#1f6f5b]/8 border border-[#1f6f5b]/15 rounded-full px-2.5 py-1">
                    {addon.buyerFit}
                  </span>
                </div>
                <h3 className="font-semibold text-[#17201a] mb-2">{addon.name}</h3>
                <p className="text-2xl font-bold text-[#17201a] mb-1">{addon.priceUsd}</p>
                <p className="text-sm text-[#697266] leading-relaxed">{addon.useCase}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ─── Overage Pricing ─────────────────────────────────────────── */}
        <section className="bg-[#f7f8f4] border-y border-[#dce2d5]">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <div className="text-center mb-12">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1f6f5b] mb-3">
                Usage overages
              </p>
              <h2 className="text-3xl font-medium text-[#17201a] mb-3 tracking-[-0.02em]" style={{ fontFamily: "var(--font-display)" }}>
                Go beyond your plan when needed
              </h2>
              <p className="text-[#697266] max-w-lg mx-auto">
                Overages are billed predictably so you are never blocked and never surprised.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 max-w-3xl mx-auto">
              {overagePrices.map((overage) => (
                <div
                  key={overage.id}
                  className="bg-white border border-[#dce2d5] rounded-xl p-5 shadow-[var(--shadow-card)]"
                >
                  <h3 className="font-semibold text-[#17201a] mb-1 text-sm">{overage.name}</h3>
                  <p className="text-2xl font-bold text-[#17201a] mb-1">€{overage.priceUsd}</p>
                  <p className="text-xs text-[#1f6f5b] font-semibold mb-3">{overage.unit}</p>
                  <p className="text-xs text-[#697266] leading-relaxed">{overage.guardrail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Typical Pilot Estimate ──────────────────────────────────── */}
        <section className="mx-auto max-w-3xl px-6 py-20">
          <div className="text-center mb-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1f6f5b] mb-3">
              Typical pilot estimate
            </p>
            <h2 className="text-2xl font-medium text-[#17201a] tracking-[-0.02em]" style={{ fontFamily: "var(--font-display)" }}>
              15 products on Growth — what does month one actually cost?
            </h2>
          </div>
          <div className="rounded-2xl border border-[#dce2d5] shadow-[var(--shadow-card)] overflow-hidden">
            <div className="divide-y divide-[#dce2d5] bg-white">
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-[#697266] text-sm">Growth plan (includes 20 generations)</span>
                <span className="font-semibold text-[#17201a]">€69</span>
              </div>
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-[#697266] text-sm">One-time setup &amp; onboarding</span>
                <span className="font-semibold text-[#17201a]">€{SETUP_FEE_EUR}</span>
              </div>
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-[#697266] text-sm">15 model generations</span>
                <span className="font-semibold text-[#1f6f5b]">Included</span>
              </div>
              <div className="flex items-center justify-between px-6 py-4 bg-[#f7f8f4]">
                <span className="font-bold text-[#17201a] text-sm">First-month total</span>
                <span className="font-bold text-[#17201a] text-xl">€{69 + SETUP_FEE_EUR}</span>
              </div>
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-[#697266] text-sm">From month 2 onwards</span>
                <span className="font-semibold text-[#697266]/70">€69 / month</span>
              </div>
            </div>
            <div className="px-6 py-5 bg-[#1f6f5b]/8 border-t border-[#1f6f5b]/15">
              <p className="text-sm text-[#0c3b2e] leading-relaxed">
                <strong>ROI context:</strong> AR lifts conversion up to ~90% and cuts furniture returns 25–40%.
                A single avoided return on a €500 sofa saves €75–125 — the whole pilot pays for itself in 1–3 avoided returns.
              </p>
            </div>
          </div>
          <p className="text-xs text-[#697266]/70 mt-4 text-center">
            Plans include monthly generations. Setup is a one-time fee, waived on annual billing. Flat price — no transaction fees.
          </p>
        </section>

        {/* ─── FAQ row ─────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-6 py-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-medium text-[#17201a] tracking-[-0.02em]" style={{ fontFamily: "var(--font-display)" }}>
              Common pricing questions
            </h2>
          </div>
          <div className="space-y-3 max-w-2xl mx-auto">
            {[
              {
                q: "How do model generations and top-ups work?",
                a: "Each plan includes a set number of model generations per month — upload a product's photos and we generate its 3D/AR model. Need more than your plan includes? Buy a generation top-up pack; the credits carry over and never expire.",
              },
              {
                q: "Do you charge a fee on my sales?",
                a: "No. Pricing is a flat monthly plan plus optional top-ups. We never take a percentage of your revenue.",
              },
              {
                q: "What is the setup fee for?",
                a: "A one-time €99 onboarding: account setup, embed install help, and your first models reviewed with you. It is waived when you pay annually.",
              },
            ].map((item) => (
              <details
                key={item.q}
                className="group bg-white border border-[#dce2d5] rounded-xl px-6 py-5 shadow-[var(--shadow-card)] open:shadow-[var(--shadow-raised)] transition-shadow"
              >
                <summary className="cursor-pointer font-semibold text-[#17201a] list-none flex items-center justify-between gap-4 text-sm">
                  {item.q}
                  <span className="shrink-0 text-[#697266] group-open:rotate-180 transition-transform text-lg leading-none">
                    ↓
                  </span>
                </summary>
                <p className="mt-4 text-[#697266] leading-relaxed text-sm">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ─── Final CTA ───────────────────────────────────────────────── */}
        <section className="bg-[#17201a] text-white">
          <div className="mx-auto max-w-3xl px-6 py-24 text-center space-y-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6ee7b7]">
              Ready to start?
            </p>
            <h2 className="text-3xl font-medium leading-snug tracking-[-0.02em]" style={{ fontFamily: "var(--font-display)" }}>
              Book a pilot demo for your first 10–25 products
            </h2>
            <p className="text-white/60 leading-relaxed max-w-lg mx-auto">
              See how guided photo upload, human review, hosted links, and analytics fit into your current ecommerce workflow.
            </p>
            <div className="flex flex-wrap gap-3 justify-center pt-2">
              <Button asChild size="lg" className="bg-white text-[#0c3b2e] hover:bg-[#f7f8f4]">
                <Link href="/contact/demo?source=pricing">Book a pilot demo</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-[#1f6f5b] bg-transparent text-white hover:bg-[#0c3b2e]/40"
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
