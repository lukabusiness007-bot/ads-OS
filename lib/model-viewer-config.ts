type ModelViewerGlobalConfig = {
  dracoDecoderLocation?: string;
  ktx2TranscoderLocation?: string;
};

const MODEL_VIEWER_DECODER_BASE = "/vendor/model-viewer";

export function configureModelViewerDecoders() {
  const root = globalThis as typeof globalThis & { ModelViewerElement?: ModelViewerGlobalConfig };
  root.ModelViewerElement = {
    ...root.ModelViewerElement,
    dracoDecoderLocation: `${MODEL_VIEWER_DECODER_BASE}/draco/`,
    ktx2TranscoderLocation: `${MODEL_VIEWER_DECODER_BASE}/basis/`,
  };
}
