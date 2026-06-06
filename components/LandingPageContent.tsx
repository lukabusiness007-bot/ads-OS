import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MarketingNav } from "@/components/marketing-nav"
import { HeroGem } from "@/components/HeroGem"
import { Reveal } from "@/components/Reveal"
import { TypingHeading } from "@/components/TypingHeading"
import { ArrowRight, CheckCircle2, Shield } from "lucide-react"
import { BackToTop } from "@/components/BackToTop"
import type { Lang } from "@/lib/translations"
import { translations } from "@/lib/translations"

export function LandingPageContent({ lang }: { lang: Lang }) {
  const t = translations[lang]

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav lang={lang} />

      <main>
        {/* ─── Hero ──────────────────────────────────────────────────── */}
        <Reveal className="pt-16 sm:pt-24 bg-white overflow-hidden">
          <div className="mx-auto max-w-5xl px-6">
            {/* Copy block */}
            <div className="mx-auto max-w-2xl text-center pt-8 pb-6 sm:pt-16 sm:pb-10">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-4">
                {t.hero.eyebrow}
              </p>
              <h1 className="text-4xl font-semibold md:text-5xl lg:text-6xl text-zinc-900 text-balance leading-tight mb-6">
                <TypingHeading text={t.hero.heading} />
              </h1>
              <p className="text-base sm:text-lg text-zinc-500 max-w-xl mx-auto leading-relaxed mb-6 sm:mb-8">
                {t.hero.body}
              </p>
              <div className="flex flex-wrap gap-3 justify-center mb-6 sm:mb-10">
                <Button asChild size="lg">
                  <Link href="/contact/demo?source=hero">{t.hero.cta}</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/p/northline-home/arc-oak-dining-chair">{t.hero.ctaSecondary}</Link>
                </Button>
              </div>

              {/* Trust strip */}
              <div className="hidden sm:grid grid-cols-2 gap-x-8 gap-y-3 max-w-sm mx-auto text-left border-t border-zinc-100 pt-8">
                {t.trustStrip.map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span className="text-xs font-semibold text-zinc-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero visual — spinning Augmenta crystal */}
            <div className="mx-auto max-w-2xl relative pb-0">
              {/* Emerald glow beneath */}
              <div className="absolute inset-x-1/4 bottom-4 h-28 bg-emerald-500/20 blur-3xl rounded-full pointer-events-none" />
              {/* model-viewer container */}
              <div style={{ height: 480 }} className="relative">
                <HeroGem />
              </div>
              <p className="text-center text-xs text-zinc-400 -mt-2 pb-8">↻ Drag to rotate</p>
            </div>
          </div>
        </Reveal>

        {/* ─── Hosted link anywhere ──────────────────────────────────── */}
        <Reveal className="bg-white relative z-10 py-12 border-t border-dashed border-zinc-200">
          <div className="mx-auto max-w-5xl px-6 text-center">
            <p className="text-sm font-semibold text-zinc-400">
              Add your hosted product link to any store page, email, ad, or QR code — no plugin required
            </p>
          </div>
        </Reveal>

        {/* ─── Problem ──────────────────────────────────────────────── */}
        <Reveal id="features" className="bg-zinc-50 border-y border-dashed border-zinc-200">
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
        </Reveal>

        {/* ─── Furniture SEO Value Blocks ───────────────────────────── */}
        <Reveal className="bg-white">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <div className="grid gap-4 sm:grid-cols-2">
              {t.seoSections.map((section) => (
                <article
                  className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-emerald-600"
                  key={section.heading}
                >
                  <h2 className="mb-3 text-xl font-semibold leading-snug text-zinc-900">{section.heading}</h2>
                  <p className="text-sm leading-relaxed text-zinc-500">{section.body}</p>
                </article>
              ))}
            </div>
          </div>
        </Reveal>

        {/* ─── How It Works ─────────────────────────────────────────── */}
        <Reveal id="how-it-works" className="mx-auto max-w-5xl px-6 py-24">
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
                className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-emerald-600"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-100 text-sm font-bold text-zinc-700 mb-4">
                  {i + 1}
                </span>
                <h3 className="font-semibold text-zinc-900 mb-2 text-sm">{step}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{copy}</p>
              </article>
            ))}
          </div>
        </Reveal>

        {/* ─── Comparison ──────────────────────────────────────────── */}
        <Reveal className="bg-white border-b border-dashed border-zinc-200">
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
                      {t.comparison.colAugmenta}
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
        </Reveal>

        {/* ─── What You Get ─────────────────────────────────────────── */}
        <Reveal className="bg-zinc-50 border-y border-dashed border-zinc-200">
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
        </Reveal>

        {/* ─── Quality & Trust ──────────────────────────────────────── */}
        <Reveal className="mx-auto max-w-5xl px-6 py-24">
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
                className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm flex items-center justify-between transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-emerald-600"
              >
                <span className="font-semibold text-sm text-zinc-800">{item}</span>
                <span className="ml-2 shrink-0 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                  ✓
                </span>
              </article>
            ))}
          </div>
          <p className="text-center text-xs text-zinc-400 mt-8 max-w-lg mx-auto leading-relaxed">
            Augmenta&apos;s promise is a verified visual AR preview — not exact CAD geometry or manufacturing-grade precision.
          </p>
        </Reveal>

        {/* ─── Dashboard Preview ────────────────────────────────────── */}
        <Reveal className="bg-zinc-50 border-y border-dashed border-zinc-200">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-3">
                {t.dashboard.eyebrow}
              </p>
              <h2 className="text-3xl font-semibold text-zinc-900 mb-3">{t.dashboard.heading}</h2>
              <p className="text-zinc-500 max-w-xl mx-auto leading-relaxed">{t.dashboard.body}</p>
              <Button asChild size="lg" className="mt-8">
                <Link href="/login?next=%2Fdashboard&intent=pilot">
                  {t.dashboard.cta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>

        {/* ─── FAQ ──────────────────────────────────────────────────── */}
        <Reveal id="faq" className="bg-zinc-50 border-y border-dashed border-zinc-200">
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
        </Reveal>

        {/* ─── Final CTA ────────────────────────────────────────────── */}
        <Reveal className="bg-emerald-950 text-white">
          <div className="mx-auto max-w-3xl px-6 py-24 text-center space-y-6">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              {t.finalCta.eyebrow}
            </p>
            <h2 className="text-3xl font-semibold leading-snug">{t.finalCta.heading}</h2>
            <p className="text-emerald-200 leading-relaxed max-w-lg mx-auto">{t.finalCta.body}</p>
            <div className="flex flex-wrap gap-3 justify-center pt-2">
              <Button asChild size="lg" className="bg-white text-emerald-900 hover:bg-emerald-50">
                <Link href="/contact/demo?source=final-cta">{t.finalCta.cta}</Link>
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
        </Reveal>
      </main>
      <BackToTop />
    </div>
  )
}
