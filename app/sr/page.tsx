import type { Metadata } from "next"
import { LandingPageContent } from "@/components/LandingPageContent"
import {
  breadcrumbJsonLd,
  buildSeoMetadata,
  faqPageJsonLd,
  howToJsonLd,
  jsonLd,
  marketingAlternates,
  serviceJsonLd,
  webApplicationJsonLd
} from "@/lib/seo"
import { translations } from "@/lib/translations"

export const metadata: Metadata = buildSeoMetadata({
  title: "AR stranice proizvoda za prodavnice nameštaja | Augmenta",
  description:
    "Pretvorite 4 fotografije nameštaja u verifikovane 3D/AR stranice proizvoda kako bi kupci videli veličinu, oblik i stil u svojoj sobi.",
  path: "/sr",
  lang: "sr",
  alternates: marketingAlternates("/", "/sr")
})

export default function LandingPageSr() {
  const t = translations.sr
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(webApplicationJsonLd("sr", "/sr"))} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(serviceJsonLd("sr"))} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(breadcrumbJsonLd([{ name: "Početna", path: "/sr" }]))}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(faqPageJsonLd(t.faqItems))}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(
          howToJsonLd(
            t.howItWorks.heading,
            "Korak po korak od fotografija nameštaja do žive AR stranice.",
            t.workflow.map((w) => ({ name: w.step, text: w.copy }))
          )
        )}
      />
      <LandingPageContent lang="sr" />
    </>
  )
}
