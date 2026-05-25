import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
