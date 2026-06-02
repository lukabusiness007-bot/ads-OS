import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/lang";
import { jsonLd, organizationJsonLd, siteConfig } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Furniture AR Product Pages That Help Shoppers Buy With Confidence | Veridian",
    template: "%s | Veridian"
  },
  description:
    "Turn 4 furniture photos into verified 3D/AR product pages. Let shoppers see size, shape, and style in their room before they buy.",
  applicationName: siteConfig.fullName,
  appleWebApp: {
    title: siteConfig.name
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(organizationJsonLd())} />
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
