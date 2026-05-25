"use client";

import { useEffect, useMemo, useState } from "react";
import { trackHostedPageEvent } from "@/lib/analytics";
import { formatMeters } from "@/lib/ui";
import type { Product } from "@/lib/types";
import { ViewerMock } from "./ViewerMock";

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
      setArSupported(isLikelyArSupported());
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
          <button className="viewerButton" type="button" onClick={trackViewerInteraction} aria-label="Interact with 3D viewer">
            <ViewerMock />
          </button>
          <div className="viewerMeta">
            <span className="badge success">3D preview generated and verified</span>
            <span className="muted">Poster loads first, then the interactive model opens in place.</span>
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
            <button className="button accent" type="button" onClick={trackArClick} disabled={!arSupported}>
              View in AR
            </button>
            <a className="button" href={product.customerUrl} onClick={trackCtaClick}>
              {product.hostedPage?.ctaLabel ?? "View on store"}
            </a>
          </div>

          <p className="muted">
            {arSupported
              ? "AR can open on this device. The 3D preview remains available if launch is interrupted."
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
        <div className="assetGrid">
          <span className="badge neutral">GLB {product.modelAsset?.fileSizeMb.toFixed(1)} MB</span>
          <span className="badge neutral">{product.modelAsset?.triangleCount.toLocaleString()} triangles</span>
          <span className="badge neutral">{product.modelAsset?.textureMax}px textures</span>
        </div>
      </section>
    </main>
  );
}

function isLikelyArSupported() {
  const userAgent = navigator.userAgent;

  return /iPhone|iPad|Android/i.test(userAgent);
}
