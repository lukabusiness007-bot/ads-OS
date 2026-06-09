import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ensureCurrentOrganization } from "@/lib/supabase/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { ProductStatus } from "@/lib/types";

const dimensionSchema = z.object({
  width: z.number().finite().nonnegative(),
  height: z.number().finite().nonnegative(),
  depth: z.number().finite().nonnegative()
});

const updateProductSchema = z.object({
  name: z.string().trim().max(200).optional(),
  category: z.string().trim().max(64).optional(),
  description: z.string().max(5000).optional(),
  customerUrl: z.string().max(2048).optional(),
  price: z.string().max(64).optional(),
  dimensions: dimensionSchema.optional()
});

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

  const parsed = updateProductSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ errorMessage: "Invalid product update." }, { status: 400 });
  }
  const body = parsed.data;

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
