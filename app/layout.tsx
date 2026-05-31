import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/lang";

export const metadata: Metadata = {
  title: "Veridian AR Commerce",
  description: "Verified AR product pages for furniture stores, without hiring a 3D team."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sr">
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
