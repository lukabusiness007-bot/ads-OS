import type { ReactNode } from "react";
import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata;

export default function PublishedLinksLayout({ children }: { children: ReactNode }) {
  return children;
}
