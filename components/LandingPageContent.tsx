import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MarketingNav } from "@/components/marketing-nav"
import { ProductTable } from "@/components/ProductTable"
import { pricingPackages } from "@/lib/mock-data"
import { CheckCircle2 } from "lucide-react"
import type { Lang } from "@/lib/translations"
import { translations } from "@/lib/translations"

const ecomPlatforms = [
  { name: "Shopify", logo: "https://cdn.simpleicons.org/shopify", h: "h-10" },
  { name: "WooCommerce", logo: "https://cdn.simpleicons.org/woocommerce", h: "h-14" },
  { name: "BigCommerce", logo: "https://cdn.simpleicons.org/bigcommerce", h: "h-10" },
  { name: "PrestaShop", logo: "https://cdn.simpleicons.org/prestashop", h: "h-10" },
  { name: "Squarespace", logo: "https://cdn.simpleicons.org/squarespace", h: "h-10" },
  { name: "Wix", logo: "https://cdn.simpleicons.org/wix", h: "h-10" },
]

export function LandingPageContent({ lang }: { lang: Lang }) {
  const t = translations[lang]

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav lang={lang} />

      <main>
        {/* Decorative background gradients */}
        <div
          aria-hidden
          className="z-[2] absolute inset-0 pointer-events-none isolate opacity-50 contain-strict hidden lg:block"
        >
          <div className="w-[35rem] h-[80rem] -translate-y-[350px] absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(150,60%,50%,.06)_0,hsla(150,30%,30%,.02)_50%,transparent_80%)]" />
          <div className="h-[80rem] absolute left-0 top-0 w-56 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(150,60%,50%,.04)_0,transparent_100%)] [translate:5%_-50%]" />
        </div>

        {/* Hero section */}
        <section className="overflow-hidden bg-white pt-20">
          <div className="relative mx-auto max-w-5xl px-6 py-28 lg:py-24">
            <div className="relative z-10 mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-emerald-700 mb-4">
                {t.hero.eyebrow}
              </p>
              <h1 className="text-balance text-4xl font-semibold md:text-5xl lg:text-6xl text-zinc-900">
                {t.hero.heading}
              </h1>
              <p className="mx-auto my-8 max-w-xl text-lg text-zinc-500">
                {t.hero.body}
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Button asChild size="lg">
                  <Link href="/dashboard">{t.hero.cta}</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/p/northline-home/arc-oak-dining-chair">{t.hero.ctaSecondary}</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Tilted hero visual */}
          <div className="mx-auto -mt-16 max-w-7xl [mask-image:linear-gradient(to_bottom,black_50%,transparent_100%)]">
            <div className="[perspective:1200px] [mask-image:linear-gradient(to_right,black_60%,transparent_100%)] -mr-16 pl-16 lg:-mr-56 lg:pl-56">
              <div className="[transform:rotateX(20deg)]">
                <div className="lg:h-[44rem] relative skew-x-[.36rad]">
                  <img
                    className="rounded-lg z-[2] relative border border-zinc-200 shadow-2xl"
                    src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=2880&q=75"
                    alt="AR product page preview — modern living room furniture"
                    width={2880}
                    height={1620}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Compatible platforms strip */}
        <section className="bg-white relative z-10 py-16 border-t border-dashed border-zinc-200">
          <div className="m-auto max-w-5xl px-6">
            <p className="text-center text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-12">
              {t.platforms.label}
            </p>
            <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-12 gap-y-8 sm:gap-x-16 sm:gap-y-12">
              {ecomPlatforms.map((p) => (
                <img
                  key={p.name}
                  className={`${p.h} w-auto opacity-50 grayscale hover:opacity-80 hover:grayscale-0 transition-all`}
                  src={p.logo}
                  alt={`${p.name} logo`}
                  width="auto"
                />
              ))}
            </div>
          </div>
        </section>

        {/* Problem section */}
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

        {/* How it works */}
        <section id="how-it-works" className="mx-auto max-w-5xl px-6 py-24">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-3">{t.howItWorks.eyebrow}</p>
            <h2 className="text-3xl font-semibold text-zinc-900">
              {t.howItWorks.heading}
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {t.workflow.map(({ step, copy }, i) => (
              <article
                key={step}
                className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-100 text-sm font-bold text-zinc-700 mb-4">
                  {i + 1}
                </span>
                <h3 className="font-semibold text-zinc-900 mb-2">{step}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{copy}</p>
              </article>
            ))}
          </div>
        </section>

        {/* What you get */}
        <section className="bg-zinc-50 border-y border-dashed border-zinc-200">
          <div className="mx-auto max-w-5xl px-6 py-20 grid gap-12 lg:grid-cols-2 lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-3">{t.whatYouGet.eyebrow}</p>
              <h2 className="text-3xl font-semibold text-zinc-900 leading-snug mb-4">
                {t.whatYouGet.heading}
              </h2>
              <p className="text-zinc-500 leading-relaxed">
                {t.whatYouGet.body}
              </p>
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
            </div>
          </div>
        </section>

        {/* Quality section */}
        <section className="mx-auto max-w-5xl px-6 py-24">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-3">{t.quality.eyebrow}</p>
            <h2 className="text-3xl font-semibold text-zinc-900 mb-4">{t.quality.heading}</h2>
            <p className="text-zinc-500 max-w-xl mx-auto leading-relaxed">
              {t.quality.body}
            </p>
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
        </section>

        {/* Dashboard preview */}
        <section className="bg-zinc-50 border-y border-dashed border-zinc-200">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <div className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-3">{t.dashboard.eyebrow}</p>
              <h2 className="text-3xl font-semibold text-zinc-900 mb-3">{t.dashboard.heading}</h2>
              <p className="text-zinc-500 max-w-xl mx-auto leading-relaxed">
                {t.dashboard.body}
              </p>
            </div>
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {t.dashboard.stats.map(({ label, value }) => (
                  <div key={label} className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">{label}</p>
                    <p className="text-2xl font-bold text-zinc-900">{value}</p>
                  </div>
                ))}
              </div>
              <ProductTable />
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mx-auto max-w-5xl px-6 py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-3">{t.pricing.eyebrow}</p>
              <h2 className="text-3xl font-semibold text-zinc-900 leading-snug mb-3">
                {t.pricing.heading}
              </h2>
              <p className="text-zinc-500 leading-relaxed">
                {t.pricing.body}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {pricingPackages.slice(0, 3).map((item) => (
                <article
                  key={item.id}
                  className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all"
                >
                  <h3 className="font-semibold text-zinc-900 mb-3">{item.name}</h3>
                  <p className="text-2xl font-bold text-zinc-900 mb-1">{item.priceRangeEur}</p>
                  <p className="text-sm text-zinc-400">{item.billingUnit}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="bg-zinc-50 border-y border-dashed border-zinc-200">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <div className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-3">{t.faqSection.eyebrow}</p>
              <h2 className="text-3xl font-semibold text-zinc-900">{t.faqSection.heading}</h2>
            </div>
            <div className="space-y-3 max-w-3xl mx-auto">
              {t.faqItems.map((item) => (
                <details
                  key={item.question}
                  className="group bg-white border border-zinc-200 rounded-xl px-6 py-5 shadow-sm open:shadow-md transition-shadow"
                >
                  <summary className="cursor-pointer font-semibold text-zinc-900 list-none flex items-center justify-between gap-4">
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

        {/* Final CTA */}
        <section className="bg-emerald-950 text-white">
          <div className="mx-auto max-w-3xl px-6 py-24 text-center space-y-6">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              {t.finalCta.eyebrow}
            </p>
            <h2 className="text-3xl font-semibold leading-snug">
              {t.finalCta.heading}
            </h2>
            <p className="text-emerald-200 leading-relaxed max-w-lg mx-auto">
              {t.finalCta.body}
            </p>
            <div className="flex flex-wrap gap-3 justify-center pt-2">
              <Button asChild size="lg" className="bg-white text-emerald-900 hover:bg-emerald-50">
                <Link href="/dashboard">{t.finalCta.cta}</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-emerald-700 text-white hover:bg-emerald-900"
              >
                <Link href="/p/northline-home/arc-oak-dining-chair">{t.finalCta.ctaSecondary}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
