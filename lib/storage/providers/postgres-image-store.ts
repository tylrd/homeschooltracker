import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { curriculumImages } from "@/db/schema";
import type {
  ImageInput,
  ImageStore,
  StoredImage,
  StoredImageRef,
} from "@/lib/storage/image-store";

function toStoredImageRef(
  row: typeof curriculumImages.$inferSelect,
): StoredImageRef {
  return {
    id: row.id,
    provider: row.provider,
    contentType: row.contentType,
    byteSize: row.byteSize,
    width: row.width,
    height: row.height,
    createdAt: row.createdAt,
  };
}

function toStoredImage(row: typeof curriculumImages.$inferSelect): StoredImage {
  return {
    ...toStoredImageRef(row),
    imageData: row.imageData,
    updatedAt: row.updatedAt,
  };
}

export class PostgresImageStore implements ImageStore {
  async saveImage(input: ImageInput): Promise<StoredImageRef> {
    const db = getDb();
    const [row] = await db
      .insert(curriculumImages)
      .values({
        provider: "postgres",
        contentType: input.contentType,
        byteSize: input.byteSize,
        width: input.width ?? null,
        height: input.height ?? null,
        imageData: input.imageData,
      })
      .returning();

    return toStoredImageRef(row);
  }

  async replaceImage(
    existingImageId: string | null,
    input: ImageInput,
  ): Promise<StoredImageRef> {
    const next = await this.saveImage(input);

    if (existingImageId && existingImageId !== next.id) {
      await this.deleteImage(existingImageId);
    }

    return next;
  }

  async getImageById(imageId: string): Promise<StoredImage | null> {
    const db = getDb();
    const row = await db.query.curriculumImages.findFirst({
      where: eq(curriculumImages.id, imageId),
    });

    if (!row) {
      return null;
    }

    return toStoredImage(row);
  }

  async deleteImage(imageId: string): Promise<void> {
    const db = getDb();
    await db.delete(curriculumImages).where(eq(curriculumImages.id, imageId));
  }
}
