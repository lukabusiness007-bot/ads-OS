"use client";

import { useEffect, useMemo, useState } from "react";
import { trackHostedPageEvent } from "@/lib/analytics";
import { formatMeters } from "@/lib/ui";
import { isArCapable } from "@/lib/device";
import type { Product } from "@/lib/types";
import { ModelViewer } from "./ModelViewer";
import { Smartphone, Monitor } from "lucide-react";

type HostedProductExperienceProps = {
  merchantSlug: string;
  productSlug: string;
  product: Product;
};

export function HostedProductExperience({ merchantSlug, productSlug, product }: HostedProductExperienceProps) {
  const [arSupported, setArSupported] = useState(false);
  const analyticsInput = useMemo(
    () => ({
      productId: product.id,
      merchantSlug,
      productSlug
    }),
    [merchantSlug, product.id, productSlug]
  );

  useEffect(() => {
    trackHostedPageEvent({ ...analyticsInput, event: "page_view" });
    const detection = window.setTimeout(() => {
      setArSupported(isArCapable());
    }, 0);

    return () => window.clearTimeout(detection);
  }, [analyticsInput]);

  function trackViewerInteraction() {
    trackHostedPageEvent({ ...analyticsInput, event: "viewer_interaction" });
  }

  function trackArClick() {
    trackHostedPageEvent({ ...analyticsInput, event: "ar_button_click" });
  }

  function trackCtaClick() {
    trackHostedPageEvent({ ...analyticsInput, event: "cta_click" });
  }

  return (
    <main className="publicPage">
      <section className="publicHero" aria-labelledby="product-title">
        <div className="publicViewerBlock">
          <ModelViewer
            asset={product.modelAsset}
            alt={`${product.name} 3D model`}
            onInteract={trackViewerInteraction}
            onArClick={trackArClick}
          />
          <div className="viewerMeta">
            <span className={product.modelAsset ? "badge success" : "badge neutral"}>
              {product.modelAsset ? "3D preview · Augmenta-verified" : "3D model not uploaded yet"}
            </span>
            <span className="muted">
              {product.modelAsset
                ? "Drag to rotate · pinch to zoom · tap View in AR on mobile."
                : "The hosted page unlocks after a model package is available."}
            </span>
          </div>
        </div>

        <article className="publicProductInfo">
          <div className="merchantBrand">
            <span className="merchantLogo" aria-hidden="true">
              {product.brandName
                .split(" ")
                .map((word) => word[0])
                .join("")
                .slice(0, 2)}
            </span>
            <span>{product.brandName}</span>
          </div>

          <p className="eyebrow">{product.category.replace("_", " ")}</p>
          <h1 id="product-title">{product.name}</h1>
          {product.description && <p className="muted">{product.description}</p>}

          <dl className="productFacts" aria-label="Product details">
            <div>
              <dt>Width</dt>
              <dd>{formatMeters(product.dimensions.width)}</dd>
            </div>
            <div>
              <dt>Height</dt>
              <dd>{formatMeters(product.dimensions.height)}</dd>
            </div>
            <div>
              <dt>Depth</dt>
              <dd>{formatMeters(product.dimensions.depth)}</dd>
            </div>
          </dl>

          {product.modelAsset && (
            <div className="trustBadgeRow">
              <span className="badge success">Human-reviewed</span>
              <span className="badge success">True-to-scale</span>
              <span className="badge success">Mobile AR ready</span>
            </div>
          )}

          {product.price && (
            <p className="publicPrice">{product.price}</p>
          )}

          <div className="publicActions">
            <a className="button accent" href={product.customerUrl} onClick={trackCtaClick}>
              {product.hostedPage?.ctaLabel ?? "View on store"}
            </a>
          </div>

          {product.modelAsset && (
            <p className="arHint">
              {arSupported ? (
                <><Smartphone className="inline-block h-4 w-4 mr-1.5 align-text-bottom" />Tap &ldquo;View in AR&rdquo; inside the 3D viewer to place it in your room.</>
              ) : (
                <><Monitor className="inline-block h-4 w-4 mr-1.5 align-text-bottom" />Rotate and zoom the 3D preview above — AR is available on mobile devices.</>
              )}
            </p>
          )}
        </article>
      </section>

      <section className="publicBand" aria-label="Preview details">
        <div>
          <h2>Augmenta-verified preview</h2>
          <p className="muted">
            This page was reviewed by Augmenta for visual accuracy, true-to-scale proportions, and AR readiness before
            publishing. It is designed for shopping confidence, not CAD or manufacturing precision.
          </p>
        </div>
        {!product.modelAsset && (
          <span className="badge neutral">Waiting for model asset</span>
        )}
      </section>
    </main>
  );
}


