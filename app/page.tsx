import type { Metadata } from "next"
import { LandingPageContent } from "@/components/LandingPageContent"
import {
  breadcrumbJsonLd,
  buildSeoMetadata,
  jsonLd,
  marketingAlternates,
  webApplicationJsonLd
} from "@/lib/seo"

export const metadata: Metadata = buildSeoMetadata({
  title: "Furniture AR Product Pages That Help Shoppers Buy With Confidence",
  description:
    "Turn 4 furniture photos into verified 3D/AR product pages. Let shoppers see size, shape, and style in their room before they buy.",
  path: "/",
  lang: "en",
  alternates: marketingAlternates("/", "/sr")
})

export default function LandingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(webApplicationJsonLd("en", "/"))} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(breadcrumbJsonLd([{ name: "Home", path: "/" }]))}
      />
      <LandingPageContent lang="en" />
    </>
  )
}
