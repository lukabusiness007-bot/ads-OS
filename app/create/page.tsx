"use client"

import type { ChangeEvent, FormEvent } from "react";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import {
  prepareGenerationPhotos,
  type PreparedGenerationPhoto
} from "@/lib/generation-upload-client";
import {
  MAX_GENERATION_PHOTO_BYTES_TOTAL,
  MAX_GENERATION_PHOTO_SIZE_BYTES,
  REQUIRED_GENERATION_PHOTOS,
  SUPPORTED_GENERATION_IMAGE_TYPES,
  TARGET_GENERATION_PHOTO_BYTES_TOTAL,
  TARGET_GENERATION_PHOTO_SIZE_BYTES,
  formatMegabytes
} from "@/lib/generation-upload";
import { GENERATED_PRODUCT_STORAGE_KEY, type StoredGeneratedProduct } from "@/lib/generated-product-storage";
import { organization } from "@/lib/mock-data";
import type {
  CreateGenerationUploadsResponse,
  GenerationPhotoContentType,
  ProductCategory,
  StartGenerationRequest,
  StartGenerationResponse
} from "@/lib/types";

const categories: ProductCategory[] = ["chair", "table", "sofa", "lamp", "shelf", "small_decor"];
type UploadPhase = "idle" | "preparing" | "ready" | "uploading" | "starting" | "queued";

export default function CreateProductPage() {
  const router = useRouter();
  const selectionIdRef = useRef(0);
  const [photos, setPhotos] = useState<File[]>([]);
  const [preparedPhotos, setPreparedPhotos] = useState<PreparedGenerationPhoto[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preparationProgress, setPreparationProgress] = useState({
    completed: 0,
    total: 0,
    currentFileName: ""
  });

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const selectionId = selectionIdRef.current + 1;
    selectionIdRef.current = selectionId;
    const selectedPhotos = Array.from(event.target.files ?? []);
    const validationError = validatePhotoSelection(selectedPhotos);

    setPhotos(selectedPhotos);
    setPreparedPhotos([]);
    setUploadProgress(0);
    setPreparationProgress({ completed: 0, total: selectedPhotos.length, currentFileName: "" });

    if (validationError) {
      setErrorMessage(validationError);
      setPhotos([]);
      setUploadPhase("idle");
      return;
    }

    setErrorMessage("");
    setUploadPhase("preparing");
    await waitForNextPaint();

    try {
      const prepared = await prepareGenerationPhotos(selectedPhotos, {
        targetBytes: TARGET_GENERATION_PHOTO_SIZE_BYTES,
        onProgress: (progress) => {
          if (selectionIdRef.current !== selectionId) {
            return;
          }

          setPreparationProgress(progress);
        }
      });

      if (selectionIdRef.current !== selectionId) {
        return;
      }

      const preparedValidationError = validatePreparedPhotos(prepared);

      if (preparedValidationError) {
        setErrorMessage(preparedValidationError);
        setPreparedPhotos([]);
        setUploadPhase("idle");
        return;
      }

      setPreparedPhotos(prepared);
      setUploadPhase("ready");
    } catch (error) {
      if (selectionIdRef.current !== selectionId) {
        return;
      }

      setPreparedPhotos([]);
      setUploadPhase("idle");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We could not prepare these photos in the browser. Try clearer source photos with fewer pixels."
      );
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validatePhotoSelection(photos) || validatePreparedPhotos(preparedPhotos);

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setUploadProgress(0);
    setUploadPhase("uploading");

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const uploadTargets = await createGenerationUploads(formData, preparedPhotos);
      await uploadPreparedPhotos(preparedPhotos, uploadTargets.uploads, (progress) => {
        setUploadProgress(progress);
      });

      setUploadPhase("starting");
      const response = await startGenerationRequest({
        productId: uploadTargets.productId,
        photos: uploadTargets.uploads.map(({ key, fileName, contentType, size }) => ({
          key,
          fileName,
          contentType,
          size
        })),
        imageEnhancement: formData.get("imageEnhancement") === "on"
      });
      const payload = readStartGenerationPayload(response.body, response.status);

      if (response.status < 200 || response.status >= 300 || !payload.productId || !payload.taskId) {
        throw new Error(payload.errorMessage ?? "Generation could not start.");
      }

      setUploadPhase("queued");
      const storedProduct = createStoredProduct(formData, payload.productId, payload.taskId, preparedPhotos.length);
      window.localStorage.setItem(GENERATED_PRODUCT_STORAGE_KEY, JSON.stringify(storedProduct));
      router.push(`/status?productId=${encodeURIComponent(payload.productId)}&taskId=${encodeURIComponent(payload.taskId)}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Generation could not start.");
      setIsSubmitting(false);
      setUploadPhase(preparedPhotos.length === REQUIRED_GENERATION_PHOTOS ? "ready" : "idle");
    }
  }

  const measurableProgress =
    uploadPhase === "preparing"
      ? preparationProgress.total > 0
        ? Math.round((preparationProgress.completed / preparationProgress.total) * 100)
        : 0
      : uploadPhase === "uploading" || uploadPhase === "starting" || uploadPhase === "queued"
      ? uploadProgress
      : preparedPhotos.length === REQUIRED_GENERATION_PHOTOS
      ? 100
      : 0;
  const progressLabel = getProgressLabel(uploadPhase, preparationProgress.currentFileName);
  const canSubmit =
    !isSubmitting && uploadPhase !== "preparing" && preparedPhotos.length === REQUIRED_GENERATION_PHOTOS;

  return (
    <AppShell>
      <header className="topbar">
        <div>
          <p className="eyebrow">Create AR product</p>
          <h1>Generate a 3D model from product photos</h1>
          <p className="muted">
            Add product details, upload 4 clean JPG or PNG product photos, then the app creates web and AR model files.
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
          <div className="assumptionNote">
            Large originals are optimized in this browser first. The app targets about{" "}
            {formatMegabytes(TARGET_GENERATION_PHOTO_SIZE_BYTES)} per photo before upload, so you should not hit the
            old {formatMegabytes(MAX_GENERATION_PHOTO_BYTES_TOTAL)} upload ceiling.
          </div>
          <div className="field">
            <label htmlFor="photos">Upload 4 required product photos</label>
            <input
              id="photos"
              type="file"
              accept="image/jpeg,image/png"
              multiple
              onChange={handlePhotoChange}
              disabled={isSubmitting}
            />
          </div>

          {(uploadPhase !== "idle" || preparedPhotos.length > 0) && (
            <div className="uploadProgress" aria-live="polite">
              <div className="uploadProgressHeader">
                <strong>{progressLabel}</strong>
                {uploadPhase === "starting" ? (
                  <span>Processing</span>
                ) : (
                  <span>{measurableProgress}%</span>
                )}
              </div>
              <div
                className={uploadPhase === "starting" ? "uploadProgressBar indeterminate" : "uploadProgressBar"}
                role={uploadPhase === "starting" ? "status" : "progressbar"}
                aria-valuemin={uploadPhase === "starting" ? undefined : 0}
                aria-valuemax={uploadPhase === "starting" ? undefined : 100}
                aria-valuenow={uploadPhase === "starting" ? undefined : measurableProgress}
              >
                <span style={{ width: `${measurableProgress}%` }} />
              </div>
            </div>
          )}

          <div className="toggleField">
            <div>
              <label htmlFor="image-enhancement">Image enhancement</label>
              <p className="muted">Leave off for accurate colors. Turn on only when photos are dark, noisy, or low contrast.</p>
            </div>
            <input id="image-enhancement" name="imageEnhancement" type="checkbox" disabled={isSubmitting} />
          </div>

          {errorMessage && <div className="assumptionNote">{errorMessage}</div>}

          <button className="button accent" type="submit" disabled={!canSubmit}>
            {getSubmitLabel(uploadPhase, isSubmitting)}
          </button>
        </form>

        <aside className="panel stack">
          <div>
            <p className="eyebrow">Photo guidance</p>
            <h2>Keep the upload small and clear</h2>
            <p className="muted">
              Use one product per photo, plain neutral backgrounds, sharp focus, and the same even lighting. Front,
              side or three-quarter, back, and top or detail views give the best color-faithful HD texture. Each photo
              is prepared in your browser before upload, so large originals are reduced automatically to about{" "}
              {formatMegabytes(TARGET_GENERATION_PHOTO_SIZE_BYTES)}.
            </p>
          </div>

          <div className="photoChecklist">
            {["Front view", "Side or three-quarter view", "Back view", "Top or detail view"].map((label, index) => {
              const photo = photos[index];
              const prepared = preparedPhotos[index];

              return (
                <div className={prepared ? "uploadSlot ready" : photo ? "uploadSlot pending" : "uploadSlot"} key={label}>
                  <span>{prepared ? "Ready" : photo ? "Preparing" : "Required"}</span>
                  <strong>{label}</strong>
                  <p className="muted">
                    {photo ? photo.name : "JPG or PNG, neutral light, no filters or glare."}
                  </p>
                  {prepared && (
                    <p className="uploadMeta">
                      {formatFileSize(prepared.originalSize)} original to {formatFileSize(prepared.preparedSize)} upload
                      {prepared.width && prepared.height ? `, ${prepared.width}x${prepared.height}` : ""}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="row">
            <span className={preparedPhotos.length === REQUIRED_GENERATION_PHOTOS ? "badge success" : "badge neutral"}>
              {photos.length}/4 photos selected
            </span>
            <span className="badge neutral">JPG or PNG</span>
            <span className="badge neutral">Auto-optimized</span>
            <span className="badge neutral">Stored in R2</span>
          </div>

          <div className="assumptionNote">
            {organization.name} can review generated color, material, and shape fidelity before publishing the hosted AR
            page.
          </div>
        </aside>
      </section>
    </AppShell>
  );
}

function validatePhotoSelection(files: File[]) {
  if (files.length !== REQUIRED_GENERATION_PHOTOS) {
    return "Upload exactly 4 product photos: front, side or three-quarter, back, and top or detail.";
  }

  if (files.some((file) => !isSupportedPhoto(file))) {
    return "Use JPG or PNG photos only. WebP is blocked for this Meshy route.";
  }

  return "";
}

function validatePreparedPhotos(files: PreparedGenerationPhoto[]) {
  if (files.length !== REQUIRED_GENERATION_PHOTOS) {
    return "Wait for the app to finish preparing all 4 photos before starting generation.";
  }

  const oversizedPhoto = files.find((photo) => photo.preparedSize > MAX_GENERATION_PHOTO_SIZE_BYTES);

  if (oversizedPhoto) {
    return `We could not prepare ${oversizedPhoto.originalName} under ${formatMegabytes(
      MAX_GENERATION_PHOTO_SIZE_BYTES
    )}. Try a clearer source photo with fewer pixels.`;
  }

  const totalPhotoBytes = files.reduce((total, photo) => total + photo.preparedSize, 0);

  if (totalPhotoBytes > MAX_GENERATION_PHOTO_BYTES_TOTAL) {
    return `The prepared photos are still too large together. The app needs the generated upload under ${formatMegabytes(
      MAX_GENERATION_PHOTO_BYTES_TOTAL
    )}.`;
  }

  if (totalPhotoBytes > TARGET_GENERATION_PHOTO_BYTES_TOTAL) {
    return `The browser prepared these photos, but they are still larger than the normal upload target of ${formatMegabytes(
      TARGET_GENERATION_PHOTO_BYTES_TOTAL
    )}. Try choosing clearer source photos with fewer pixels.`;
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

function getPreparedPhotoContentType(file: File): GenerationPhotoContentType {
  const type = file.type.toLowerCase();

  if (type === "image/png") {
    return "image/png";
  }

  return "image/jpeg";
}

async function createGenerationUploads(
  formData: FormData,
  preparedPhotos: PreparedGenerationPhoto[]
): Promise<CreateGenerationUploadsResponse> {
  const response = await fetch("/api/generation/uploads", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      productName: getFormString(formData, "productName") || "product",
      category: getFormString(formData, "category") || "small_decor",
      description: getFormString(formData, "description"),
      customerUrl: getFormString(formData, "customerUrl"),
      price: getFormString(formData, "price"),
      dimensions: {
        width: cmToMeters(getFormString(formData, "width")),
        height: cmToMeters(getFormString(formData, "height")),
        depth: cmToMeters(getFormString(formData, "depth"))
      },
      photos: preparedPhotos.map((photo) => ({
        fileName: photo.file.name,
        contentType: getPreparedPhotoContentType(photo.file),
        size: photo.preparedSize
      }))
    })
  });
  const payload = await readJsonPayload<CreateGenerationUploadsResponse>(response);

  if (!response.ok || !payload.productId || !payload.uploads) {
    throw new Error(payload.errorMessage ?? "We could not prepare photo uploads. Please try again.");
  }

  return payload as CreateGenerationUploadsResponse;
}

async function uploadPreparedPhotos(
  preparedPhotos: PreparedGenerationPhoto[],
  uploads: CreateGenerationUploadsResponse["uploads"],
  onUploadProgress: (progress: number) => void
) {
  if (preparedPhotos.length !== uploads.length) {
    throw new Error("The upload targets did not match the prepared photos. Please try again.");
  }

  const uploadedBytesByIndex = new Array(preparedPhotos.length).fill(0) as number[];
  const totalBytes = preparedPhotos.reduce((total, photo) => total + photo.preparedSize, 0);

  for (const [index, photo] of preparedPhotos.entries()) {
    await uploadPhotoToR2(photo.file, uploads[index], (loadedBytes) => {
      uploadedBytesByIndex[index] = loadedBytes;
      const uploadedBytes = uploadedBytesByIndex.reduce((total, value) => total + value, 0);
      onUploadProgress(Math.min(100, Math.round((uploadedBytes / totalBytes) * 100)));
    });

    uploadedBytesByIndex[index] = photo.preparedSize;
    const uploadedBytes = uploadedBytesByIndex.reduce((total, value) => total + value, 0);
    onUploadProgress(Math.min(100, Math.round((uploadedBytes / totalBytes) * 100)));
  }
}

function uploadPhotoToR2(
  file: File,
  upload: CreateGenerationUploadsResponse["uploads"][number],
  onUploadProgress: (loadedBytes: number) => void
) {
  return new Promise<{ status: number; body: string }>((resolve, reject) => {
    const request = new XMLHttpRequest();

    request.open("PUT", upload.uploadUrl);
    Object.entries(upload.headers).forEach(([key, value]) => {
      request.setRequestHeader(key, value);
    });
    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        return;
      }

      onUploadProgress(Math.min(file.size, event.loaded));
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve({
          status: request.status,
          body: typeof request.response === "string" ? request.response : request.responseText
        });
        return;
      }

      reject(new Error("A photo upload failed. Please try again."));
    };
    request.onerror = () => reject(new Error("The upload connection failed. Please try again."));
    request.onabort = () => reject(new Error("The upload was cancelled."));
    request.send(file);
  });
}

async function startGenerationRequest(payload: StartGenerationRequest) {
  const response = await fetch("/api/generation/start", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return {
    status: response.status,
    body: await response.text()
  };
}

function readStartGenerationPayload(responseText: string, status: number) {
  const fallbackMessage =
    status === 413
      ? "Generation could not start because the request was rejected before the app could process it. Please try again."
      : "Generation could not start.";

  if (!responseText) {
    return { errorMessage: fallbackMessage } as Partial<StartGenerationResponse> & { errorMessage?: string };
  }

  try {
    return JSON.parse(responseText) as Partial<StartGenerationResponse> & { errorMessage?: string };
  } catch {
    return { errorMessage: fallbackMessage } as Partial<StartGenerationResponse> & { errorMessage?: string };
  }
}

async function readJsonPayload<T extends { errorMessage?: string }>(response: Response) {
  const text = await response.text();

  if (!text) {
    return {} as Partial<T>;
  }

  try {
    return JSON.parse(text) as Partial<T>;
  } catch {
    return {} as Partial<T>;
  }
}

function getProgressLabel(phase: UploadPhase, currentFileName: string) {
  if (phase === "preparing") {
    return currentFileName ? `Preparing ${currentFileName}` : "Preparing photos";
  }

  if (phase === "uploading") {
    return "Uploading photos";
  }

  if (phase === "starting") {
    return "Starting generation";
  }

  if (phase === "queued") {
    return "Generation queued";
  }

  if (phase === "ready") {
    return "Photos ready to upload";
  }

  return "Photo upload";
}

function getSubmitLabel(phase: UploadPhase, isSubmitting: boolean) {
  if (phase === "preparing") {
    return "Preparing photos...";
  }

  if (isSubmitting && phase === "uploading") {
    return "Uploading photos...";
  }

  if (isSubmitting && phase === "starting") {
    return "Starting generation...";
  }

  if (isSubmitting && phase === "queued") {
    return "Generation queued...";
  }

  return "Generate 3D model";
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

function waitForNextPaint() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });
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
