import { unzipSync, zipSync, type Zippable } from "fflate";

export type ScaledUsdz = {
  buffer: Buffer;
};

const ALIGNMENT = 64;
const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const USD_LAYER_EXTENSIONS = [".usda", ".usdc", ".usd"];

// USD layers default to 1 unit = 1 meter when the metadata is absent (this
// matches glTF's convention, and Meshy's USDZ is derived from the same GLB).
const DEFAULT_METERS_PER_UNIT = 1;

/**
 * Wraps a USDZ package with a new root layer that overrides `metersPerUnit`,
 * so iOS Quick Look renders the model at the size implied by `appliedScale`
 * (the same factor baked into the GLB by scaleGlbToDimensions). The original
 * geometry/material layer is referenced as a sublayer and left untouched.
 *
 * USDZ packages must be a zip with every entry STORED (uncompressed) and
 * 64-byte aligned so AR runtimes can mmap the contents directly. This
 * rebuilds the package with that layout and verifies the result before
 * returning it. Returns null (caller should fall back to the original USDZ)
 * if the package can't be parsed or the rebuilt layout fails verification.
 */
export function scaleUsdzToDimensions(input: Buffer, appliedScale: number): ScaledUsdz | null {
  try {
    const entries = unzipSync(new Uint8Array(input));
    const names = Object.keys(entries);

    const rootLayerName = names.find((name) =>
      USD_LAYER_EXTENSIONS.some((ext) => name.toLowerCase().endsWith(ext))
    );

    if (!rootLayerName) {
      return null;
    }

    const innerMetersPerUnit = readMetersPerUnit(rootLayerName, entries[rootLayerName]);
    const metersPerUnit = innerMetersPerUnit * appliedScale;

    const wrapperName = uniqueWrapperName(names);
    const wrapperContent = new TextEncoder().encode(
      `#usda 1.0\n` +
        `(\n` +
        `    metersPerUnit = ${metersPerUnit}\n` +
        `    subLayers = [\n` +
        `        @./${rootLayerName}@\n` +
        `    ]\n` +
        `)\n`
    );

    const orderedNames = [wrapperName, ...names];
    const orderedContents: Record<string, Uint8Array> = { [wrapperName]: wrapperContent, ...entries };

    const zippable: Zippable = {};
    let offset = 0;

    for (const name of orderedNames) {
      const content = orderedContents[name];
      const headerBase = 30 + byteLength(name);
      const padding = computeAlignmentPadding(offset + headerBase);

      zippable[name] = padding
        ? [content, { level: 0, extra: { 0: padding } }]
        : [content, { level: 0 }];

      const extraLength = padding ? padding.length + 4 : 0;
      offset += headerBase + extraLength + content.length;
    }

    const output = zipSync(zippable, { level: 0 });

    if (!verifyAlignment(output, orderedNames.length)) {
      console.warn("USDZ rescale produced a misaligned package; falling back to the original USDZ");
      return null;
    }

    return { buffer: Buffer.from(output) };
  } catch (error) {
    console.warn("USDZ rescale failed; falling back to the original USDZ", toSafeError(error));
    return null;
  }
}

/** Bytes needed in a zip "extra field" so the data section starts 64-byte aligned. */
function computeAlignmentPadding(headerEndWithoutExtra: number): Uint8Array | null {
  const remainder = headerEndWithoutExtra % ALIGNMENT;
  if (remainder === 0) {
    return null;
  }

  // The extra field itself costs 4 bytes (id + length) before the padding bytes.
  const padLength = (ALIGNMENT - ((remainder + 4) % ALIGNMENT)) % ALIGNMENT;
  return new Uint8Array(padLength);
}

/** Re-derives data offsets from the zip's local file headers and checks 64-byte alignment. */
function verifyAlignment(zip: Uint8Array, expectedFileCount: number): boolean {
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  let offset = 0;
  let count = 0;

  while (offset + 30 <= zip.byteLength && view.getUint32(offset, true) === LOCAL_FILE_HEADER_SIGNATURE) {
    const compressedSize = view.getUint32(offset + 18, true);
    const filenameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);

    const dataStart = offset + 30 + filenameLength + extraLength;
    if (dataStart % ALIGNMENT !== 0) {
      return false;
    }

    offset = dataStart + compressedSize;
    count++;
  }

  return count === expectedFileCount;
}

function readMetersPerUnit(name: string, content: Uint8Array): number {
  if (!name.toLowerCase().endsWith(".usda")) {
    // .usdc is a binary crate format; not parseable without a USD toolchain.
    return DEFAULT_METERS_PER_UNIT;
  }

  const text = new TextDecoder().decode(content);
  const match = text.match(/metersPerUnit\s*=\s*([0-9.]+)/);
  const value = match ? Number(match[1]) : NaN;

  return Number.isFinite(value) && value > 0 ? value : DEFAULT_METERS_PER_UNIT;
}

function uniqueWrapperName(existingNames: string[]): string {
  let name = "scale-root.usda";
  let suffix = 0;

  while (existingNames.includes(name)) {
    suffix += 1;
    name = `scale-root-${suffix}.usda`;
  }

  return name;
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

function toSafeError(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message };
  }

  return { message: String(error) };
}
