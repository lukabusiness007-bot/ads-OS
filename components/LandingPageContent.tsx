import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MarketingNav } from "@/components/marketing-nav"
import { ArrowRight, CheckCircle2, Shield } from "lucide-react"
import type { Lang } from "@/lib/translations"
import { translations } from "@/lib/translations"

export function LandingPageContent({ lang }: { lang: Lang }) {
  const t = translations[lang]

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav lang={lang} />

      <main>
        {/* ─── Hero ──────────────────────────────────────────────────── */}
        <section className="pt-24 bg-white overflow-hidden">
          <div className="mx-auto max-w-5xl px-6">
            {/* Copy block */}
            <div className="mx-auto max-w-2xl text-center pt-16 pb-10">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-4">
                {t.hero.eyebrow}
              </p>
              <h1 className="text-4xl font-semibold md:text-5xl lg:text-6xl text-zinc-900 text-balance leading-tight mb-6">
                {t.hero.heading}
              </h1>
              <p className="text-lg text-zinc-500 max-w-xl mx-auto leading-relaxed mb-8">
                {t.hero.body}
              </p>
              <div className="flex flex-wrap gap-3 justify-center mb-10">
                <Button asChild size="lg">
                  <Link href="/dashboard">{t.hero.cta}</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/p/northline-home/arc-oak-dining-chair">{t.hero.ctaSecondary}</Link>
                </Button>
              </div>

              {/* Trust strip */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 max-w-sm mx-auto text-left border-t border-zinc-100 pt-8">
                {t.trustStrip.map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span className="text-xs font-semibold text-zinc-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Browser mockup — hosted product page preview */}
            <div className="mx-auto max-w-4xl relative pb-0">
              <div className="absolute inset-x-8 bottom-0 h-24 bg-emerald-900/8 blur-3xl rounded-full" />
              <div className="relative rounded-xl border border-zinc-200 shadow-2xl overflow-hidden [mask-image:linear-gradient(to_bottom,black_70%,transparent_100%)]">
                {/* Chrome bar */}
                <div className="bg-zinc-800 flex items-center gap-2.5 px-4 py-3 shrink-0">
                  <div className="flex gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                    <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                    <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                  </div>
                  <div className="ml-2 flex-1 bg-zinc-700 rounded text-xs text-zinc-300 px-3 py-1 font-mono text-center max-w-xs mx-auto">
                    veridian.ar/p/northline-home/arc-oak-chair
                  </div>
                </div>

                {/* Page body */}
                <div
                  className="flex bg-[#f7f8f4]"
                  style={{ minHeight: "300px" }}
                >
                  {/* 3D Viewer panel */}
                  <div className="relative flex flex-1 items-center justify-center overflow-hidden border-r border-zinc-200 bg-gradient-to-br from-zinc-50 to-amber-50/40 min-h-[280px]">
                    {/* Chair silhouette */}
                    <div className="relative z-10 flex flex-col items-center select-none">
                      {/* Back */}
                      <div
                        className="w-24 h-16 rounded-t-md border shadow-md"
                        style={{
                          background: "linear-gradient(160deg,#d4b892,#c4a07a)",
                          borderColor: "#b08a62",
                        }}
                      />
                      {/* Seat */}
                      <div
                        className="w-28 h-4 rounded border shadow"
                        style={{
                          background: "linear-gradient(180deg,#c4a07a,#b58960)",
                          borderColor: "#9a7450",
                          marginTop: "-1px",
                        }}
                      />
                      {/* Legs */}
                      <div className="flex gap-10 mt-0.5">
                        <div className="flex gap-4">
                          <div className="w-2.5 h-14 rounded-sm" style={{ background: "#7c5230" }} />
                          <div className="w-2.5 h-11 rounded-sm" style={{ background: "#7c5230" }} />
                        </div>
                        <div className="flex gap-4">
                          <div className="w-2.5 h-11 rounded-sm" style={{ background: "#7c5230" }} />
                          <div className="w-2.5 h-14 rounded-sm" style={{ background: "#7c5230" }} />
                        </div>
                      </div>
                    </div>
                    {/* AR overlay button */}
                    <div className="absolute bottom-4 right-4 bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-700 flex items-center gap-2 shadow-sm">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      View in your room
                    </div>
                    <span className="absolute bottom-4 left-4 text-xs text-zinc-400">↻ Drag to rotate</span>
                  </div>

                  {/* Product info panel — hidden on narrow screens */}
                  <div className="hidden sm:flex bg-white p-5 flex-col gap-4 border-l border-zinc-100" style={{ width: 220, flexShrink: 0 }}>
                    {/* Merchant brand */}
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded bg-zinc-900 text-white text-xs font-extrabold flex items-center justify-center shrink-0">
                        N
                      </div>
                      <span className="text-xs font-semibold text-zinc-500">Northline Home</span>
                    </div>

                    {/* Product name */}
                    <div>
                      <h2 className="text-sm font-bold text-zinc-900 leading-tight mb-1">Arc Oak Dining Chair</h2>
                      <p className="text-xs text-zinc-500">Solid oak, natural finish</p>
                    </div>

                    {/* Dimensions */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {[["W", "48 cm"], ["H", "82 cm"], ["D", "52 cm"]].map(([label, value]) => (
                        <div
                          key={label}
                          className="border border-zinc-100 rounded-lg p-1.5 text-center bg-zinc-50"
                        >
                          <div className="text-[9px] text-zinc-400 font-bold uppercase">{label}</div>
                          <div className="text-xs font-bold text-zinc-800">{value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Verification badge */}
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-2">
                      <CheckCircle2 className="h-3 w-3 shrink-0" />
                      3D preview generated and verified
                    </div>

                    {/* CTA */}
                    <div className="bg-zinc-900 text-white text-xs font-bold text-center py-2.5 rounded-lg mt-auto">
                      View on store →
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Hosted link anywhere ──────────────────────────────────── */}
        <section className="bg-white relative z-10 py-12 border-t border-dashed border-zinc-200">
          <div className="mx-auto max-w-5xl px-6 text-center">
            <p className="text-sm font-semibold text-zinc-400">
              Add your hosted product link to any store page, email, ad, or QR code — no plugin required
            </p>
          </div>
        </section>

        {/* ─── Problem ──────────────────────────────────────────────── */}
        <section id="features" className="bg-zinc-50 border-y border-dashed border-zinc-200">
          <div className="mx-auto max-w-5xl px-6 py-20 grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-3">
                {t.problem.eyebrow}
              </p>
              <h2 className="text-3xl font-semibold text-zinc-900 leading-snug">
                {t.problem.heading}
              </h2>
            </div>
            <div className="space-y-4 text-zinc-500 leading-relaxed">
              <p>{t.problem.p1}</p>
              <p>{t.problem.p2}</p>
            </div>
          </div>
        </section>

        {/* ─── Furniture SEO Value Blocks ───────────────────────────── */}
        <section className="bg-white">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <div className="grid gap-4 sm:grid-cols-2">
              {t.seoSections.map((section) => (
                <article
                  className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm"
                  key={section.heading}
                >
                  <h2 className="mb-3 text-xl font-semibold leading-snug text-zinc-900">{section.heading}</h2>
                  <p className="text-sm leading-relaxed text-zinc-500">{section.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How It Works ─────────────────────────────────────────── */}
        <section id="how-it-works" className="mx-auto max-w-5xl px-6 py-24">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-3">
              {t.howItWorks.eyebrow}
            </p>
            <h2 className="text-3xl font-semibold text-zinc-900">
              {t.howItWorks.heading}
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {t.workflow.map(({ step, copy }, i) => (
              <article
                key={step}
                className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-100 text-sm font-bold text-zinc-700 mb-4">
                  {i + 1}
                </span>
                <h3 className="font-semibold text-zinc-900 mb-2 text-sm">{step}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{copy}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ─── Comparison ──────────────────────────────────────────── */}
        <section className="bg-white border-b border-dashed border-zinc-200">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <div className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-3">
                {t.comparison.eyebrow}
              </p>
              <h2 className="text-3xl font-semibold text-zinc-900">
                {t.comparison.heading}
              </h2>
            </div>
            <div className="overflow-x-auto rounded-xl border border-zinc-200 shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    <th className="text-left py-3.5 px-5 font-semibold text-zinc-400 w-2/5" />
                    <th className="text-left py-3.5 px-5 font-bold text-emerald-900">
                      {t.comparison.colVeridian}
                    </th>
                    <th className="text-left py-3.5 px-5 font-semibold text-zinc-400">
                      {t.comparison.colStudio}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 bg-white">
                  {t.comparison.rows.map((row) => (
                    <tr key={row.aspect} className="hover:bg-zinc-50 transition-colors">
                      <td className="py-4 px-5 text-zinc-500">{row.aspect}</td>
                      <td className="py-4 px-5 font-semibold text-zinc-900">{row.veridian}</td>
                      <td className="py-4 px-5 text-zinc-400">{row.studio}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ─── What You Get ─────────────────────────────────────────── */}
        <section className="bg-zinc-50 border-y border-dashed border-zinc-200">
          <div className="mx-auto max-w-5xl px-6 py-20 grid gap-12 lg:grid-cols-2 lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-3">
                {t.whatYouGet.eyebrow}
              </p>
              <h2 className="text-3xl font-semibold text-zinc-900 leading-snug mb-4">
                {t.whatYouGet.heading}
              </h2>
              <p className="text-zinc-500 leading-relaxed">{t.whatYouGet.body}</p>
            </div>
            <div className="grid gap-3">
              {t.features.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 bg-white border border-zinc-200 rounded-xl px-4 py-3.5 shadow-sm"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="font-medium text-zinc-800 text-sm">{item}</span>
                </div>
              ))}
              {/* Verification badge row */}
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3.5">
                <Shield className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="font-semibold text-emerald-800 text-sm">
                  3D preview generated and verified
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Quality & Trust ──────────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-6 py-24">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-3">
              {t.quality.eyebrow}
            </p>
            <h2 className="text-3xl font-semibold text-zinc-900 mb-4">{t.quality.heading}</h2>
            <p className="text-zinc-500 max-w-xl mx-auto leading-relaxed">{t.quality.body}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {t.qualityChecks.map((item) => (
              <article
                key={item}
                className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm flex items-center justify-between"
              >
                <span className="font-semibold text-sm text-zinc-800">{item}</span>
                <span className="ml-2 shrink-0 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                  ✓
                </span>
              </article>
            ))}
          </div>
          <p className="text-center text-xs text-zinc-400 mt-8 max-w-lg mx-auto leading-relaxed">
            Veridian&apos;s promise is a verified visual AR preview — not exact CAD geometry or manufacturing-grade precision.
          </p>
        </section>

        {/* ─── Dashboard Preview ────────────────────────────────────── */}
        <section className="bg-zinc-50 border-y border-dashed border-zinc-200">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-3">
                {t.dashboard.eyebrow}
              </p>
              <h2 className="text-3xl font-semibold text-zinc-900 mb-3">{t.dashboard.heading}</h2>
              <p className="text-zinc-500 max-w-xl mx-auto leading-relaxed">{t.dashboard.body}</p>
              <Button asChild size="lg" className="mt-8">
                <Link href="/dashboard">
                  {t.dashboard.cta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ─── FAQ ──────────────────────────────────────────────────── */}
        <section id="faq" className="bg-zinc-50 border-y border-dashed border-zinc-200">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <div className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-3">
                {t.faqSection.eyebrow}
              </p>
              <h2 className="text-3xl font-semibold text-zinc-900">{t.faqSection.heading}</h2>
            </div>
            <div className="space-y-3 max-w-3xl mx-auto">
              {t.faqItems.map((item) => (
                <details
                  key={item.question}
                  className="group bg-white border border-zinc-200 rounded-xl px-6 py-5 shadow-sm open:shadow-md transition-shadow"
                >
                  <summary className="cursor-pointer font-semibold text-zinc-900 list-none flex items-center justify-between gap-4 text-sm">
                    {item.question}
                    <span className="shrink-0 text-zinc-400 group-open:rotate-180 transition-transform text-lg leading-none">
                      ↓
                    </span>
                  </summary>
                  <p className="mt-4 text-zinc-500 leading-relaxed text-sm">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Final CTA ────────────────────────────────────────────── */}
        <section className="bg-emerald-950 text-white">
          <div className="mx-auto max-w-3xl px-6 py-24 text-center space-y-6">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              {t.finalCta.eyebrow}
            </p>
            <h2 className="text-3xl font-semibold leading-snug">{t.finalCta.heading}</h2>
            <p className="text-emerald-200 leading-relaxed max-w-lg mx-auto">{t.finalCta.body}</p>
            <div className="flex flex-wrap gap-3 justify-center pt-2">
              <Button asChild size="lg" className="bg-white text-emerald-900 hover:bg-emerald-50">
                <Link href="/dashboard">{t.finalCta.cta}</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-emerald-700 bg-transparent text-white hover:bg-emerald-900"
              >
                <Link href="/p/northline-home/arc-oak-dining-chair">
                  {t.finalCta.ctaSecondary}
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
