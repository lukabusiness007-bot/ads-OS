import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin",
        "/analytics",
        "/analytics-billing",
        "/approval",
        "/billing",
        "/create",
        "/dashboard",
        "/expansion",
        "/hosted-page",
        "/launch",
        "/preview",
        "/published-links",
        "/status",
        "/upload"
      ]
    },
    sitemap: absoluteUrl("/sitemap.xml")
  };
}
