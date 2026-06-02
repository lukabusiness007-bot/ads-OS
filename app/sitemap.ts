import type { MetadataRoute } from "next";
import {
  getSeoContentAlternatePath,
  getSeoContentPath,
  seoContentPages
} from "@/lib/seo-content";
import { absoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const staticPages = [
    {
      path: "/",
      en: "/",
      sr: "/sr",
      priority: 1
    },
    {
      path: "/pricing",
      en: "/pricing",
      sr: "/sr/pricing",
      priority: 0.85
    },
    {
      path: "/sr",
      en: "/",
      sr: "/sr",
      priority: 0.95
    },
    {
      path: "/sr/pricing",
      en: "/pricing",
      sr: "/sr/pricing",
      priority: 0.8
    }
  ];

  const contentPages = [...seoContentPages.en, ...seoContentPages.sr].map((page) => {
    const path = getSeoContentPath(page);
    const alternatePath = getSeoContentAlternatePath(page);
    const en = page.lang === "en" ? path : alternatePath;
    const sr = page.lang === "sr" ? path : alternatePath;

    return {
      path,
      en,
      sr,
      priority: 0.75
    };
  });

  return [...staticPages, ...contentPages].map((page) => ({
    url: absoluteUrl(page.path),
    lastModified,
    changeFrequency: "weekly",
    priority: page.priority,
    alternates: {
      languages: {
        en: absoluteUrl(page.en),
        sr: absoluteUrl(page.sr),
        "x-default": absoluteUrl(page.en)
      }
    }
  }));
}
