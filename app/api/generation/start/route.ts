import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  MAX_GENERATION_FORM_BODY_SIZE_BYTES,
  MAX_GENERATION_PHOTO_BYTES_TOTAL,
  MAX_GENERATION_PHOTO_SIZE_BYTES,
  REQUIRED_GENERATION_PHOTOS,
  SUPPORTED_GENERATION_IMAGE_TYPES,
  formatMegabytes
} from "@/lib/generation-upload";
import { createMeshyMultiImageTask, MeshyConfigurationError, MeshyRequestError } from "@/lib/providers/meshy";
import { createProductPhotoKey, uploadR2Object } from "@/lib/storage/r2";
import type { StartGenerationResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const bodySizeError = validateRequestBodySize(request);

    if (bodySizeError) {
      return bodySizeError;
    }

    const formData = await request.formData();
    const productName = getFormString(formData, "productName") || "product";
    const imageEnhancement = formData.get("imageEnhancement") === "on";
    const files = formData.getAll("photos").filter((entry): entry is File => entry instanceof File);

    if (files.length !== REQUIRED_GENERATION_PHOTOS) {
      return NextResponse.json(
        { errorMessage: "Upload exactly 4 product photos before starting generation." },
        { status: 400 }
      );
    }

    const totalPhotoBytes = files.reduce((total, file) => total + file.size, 0);

    if (totalPhotoBytes > MAX_GENERATION_PHOTO_BYTES_TOTAL) {
      return NextResponse.json(
        {
          errorMessage: `The selected photos are too large together. Keep the full upload under ${formatMegabytes(
            MAX_GENERATION_PHOTO_BYTES_TOTAL
          )}.`
        },
        { status: 413 }
      );
    }

    const productId = `${slugify(productName)}-${randomUUID().slice(0, 8)}`;
    const imageDataUris: string[] = [];

    for (const [index, file] of files.entries()) {
      const contentType = getSupportedImageType(file);

      if (!contentType) {
        return NextResponse.json(
          { errorMessage: "Use JPG or PNG photos only for this generation flow." },
          { status: 400 }
        );
      }

      if (file.size > MAX_GENERATION_PHOTO_SIZE_BYTES) {
        return NextResponse.json(
          { errorMessage: `Each photo must be ${formatMegabytes(MAX_GENERATION_PHOTO_SIZE_BYTES)} or smaller.` },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      await uploadR2Object({
        key: createProductPhotoKey(productId, file.name || `photo-${index + 1}`, index),
        body: buffer,
        contentType,
        cacheControl: "private, max-age=0, no-store"
      });

      imageDataUris.push(`data:${contentType};base64,${buffer.toString("base64")}`);
    }

    const taskId = await createMeshyMultiImageTask(imageDataUris, { imageEnhancement });
    const response: StartGenerationResponse = {
      productId,
      taskId,
      status: "queued"
    };

    return NextResponse.json(response);
  } catch (error) {
    return handleStartError(error);
  }
}

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getSupportedImageType(file: File) {
  const type = file.type.toLowerCase();

  if (SUPPORTED_GENERATION_IMAGE_TYPES.has(type)) {
    return type;
  }

  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  if (fileName.endsWith(".png")) {
    return "image/png";
  }

  return null;
}

function validateRequestBodySize(request: Request) {
  const contentLength = request.headers.get("content-length");

  if (!contentLength) {
    return null;
  }

  const requestBytes = Number.parseInt(contentLength, 10);

  if (!Number.isFinite(requestBytes) || requestBytes <= MAX_GENERATION_FORM_BODY_SIZE_BYTES) {
    return null;
  }

  return NextResponse.json(
    {
      errorMessage: `This upload is too large to process. Keep the selected photos under ${formatMegabytes(
        MAX_GENERATION_PHOTO_BYTES_TOTAL
      )} total.`
    },
    { status: 413 }
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "product";
}

function handleStartError(error: unknown) {
  if (error instanceof MeshyConfigurationError) {
    return NextResponse.json(
      { errorMessage: "The generation service is not configured yet. Add the Meshy API key and try again." },
      { status: 500 }
    );
  }

  if (error instanceof MeshyRequestError) {
    return NextResponse.json(
      { errorMessage: "The generation service could not start this model. Please try again with clearer photos." },
      { status: error.statusCode >= 500 ? 502 : error.statusCode }
    );
  }

  if (error instanceof Error && error.message === "R2 storage is not configured.") {
    return NextResponse.json(
      { errorMessage: "Storage is not configured yet. Add the R2 environment variables and try again." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { errorMessage: "We could not start generation. Please try again." },
    { status: 500 }
  );
}
