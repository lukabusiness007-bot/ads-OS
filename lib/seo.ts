import type { Metadata } from "next";

export type SeoLang = "en" | "sr";

export const siteConfig = {
  name: "Augmenta",
  fullName: "Augmenta",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://veridianar.com").replace(/\/$/, ""),
  ogImagePath: "/opengraph-image",
  contactEmail: "hello@veridianar.com"
};

export const localeByLang: Record<SeoLang, string> = {
  en: "en_US",
  sr: "sr_RS"
};

export const noIndexMetadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false
    }
  }
};

type BuildSeoMetadataInput = {
  title: string;
  description: string;
  path: string;
  lang: SeoLang;
  alternates: Record<SeoLang | "x-default", string>;
  imagePath?: string;
};

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${siteConfig.url}${normalizedPath}`;
}

export function buildSeoMetadata({
  title,
  description,
  path,
  lang,
  alternates,
  imagePath = siteConfig.ogImagePath
}: BuildSeoMetadataInput): Metadata {
  const imageUrl = absoluteUrl(imagePath);

  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl(path),
      languages: {
        en: absoluteUrl(alternates.en),
        sr: absoluteUrl(alternates.sr),
        "x-default": absoluteUrl(alternates["x-default"])
      }
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(path),
      siteName: siteConfig.fullName,
      locale: localeByLang[lang],
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${siteConfig.name} furniture AR product pages`
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl]
    }
  };
}

export function marketingAlternates(enPath: string, srPath: string) {
  return {
    en: enPath,
    sr: srPath,
    "x-default": enPath
  } satisfies Record<SeoLang | "x-default", string>;
}

export function jsonLd(value: unknown) {
  return {
    __html: JSON.stringify(value).replace(/</g, "\\u003c")
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.fullName,
    alternateName: siteConfig.name,
    url: siteConfig.url,
    logo: absoluteUrl(siteConfig.ogImagePath),
    contactPoint: {
      "@type": "ContactPoint",
      email: siteConfig.contactEmail,
      contactType: "sales"
    }
  };
}

export function webApplicationJsonLd(lang: SeoLang, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.fullName,
    url: absoluteUrl(path),
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: lang === "sr" ? "sr" : "en",
    description:
      lang === "sr"
        ? "SaaS platforma za 3D i AR stranice proizvoda namenjena prodavnicama nameštaja."
        : "SaaS platform for verified 3D and AR product pages built for furniture stores.",
    featureList:
      lang === "sr"
        ? ["3D pregled proizvoda", "App-free AR", "Analitika angažovanja", "Upravljanje katalogom"]
        : ["3D product viewer", "App-free AR", "Engagement analytics", "Catalog management"],
    offers: {
      "@type": "Offer",
      price: "39",
      priceCurrency: "EUR",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "39",
        priceCurrency: "EUR",
        referenceQuantity: {
          "@type": "QuantitativeValue",
          value: "1",
          unitCode: "MON"
        }
      }
    }
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path)
    }))
  };
}
