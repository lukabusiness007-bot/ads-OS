import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HostedProductExperience } from "@/components/HostedProductExperience";
import { getHostedProduct, products } from "@/lib/mock-data";
import { noIndexMetadata } from "@/lib/seo";

type PublicHostedPageProps = {
  params: Promise<{
    merchantSlug: string;
    productSlug: string;
  }>;
};

export function generateStaticParams() {
  return products
    .filter((product) => product.hostedPage?.status === "published")
    .map((product) => {
      const [merchantSlug, productSlug] = product.hostedPage?.slug.split("/") ?? [];

      return {
        merchantSlug,
        productSlug
      };
    });
}

export async function generateMetadata({ params }: PublicHostedPageProps): Promise<Metadata> {
  const { merchantSlug, productSlug } = await params;
  const product = getHostedProduct(merchantSlug, productSlug);

  if (!product) {
    return {
      title: "Product preview unavailable",
      robots: noIndexMetadata.robots
    };
  }

  return {
    title: `${product.name} | ${product.brandName}`,
    description: product.description,
    robots: noIndexMetadata.robots,
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.modelAsset?.posterUrl ? [product.modelAsset.posterUrl] : undefined
    }
  };
}

export default async function PublicHostedPage({ params }: PublicHostedPageProps) {
  const { merchantSlug, productSlug } = await params;
  const product = getHostedProduct(merchantSlug, productSlug);

  if (!product) {
    notFound();
  }

  return <HostedProductExperience merchantSlug={merchantSlug} productSlug={productSlug} product={product} />;
}
