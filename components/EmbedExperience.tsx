"use client";

import { useEffect, useMemo } from "react";
import { trackHostedPageEvent } from "@/lib/analytics";
import type { Product } from "@/lib/types";
import { ModelViewer } from "./ModelViewer";

export type EmbedOptions = {
  /** Viewer backdrop. `transparent` lets the host page's background show through. */
  background: "transparent" | "light" | "dark";
  /** Whether to render the merchant CTA button under the viewer. */
  showCta: boolean;
};

type EmbedExperienceProps = {
  merchantSlug: string;
  productSlug: string;
  product: Product;
  options: EmbedOptions;
};

/**
 * Stripped-down hosted experience for cross-origin iframes: the 3D/AR viewer and
 * an optional CTA only — no marketing chrome. Auto-AR (`?ar=1`) is handled inside
 * ModelViewer, which reads the iframe's own URL. All analytics are tagged
 * `embedded: true` so the dashboard can split embedded vs. hosted-page traffic.
 */
export function EmbedExperience({ merchantSlug, productSlug, product, options }: EmbedExperienceProps) {
  const analyticsInput = useMemo(
    () => ({ productId: product.id, merchantSlug, productSlug, embedded: true }),
    [merchantSlug, product.id, productSlug]
  );

  useEffect(() => {
    trackHostedPageEvent({ ...analyticsInput, event: "embed_view" });
  }, [analyticsInput]);

  // Report our content height to the embedding page so the embed.js web
  // component (Phase 2) can size the iframe responsively. The parent verifies
  // origin before acting; we only ever post our own height.
  useEffect(() => {
    if (window.parent === window) {
      return;
    }

    function postHeight() {
      const height = Math.ceil(document.documentElement.scrollHeight);
      window.parent.postMessage({ type: "augmenta-embed:height", height }, "*");
    }

    postHeight();
    const observer = new ResizeObserver(postHeight);
    observer.observe(document.documentElement);
    window.addEventListener("load", postHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("load", postHeight);
    };
  }, []);

  return (
    <main className={`embedRoot embedBg-${options.background}`}>
      <ModelViewer
        asset={product.modelAsset}
        alt={`${product.name} 3D model`}
        onInteract={() => trackHostedPageEvent({ ...analyticsInput, event: "viewer_interaction" })}
        onArClick={() => trackHostedPageEvent({ ...analyticsInput, event: "ar_button_click" })}
      />

      {options.showCta && product.customerUrl && (
        <a
          className="button accent embedCta"
          href={product.customerUrl}
          target="_blank"
          rel="noopener"
          onClick={() => trackHostedPageEvent({ ...analyticsInput, event: "cta_click" })}
        >
          {product.hostedPage?.ctaLabel ?? "View on store"}
        </a>
      )}
    </main>
  );
}
