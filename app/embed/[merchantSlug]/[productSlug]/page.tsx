import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { EmbedExperience, type EmbedOptions } from "@/components/EmbedExperience";
import { noIndexMetadata } from "@/lib/seo";
import { getPublishedProduct } from "@/lib/supabase/data";

// Published state can change at any time and the row drives framing/analytics,
// so the embed must never be statically cached.
export const dynamic = "force-dynamic";

type EmbedPageProps = {
  params: Promise<{ merchantSlug: string; productSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// Embed customization is attacker-controllable (anyone can craft the iframe src),
// so every option is constrained to a known enum. Unknown/garbage values fall
// back to defaults rather than erroring.
const embedOptionsSchema = z.object({
  // `ar=1` is read by ModelViewer from the URL directly; parsed here only so it
  // is a recognized, validated param.
  ar: z.enum(["0", "1"]).optional(),
  bg: z.enum(["transparent", "light", "dark"]).optional(),
  cta: z.enum(["show", "hide"]).optional(),
});

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "AR product embed",
    robots: noIndexMetadata.robots,
  };
}

export default async function EmbedPage({ params, searchParams }: EmbedPageProps) {
  const { merchantSlug, productSlug } = await params;

  // Published-only: no mock-data fallback, unlike the /p hosted page.
  const product = await getPublishedProduct(merchantSlug, productSlug);
  if (!product) {
    notFound();
  }

  const parsed = embedOptionsSchema.safeParse(await searchParams);
  const raw = parsed.success ? parsed.data : {};
  const options: EmbedOptions = {
    background: raw.bg ?? "light",
    showCta: raw.cta !== "hide",
  };

  return (
    <EmbedExperience
      merchantSlug={merchantSlug}
      productSlug={productSlug}
      product={product}
      options={options}
    />
  );
}
