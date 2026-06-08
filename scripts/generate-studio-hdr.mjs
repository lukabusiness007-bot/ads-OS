// Generates a neutral studio equirectangular HDR for model-viewer's
// environment-image (image-based lighting). Neutral white so product textures
// keep their true color; a soft overhead key + fill give PBR materials
// realistic highlights without a visible skybox.
//
// Output: public/vendor/model-viewer/env/studio.hdr (Radiance RGBE, flat).
// Re-run with: node scripts/generate-studio-hdr.mjs

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const WIDTH = 512;
const HEIGHT = 256;

const here = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(here, "../public/vendor/model-viewer/env/studio.hdr");

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function softLight(x, y, cx, cy, sigma, peak) {
  const dx = x - cx;
  const dy = y - cy;
  return peak * Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
}

// Neutral luminance at each equirectangular texel.
function luminance(x, y) {
  const t = y / HEIGHT; // 0 = top, 1 = bottom
  // Vertical gradient: bright ceiling -> horizon -> darker floor.
  const ambient = t < 0.5 ? lerp(1.6, 1.0, t / 0.5) : lerp(1.0, 0.45, (t - 0.5) / 0.5);
  const key = softLight(x, y, WIDTH * 0.32, HEIGHT * 0.22, HEIGHT * 0.16, 5.0);
  const fill = softLight(x, y, WIDTH * 0.72, HEIGHT * 0.34, HEIGHT * 0.26, 1.8);
  return ambient + key + fill;
}

// Float radiance -> 4-byte RGBE.
function toRGBE(r, g, b, out, offset) {
  const v = Math.max(r, g, b);
  if (v <= 1e-9) {
    out[offset] = out[offset + 1] = out[offset + 2] = out[offset + 3] = 0;
    return;
  }
  const e = Math.ceil(Math.log2(v));
  const scale = 256 / Math.pow(2, e);
  out[offset] = Math.min(255, Math.floor(r * scale));
  out[offset + 1] = Math.min(255, Math.floor(g * scale));
  out[offset + 2] = Math.min(255, Math.floor(b * scale));
  out[offset + 3] = e + 128;
}

const header = `#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y ${HEIGHT} +X ${WIDTH}\n`;
const headerBytes = Buffer.from(header, "ascii");
const pixels = Buffer.alloc(WIDTH * HEIGHT * 4);

for (let y = 0; y < HEIGHT; y++) {
  for (let x = 0; x < WIDTH; x++) {
    const l = luminance(x, y);
    toRGBE(l, l, l, pixels, (y * WIDTH + x) * 4);
  }
}

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, Buffer.concat([headerBytes, pixels]));
console.log(`Wrote ${outPath} (${WIDTH}x${HEIGHT}, ${pixels.length + headerBytes.length} bytes)`);
