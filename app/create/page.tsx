"use client"

import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import {
  MAX_GENERATION_PHOTO_BYTES_TOTAL,
  MAX_GENERATION_PHOTO_SIZE_BYTES,
  MAX_GENERATION_PHOTOS,
  SUPPORTED_GENERATION_IMAGE_TYPES,
  formatMegabytes
} from "@/lib/generation-upload";
import { GENERATED_PRODUCT_STORAGE_KEY, type StoredGeneratedProduct } from "@/lib/generated-product-storage";
import { organization } from "@/lib/mock-data";
import type { ProductCategory, StartGenerationResponse } from "@/lib/types";

const categories: ProductCategory[] = ["chair", "table", "sofa", "lamp", "shelf", "small_decor"];

export default function CreateProductPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<File[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedPhotos = Array.from(event.target.files ?? []);
    const validationError = validatePhotos(selectedPhotos);

    if (validationError) {
      setErrorMessage(validationError);
      setPhotos([]);
      return;
    }

    setErrorMessage("");
    setPhotos(selectedPhotos);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validatePhotos(photos);

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.delete("photos");
    photos.forEach((photo) => formData.append("photos", photo));

    try {
      const response = await fetch("/api/generation/start", {
        method: "POST",
        body: formData
      });
      const payload = await readStartGenerationPayload(response);

      if (!response.ok || !payload.productId || !payload.taskId) {
        throw new Error(payload.errorMessage ?? "Generation could not start.");
      }

      const storedProduct = createStoredProduct(formData, payload.productId, payload.taskId, photos.length);
      window.localStorage.setItem(GENERATED_PRODUCT_STORAGE_KEY, JSON.stringify(storedProduct));
      router.push(`/status?productId=${encodeURIComponent(payload.productId)}&taskId=${encodeURIComponent(payload.taskId)}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Generation could not start.");
      setIsSubmitting(false);
    }
  }

  return (
    <AppShell>
      <header className="topbar">
        <div>
          <p className="eyebrow">Create AR product</p>
          <h1>Generate a 3D model from product photos</h1>
          <p className="muted">
            Add product details, upload 1-4 clean JPG or PNG photos, then the app creates web and AR model files.
          </p>
        </div>
        <Link className="button secondary" href="/dashboard">
          Back to products
        </Link>
      </header>

      <section className="flowProgress" aria-label="Product creation progress">
        {["Product details", "Photos", "Generate", "Review"].map((step, index) => (
          <div className={index === 0 ? "flowStep active" : "flowStep"} key={step}>
            <span>{index + 1}</span>
            <strong>{step}</strong>
          </div>
        ))}
      </section>

      <section className="grid two">
        <form className="panel form" onSubmit={handleSubmit}>
          <h2>Product details</h2>
          <div className="field">
            <label htmlFor="product-name">Product name</label>
            <input id="product-name" name="productName" defaultValue="Arc Oak Dining Chair" required />
          </div>
          <div className="field">
            <label htmlFor="category">Product category</label>
            <select id="category" name="category" defaultValue="chair">
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="description">Short product description</label>
            <textarea
              id="description"
              name="description"
              defaultValue="Solid oak dining chair with curved back support."
            />
          </div>

          <h2>Dimensions</h2>
          <div className="grid three">
            <div className="field">
              <label htmlFor="width">Width cm</label>
              <input id="width" name="width" inputMode="decimal" defaultValue="48" required />
            </div>
            <div className="field">
              <label htmlFor="height">Height cm</label>
              <input id="height" name="height" inputMode="decimal" defaultValue="82" required />
            </div>
            <div className="field">
              <label htmlFor="depth">Depth cm</label>
              <input id="depth" name="depth" inputMode="decimal" defaultValue="52" required />
            </div>
          </div>

          <h2>Store URL</h2>
          <div className="field">
            <label htmlFor="customer-url">Product page on your store</label>
            <input
              id="customer-url"
              name="customerUrl"
              type="url"
              defaultValue="https://northline.example/products/arc-oak-chair"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="price">Display price optional</label>
            <input id="price" name="price" defaultValue="89 EUR" />
          </div>

          <h2>Photos</h2>
          <div className="field">
            <label htmlFor="photos">Upload 1-4 product photos</label>
            <input
              id="photos"
              type="file"
              accept="image/jpeg,image/png"
              multiple
              onChange={handlePhotoChange}
              disabled={isSubmitting}
            />
          </div>

          {errorMessage && <div className="assumptionNote">{errorMessage}</div>}

          <button className="button accent" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Starting generation..." : "Generate 3D model"}
          </button>
        </form>

        <aside className="panel stack">
          <div>
            <p className="eyebrow">Photo guidance</p>
            <h2>Keep the upload small and clear</h2>
            <p className="muted">
              Use one product per photo, simple backgrounds, sharp focus, and consistent lighting. Front, side, back,
              and a three-quarter angle are the best four-photo set. Each photo can be up to{" "}
              {formatMegabytes(MAX_GENERATION_PHOTO_SIZE_BYTES)}.
            </p>
          </div>

          <div className="photoChecklist">
            {["Front view", "Side or three-quarter view", "Back view", "Top or detail view"].map((label, index) => {
              const photo = photos[index];

              return (
                <div className={photo ? "uploadSlot ready" : "uploadSlot"} key={label}>
                  <span>{photo ? "Ready" : index === 0 ? "Needed" : "Helpful"}</span>
                  <strong>{label}</strong>
                  <p className="muted">{photo ? photo.name : "JPG or PNG, one clear object, no busy scene."}</p>
                </div>
              );
            })}
          </div>

          <div className="row">
            <span className={photos.length ? "badge success" : "badge neutral"}>{photos.length}/4 photos selected</span>
            <span className="badge neutral">JPG or PNG</span>
            <span className="badge neutral">Stored in R2</span>
          </div>

          <div className="assumptionNote">
            {organization.name} can review the generated model before publishing the hosted AR page.
          </div>
        </aside>
      </section>
    </AppShell>
  );
}

function validatePhotos(files: File[]) {
  if (files.length < 1) {
    return "Upload at least one product photo.";
  }

  if (files.length > MAX_GENERATION_PHOTOS) {
    return "Upload no more than four photos for this generation flow.";
  }

  if (files.some((file) => !isSupportedPhoto(file))) {
    return "Use JPG or PNG photos only. WebP is blocked for this Meshy route.";
  }

  const oversizedPhoto = files.find((file) => file.size > MAX_GENERATION_PHOTO_SIZE_BYTES);

  if (oversizedPhoto) {
    return `${oversizedPhoto.name} is too large. Each photo must be ${formatMegabytes(
      MAX_GENERATION_PHOTO_SIZE_BYTES
    )} or smaller.`;
  }

  const totalPhotoBytes = files.reduce((total, file) => total + file.size, 0);

  if (totalPhotoBytes > MAX_GENERATION_PHOTO_BYTES_TOTAL) {
    return `The selected photos are too large together. Keep the full upload under ${formatMegabytes(
      MAX_GENERATION_PHOTO_BYTES_TOTAL
    )}.`;
  }

  return "";
}

function isSupportedPhoto(file: File) {
  if (SUPPORTED_GENERATION_IMAGE_TYPES.has(file.type.toLowerCase())) {
    return true;
  }

  const fileName = file.name.toLowerCase();

  return fileName.endsWith(".jpg") || fileName.endsWith(".jpeg") || fileName.endsWith(".png");
}

async function readStartGenerationPayload(response: Response) {
  const fallbackMessage =
    response.status === 413
      ? `The selected photos are too large. Keep the full upload under ${formatMegabytes(
          MAX_GENERATION_PHOTO_BYTES_TOTAL
        )}.`
      : "Generation could not start.";

  const responseText = await response.text();

  if (!responseText) {
    return { errorMessage: fallbackMessage } as Partial<StartGenerationResponse> & { errorMessage?: string };
  }

  try {
    return JSON.parse(responseText) as Partial<StartGenerationResponse> & { errorMessage?: string };
  } catch {
    return { errorMessage: fallbackMessage } as Partial<StartGenerationResponse> & { errorMessage?: string };
  }
}

function createStoredProduct(
  formData: FormData,
  productId: string,
  taskId: string,
  photoCount: number
): StoredGeneratedProduct {
  const name = getFormString(formData, "productName") || "Generated product";
  const category = (getFormString(formData, "category") || "small_decor") as ProductCategory;

  return {
    productId,
    taskId,
    name,
    slug: slugify(name),
    category,
    description: getFormString(formData, "description"),
    dimensions: {
      width: cmToMeters(getFormString(formData, "width")),
      height: cmToMeters(getFormString(formData, "height")),
      depth: cmToMeters(getFormString(formData, "depth"))
    },
    customerUrl: getFormString(formData, "customerUrl"),
    price: getFormString(formData, "price"),
    brandName: organization.name,
    photoCount,
    status: "queued",
    progress: 0,
    message: "Generation is queued.",
    updatedAt: new Date().toISOString()
  };
}

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function cmToMeters(value: string) {
  const centimeters = Number.parseFloat(value.replace(",", "."));

  if (!Number.isFinite(centimeters)) {
    return 0;
  }

  return Number((centimeters / 100).toFixed(3));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "generated-product";
}
