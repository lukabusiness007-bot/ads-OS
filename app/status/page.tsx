"use client"

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { GENERATED_PRODUCT_STORAGE_KEY, type StoredGeneratedProduct } from "@/lib/generated-product-storage";
import type { GenerationStatusResponse } from "@/lib/types";

export default function StatusPage() {
  return (
    <Suspense fallback={<StatusFallback />}>
      <StatusPageContent />
    </Suspense>
  );
}

function StatusPageContent() {
  const searchParams = useSearchParams();
  const [storedProduct, setStoredProduct] = useState<StoredGeneratedProduct | null>(null);
  const [statusPayload, setStatusPayload] = useState<GenerationStatusResponse | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollError, setPollError] = useState("");

  // Read from localStorage only after mount so the server-rendered HTML and the
  // first client render match. Reading it in the useState initializer caused a
  // hydration mismatch (React error #418).
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setStoredProduct(readStoredProduct());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const productId = searchParams.get("productId") ?? storedProduct?.productId ?? "";
  const taskId = searchParams.get("taskId") ?? storedProduct?.taskId ?? "";
  const hasStoredCompletedAsset =
    storedProduct?.productId === productId && storedProduct.status === "succeeded" && Boolean(storedProduct.asset);

  useEffect(() => {
    if (!productId || !taskId || hasStoredCompletedAsset) {
      return;
    }

    let timeoutId: number | undefined;
    let isCancelled = false;

    async function pollStatus() {
      setIsPolling(true);
      setPollError("");

      try {
        const response = await fetch(
          `/api/generation/status?productId=${encodeURIComponent(productId)}&taskId=${encodeURIComponent(taskId)}`,
          { cache: "no-store" }
        );
        const payload = (await response.json()) as GenerationStatusResponse;

        if (isCancelled) {
          return;
        }

        if (!response.ok) {
          throw new Error(payload.errorMessage ?? payload.message);
        }

        setStatusPayload(payload);
        setStoredProduct((previous) => {
          const next = createUpdatedStoredProduct(previous, productId, taskId, payload);
          window.localStorage.setItem(GENERATED_PRODUCT_STORAGE_KEY, JSON.stringify(next));
          return next;
        });

        if (payload.status !== "succeeded" && payload.status !== "failed") {
          timeoutId = window.setTimeout(pollStatus, 5000);
        }
      } catch (error) {
        if (!isCancelled) {
          setPollError(error instanceof Error ? error.message : "We could not refresh generation status.");
        }
      } finally {
        if (!isCancelled) {
          setIsPolling(false);
        }
      }
    }

    void pollStatus();

    return () => {
      isCancelled = true;

      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [hasStoredCompletedAsset, productId, taskId]);

  const effectiveStatus = statusPayload?.status ?? storedProduct?.status ?? "queued";
  const progress = statusPayload?.progress ?? storedProduct?.progress ?? 0;
  const message = statusPayload?.message ?? storedProduct?.message ?? "Generation is queued.";
  const previewHref = `/preview?productId=${encodeURIComponent(productId)}`;

  const steps = useMemo(
    () => [
      {
        title: "Photos uploaded",
        detail: `${storedProduct?.photoCount ?? "4"} product photos were received and stored.`,
        state: "done"
      },
      {
        title: "Creating model",
        detail:
          effectiveStatus === "failed"
            ? message
            : effectiveStatus === "queued" || effectiveStatus === "running"
            ? message
            : "The 3D model was generated.",
        state:
          effectiveStatus === "failed"
            ? "failed"
            : effectiveStatus === "queued" || effectiveStatus === "running"
            ? "active"
            : "done"
      },
      {
        title: "Packaging AR files",
        detail:
          effectiveStatus === "succeeded"
            ? "GLB, USDZ, and poster files are stored for the viewer."
            : effectiveStatus === "failed"
            ? "Packaging stopped because this generation run failed."
            : "The model will be copied into storage as soon as generation finishes.",
        state: effectiveStatus === "succeeded" ? "done" : effectiveStatus === "failed" ? "pending" : "active"
      },
      {
        title: "Ready to review",
        detail:
          effectiveStatus === "succeeded"
            ? "Open the preview, inspect the model, then send it to quality review."
            : effectiveStatus === "failed"
            ? "Start another generation after fixing the issue above."
            : "Preview unlocks after packaging finishes.",
        state: effectiveStatus === "succeeded" ? "active" : "pending"
      }
    ],
    [effectiveStatus, message, storedProduct?.photoCount]
  );

  if (!productId || !taskId) {
    return (
      <AppShell>
        <section className="panel stack">
          <p className="eyebrow">Generation status</p>
          <h1>No active generation</h1>
          <p className="muted">Start a product generation first, then this page will show live progress.</p>
          <Link className="button accent" href="/create">
            Create AR product
          </Link>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header>
        <p className="eyebrow">Generation status</p>
        <h1>{storedProduct?.name ?? "Generated product"}</h1>
        <p className="muted">The app is creating the 3D model and packaging it for the web and AR viewer.</p>
      </header>

      <section className="grid two">
        <div className="panel timeline">
          {steps.map((step) => (
            <div className={stepClassName(step.state)} key={step.title}>
              <h3>{step.title}</h3>
              <p className="muted">{step.detail}</p>
            </div>
          ))}
        </div>

        <aside className="panel stack">
          <h2>Current status</h2>
          <p className="muted">{pollError || message}</p>
          <div className="row">
            <span className={`badge ${statusTone(effectiveStatus)}`}>{statusLabel(effectiveStatus)}</span>
            <span className="badge neutral">{Math.max(0, Math.min(100, progress))}% complete</span>
            {isPolling && <span className="badge neutral">Refreshing</span>}
          </div>
          <div className="uploadProgress">
            <div className="uploadProgressHeader">
              <strong>Generation progress</strong>
              <span>{Math.max(0, Math.min(100, progress))}%</span>
            </div>
            <div
              className="uploadProgressBar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.max(0, Math.min(100, progress))}
            >
              <span style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
            </div>
          </div>

          {pollError && <div className="assumptionNote">{pollError}</div>}

          {effectiveStatus === "succeeded" ? (
            <Link className="button accent" href={previewHref}>
              Open generated model
            </Link>
          ) : (
            <Link className="button secondary" href="/create">
              Start another generation
            </Link>
          )}
        </aside>
      </section>
    </AppShell>
  );
}

function StatusFallback() {
  return (
    <AppShell>
      <section className="panel stack">
        <p className="eyebrow">Generation status</p>
        <h1>Loading status</h1>
        <p className="muted">Preparing the generation timeline.</p>
      </section>
    </AppShell>
  );
}

function readStoredProduct() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(GENERATED_PRODUCT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredGeneratedProduct) : null;
  } catch {
    return null;
  }
}

function createUpdatedStoredProduct(
  previous: StoredGeneratedProduct | null,
  productId: string,
  taskId: string,
  payload: GenerationStatusResponse
): StoredGeneratedProduct {
  return {
    productId,
    taskId,
    name: previous?.name ?? "Generated product",
    slug: previous?.slug ?? "generated-product",
    category: previous?.category ?? "small_decor",
    description: previous?.description,
    dimensions: previous?.dimensions ?? { width: 0, height: 0, depth: 0 },
    customerUrl: previous?.customerUrl ?? "#",
    price: previous?.price,
    brandName: previous?.brandName ?? "Augmenta",
    photoCount: previous?.photoCount ?? 0,
    status: payload.status,
    progress: payload.progress,
    message: payload.message,
    asset: payload.asset ?? previous?.asset,
    updatedAt: new Date().toISOString()
  };
}

function stepClassName(state: string) {
  if (state === "done") {
    return "step done";
  }

  if (state === "active") {
    return "step active";
  }

  if (state === "failed") {
    return "step failed";
  }

  return "step";
}

function statusTone(status: string) {
  if (status === "succeeded") {
    return "success";
  }

  if (status === "failed") {
    return "danger";
  }

  return "warning";
}

function statusLabel(status: string) {
  if (status === "succeeded") {
    return "Ready to review";
  }

  if (status === "failed") {
    return "Needs new photos";
  }

  if (status === "running") {
    return "Creating model";
  }

  return "Queued";
}
