import { PostgresImageStore } from "@/lib/storage/providers/postgres-image-store";

export type StoredImageRef = {
  id: string;
  provider: string;
  contentType: string;
  byteSize: number;
  width: number | null;
  height: number | null;
  createdAt: Date;
};

export type ImageInput = {
  contentType: string;
  byteSize: number;
  width?: number | null;
  height?: number | null;
  imageData: Buffer;
};

export type StoredImage = StoredImageRef & {
  imageData: Buffer;
  updatedAt: Date;
};

export interface ImageStore {
  saveImage(input: ImageInput): Promise<StoredImageRef>;
  replaceImage(
    existingImageId: string | null,
    input: ImageInput,
  ): Promise<StoredImageRef>;
  getImageById(imageId: string): Promise<StoredImage | null>;
  deleteImage(imageId: string): Promise<void>;
}

let singleton: ImageStore | null = null;

export function getImageStore(): ImageStore {
  if (singleton) {
    return singleton;
  }

  const provider = (
    process.env.IMAGE_STORE_PROVIDER ?? "postgres"
  ).toLowerCase();

  if (provider === "postgres") {
    singleton = new PostgresImageStore();
    return singleton;
  }

  throw new Error(`Unsupported IMAGE_STORE_PROVIDER: ${provider}`);
}
