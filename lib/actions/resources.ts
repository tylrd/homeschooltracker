"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { resources, subjects } from "@/db/schema";
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

export async function createPersonalCurriculumFromShelf(formData: FormData) {
  const db = getDb();
  const imageStore = getImageStore();

  const studentId = ((formData.get("studentId") as string | null) ?? "").trim();
  const resourceName = ((formData.get("name") as string | null) ?? "").trim();
  const selectedSubjectId = (
    (formData.get("subjectId") as string | null) ?? ""
  ).trim();
  const newSubjectName = (
    (formData.get("newSubjectName") as string | null) ?? ""
  ).trim();
  const coverImage = formData.get("coverImage");

  if (!studentId || !resourceName) {
    throw new Error("Student and curriculum name are required.");
  }

  let subjectId = selectedSubjectId;
  if (newSubjectName) {
    const [created] = await db
      .insert(subjects)
      .values({ name: newSubjectName, studentId })
      .returning({ id: subjects.id });
    subjectId = created.id;
  }

  if (!subjectId) {
    throw new Error("Choose an existing subject or enter a new one.");
  }

  const subject = await db.query.subjects.findFirst({
    where: and(eq(subjects.id, subjectId), eq(subjects.studentId, studentId)),
    columns: { id: true },
  });
  if (!subject) {
    throw new Error("Selected subject does not belong to that student.");
  }

  let coverImageId: string | null = null;
  if (coverImage instanceof File && coverImage.size > 0) {
    const validation = validateImageFile(coverImage);
    if (!validation.ok) {
      throw new Error(validation.message);
    }

    const savedImage = await imageStore.saveImage({
      contentType: coverImage.type,
      byteSize: coverImage.size,
      imageData: Buffer.from(await coverImage.arrayBuffer()),
    });
    coverImageId = savedImage.id;
  }

  const [createdResource] = await db
    .insert(resources)
    .values({ name: resourceName, subjectId, coverImageId })
    .returning({ id: resources.id });

  revalidatePath("/shelf");
  revalidatePath(`/students/${studentId}`);

  return {
    resourceId: createdResource.id,
    subjectId,
  };
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
