import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MarketingNav } from "@/components/marketing-nav"
import { SerbianPricingActivityToast } from "@/components/SerbianPricingActivityToast"
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
  title: "Cene za AR stranice proizvoda za namestaj",
  description:
    "Pocnite sa 10 proizvoda namestaja i dokazite angazovanje kupaca pre sirenja kataloga. Hosting plus naknada po odobrenom modelu.",
  path: "/sr/pricing",
  lang: "sr",
  alternates: marketingAlternates("/pricing", "/sr/pricing")
})

const SETUP_FEE_EUR = 99

const plans = [
  {
    id: "starter",
    name: "Starter",
    monthlyUsd: 29,
    publishedSkuLimit: 5,
    includedGenerations: 5,
    setupFeeEur: SETUP_FEE_EUR,
    storageGb: 2,
    monthlyViewLimit: 5000,
    positioning: "Prva provera za malu prodavnicu, uživo za par dana.",
    includes: [
      "5 generisanja modela mesečno",
      "3D preglednik i AR bez aplikacije",
      "Hostovane stranice proizvoda",
      "Osnovna analitika angažovanosti",
    ],
    recommended: false,
  },
  {
    id: "growth",
    name: "Growth",
    monthlyUsd: 69,
    publishedSkuLimit: 20,
    includedGenerations: 20,
    setupFeeEur: SETUP_FEE_EUR,
    storageGb: 10,
    monthlyViewLimit: 25000,
    positioning: "Najbolji izbor za katalog koji raste, 10–25 proizvoda.",
    includes: [
      "20 generisanja modela mesečno",
      "Sve iz Starter plana",
      "Shopify i WooCommerce integracija",
      "Prioritetni QA + CSV izvoz",
    ],
    recommended: true,
  },
  {
    id: "studio",
    name: "Studio",
    monthlyUsd: 149,
    publishedSkuLimit: 50,
    includedGenerations: 50,
    setupFeeEur: SETUP_FEE_EUR,
    storageGb: 50,
    monthlyViewLimit: 100000,
    positioning: "Za prodavnice koje šire AR kroz veći katalog.",
    includes: [
      "50 generisanja modela mesečno",
      "Sve iz Growth plana",
      "White-label hostovane stranice",
      "Napredna analitika",
    ],
    recommended: false,
  },
  {
    id: "business",
    name: "Business",
    monthlyUsd: null,
    publishedSkuLimit: null,
    includedGenerations: null,
    setupFeeEur: null,
    storageGb: null,
    monthlyViewLimit: null,
    positioning: "Za 100+ proizvoda, prilagođeni SLA, uvođenje i API.",
    includes: [
      "Neograničeno generisanje",
      "Prilagođeni uslovi upotrebe",
      "Posvećeno uvođenje",
      "API pristup + SLA",
    ],
    recommended: false,
  },
]

const topUps = [
  { id: "topup-10", name: "10 generisanja", priceEur: 19, perModelEur: 1.9, note: "Osvežavanje malog kataloga ili nekoliko dodatnih proizvoda.", recommended: false },
  { id: "topup-25", name: "25 generisanja", priceEur: 39, perModelEur: 1.56, note: "Najbolja vrednost za sezonsko širenje kataloga.", recommended: true },
  { id: "topup-50", name: "50 generisanja", priceEur: 69, perModelEur: 1.38, note: "Masovno uvođenje većeg kataloga odjednom.", recommended: false },
]

const modelAddons = [
  {
    id: "basic-cleanup",
    name: "Osnovno čišćenje skena",
    price: "€79/SKU",
    buyerFit: "Jednostavni komadi",
    useCase: "Klijent ima upotrebljive skenove, ali je potrebno čišćenje, imenovanje i pomoć pri otpremanju.",
  },
  {
    id: "commerce-ready",
    name: "GLB/USDZ optimizacija za e-commerce",
    price: "€149/SKU",
    buyerFit: "Većina SMB proizvoda",
    useCase: "Podrazumevani dodatak za SMB prodavnice kojima su potrebni mobilno-sigurni fajlovi, provere razmere, posteri i QA.",
  },
  {
    id: "premium-pbr",
    name: "Premium ručni/PBR model",
    price: "€299–€499/SKU",
    buyerFit: "Složeni ili luksuzni komadi",
    useCase: "Složeni proizvodi, luksuzna vizualna prezentacija, loše izvorne fotografije ili materijali visokih detalja.",
  },
]

const overages = [
  {
    id: "extra-sku",
    name: "Dodatni objavljeni proizvod",
    price: 3,
    unit: "po proizvodu/mesečno",
    guardrail: "Dodajte par proizvoda preko plana bez prelaska na viši nivo.",
  },
  {
    id: "view-pack",
    name: "Dodatni paket pregleda",
    price: 9,
    unit: "na 10.000 3D/AR pregleda",
    guardrail: "Štiti propusnost, analitiku i podršku tokom naglih porasta saobraćaja.",
  },
  {
    id: "storage-pack",
    name: "Dodatni prostor",
    price: 5,
    unit: "na 10 GB/mesečno",
    guardrail: "Pokriva sirove snimke, izvorne fajlove, GLB/USDZ pakete i poster materijale.",
  },
]

export default function PricingPageSr() {
  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(webApplicationJsonLd("sr", "/sr/pricing"))} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(
          breadcrumbJsonLd([
            { name: "Početna", path: "/sr" },
            { name: "Cene", path: "/sr/pricing" }
          ])
        )}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(faqPageJsonLd([
          {
            question: "Kako funkcionišu generisanja modela i top-up paketi?",
            answer: "Svaki plan uključuje određeni broj generisanja modela mesečno — otpremite fotografije proizvoda i mi generišemo njegov 3D/AR model. Treba vam više nego što plan uključuje? Kupite top-up paket; krediti se prenose i ne ističu.",
          },
          {
            question: "Da li naplaćujete naknadu na moju prodaju?",
            answer: "Ne. Cena je fiksna mesečna pretplata plus opcioni top-up paketi. Nikada ne uzimamo procenat od vašeg prihoda.",
          },
          {
            question: "Čemu služi naknada za uvođenje?",
            answer: "Jednokratno uvođenje od €99: podešavanje naloga, pomoć pri integraciji i prvi modeli pregledani zajedno sa vama. Besplatno je uz godišnju pretplatu.",
          },
        ]))}
      />
      <MarketingNav lang="sr" />

      <main className="pt-24">
        {/* ─── Header ─────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-6 py-20 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-4">
            Cene
          </p>
          <h1 className="text-4xl font-semibold md:text-5xl text-zinc-900 text-balance leading-tight mb-5">
            Samostalni AR za vaše proizvode. Otpremite fotografije, uživo za par dana.
          </h1>
          <p className="text-lg text-zinc-500 max-w-xl mx-auto leading-relaxed">
            Svaki plan uključuje mesečna generisanja modela, hostovane AR stranice i analitiku. Treba vam više modela? Dodajte top-up paket bilo kada. Fiksna cena — nikada ne uzimamo procenat od vaše prodaje.
          </p>
        </section>

        {/* ─── Subscription Plans ──────────────────────────────────────── */}
        <section className="bg-zinc-50 border-y border-dashed border-zinc-200">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <div className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-3">
                Mesečna pretplata
              </p>
              <h2 className="text-3xl font-semibold text-zinc-900 mb-3">
                Odaberite plan koji odgovara vašem katalogu
              </h2>
              <p className="text-zinc-500 max-w-lg mx-auto">
                Svi planovi uključuju hostovane stranice proizvoda, 3D preglednik, AR bez aplikacije i analitiku angažovanosti.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {plans.map((tier) => (
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
                        Najpopularnije
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
                          / mesec
                        </span>
                      </>
                    ) : (
                      <span className={`text-2xl font-bold ${tier.recommended ? "text-white" : "text-zinc-900"}`}>
                        Individualna ponuda
                      </span>
                    )}
                    {tier.monthlyUsd && (
                      <p className={`text-xs mt-1.5 ${tier.recommended ? "text-emerald-300" : "text-zinc-400"}`}>
                        {tier.setupFeeEur ? `+ €${tier.setupFeeEur} jednokratno uvođenje · besplatno uz godišnju` : "Uvođenje uključeno"}
                      </p>
                    )}
                  </div>

                  <div className={`grid gap-2 mb-6 p-3 rounded-xl text-xs ${tier.recommended ? "bg-emerald-900" : "bg-zinc-50 border border-zinc-100"}`}>
                    {tier.publishedSkuLimit ? (
                      <>
                        {tier.includedGenerations != null && (
                          <div className="flex justify-between">
                            <span className={tier.recommended ? "text-emerald-300" : "text-zinc-500"}>Generisanja / mes</span>
                            <span className={`font-bold ${tier.recommended ? "text-white" : "text-zinc-800"}`}>{tier.includedGenerations}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className={tier.recommended ? "text-emerald-300" : "text-zinc-500"}>Objavljeni proizvodi</span>
                          <span className={`font-bold ${tier.recommended ? "text-white" : "text-zinc-800"}`}>{tier.publishedSkuLimit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={tier.recommended ? "text-emerald-300" : "text-zinc-500"}>Mesečni pregledi</span>
                          <span className={`font-bold ${tier.recommended ? "text-white" : "text-zinc-800"}`}>{tier.monthlyViewLimit?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={tier.recommended ? "text-emerald-300" : "text-zinc-500"}>Prostor</span>
                          <span className={`font-bold ${tier.recommended ? "text-white" : "text-zinc-800"}`}>{tier.storageGb} GB</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between">
                        <span className={tier.recommended ? "text-emerald-300" : "text-zinc-500"}>SKU / Pregledi</span>
                        <span className={`font-bold ${tier.recommended ? "text-white" : "text-zinc-800"}`}>Po dogovoru</span>
                      </div>
                    )}
                  </div>

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
                      {tier.monthlyUsd ? "Počnite" : "Kontaktirajte nas"}
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
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-3">
              Treba vam više modela?
            </p>
            <h2 className="text-3xl font-semibold text-zinc-900 mb-3">
              Top-up paketi za generisanje
            </h2>
            <p className="text-zinc-500 max-w-lg mx-auto">
              Potrošili ste mesečna generisanja? Dodajte paket — krediti ne ističu i prenose se u naredni mesec. Bez promene plana.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3 max-w-3xl mx-auto">
            {topUps.map((pack) => (
              <article
                key={pack.id}
                className={`relative rounded-2xl border p-6 shadow-sm transition-all ${
                  pack.recommended ? "border-emerald-400 bg-emerald-50/40" : "border-zinc-200 bg-white hover:border-emerald-200"
                }`}
              >
                {pack.recommended && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Najbolja vrednost
                  </span>
                )}
                <h3 className="font-bold text-zinc-900 mb-1">{pack.name}</h3>
                <p className="text-3xl font-bold text-zinc-900">€{pack.priceEur}</p>
                <p className="text-xs font-semibold text-emerald-700 mb-3">€{pack.perModelEur.toFixed(2)} / generisanju</p>
                <p className="text-sm text-zinc-500 leading-relaxed">{pack.note}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ─── Optional Premium Finishing ──────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-3">
              Opciono · radimo umesto vas
            </p>
            <h2 className="text-3xl font-semibold text-zinc-900 mb-3">
              Premium dorada modela
            </h2>
            <p className="text-zinc-500 max-w-lg mx-auto">
              Samostalno generisanje pokriva većinu proizvoda. Za složene ili luksuzne komade, naš tim može ručno doraditi model — naplaćuje se jednom, samo kada zatražite.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {modelAddons.map((addon, i) => (
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
                <p className="text-2xl font-bold text-zinc-900 mb-1">{addon.price}</p>
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
                Prekoračenje upotrebe
              </p>
              <h2 className="text-3xl font-semibold text-zinc-900 mb-3">
                Nadmašite plan kada je potrebno
              </h2>
              <p className="text-zinc-500 max-w-lg mx-auto">
                Prekoračenja se naplaćuju predvidivo — nikada niste blokirani niti iznenađeni.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 max-w-3xl mx-auto">
              {overages.map((overage) => (
                <div
                  key={overage.id}
                  className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm"
                >
                  <h3 className="font-semibold text-zinc-900 mb-1 text-sm">{overage.name}</h3>
                  <p className="text-2xl font-bold text-zinc-900 mb-1">€{overage.price}</p>
                  <p className="text-xs text-emerald-700 font-semibold mb-3">{overage.unit}</p>
                  <p className="text-xs text-zinc-500 leading-relaxed">{overage.guardrail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Tipičan pilot ────────────────────────────────────────────── */}
        <section className="mx-auto max-w-3xl px-6 py-20">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-3">
              Tipičan pilot
            </p>
            <h2 className="text-2xl font-semibold text-zinc-900">
              15 proizvoda na Growth planu — koliko zapravo košta prvi mesec?
            </h2>
          </div>
          <div className="rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-zinc-100 bg-white">
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-zinc-600 text-sm">Growth plan (uključuje 20 generisanja)</span>
                <span className="font-semibold text-zinc-900">€69</span>
              </div>
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-zinc-600 text-sm">Jednokratno uvođenje i podešavanje</span>
                <span className="font-semibold text-zinc-900">€{SETUP_FEE_EUR}</span>
              </div>
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-zinc-600 text-sm">15 generisanja modela</span>
                <span className="font-semibold text-emerald-700">Uključeno</span>
              </div>
              <div className="flex items-center justify-between px-6 py-4 bg-zinc-50">
                <span className="font-bold text-zinc-900 text-sm">Ukupno prvi mesec</span>
                <span className="font-bold text-zinc-900 text-xl">€{69 + SETUP_FEE_EUR}</span>
              </div>
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-zinc-500 text-sm">Od drugog meseca</span>
                <span className="font-semibold text-zinc-400">€69 / mesec</span>
              </div>
            </div>
            <div className="px-6 py-5 bg-emerald-50 border-t border-emerald-100">
              <p className="text-sm text-emerald-800 leading-relaxed">
                <strong>ROI kontekst:</strong> AR podiže konverziju do ~90% i smanjuje povrate nameštaja za 25–40%.
                Jedan izbegnut povrat sofe od €500 štedi €75–125 — ceo pilot se isplati za 1–3 izbegnuta povrata.
              </p>
            </div>
          </div>
          <p className="text-xs text-zinc-400 mt-4 text-center">
            Planovi uključuju mesečna generisanja. Uvođenje je jednokratno, besplatno uz godišnju pretplatu. Fiksna cena — bez naknada na transakcije.
          </p>
        </section>

        {/* ─── FAQ ─────────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-6 py-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-semibold text-zinc-900">Česta pitanja o cenama</h2>
          </div>
          <div className="space-y-3 max-w-2xl mx-auto">
            {[
              {
                q: "Kako funkcionišu generisanja modela i top-up paketi?",
                a: "Svaki plan uključuje određeni broj generisanja modela mesečno — otpremite fotografije proizvoda i mi generišemo njegov 3D/AR model. Treba vam više nego što plan uključuje? Kupite top-up paket; krediti se prenose i ne ističu.",
              },
              {
                q: "Da li naplaćujete naknadu na moju prodaju?",
                a: "Ne. Cena je fiksna mesečna pretplata plus opcioni top-up paketi. Nikada ne uzimamo procenat od vašeg prihoda.",
              },
              {
                q: "Čemu služi naknada za uvođenje?",
                a: "Jednokratno uvođenje od €99: podešavanje naloga, pomoć pri integraciji i prvi modeli pregledani zajedno sa vama. Besplatno je uz godišnju pretplatu.",
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
              Spremni za početak?
            </p>
            <h2 className="text-3xl font-semibold leading-snug">
              Zakažite pilot demo za prvih 10–25 proizvoda
            </h2>
            <p className="text-emerald-200 leading-relaxed max-w-lg mx-auto">
              Pogledajte kako vođeno otpremanje fotografija, ljudska recenzija, hostovani linkovi i analitika se uklapaju u vaš postojeći e-commerce tok rada.
            </p>
            <div className="flex flex-wrap gap-3 justify-center pt-2">
              <Button asChild size="lg" className="bg-white text-emerald-900 hover:bg-emerald-50">
                <Link href="/contact/demo?source=sr-pricing">Zakažite pilot demo</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-emerald-700 bg-transparent text-white hover:bg-emerald-900"
              >
                <Link href="/p/northline-home/arc-oak-dining-chair">
                  Pogledajte primer stranice
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SerbianPricingActivityToast />
    </div>
  )
}

function getPricingCtaHref(tierId: string, isSelfServe: boolean) {
  if (!isSelfServe || tierId === "business") {
    return `/contact/demo?plan=${encodeURIComponent(tierId)}&lang=sr`;
  }

  return `/login?intent=${encodeURIComponent(tierId)}`;
}
