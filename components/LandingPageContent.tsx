import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MarketingNav } from "@/components/marketing-nav"
import { HeroGem } from "@/components/HeroGem"
import { Reveal, RevealStagger } from "@/components/Reveal"
import { DashboardMock } from "@/components/DashboardMock"
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
            {/* Mobile: stacked centered | Desktop: side-by-side */}
            <div className="lg:flex lg:flex-row lg:items-center lg:gap-8">

              {/* Copy block — left on desktop, centered on mobile */}
              <div className="text-center lg:text-left pt-8 pb-6 sm:pt-16 sm:pb-10 lg:flex-1 lg:min-w-0">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-4">
                  {t.hero.eyebrow}
                </p>
                <h1 className="text-4xl font-semibold md:text-5xl lg:text-6xl text-zinc-900 text-balance leading-tight mb-6">
                  {t.hero.heading}
                </h1>
                <p className="text-base sm:text-lg text-zinc-500 max-w-xl mx-auto lg:mx-0 leading-relaxed mb-6 sm:mb-8">
                  {t.hero.body}
                </p>
                <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-6 sm:mb-10">
                  <Button asChild size="lg">
                    <Link href="/contact/demo?source=hero">{t.hero.cta}</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/p/northline-home/arc-oak-dining-chair">{t.hero.ctaSecondary}</Link>
                  </Button>
                </div>

                {/* Trust strip — stagger */}
                <RevealStagger
                  as="div"
                  className="grid grid-cols-2 gap-x-8 gap-y-3 max-w-sm mx-auto lg:mx-0 text-left border-t border-zinc-100 pt-8"
                  step={80}
                  initialDelay={400}
                >
                  {t.trustStrip.map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span className="text-xs font-semibold text-zinc-600">{item}</span>
                    </div>
                  ))}
                </RevealStagger>
              </div>

              {/* Hero visual — right on desktop, below on mobile */}
              <div className="mx-auto max-w-2xl lg:mx-0 lg:flex-1 relative pb-0">
                <div className="absolute inset-x-1/4 bottom-4 h-28 bg-emerald-500/20 blur-3xl rounded-full pointer-events-none" />
                <div style={{ height: 480 }} className="relative">
                  <HeroGem />
                </div>
                <p className="text-center text-xs text-zinc-400 -mt-2 pb-8">↻ Drag to rotate</p>
              </div>

            </div>
          </div>
        </Reveal>

        {/* ─── Hosted link anywhere ──────────────────────────────────── */}
        <Reveal className="relative z-10 py-12 border-t border-dashed border-zinc-200 bg-gradient-to-b from-white to-zinc-50">
          <div className="mx-auto max-w-5xl px-6 text-center">
            <p className="text-sm font-semibold text-zinc-400">
              Add your hosted product link to any store page, email, ad, or QR code — no plugin required
            </p>
          </div>
        </Reveal>

        {/* ─── Problem ──────────────────────────────────────────────── */}
        <Reveal
          id="features"
          className="relative overflow-hidden bg-zinc-50 border-y border-dashed border-zinc-200 bg-dotgrid"
        >
          {/* Glow blob */}
          <div className="glow-blob glow-blob--emerald w-96 h-64 -top-16 -left-24" />
          <div className="relative z-10 mx-auto max-w-5xl px-6 py-20 grid gap-12 lg:grid-cols-2 lg:items-center">
            <Reveal variant="left" as="div">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-3">
                {t.problem.eyebrow}
              </p>
              <h2 className="text-3xl font-semibold text-zinc-900 leading-snug">
                {t.problem.heading}
              </h2>
            </Reveal>
            <Reveal variant="right" delay={100} as="div" className="space-y-4 text-zinc-500 leading-relaxed">
              <p>{t.problem.p1}</p>
              <p>{t.problem.p2}</p>
            </Reveal>
          </div>
        </Reveal>

        {/* ─── Furniture SEO Value Blocks ───────────────────────────── */}
        <Reveal className="bg-white">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <RevealStagger
              as="div"
              className="grid gap-4 sm:grid-cols-2"
              step={100}
              variant="scale"
            >
              {t.seoSections.map((section) => (
                <article
                  className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-emerald-600"
                  key={section.heading}
                >
                  <h2 className="mb-3 text-xl font-semibold leading-snug text-zinc-900">{section.heading}</h2>
                  <p className="text-sm leading-relaxed text-zinc-500">{section.body}</p>
                </article>
              ))}
            </RevealStagger>
          </div>
        </Reveal>

        {/* ─── How It Works ─────────────────────────────────────────── */}
        <Reveal id="how-it-works" className="bg-zinc-50 border-y border-dashed border-zinc-200">
          <div className="mx-auto max-w-5xl px-6 py-24">
            <div className="text-center mb-16">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-3">
                {t.howItWorks.eyebrow}
              </p>
              <h2 className="text-3xl font-semibold text-zinc-900">
                {t.howItWorks.heading}
              </h2>
            </div>
            <RevealStagger
              as="div"
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
              step={80}
            >
              {t.workflow.map(({ step, copy }, i) => (
                <article
                  key={step}
                  className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-emerald-600"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-50 border border-emerald-200 text-sm font-bold text-emerald-700 mb-4">
                    {i + 1}
                  </span>
                  <h3 className="font-semibold text-zinc-900 mb-2 text-sm">{step}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{copy}</p>
                </article>
              ))}
            </RevealStagger>
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
                    <th className="text-left py-3.5 px-5 font-bold text-emerald-900 bg-emerald-50/60">
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
                      <td className="py-4 px-5 font-semibold text-zinc-900 bg-emerald-50/30">{row.veridian}</td>
                      <td className="py-4 px-5 text-zinc-400">{row.studio}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>

        {/* ─── What You Get ─────────────────────────────────────────── */}
        <Reveal className="bg-zinc-50 border-b border-dashed border-zinc-200">
          <div className="mx-auto max-w-5xl px-6 py-20 grid gap-12 lg:grid-cols-2 lg:items-start">
            <Reveal variant="left" as="div">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-3">
                {t.whatYouGet.eyebrow}
              </p>
              <h2 className="text-3xl font-semibold text-zinc-900 leading-snug mb-4">
                {t.whatYouGet.heading}
              </h2>
              <p className="text-zinc-500 leading-relaxed">{t.whatYouGet.body}</p>
            </Reveal>
            <RevealStagger as="div" className="grid gap-3" step={80} variant="right">
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
            </RevealStagger>
          </div>
        </Reveal>

        {/* ─── Quality & Trust — TAMNA SEKCIJA ─────────────────────── */}
        <Reveal className="relative overflow-hidden bg-emerald-950">
          {/* Ambient glow */}
          <div className="glow-blob glow-blob--emerald w-[480px] h-72 top-0 left-1/2 -translate-x-1/2 opacity-60" />
          <div className="relative z-10 mx-auto max-w-5xl px-6 py-24">
            <div className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-3">
                {t.quality.eyebrow}
              </p>
              <h2 className="text-3xl font-semibold text-white mb-4">{t.quality.heading}</h2>
              <p className="text-emerald-200/80 max-w-xl mx-auto leading-relaxed">{t.quality.body}</p>
            </div>
            <RevealStagger
              as="div"
              className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5"
              step={70}
              variant="scale"
            >
              {t.qualityChecks.map((item) => (
                <article
                  key={item}
                  className="bg-emerald-900/50 border border-emerald-800 rounded-xl p-4 flex items-center justify-between transition-all duration-300 hover:-translate-y-1 hover:bg-emerald-900/80"
                >
                  <span className="font-semibold text-sm text-emerald-100">{item}</span>
                  <span className="ml-2 shrink-0 text-xs font-bold text-emerald-300 bg-emerald-800/60 border border-emerald-700 rounded-full px-2 py-0.5">
                    ✓
                  </span>
                </article>
              ))}
            </RevealStagger>
            <p className="text-center text-xs text-emerald-500/70 mt-8 max-w-lg mx-auto leading-relaxed">
              Augmenta&apos;s promise is a verified visual AR preview — not exact CAD geometry or manufacturing-grade precision.
            </p>
          </div>
        </Reveal>

        {/* ─── Dashboard Preview ────────────────────────────────────── */}
        <Reveal className="bg-white border-y border-dashed border-zinc-200">
          <div className="mx-auto max-w-5xl px-6 py-20 grid gap-12 lg:grid-cols-2 lg:items-center">
            <Reveal variant="left" as="div">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-3">
                {t.dashboard.eyebrow}
              </p>
              <h2 className="text-3xl font-semibold text-zinc-900 mb-3">{t.dashboard.heading}</h2>
              <p className="text-zinc-500 max-w-xl leading-relaxed mb-8">{t.dashboard.body}</p>
              <Button asChild size="lg">
                <Link href="/login?next=%2Fdashboard&intent=pilot">
                  {t.dashboard.cta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </Reveal>
            <Reveal variant="right" delay={120} as="div">
              <DashboardMock />
            </Reveal>
          </div>
        </Reveal>

        {/* ─── Stat Band ────────────────────────────────────────────── */}
        <RevealStagger
          as="section"
          className="grid grid-cols-2 sm:grid-cols-4 bg-zinc-900 divide-x divide-zinc-800 border-b border-zinc-800"
          step={80}
          variant="scale"
        >
          {t.stats.map((s) => (
            <div key={s.value} className="px-6 py-8 text-center">
              <p className="text-2xl font-bold text-emerald-400 mb-1">{s.value}</p>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </RevealStagger>

        {/* ─── FAQ ──────────────────────────────────────────────────── */}
        <Reveal id="faq" className="relative overflow-hidden bg-zinc-50 border-b border-dashed border-zinc-200 bg-dotgrid">
          <div className="glow-blob glow-blob--amber w-80 h-48 bottom-0 right-0 opacity-70" />
          <div className="relative z-10 mx-auto max-w-5xl px-6 py-20">
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
        <Reveal className="relative overflow-hidden bg-emerald-950 text-white">
          {/* Radial glow behind heading */}
          <div className="glow-blob glow-blob--emerald w-[560px] h-80 top-0 left-1/2 -translate-x-1/2" />
          <div className="relative z-10 mx-auto max-w-3xl px-6 py-24 text-center space-y-6">
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
