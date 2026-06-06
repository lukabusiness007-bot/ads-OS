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

const plans = [
  {
    id: "starter",
    name: "Starter",
    monthlyUsd: 39,
    publishedSkuLimit: 5,
    storageGb: 2,
    monthlyViewLimit: 5000,
    positioning: "Prva provera za malu Shopify prodavnicu.",
    includes: [
      "3D preglednik i AR bez aplikacije",
      "Hostovane stranice proizvoda",
      "Osnovna analitika angažovanosti",
      "Podrška putem emaila",
    ],
    recommended: false,
  },
  {
    id: "growth",
    name: "Growth",
    monthlyUsd: 89,
    publishedSkuLimit: 20,
    storageGb: 10,
    monthlyViewLimit: 25000,
    positioning: "Najbolji izbor za pilote sa 10–25 SKU-ova.",
    includes: [
      "Sve iz Starter plana",
      "Vodič za Shopify integraciju",
      "Prioritetna lista za pregled modela",
      "CSV izvoz analitike",
    ],
    recommended: true,
  },
  {
    id: "studio",
    name: "Studio",
    monthlyUsd: 179,
    publishedSkuLimit: 50,
    storageGb: 50,
    monthlyViewLimit: 100000,
    positioning: "Za prodavnice koje šire AR kroz veći katalog.",
    includes: [
      "Sve iz Growth plana",
      "White-label hostovane stranice",
      "Napredni izveštaji o uređajima",
      "Uvodni poziv pre lansiranja",
    ],
    recommended: false,
  },
  {
    id: "business",
    name: "Business",
    monthlyUsd: null,
    publishedSkuLimit: null,
    storageGb: null,
    monthlyViewLimit: null,
    positioning: "Za 100+ SKU-ova, prilagođeni SLA, uvođenje i podršku.",
    includes: [
      "Prilagođena kvota SKU-ova",
      "Prilagođeni uslovi upotrebe",
      "Posvećeno uvođenje",
      "Opcioni nabavni ugovor",
    ],
    recommended: false,
  },
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
    name: "Dodatni objavljeni SKU",
    price: 5,
    unit: "po SKU-u/mesečno",
    guardrail: "Čini proširenje objavljenog kataloga isplativim bez prisilnog prelaska na viši plan.",
  },
  {
    id: "view-pack",
    name: "Dodatni paket pregleda",
    price: 10,
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
            question: "Da li se kreacija modela naplaćuje odvojeno od hostinga?",
            answer: "Da. Mesečna pretplata pokriva hostovane stranice, AR preglednik i analitiku. Kreacija modela je zasebna jednokratna naknada po odobrenom SKU-u.",
          },
          {
            question: "Šta ako model ne prođe pregled kvaliteta?",
            answer: "Stranica ostaje neobjavljena i revidiramo ili regenerišemo model. Naplaćujemo samo odobrene, objavljene modele.",
          },
          {
            question: "Mogu li početi sa manjim brojem SKU-ova?",
            answer: "Apsolutno. Starter plan pokriva do 5 objavljenih SKU-ova. Možete nadograditi u bilo kom trenutku kako vaš katalog raste.",
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
            Počnite sa 10 proizvoda nameštaja. Dokažite angažovanje pre skaliranja.
          </h1>
          <p className="text-lg text-zinc-500 max-w-xl mx-auto leading-relaxed">
            Mesečna pretplata za hostovane AR stranice plus naknada po odobrenom modelu za 3D kreaciju. Dovoljno jednostavno za pilot pre širenja na ceo katalog.
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
                  </div>

                  <div className={`grid gap-2 mb-6 p-3 rounded-xl text-xs ${tier.recommended ? "bg-emerald-900" : "bg-zinc-50 border border-zinc-100"}`}>
                    {tier.publishedSkuLimit ? (
                      <>
                        <div className="flex justify-between">
                          <span className={tier.recommended ? "text-emerald-300" : "text-zinc-500"}>Objavljeni SKU-ovi</span>
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

        {/* ─── Model Creation Add-ons ──────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-3">
              Naknada po modelu
            </p>
            <h2 className="text-3xl font-semibold text-zinc-900 mb-3">
              Dodaci za kreiranje 3D modela
            </h2>
            <p className="text-zinc-500 max-w-lg mx-auto">
              Naplaćuje se jednom po odobrenom modelu. Odaberite nivo koji odgovara složenosti i kvalitetu vašeg proizvoda.
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
              15 SKU-ova na Growth planu — koliko zapravo košta prvi mesec?
            </h2>
          </div>
          <div className="rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-zinc-100 bg-white">
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-zinc-600 text-sm">Growth plan (hosting)</span>
                <span className="font-semibold text-zinc-900">€89</span>
              </div>
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-zinc-600 text-sm">15 × kreacija modela (e-commerce nivo)</span>
                <span className="font-semibold text-zinc-900">15 × €149 = €2.235</span>
              </div>
              <div className="flex items-center justify-between px-6 py-4 bg-zinc-50">
                <span className="font-bold text-zinc-900 text-sm">Ukupno prvi mesec</span>
                <span className="font-bold text-zinc-900 text-xl">€2.324</span>
              </div>
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-zinc-500 text-sm">Od drugog meseca</span>
                <span className="font-semibold text-zinc-400">€89 / mesec</span>
              </div>
            </div>
            <div className="px-6 py-5 bg-emerald-50 border-t border-emerald-100">
              <p className="text-sm text-emerald-800 leading-relaxed">
                <strong>ROI kontekst:</strong> Jedan izbegnut povrat sofe od €500 štedi €75–125 u logistici i rukovanju.
                Pilot obično nadoknađuje troškove kreacije modela unutar 2–4 izbegnuta povrata.
              </p>
            </div>
          </div>
          <p className="text-xs text-zinc-400 mt-4 text-center">
            Kreacija modela je jednokratna naknada po odobrenom SKU-u. Hosting se obnavlja mesečno.
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
                q: "Da li se kreacija modela naplaćuje odvojeno od hostinga?",
                a: "Da. Mesečna pretplata pokriva hostovane stranice, AR preglednik i analitiku. Kreacija modela je zasebna jednokratna naknada po odobrenom SKU-u.",
              },
              {
                q: "Šta ako model ne prođe pregled kvaliteta?",
                a: "Stranica ostaje neobjavljena i revidiramo ili regenerišemo model. Naplaćujemo samo odobrene, objavljene modele.",
              },
              {
                q: "Mogu li početi sa manjim brojem SKU-ova?",
                a: "Apsolutno. Starter plan pokriva do 5 objavljenih SKU-ova. Možete nadograditi u bilo kom trenutku kako vaš katalog raste.",
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
