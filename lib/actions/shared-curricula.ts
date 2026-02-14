"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { sharedCurricula, sharedCurriculumStudents } from "@/db/schema";
import { validateImageFile } from "@/lib/images/validation";
import { getImageStore } from "@/lib/storage/image-store";

export async function createSharedCurriculum(formData: FormData) {
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const description = formData.get("description") as string | null;
  const coverImage = formData.get("coverImage");
  const studentIds = formData
    .getAll("studentIds")
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter((value) => value.length > 0);

  const trimmed = name;
  if (!trimmed) {
    throw new Error("Name is required");
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

  const db = getDb();
  const [created] = await db
    .insert(sharedCurricula)
    .values({
      name: trimmed,
      description: description?.trim() || null,
      coverImageId,
    })
    .returning({ id: sharedCurricula.id });

  if (studentIds.length > 0) {
    await db
      .insert(sharedCurriculumStudents)
      .values(
        studentIds.map((studentId) => ({
          sharedCurriculumId: created.id,
          studentId,
        })),
      )
      .onConflictDoNothing();
  }

  revalidatePath("/shelf");
  revalidatePath("/");
  revalidatePath("/attendance");
  for (const studentId of studentIds) {
    revalidatePath(`/students/${studentId}`);
  }

  return { sharedCurriculumId: created.id };
}

export async function addStudentToSharedCurriculum(
  sharedCurriculumId: string,
  studentId: string,
) {
  const db = getDb();
  await db
    .insert(sharedCurriculumStudents)
    .values({ sharedCurriculumId, studentId })
    .onConflictDoNothing();

  revalidatePath("/shelf");
  revalidatePath("/");
  revalidatePath("/attendance");
  revalidatePath(`/students/${studentId}`);
}

export async function removeStudentFromSharedCurriculum(
  sharedCurriculumId: string,
  studentId: string,
) {
  const db = getDb();
  await db
    .delete(sharedCurriculumStudents)
    .where(
      and(
        eq(sharedCurriculumStudents.sharedCurriculumId, sharedCurriculumId),
        eq(sharedCurriculumStudents.studentId, studentId),
      ),
    );

  revalidatePath("/shelf");
  revalidatePath("/");
  revalidatePath("/attendance");
  revalidatePath(`/students/${studentId}`);
}

export async function updateSharedCurriculum(
  sharedCurriculumId: string,
  formData: FormData,
) {
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const description = (formData.get("description") as string | null)?.trim();
  const coverImage = formData.get("coverImage");

  if (!name) {
    throw new Error("Curriculum name is required.");
  }

  const db = getDb();
  const imageStore = getImageStore();
  const existing = await db.query.sharedCurricula.findFirst({
    where: eq(sharedCurricula.id, sharedCurriculumId),
    columns: { id: true, coverImageId: true },
  });

  if (!existing) {
    throw new Error("Shared curriculum not found.");
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
    .update(sharedCurricula)
    .set({
      name,
      description: description || null,
      coverImageId: nextCoverImageId,
    })
    .where(eq(sharedCurricula.id, sharedCurriculumId));

  revalidatePath("/shelf");
  revalidatePath("/");
  revalidatePath(`/shared-curriculum/${sharedCurriculumId}`);
}
