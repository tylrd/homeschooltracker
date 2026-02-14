"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { resources } from "@/db/schema";
import { validateImageFile } from "@/lib/images/validation";
import { getImageStore } from "@/lib/storage/image-store";

export async function createResource(formData: FormData) {
  const db = getDb();
  const name = formData.get("name") as string;
  const subjectId = formData.get("subjectId") as string;
  const studentId = formData.get("studentId") as string;
  const coverImage = formData.get("coverImage");

  if (!name || !subjectId) {
    throw new Error("Name and subject are required");
  }

  let coverImageId: string | null = null;
  if (coverImage instanceof File && coverImage.size > 0) {
    const validation = validateImageFile(coverImage);
    if (!validation.ok) {
      throw new Error(validation.message);
    }

    const imageStore = getImageStore();
    const savedImage = await imageStore.saveImage({
      contentType: coverImage.type,
      byteSize: coverImage.size,
      imageData: Buffer.from(await coverImage.arrayBuffer()),
    });
    coverImageId = savedImage.id;
  }

  await db.insert(resources).values({ name, subjectId, coverImageId });
  revalidatePath(`/students/${studentId}`);
  revalidatePath("/shelf");
}

export async function deleteResource(id: string, studentId: string) {
  const db = getDb();
  const imageStore = getImageStore();
  const existing = await db.query.resources.findFirst({
    where: eq(resources.id, id),
    columns: { coverImageId: true },
  });

  await db.delete(resources).where(eq(resources.id, id));
  if (existing?.coverImageId) {
    await imageStore.deleteImage(existing.coverImageId);
  }

  revalidatePath(`/students/${studentId}`);
  revalidatePath("/shelf");
}

export async function updateResource(
  resourceId: string,
  studentId: string,
  formData: FormData,
) {
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const coverImage = formData.get("coverImage");

  if (!name) {
    throw new Error("Resource name is required.");
  }

  const db = getDb();
  const imageStore = getImageStore();
  const existing = await db.query.resources.findFirst({
    where: eq(resources.id, resourceId),
    columns: { id: true, coverImageId: true },
  });

  if (!existing) {
    throw new Error("Resource not found.");
  }

  let nextCoverImageId = existing.coverImageId;
  if (coverImage instanceof File && coverImage.size > 0) {
    const validation = validateImageFile(coverImage);
    if (!validation.ok) {
      throw new Error(validation.message);
    }

    const nextCover = await imageStore.replaceImage(existing.coverImageId, {
      contentType: coverImage.type,
      byteSize: coverImage.size,
      imageData: Buffer.from(await coverImage.arrayBuffer()),
    });
    nextCoverImageId = nextCover.id;
  }

  await db
    .update(resources)
    .set({ name, coverImageId: nextCoverImageId })
    .where(eq(resources.id, resourceId));

  revalidatePath(`/students/${studentId}`);
  revalidatePath("/shelf");
  revalidatePath(`/shelf/${resourceId}`);
}
