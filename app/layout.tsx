import type { Metadata } from "next";
import "./globals.css";
import { RuntimeDiagnosticsPopup } from "@/components/RuntimeDiagnosticsPopup";
import { LanguageProvider } from "@/lib/lang";
import { jsonLd, organizationJsonLd, siteConfig } from "@/lib/seo";
import { Fraunces, Inter } from "next/font/google";

const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["SOFT", "opsz"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Furniture AR Product Pages That Help Shoppers Buy With Confidence | Augmenta",
    template: "%s | Augmenta"
  },
  description:
    "Turn 4 furniture photos into verified 3D/AR product pages. Let shoppers see size, shape, and style in their room before they buy.",
  applicationName: siteConfig.fullName,
  appleWebApp: {
    title: siteConfig.name
  },
  themeColor: "#064e3b",
  colorScheme: "light",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1
    }
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(organizationJsonLd())} />
        <LanguageProvider>{children}</LanguageProvider>
        <RuntimeDiagnosticsPopup />
      </body>
    </html>
  );
}
