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
  title: "Furniture AR Product Pages That Help Shoppers Buy With Confidence",
  description:
    "Turn 4 furniture photos into verified 3D/AR product pages. Let shoppers see size, shape, and style in their room before they buy.",
  path: "/",
  lang: "en",
  alternates: marketingAlternates("/", "/sr")
})

export default function LandingPage() {
  const t = translations.en
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(webApplicationJsonLd("en", "/"))} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(serviceJsonLd("en"))} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(breadcrumbJsonLd([{ name: "Home", path: "/" }]))}
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
            "A step-by-step guide from furniture photos to a live hosted AR product page.",
            t.workflow.map((w) => ({ name: w.step, text: w.copy }))
          )
        )}
      />
      <LandingPageContent lang="en" />
    </>
  )
}
