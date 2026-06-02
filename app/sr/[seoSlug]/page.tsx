import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeoContentPage } from "@/components/SeoContentPage";
import {
  getSeoContentAlternatePath,
  getSeoContentPage,
  getSeoContentPath,
  seoContentPages
} from "@/lib/seo-content";
import { buildSeoMetadata, marketingAlternates } from "@/lib/seo";

type SeoPageProps = {
  params: Promise<{
    seoSlug: string;
  }>;
};

export function generateStaticParams() {
  return seoContentPages.sr.map((page) => ({
    seoSlug: page.slug
  }));
}

export async function generateMetadata({ params }: SeoPageProps): Promise<Metadata> {
  const { seoSlug } = await params;
  const page = getSeoContentPage("sr", seoSlug);

  if (!page) {
    return {};
  }

  const currentPath = getSeoContentPath(page);

  return buildSeoMetadata({
    title: page.title,
    description: page.description,
    path: currentPath,
    lang: "sr",
    alternates: marketingAlternates(getSeoContentAlternatePath(page), currentPath)
  });
}

export default async function SerbianSeoPage({ params }: SeoPageProps) {
  const { seoSlug } = await params;
  const page = getSeoContentPage("sr", seoSlug);

  if (!page) {
    notFound();
  }

  return <SeoContentPage page={page} />;
}
