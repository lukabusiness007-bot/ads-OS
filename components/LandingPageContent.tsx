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
    <div className="min-h-screen bg-[#fbfaf6]">
      <MarketingNav lang={lang} />

      <main>
        {/* ─── Hero ──────────────────────────────────────────────────── */}
        <Reveal className="overflow-hidden bg-[#fbfaf6]">
          <div className="mx-auto max-w-6xl px-6 pt-20 sm:pt-28 lg:grid lg:grid-cols-[1fr_440px] lg:gap-16 lg:items-center lg:min-h-[88vh]">
            {/* Copy block */}
            <div className="pb-14 lg:pb-0 text-center lg:text-left">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1f6f5b] mb-5">
                {t.hero.eyebrow}
              </p>
              <h1 className="text-[clamp(2.5rem,5.5vw,4.5rem)] font-medium leading-[1.05] tracking-[-0.03em] text-[#17201a] text-balance mb-7">
                {t.hero.heading}
              </h1>
              <p className="text-lg text-[#697266] max-w-lg mx-auto lg:mx-0 leading-relaxed mb-9">
                {t.hero.body}
              </p>
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-10">
                <Button asChild size="lg">
                  <Link href="/contact/demo?source=hero">{t.hero.cta}</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/p/northline-home/arc-oak-dining-chair">{t.hero.ctaSecondary}</Link>
                </Button>
              </div>

              <RevealStagger
                as="div"
                className="grid grid-cols-2 gap-x-8 gap-y-3 max-w-xs mx-auto lg:mx-0 text-left border-t border-[#dce2d5] pt-7"
                step={80}
                initialDelay={400}
              >
                {t.trustStrip.map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#1f6f5b] shrink-0" />
                    <span className="text-xs font-semibold text-[#697266]">{item}</span>
                  </div>
                ))}
              </RevealStagger>
            </div>

            {/* Hero visual */}
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="absolute inset-x-1/4 bottom-0 h-32 bg-[#1f6f5b]/12 blur-3xl rounded-full pointer-events-none" />
              <div style={{ height: 460 }} className="relative">
                <HeroGem />
              </div>
              <p className="text-center text-xs text-[#697266]/50 -mt-3 pb-6">↻ Drag to rotate</p>
            </div>
          </div>
        </Reveal>

        {/* ─── Hosted link band ──────────────────────────────────────── */}
        <div className="border-t border-[#dce2d5] py-10 bg-white">
          <div className="mx-auto max-w-6xl px-6 text-center">
            <p className="text-sm text-[#697266]">
              Add your hosted product link to any store page, email, ad, or QR code — no plugin required
            </p>
          </div>
        </div>

        {/* ─── Problem ──────────────────────────────────────────────── */}
        <Reveal
          id="features"
          className="relative overflow-hidden bg-[#f7f8f4] border-y border-[#dce2d5] bg-dotgrid"
        >
          <div className="glow-blob glow-blob--emerald w-96 h-64 -top-16 -left-24" />
          <div className="relative z-10 mx-auto max-w-6xl px-6 py-24 grid gap-12 lg:grid-cols-2 lg:items-center">
            <Reveal variant="left" as="div">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1f6f5b] mb-4">
                {t.problem.eyebrow}
              </p>
              <h2 className="text-4xl font-medium leading-[1.1] tracking-[-0.02em] text-[#17201a]">
                {t.problem.heading}
              </h2>
            </Reveal>
            <Reveal variant="right" delay={100} as="div" className="space-y-5 text-[#697266] leading-relaxed">
              <p>{t.problem.p1}</p>
              <p>{t.problem.p2}</p>
            </Reveal>
          </div>
        </Reveal>

        {/* ─── SEO Value Blocks ─────────────────────────────────────── */}
        <Reveal className="bg-white">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <RevealStagger
              as="div"
              className="grid gap-5 sm:grid-cols-2"
              step={100}
              variant="scale"
            >
              {t.seoSections.map((section) => (
                <article
                  className="rounded-xl border border-[#dce2d5] bg-white p-7 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-raised)] hover:border-[#1f6f5b]/40"
                  key={section.heading}
                >
                  <h2 className="mb-3 text-xl font-medium leading-snug text-[#17201a]">{section.heading}</h2>
                  <p className="text-sm leading-relaxed text-[#697266]">{section.body}</p>
                </article>
              ))}
            </RevealStagger>
          </div>
        </Reveal>

        {/* ─── How It Works ─────────────────────────────────────────── */}
        <Reveal id="how-it-works" className="bg-[#f7f8f4] border-y border-[#dce2d5]">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <div className="text-center mb-16">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1f6f5b] mb-4">
                {t.howItWorks.eyebrow}
              </p>
              <h2 className="text-4xl font-medium leading-[1.1] tracking-[-0.02em] text-[#17201a]">
                {t.howItWorks.heading}
              </h2>
            </div>
            <RevealStagger
              as="div"
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              step={80}
            >
              {t.workflow.map(({ step, copy }, i) => (
                <article
                  key={step}
                  className="bg-white border border-[#dce2d5] rounded-xl p-6 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-raised)] hover:border-[#1f6f5b]/40"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#eef2e8] text-sm font-bold text-[#1f6f5b] mb-5">
                    {i + 1}
                  </span>
                  <h3 className="font-semibold text-[#17201a] mb-2 text-sm">{step}</h3>
                  <p className="text-sm text-[#697266] leading-relaxed">{copy}</p>
                </article>
              ))}
            </RevealStagger>
          </div>
        </Reveal>

        {/* ─── Comparison ──────────────────────────────────────────── */}
        <Reveal className="bg-white border-b border-[#dce2d5]">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <div className="text-center mb-14">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1f6f5b] mb-4">
                {t.comparison.eyebrow}
              </p>
              <h2 className="text-4xl font-medium leading-[1.1] tracking-[-0.02em] text-[#17201a]">
                {t.comparison.heading}
              </h2>
            </div>
            <div className="overflow-x-auto rounded-xl border border-[#dce2d5] shadow-[var(--shadow-card)]">
              <table className="w-full text-sm">
                <thead className="bg-[#f7f8f4] border-b border-[#dce2d5]">
                  <tr>
                    <th className="text-left py-4 px-5 font-semibold text-[#697266] w-2/5" />
                    <th className="text-left py-4 px-5 font-bold text-[#17201a] bg-[#eef2e8]/60">
                      {t.comparison.colAugmenta}
                    </th>
                    <th className="text-left py-4 px-5 font-medium text-[#697266]">
                      {t.comparison.colStudio}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dce2d5] bg-white">
                  {t.comparison.rows.map((row) => (
                    <tr key={row.aspect} className="hover:bg-[#f7f8f4] transition-colors">
                      <td className="py-4 px-5 text-[#697266]">{row.aspect}</td>
                      <td className="py-4 px-5 font-medium text-[#17201a] bg-[#eef2e8]/20">{row.veridian}</td>
                      <td className="py-4 px-5 text-[#697266]">{row.studio}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>

        {/* ─── What You Get ─────────────────────────────────────────── */}
        <Reveal className="bg-[#f7f8f4] border-b border-[#dce2d5]">
          <div className="mx-auto max-w-6xl px-6 py-24 grid gap-14 lg:grid-cols-2 lg:items-start">
            <Reveal variant="left" as="div">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1f6f5b] mb-4">
                {t.whatYouGet.eyebrow}
              </p>
              <h2 className="text-4xl font-medium leading-[1.1] tracking-[-0.02em] text-[#17201a] mb-5">
                {t.whatYouGet.heading}
              </h2>
              <p className="text-[#697266] leading-relaxed">{t.whatYouGet.body}</p>
            </Reveal>
            <RevealStagger as="div" className="grid gap-3" step={80} variant="right">
              {t.features.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 bg-white border border-[#dce2d5] rounded-xl px-5 py-4 shadow-[var(--shadow-card)]"
                >
                  <CheckCircle2 className="h-4 w-4 text-[#1f6f5b] shrink-0" />
                  <span className="font-medium text-[#17201a] text-sm">{item}</span>
                </div>
              ))}
              <div className="flex items-center gap-3 bg-[#eef2e8] border border-[#1f6f5b]/25 rounded-xl px-5 py-4">
                <Shield className="h-4 w-4 text-[#1f6f5b] shrink-0" />
                <span className="font-semibold text-[#1f6f5b] text-sm">
                  3D preview generated and verified
                </span>
              </div>
            </RevealStagger>
          </div>
        </Reveal>

        {/* ─── Quality & Trust — dark band ──────────────────────────── */}
        <Reveal className="relative overflow-hidden bg-[#17201a]">
          <div className="glow-blob glow-blob--emerald w-[480px] h-72 top-0 left-1/2 -translate-x-1/2 opacity-50" />
          <div className="relative z-10 mx-auto max-w-6xl px-6 py-28">
            <div className="text-center mb-14">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6ee7b7] mb-4">
                {t.quality.eyebrow}
              </p>
              <h2 className="text-4xl font-medium leading-[1.1] tracking-[-0.02em] text-white mb-5">{t.quality.heading}</h2>
              <p className="text-white/55 max-w-xl mx-auto leading-relaxed">{t.quality.body}</p>
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
                  className="bg-white/[0.06] border border-white/[0.12] rounded-xl p-4 flex items-center justify-between transition-all duration-200 hover:bg-white/10"
                >
                  <span className="font-medium text-sm text-white/80">{item}</span>
                  <span className="ml-2 shrink-0 text-xs font-bold text-[#6ee7b7] bg-[#1f6f5b]/30 border border-[#1f6f5b]/40 rounded-full px-2 py-0.5">
                    ✓
                  </span>
                </article>
              ))}
            </RevealStagger>
            <p className="text-center text-xs text-white/30 mt-10 max-w-lg mx-auto leading-relaxed">
              Augmenta&apos;s promise is a verified visual AR preview — not exact CAD geometry or manufacturing-grade precision.
            </p>
          </div>
        </Reveal>

        {/* ─── Dashboard Preview ────────────────────────────────────── */}
        <Reveal className="bg-white border-y border-[#dce2d5]">
          <div className="mx-auto max-w-6xl px-6 py-24 grid gap-14 lg:grid-cols-2 lg:items-center">
            <Reveal variant="left" as="div">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1f6f5b] mb-4">
                {t.dashboard.eyebrow}
              </p>
              <h2 className="text-4xl font-medium leading-[1.1] tracking-[-0.02em] text-[#17201a] mb-4">{t.dashboard.heading}</h2>
              <p className="text-[#697266] max-w-xl leading-relaxed mb-9">{t.dashboard.body}</p>
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
          className="grid grid-cols-2 sm:grid-cols-4 bg-[#17201a] divide-x divide-white/[0.08]"
          step={80}
          variant="scale"
        >
          {t.stats.map((s) => (
            <div key={s.value} className="px-6 py-10 text-center">
              <p className="text-2xl font-bold text-[#6ee7b7] mb-1.5">{s.value}</p>
              <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </RevealStagger>

        {/* ─── FAQ ──────────────────────────────────────────────────── */}
        <Reveal id="faq" className="relative overflow-hidden bg-[#f7f8f4] border-b border-[#dce2d5] bg-dotgrid">
          <div className="glow-blob glow-blob--amber w-80 h-48 bottom-0 right-0 opacity-60" />
          <div className="relative z-10 mx-auto max-w-6xl px-6 py-24">
            <div className="text-center mb-14">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1f6f5b] mb-4">
                {t.faqSection.eyebrow}
              </p>
              <h2 className="text-4xl font-medium leading-[1.1] tracking-[-0.02em] text-[#17201a]">{t.faqSection.heading}</h2>
            </div>
            <div className="space-y-3 max-w-3xl mx-auto">
              {t.faqItems.map((item) => (
                <details
                  key={item.question}
                  className="group bg-white border border-[#dce2d5] rounded-xl px-6 py-5 shadow-[var(--shadow-card)] open:shadow-[var(--shadow-raised)] transition-shadow"
                >
                  <summary className="cursor-pointer font-semibold text-[#17201a] list-none flex items-center justify-between gap-4 text-sm">
                    {item.question}
                    <span className="shrink-0 text-[#697266] group-open:rotate-180 transition-transform text-lg leading-none">
                      ↓
                    </span>
                  </summary>
                  <p className="mt-4 text-[#697266] leading-relaxed text-sm">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </Reveal>

        {/* ─── Final CTA ────────────────────────────────────────────── */}
        <Reveal className="relative overflow-hidden bg-[#17201a] text-white">
          <div className="glow-blob glow-blob--emerald w-[560px] h-80 top-0 left-1/2 -translate-x-1/2" />
          <div className="relative z-10 mx-auto max-w-3xl px-6 py-28 text-center space-y-7">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6ee7b7]">
              {t.finalCta.eyebrow}
            </p>
            <h2 className="text-4xl font-medium leading-[1.1] tracking-[-0.02em]">{t.finalCta.heading}</h2>
            <p className="text-white/55 leading-relaxed max-w-lg mx-auto">{t.finalCta.body}</p>
            <div className="flex flex-wrap gap-3 justify-center pt-2">
              <Button asChild size="lg" className="bg-white text-[#17201a] hover:bg-[#eef2e8]">
                <Link href="/contact/demo?source=final-cta">{t.finalCta.cta}</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/20 bg-transparent text-white hover:bg-white/[0.08]"
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
