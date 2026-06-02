import type { GenerationClientStatus, ModelAsset, ProductCategory } from "./types";

export const GENERATED_PRODUCT_STORAGE_KEY = "veridian.generatedProduct";

export type StoredGeneratedProduct = {
  productId: string;
  taskId: string;
  name: string;
  slug: string;
  category: ProductCategory;
  description?: string;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  customerUrl: string;
  price?: string;
  brandName: string;
  photoCount: number;
  status: GenerationClientStatus;
  progress: number;
  message: string;
  asset?: ModelAsset;
  updatedAt: string;
};
