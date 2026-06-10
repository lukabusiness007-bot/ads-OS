/**
 * Augmenta AR viewer — drop-in web component for merchant stores.
 *
 * Usage on any site (Shopify, WooCommerce, Wix, custom):
 *
 *   <script src="https://augmenta3d.com/embed.js" async></script>
 *   <augmenta-ar-viewer merchant="acme" product="oak-chair"></augmenta-ar-viewer>
 *
 * The element injects the canonical /embed/{merchant}/{product} iframe, so all
 * viewer/AR/analytics logic lives in one place. The base origin is inferred from
 * this script's own URL — merchants never configure it.
 *
 * Attributes:
 *   merchant   (required) merchant slug
 *   product    (required) product slug
 *   height     fixed iframe height (e.g. "560" or "70vh"); default 480px. When
 *              omitted, the iframe auto-sizes to the embed's reported height.
 *   ar         "1" to auto-prompt AR on supported phones
 *   bg         "transparent" | "light" | "dark"
 *   cta        "hide" to drop the store CTA button
 *   origin     override the base origin (testing only)
 */
(function () {
  "use strict";

  if (typeof window === "undefined" || !window.customElements) {
    return;
  }
  if (customElements.get("augmenta-ar-viewer")) {
    return;
  }

  var SCRIPT_ORIGIN = (function () {
    try {
      var current = document.currentScript;
      if (current && current.src) {
        return new URL(current.src).origin;
      }
    } catch (err) {
      /* ignore */
    }
    return null;
  })();

  function buildSrc(base, merchant, product, el) {
    var params = new URLSearchParams();
    if (el.getAttribute("ar") === "1") params.set("ar", "1");
    var bg = el.getAttribute("bg");
    if (bg) params.set("bg", bg);
    var cta = el.getAttribute("cta");
    if (cta) params.set("cta", cta);
    var query = params.toString();
    return (
      base +
      "/embed/" +
      encodeURIComponent(merchant) +
      "/" +
      encodeURIComponent(product) +
      (query ? "?" + query : "")
    );
  }

  function resolveHeight(value) {
    if (!value) return "480px";
    return /^\d+$/.test(value) ? value + "px" : value;
  }

  class AugmentaArViewerElement extends HTMLElement {
    connectedCallback() {
      if (this._iframe) return;

      var merchant = this.getAttribute("merchant");
      var product = this.getAttribute("product");
      var base = this.getAttribute("origin") || SCRIPT_ORIGIN;

      if (!merchant || !product || !base) {
        this.textContent = "augmenta-ar-viewer: missing merchant, product, or origin";
        return;
      }

      var iframe = document.createElement("iframe");
      iframe.src = buildSrc(base, merchant, product, this);
      iframe.setAttribute("frameborder", "0");
      iframe.setAttribute("allow", "xr-spatial-tracking; fullscreen");
      iframe.setAttribute("loading", "lazy");
      iframe.setAttribute("title", "Augmenta AR product viewer");
      iframe.style.border = "0";
      iframe.style.width = "100%";
      iframe.style.display = "block";
      iframe.style.borderRadius = "16px";
      iframe.style.height = resolveHeight(this.getAttribute("height"));

      this.style.display = this.style.display || "block";
      this._iframe = iframe;
      this._base = base;
      this.appendChild(iframe);

      // Auto-size to the embed's reported content height only when the merchant
      // hasn't pinned an explicit height. Strictly origin- and source-checked so a
      // hostile page can't drive arbitrary resizes.
      if (!this.getAttribute("height")) {
        var self = this;
        this._onMessage = function (event) {
          if (event.origin !== self._base) return;
          if (event.source !== iframe.contentWindow) return;
          var data = event.data;
          if (!data || data.type !== "augmenta-embed:height") return;
          var height = Number(data.height);
          if (height >= 200 && height <= 20000) {
            iframe.style.height = height + "px";
          }
        };
        window.addEventListener("message", this._onMessage);
      }
    }

    disconnectedCallback() {
      if (this._onMessage) {
        window.removeEventListener("message", this._onMessage);
        this._onMessage = null;
      }
    }
  }

  customElements.define("augmenta-ar-viewer", AugmentaArViewerElement);
})();
