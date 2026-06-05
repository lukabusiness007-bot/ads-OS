import type { Metadata } from "next";
import "./globals.css";
import { RuntimeDiagnosticsPopup } from "@/components/RuntimeDiagnosticsPopup";
import { LanguageProvider } from "@/lib/lang";
import { jsonLd, organizationJsonLd, siteConfig } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "AR stranice proizvoda — kupujte sa sigurnošću | Veridian",
    template: "%s | Veridian"
  },
  description:
    "Pretvorite 4 fotografije nameštaja u verifikovane 3D/AR stranice proizvoda. Neka kupci vide veličinu, oblik i stil u svojoj sobi pre nego što kupe.",
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
    <html lang="sr">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(organizationJsonLd())} />
        <LanguageProvider>{children}</LanguageProvider>
        <RuntimeDiagnosticsPopup />
      </body>
    </html>
  );
}
