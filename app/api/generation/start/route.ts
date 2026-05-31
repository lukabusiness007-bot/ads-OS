import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createMeshyMultiImageTask, MeshyConfigurationError, MeshyRequestError } from "@/lib/providers/meshy";
import { createProductPhotoKey, uploadR2Object } from "@/lib/storage/r2";
import type { StartGenerationResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PHOTOS = 4;
const MAX_PHOTO_SIZE = 20 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const productName = getFormString(formData, "productName") || "product";
    const files = formData.getAll("photos").filter((entry): entry is File => entry instanceof File);

    if (files.length < 1 || files.length > MAX_PHOTOS) {
      return NextResponse.json(
        { errorMessage: "Upload 1-4 product photos before starting generation." },
        { status: 400 }
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

      if (file.size > MAX_PHOTO_SIZE) {
        return NextResponse.json(
          { errorMessage: "Each photo must be 20 MB or smaller." },
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

    const taskId = await createMeshyMultiImageTask(imageDataUris);
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

  if (SUPPORTED_IMAGE_TYPES.has(type)) {
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
