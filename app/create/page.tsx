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
const categoryLabels: Record<ProductCategory, string> = {
  chair: "Stolica",
  table: "Sto",
  sofa: "Sofa",
  lamp: "Lampa",
  shelf: "Polica",
  small_decor: "Sitni dekor"
};
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
          : "Nismo mogli da pripremimo ove fotografije u pregledaču. Pokušajte sa jasnijim izvornim fotografijama sa manje piksela."
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
        throw new Error(payload.errorMessage ?? "Generisanje nije moglo da započne.");
      }

      setUploadPhase("queued");
      const storedProduct = createStoredProduct(formData, payload.productId, payload.taskId, preparedPhotos.length);
      window.localStorage.setItem(GENERATED_PRODUCT_STORAGE_KEY, JSON.stringify(storedProduct));
      router.push(`/status?productId=${encodeURIComponent(payload.productId)}&taskId=${encodeURIComponent(payload.taskId)}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Generisanje nije moglo da započne.");
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
          <p className="eyebrow">Kreiraj AR proizvod</p>
          <h1>Generišite 3D model iz fotografija proizvoda</h1>
          <p className="muted">
            Dodajte detalje proizvoda, otpremite 4 jasne JPG ili PNG fotografije, zatim aplikacija kreira web i AR fajlove modela.
          </p>
        </div>
        <Link className="button secondary" href="/dashboard">
          Nazad na proizvode
        </Link>
      </header>

      <section className="flowProgress" aria-label="Napredak kreiranja proizvoda">
        {["Detalji proizvoda", "Fotografije", "Generisanje", "Pregled"].map((step, index) => (
          <div className={index === 0 ? "flowStep active" : "flowStep"} key={step}>
            <span>{index + 1}</span>
            <strong>{step}</strong>
          </div>
        ))}
      </section>

      <section className="grid two">
        <form className="panel form" onSubmit={handleSubmit}>
          <h2>Detalji proizvoda</h2>
          <div className="field">
            <label htmlFor="product-name">Naziv proizvoda</label>
            <input id="product-name" name="productName" placeholder="npr. Arc hrastova trpezarijska stolica" required />
          </div>
          <div className="field">
            <label htmlFor="category">Kategorija proizvoda</label>
            <select id="category" name="category" defaultValue="chair">
              {categories.map((category) => (
                <option key={category} value={category}>
                  {categoryLabels[category]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="description">Kratki opis proizvoda</label>
            <textarea
              id="description"
              name="description"
              placeholder="npr. Trpezarijska stolica od punog hrasta sa zakrivljenim naslonom."
            />
          </div>

          <h2>Dimenzije</h2>
          <div className="grid three">
            <div className="field">
              <label htmlFor="width">Širina cm</label>
              <input id="width" name="width" inputMode="decimal" placeholder="48" required />
            </div>
            <div className="field">
              <label htmlFor="height">Visina cm</label>
              <input id="height" name="height" inputMode="decimal" placeholder="82" required />
            </div>
            <div className="field">
              <label htmlFor="depth">Dubina cm</label>
              <input id="depth" name="depth" inputMode="decimal" placeholder="52" required />
            </div>
          </div>

          <h2>URL prodavnice</h2>
          <div className="field">
            <label htmlFor="customer-url">Stranica proizvoda na vašoj prodavnici</label>
            <input
              id="customer-url"
              name="customerUrl"
              type="url"
              placeholder="https://vasaprodavnica.com/proizvodi/naziv-proizvoda"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="price">Prikaz cene (opciono)</label>
            <input id="price" name="price" placeholder="npr. 89 EUR" />
          </div>

          <h2>Fotografije</h2>
          <div className="assumptionNote">
            Veliki originali se prvo optimizuju u ovom pregledaču. Aplikacija cilja oko{" "}
            {formatMegabytes(TARGET_GENERATION_PHOTO_SIZE_BYTES)} po fotografiji kako bi otpremanje i generisanje ostali brzi.
          </div>
          <div className="field">
            <label htmlFor="photos">Otpremite 4 obavezne fotografije proizvoda</label>
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
                  <span>Obrada</span>
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
              <label htmlFor="image-enhancement">Poboljšanje slike</label>
              <p className="muted">Ostavite isključeno za tačne boje. Uključite samo kada su fotografije tamne, zrnaste ili niskog kontrasta.</p>
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
            <p className="eyebrow">Saveti za fotografije</p>
            <h2>Neka otpremanje bude malo i jasno</h2>
            <p className="muted">
              Koristite jedan proizvod po fotografiji, jednostavne neutralne pozadine, oštar fokus i isto ravnomerno
              osvetljenje. Prednji, bočni ili tročetvrtinski, zadnji i gornji ili detaljni pogled daju najvernije HD
              teksture. Svaka fotografija se priprema u vašem pregledaču pre otpremanja, pa se veliki originali
              automatski smanjuju na oko {formatMegabytes(TARGET_GENERATION_PHOTO_SIZE_BYTES)}.
            </p>
          </div>

          <div className="photoChecklist">
            {["Prednji pogled", "Bočni ili tročetvrtinski pogled", "Zadnji pogled", "Gornji ili detaljni pogled"].map((label, index) => {
              const photo = photos[index];
              const prepared = preparedPhotos[index];

              return (
                <div className={prepared ? "uploadSlot ready" : photo ? "uploadSlot pending" : "uploadSlot"} key={label}>
                  <span>{prepared ? "Spremno" : photo ? "Priprema" : "Obavezno"}</span>
                  <strong>{label}</strong>
                  <p className="muted">
                    {photo ? photo.name : "JPG ili PNG, neutralno svetlo, bez filtera ili odsjaja."}
                  </p>
                  {prepared && (
                    <p className="uploadMeta">
                      {formatFileSize(prepared.originalSize)} original na {formatFileSize(prepared.preparedSize)} otpremanje
                      {prepared.width && prepared.height ? `, ${prepared.width}x${prepared.height}` : ""}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="row">
            <span className={preparedPhotos.length === REQUIRED_GENERATION_PHOTOS ? "badge success" : "badge neutral"}>
              {photos.length}/4 fotografije izabrane
            </span>
            <span className="badge neutral">JPG ili PNG</span>
            <span className="badge neutral">Auto-optimizovano</span>
            <span className="badge neutral">Bezbedno otpremanje</span>
          </div>

          <div className="assumptionNote">
            Vaš tim može pregledati generisanu boju, materijal, oblik i razmeru pre objavljivanja hostovane AR stranice.
          </div>
        </aside>
      </section>
    </AppShell>
  );
}

function validatePhotoSelection(files: File[]) {
  if (files.length !== REQUIRED_GENERATION_PHOTOS) {
    return "Otpremite tačno 4 fotografije proizvoda: prednju, bočnu ili tročetvrtinsku, zadnju i gornju ili detaljnu.";
  }

  if (files.some((file) => !isSupportedPhoto(file))) {
    return "Za ovaj tok generisanja koristite samo JPG ili PNG fotografije.";
  }

  return "";
}

function validatePreparedPhotos(files: PreparedGenerationPhoto[]) {
  if (files.length !== REQUIRED_GENERATION_PHOTOS) {
    return "Sačekajte da aplikacija završi pripremu svih 4 fotografije pre pokretanja generisanja.";
  }

  const oversizedPhoto = files.find((photo) => photo.preparedSize > MAX_GENERATION_PHOTO_SIZE_BYTES);

  if (oversizedPhoto) {
    return `Nismo mogli da pripremimo ${oversizedPhoto.originalName} ispod ${formatMegabytes(
      MAX_GENERATION_PHOTO_SIZE_BYTES
    )}. Pokušajte sa jasnijom izvornom fotografijom sa manje piksela.`;
  }

  const totalPhotoBytes = files.reduce((total, photo) => total + photo.preparedSize, 0);

  if (totalPhotoBytes > MAX_GENERATION_PHOTO_BYTES_TOTAL) {
    return `Pripremljene fotografije su zajedno i dalje prevelike. Aplikaciji je potrebno da generisano otpremanje bude ispod ${formatMegabytes(
      MAX_GENERATION_PHOTO_BYTES_TOTAL
    )}.`;
  }

  if (totalPhotoBytes > TARGET_GENERATION_PHOTO_BYTES_TOTAL) {
    return `Pregledač je pripremio ove fotografije, ali su i dalje veće od uobičajenog cilja otpremanja od ${formatMegabytes(
      TARGET_GENERATION_PHOTO_BYTES_TOTAL
    )}. Pokušajte da izaberete jasnije izvorne fotografije sa manje piksela.`;
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
    throw new Error(payload.errorMessage ?? "Nismo mogli da pripremimo otpremanje fotografija. Pokušajte ponovo.");
  }

  return payload as CreateGenerationUploadsResponse;
}

async function uploadPreparedPhotos(
  preparedPhotos: PreparedGenerationPhoto[],
  uploads: CreateGenerationUploadsResponse["uploads"],
  onUploadProgress: (progress: number) => void
) {
  if (preparedPhotos.length !== uploads.length) {
    throw new Error("Odredišta otpremanja se ne poklapaju sa pripremljenim fotografijama. Pokušajte ponovo.");
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

      reject(new Error("Otpremanje fotografije nije uspelo. Pokušajte ponovo."));
    };
    request.onerror = () => reject(new Error("Veza za otpremanje nije uspela. Pokušajte ponovo."));
    request.onabort = () => reject(new Error("Otpremanje je otkazano."));
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
      ? "Generisanje nije moglo da započne jer je zahtev odbijen pre nego što je aplikacija mogla da ga obradi. Pokušajte ponovo."
      : "Generisanje nije moglo da započne.";

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
    return currentFileName ? `Priprema ${currentFileName}` : "Priprema fotografija";
  }

  if (phase === "uploading") {
    return "Otpremanje fotografija";
  }

  if (phase === "starting") {
    return "Pokretanje generisanja";
  }

  if (phase === "queued") {
    return "Generisanje na čekanju";
  }

  if (phase === "ready") {
    return "Fotografije spremne za otpremanje";
  }

  return "Otpremanje fotografija";
}

function getSubmitLabel(phase: UploadPhase, isSubmitting: boolean) {
  if (phase === "preparing") {
    return "Priprema fotografija...";
  }

  if (isSubmitting && phase === "uploading") {
    return "Otpremanje fotografija...";
  }

  if (isSubmitting && phase === "starting") {
    return "Pokretanje generisanja...";
  }

  if (isSubmitting && phase === "queued") {
    return "Generisanje na čekanju...";
  }

  return "Generiši 3D model";
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
  const name = getFormString(formData, "productName") || "Generisani proizvod";
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
    message: "Generisanje je na čekanju.",
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
