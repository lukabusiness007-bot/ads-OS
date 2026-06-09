import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ensureCurrentOrganization } from "@/lib/supabase/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { ProductCategory, ProductStatus } from "@/lib/types";

const DELETABLE_STATUSES: ProductStatus[] = [
  "draft",
  "photos_uploaded",
  "generation_failed",
  "rejected"
];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ errorMessage: "Storage not configured." }, { status: 500 });
  }

  const supabase = await createServerSupabaseClient();
  const orgResult = await ensureCurrentOrganization(supabase);

  if (orgResult.status !== "ready") {
    return NextResponse.json({ errorMessage: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: string;
    category?: ProductCategory;
    description?: string;
    customerUrl?: string;
    price?: string;
    dimensions?: { width: number; height: number; depth: number };
  };

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  };

  if (body.name?.trim()) {
    const trimmed = body.name.trim();
    updates.name = trimmed;
    updates.slug = slugify(trimmed) + "-" + productId.slice(0, 8);
  }
  if (body.category) updates.category = body.category;
  if (body.description !== undefined) updates.description = body.description.trim() || null;
  if (body.customerUrl !== undefined) updates.customer_url = body.customerUrl.trim() || null;
  if (body.price !== undefined) updates.price = body.price.trim() || null;
  if (body.dimensions) {
    updates.width_m = body.dimensions.width;
    updates.height_m = body.dimensions.height;
    updates.depth_m = body.dimensions.depth;
  }

  const { error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", productId)
    .eq("organization_id", orgResult.organization.id);

  if (error) {
    return NextResponse.json({ errorMessage: "Could not update product." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ errorMessage: "Storage not configured." }, { status: 500 });
  }

  const supabase = await createServerSupabaseClient();
  const orgResult = await ensureCurrentOrganization(supabase);

  if (orgResult.status !== "ready") {
    return NextResponse.json({ errorMessage: "Unauthorized." }, { status: 401 });
  }

  const { data: product } = await supabase
    .from("products")
    .select("id, status")
    .eq("id", productId)
    .eq("organization_id", orgResult.organization.id)
    .maybeSingle();

  if (!product) {
    return NextResponse.json({ errorMessage: "Product not found." }, { status: 404 });
  }

  if (!DELETABLE_STATUSES.includes(product.status as ProductStatus)) {
    return NextResponse.json(
      { errorMessage: "This product cannot be deleted in its current status." },
      { status: 409 }
    );
  }

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("organization_id", orgResult.organization.id);

  if (error) {
    return NextResponse.json({ errorMessage: "Could not delete product." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "product"
  );
}
