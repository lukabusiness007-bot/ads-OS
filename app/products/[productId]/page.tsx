import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ProductDetail } from "@/components/ProductDetail";
import { getProductById } from "@/lib/supabase/data";

export default async function ProductDetailPage({
  params
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const product = await getProductById(productId);

  if (!product) {
    notFound();
  }

  return (
    <AppShell>
      <ProductDetail product={product} />
    </AppShell>
  );
}
