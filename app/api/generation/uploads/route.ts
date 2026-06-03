import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  MAX_GENERATION_PHOTO_BYTES_TOTAL,
  MAX_GENERATION_PHOTO_SIZE_BYTES,
  REQUIRED_GENERATION_PHOTOS,
  SUPPORTED_GENERATION_IMAGE_TYPES,
  formatMegabytes
} from "@/lib/generation-upload";
import {
  createOrganizationProductPhotoKey,
  createPresignedR2PutUrl,
  createProductPhotoKey,
  R2ConfigurationError,
  R2RequestError
} from "@/lib/storage/r2";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ensureCurrentOrganization } from "@/lib/supabase/data";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  CreateGenerationUploadsRequest,
  CreateGenerationUploadsResponse,
  GenerationPhotoContentType,
  GenerationUploadPhotoInput
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<CreateGenerationUploadsRequest>;
    const photos = Array.isArray(payload.photos) ? payload.photos : [];
    const validationError = validateUploadPhotos(photos);

    if (validationError) {
      return NextResponse.json({ errorMessage: validationError }, { status: 400 });
    }

    const productId = `${slugify(payload.productName || "product")}-${randomUUID().slice(0, 8)}`;
    const supabase = isSupabaseConfigured() ? await createServerSupabaseClient() : null;
    const organizationResult = supabase ? await ensureCurrentOrganization(supabase) : null;

    if (organizationResult?.status === "unauthenticated") {
      return NextResponse.json({ errorMessage: "Sign in before uploading product photos." }, { status: 401 });
    }

    if (organizationResult?.status === "setup_failed") {
      return NextResponse.json({ errorMessage: organizationResult.errorMessage }, { status: 500 });
    }

    const organization = organizationResult?.organization ?? null;
    const databaseProductId = organization
      ? await createProductRecord(supabase!, organization.id, payload)
      : productId;
    const objectOwnerId = organization?.id ?? "demo-org";
    const uploads = await Promise.all(
      photos.map(async (photo, index) => {
        const key = organization
          ? createOrganizationProductPhotoKey(objectOwnerId, databaseProductId, photo.fileName || `photo-${index + 1}.jpg`, index)
          : createProductPhotoKey(databaseProductId, photo.fileName || `photo-${index + 1}.jpg`, index);
        const presigned = await createPresignedR2PutUrl({
          key,
          contentType: photo.contentType,
          cacheControl: "private, max-age=0, no-store"
        });

        return {
          key,
          fileName: photo.fileName,
          contentType: photo.contentType,
          size: photo.size,
          uploadUrl: presigned.uploadUrl,
          headers: presigned.headers
        };
      })
    );

    return NextResponse.json({
      productId: databaseProductId,
      uploads
    } satisfies CreateGenerationUploadsResponse);
  } catch (error) {
    return handleUploadsError(error);
  }
}

async function createProductRecord(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  organizationId: string,
  payload: Partial<CreateGenerationUploadsRequest>
) {
  const productName = payload.productName?.trim() || "Product";
  const slug = `${slugify(productName)}-${randomUUID().slice(0, 8)}`;
  const { data, error } = await supabase
    .from("products")
    .insert({
      organization_id: organizationId,
      name: productName,
      slug,
      category: payload.category || "small_decor",
      status: "draft",
      description: payload.description || null,
      customer_url: payload.customerUrl || null,
      price: payload.price || null,
      width_m: payload.dimensions?.width ?? null,
      height_m: payload.dimensions?.height ?? null,
      depth_m: payload.dimensions?.depth ?? null
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error("Product could not be created.");
  }

  return data.id as string;
}

function validateUploadPhotos(photos: GenerationUploadPhotoInput[]) {
  if (photos.length !== REQUIRED_GENERATION_PHOTOS) {
    return "Upload exactly 4 product photos before starting generation.";
  }

  const invalidPhoto = photos.find((photo) => !isUploadPhotoInput(photo));

  if (invalidPhoto) {
    return "Use prepared JPG or PNG photos only for this generation flow.";
  }

  const oversizedPhoto = photos.find((photo) => photo.size > MAX_GENERATION_PHOTO_SIZE_BYTES);

  if (oversizedPhoto) {
    return `One prepared photo is still larger than ${formatMegabytes(
      MAX_GENERATION_PHOTO_SIZE_BYTES
    )}. Try a clearer source photo with fewer pixels.`;
  }

  const totalPhotoBytes = photos.reduce((total, photo) => total + photo.size, 0);

  if (totalPhotoBytes > MAX_GENERATION_PHOTO_BYTES_TOTAL) {
    return `The prepared photos are still too large together. The app needs the generated upload under ${formatMegabytes(
      MAX_GENERATION_PHOTO_BYTES_TOTAL
    )}.`;
  }

  return "";
}

function isUploadPhotoInput(photo: GenerationUploadPhotoInput): photo is GenerationUploadPhotoInput {
  return (
    typeof photo.fileName === "string" &&
    photo.fileName.trim().length > 0 &&
    isSupportedPhotoType(photo.contentType) &&
    Number.isFinite(photo.size) &&
    photo.size > 0
  );
}

function isSupportedPhotoType(type: unknown): type is GenerationPhotoContentType {
  return typeof type === "string" && SUPPORTED_GENERATION_IMAGE_TYPES.has(type.toLowerCase());
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

function handleUploadsError(error: unknown) {
  if (error instanceof Error && error.message === "Product could not be created.") {
    return NextResponse.json(
      { errorMessage: "We could not create the product record. Please try again." },
      { status: 500 }
    );
  }

  if (error instanceof R2ConfigurationError) {
    return NextResponse.json(
      {
        errorMessage: "Storage is not configured yet. Add the R2 environment variables and try again.",
        failureCode: "storage_not_configured"
      },
      { status: 500 }
    );
  }

  if (error instanceof R2RequestError) {
    console.error("Upload preparation storage request failed", toSafeErrorLog(error));

    return NextResponse.json(
      {
        errorMessage:
          "Storage could not create upload links. Check the R2 bucket name, endpoint, access key permissions, and CORS policy.",
        failureCode: "storage_request_failed"
      },
      { status: 502 }
    );
  }

  console.error("Upload preparation failed", toSafeErrorLog(error));

  return NextResponse.json(
    { errorMessage: "We could not prepare photo uploads. Please try again.", failureCode: "upload_preparation_failed" },
    { status: 500 }
  );
}

function toSafeErrorLog(error: unknown) {
  if (error instanceof R2RequestError) {
    return {
      name: error.name,
      operation: error.operation,
      cause: getSafeCause(error.cause)
    };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message
    };
  }

  return { message: String(error) };
}

function getSafeCause(cause: unknown) {
  if (cause instanceof Error) {
    return {
      name: cause.name,
      message: cause.message
    };
  }

  return String(cause);
}
