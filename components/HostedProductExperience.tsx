"use client";

import { useEffect, useMemo, useState } from "react";
import { trackHostedPageEvent } from "@/lib/analytics";
import { formatMeters } from "@/lib/ui";
import { isArCapable } from "@/lib/device";
import type { Product } from "@/lib/types";
import { ModelViewer } from "./ModelViewer";

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
              {product.modelAsset ? "3D preview generated and verified" : "3D model not uploaded yet"}
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

          <div className="publicActions">
            <a className="button" href={product.customerUrl} onClick={trackCtaClick}>
              {product.hostedPage?.ctaLabel ?? "View on store"}
            </a>
          </div>

          <p className="muted">
            {!product.modelAsset
              ? "AR is hidden until a model package is available."
              : arSupported
                ? "Use the View in AR control inside the 3D viewer on this device."
                : "AR is not supported in this browser, but the interactive 3D preview remains available."}
          </p>
        </article>
      </section>

      <section className="publicBand" aria-label="Preview details">
        <div>
          <h2>Verified product preview</h2>
          <p className="muted">
            This hosted page is approved for customer viewing. It is intended for visual shopping confidence, not exact
            CAD or manufacturing precision.
          </p>
        </div>
        {product.modelAsset ? (
          <div className="assetGrid">
            <span className="badge neutral">True-to-scale preview</span>
            <span className="badge neutral">Human-reviewed</span>
            <span className="badge neutral">Mobile AR ready</span>
          </div>
        ) : (
          <span className="badge neutral">Waiting for model asset</span>
        )}
      </section>
    </main>
  );
}


