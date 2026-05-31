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
  title: "AR stranice proizvoda za prodavnice namestaja",
  description:
    "Pretvorite 4 fotografije namestaja u verifikovane 3D/AR stranice proizvoda kako bi kupci videli velicinu, oblik i stil u svojoj sobi.",
  path: "/sr",
  lang: "sr",
  alternates: marketingAlternates("/", "/sr")
})

export default function LandingPageSr() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(webApplicationJsonLd("sr", "/sr"))} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(breadcrumbJsonLd([{ name: "Pocetna", path: "/sr" }]))}
      />
      <LandingPageContent lang="sr" />
    </>
  )
}
