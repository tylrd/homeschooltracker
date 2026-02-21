"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import {
  curriculumImages,
  schoolDocumentFiles,
  schoolDocumentStudents,
  schoolDocuments,
} from "@/db/schema";
import { getTenantContext } from "@/lib/auth/session";
import { validateImageFile } from "@/lib/images/validation";
import { getImageStore } from "@/lib/storage/image-store";

type SchoolDocumentType =
  | "weekly_plan"
  | "curriculum_outline"
  | "pacing_calendar";

function normalizeRotation(value: number) {
  const normalized = value % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

async function reindexDocumentFiles(
  organizationId: string,
  schoolDocumentId: string,
) {
  const db = getDb();
  const rows = await db.query.schoolDocumentFiles.findMany({
    where: and(
      eq(schoolDocumentFiles.organizationId, organizationId),
      eq(schoolDocumentFiles.schoolDocumentId, schoolDocumentId),
    ),
    orderBy: [
      asc(schoolDocumentFiles.sortOrder),
      asc(schoolDocumentFiles.createdAt),
    ],
    columns: { id: true },
  });

  await db.transaction(async (tx) => {
    for (let i = 0; i < rows.length; i++) {
      await tx
        .update(schoolDocumentFiles)
        .set({ sortOrder: i })
        .where(
          and(
            eq(schoolDocumentFiles.organizationId, organizationId),
            eq(schoolDocumentFiles.id, rows[i].id),
          ),
        );
    }
  });
}

async function getDocumentForOrg(
  organizationId: string,
  schoolDocumentId: string,
) {
  const db = getDb();
  return db.query.schoolDocuments.findFirst({
    where: and(
      eq(schoolDocuments.organizationId, organizationId),
      eq(schoolDocuments.id, schoolDocumentId),
    ),
    columns: { id: true, resourceId: true },
  });
}

export async function createSchoolDocument(formData: FormData) {
  const db = getDb();
  const { organizationId } = await getTenantContext();

  const type = String(formData.get("type") ?? "") as SchoolDocumentType;
  const title = String(formData.get("title") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const resourceIdRaw = String(formData.get("resourceId") ?? "").trim();
  const weekStartDate = String(formData.get("weekStartDate") ?? "").trim();
  const weekEndDate = String(formData.get("weekEndDate") ?? "").trim();
  const schoolYearLabel = String(formData.get("schoolYearLabel") ?? "").trim();
  const studentIds = formData
    .getAll("studentIds")
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (
    !["weekly_plan", "curriculum_outline", "pacing_calendar"].includes(type)
  ) {
    throw new Error("Invalid document type.");
  }
  if (!title) {
    throw new Error("Title is required.");
  }

  const resourceRequired =
    type === "curriculum_outline" || type === "pacing_calendar";
  const resourceId = resourceIdRaw || null;
  if (resourceRequired && !resourceId) {
    throw new Error("This document type requires a curriculum resource.");
  }

  const files = formData
    .getAll("files")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (files.length === 0) {
    throw new Error("Please upload at least one image.");
  }

  for (const file of files) {
    const validation = validateImageFile(file, { maxBytes: 12 * 1024 * 1024 });
    if (!validation.ok) {
      throw new Error(validation.message);
    }
  }

  const [document] = await db
    .insert(schoolDocuments)
    .values({
      organizationId,
      type,
      title,
      notes: notes || null,
      resourceId,
      weekStartDate: weekStartDate || null,
      weekEndDate: weekEndDate || null,
      schoolYearLabel: schoolYearLabel || null,
    })
    .returning({
      id: schoolDocuments.id,
      resourceId: schoolDocuments.resourceId,
    });

  if (studentIds.length > 0) {
    await db.insert(schoolDocumentStudents).values(
      studentIds.map((studentId) => ({
        organizationId,
        schoolDocumentId: document.id,
        studentId,
      })),
    );
  }

  const imageStore = getImageStore();
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const savedImage = await imageStore.saveImage({
      contentType: file.type,
      byteSize: file.size,
      imageData: Buffer.from(await file.arrayBuffer()),
    });
    await db
      .update(curriculumImages)
      .set({ organizationId })
      .where(eq(curriculumImages.id, savedImage.id));

    await db.insert(schoolDocumentFiles).values({
      organizationId,
      schoolDocumentId: document.id,
      imageId: savedImage.id,
      sortOrder: i,
      rotationDegrees: 0,
    });
  }

  revalidatePath("/documents");
  if (document.resourceId) {
    revalidatePath(`/shelf/${document.resourceId}`);
  }
}

export async function deleteSchoolDocument(schoolDocumentId: string) {
  const db = getDb();
  const { organizationId } = await getTenantContext();

  const document = await getDocumentForOrg(organizationId, schoolDocumentId);
  if (!document) return;

  const fileRows = await db.query.schoolDocumentFiles.findMany({
    where: and(
      eq(schoolDocumentFiles.organizationId, organizationId),
      eq(schoolDocumentFiles.schoolDocumentId, schoolDocumentId),
    ),
    columns: { imageId: true },
  });

  await db
    .delete(schoolDocuments)
    .where(
      and(
        eq(schoolDocuments.organizationId, organizationId),
        eq(schoolDocuments.id, schoolDocumentId),
      ),
    );

  const imageStore = getImageStore();
  for (const row of fileRows) {
    await imageStore.deleteImage(row.imageId);
  }

  revalidatePath("/documents");
  if (document.resourceId) {
    revalidatePath(`/shelf/${document.resourceId}`);
  }
}

export async function deleteSchoolDocumentFile(
  schoolDocumentId: string,
  schoolDocumentFileId: string,
) {
  const db = getDb();
  const { organizationId } = await getTenantContext();

  const file = await db.query.schoolDocumentFiles.findFirst({
    where: and(
      eq(schoolDocumentFiles.organizationId, organizationId),
      eq(schoolDocumentFiles.schoolDocumentId, schoolDocumentId),
      eq(schoolDocumentFiles.id, schoolDocumentFileId),
    ),
    columns: { id: true, imageId: true },
  });
  if (!file) return;

  const document = await getDocumentForOrg(organizationId, schoolDocumentId);

  await db
    .delete(schoolDocumentFiles)
    .where(
      and(
        eq(schoolDocumentFiles.organizationId, organizationId),
        eq(schoolDocumentFiles.schoolDocumentId, schoolDocumentId),
        eq(schoolDocumentFiles.id, schoolDocumentFileId),
      ),
    );

  const imageStore = getImageStore();
  await imageStore.deleteImage(file.imageId);

  await reindexDocumentFiles(organizationId, schoolDocumentId);

  revalidatePath("/documents");
  if (document?.resourceId) {
    revalidatePath(`/shelf/${document.resourceId}`);
  }
}

export async function rotateSchoolDocumentFile(
  schoolDocumentId: string,
  schoolDocumentFileId: string,
  degreesDelta: number,
) {
  const db = getDb();
  const { organizationId } = await getTenantContext();

  const file = await db.query.schoolDocumentFiles.findFirst({
    where: and(
      eq(schoolDocumentFiles.organizationId, organizationId),
      eq(schoolDocumentFiles.schoolDocumentId, schoolDocumentId),
      eq(schoolDocumentFiles.id, schoolDocumentFileId),
    ),
    columns: { id: true, rotationDegrees: true },
  });

  if (!file) return;

  await db
    .update(schoolDocumentFiles)
    .set({
      rotationDegrees: normalizeRotation(file.rotationDegrees + degreesDelta),
    })
    .where(
      and(
        eq(schoolDocumentFiles.organizationId, organizationId),
        eq(schoolDocumentFiles.id, schoolDocumentFileId),
      ),
    );

  const document = await getDocumentForOrg(organizationId, schoolDocumentId);
  revalidatePath("/documents");
  if (document?.resourceId) {
    revalidatePath(`/shelf/${document.resourceId}`);
  }
}

export async function moveSchoolDocumentFile(
  schoolDocumentId: string,
  schoolDocumentFileId: string,
  direction: "up" | "down",
) {
  const db = getDb();
  const { organizationId } = await getTenantContext();

  const files = await db.query.schoolDocumentFiles.findMany({
    where: and(
      eq(schoolDocumentFiles.organizationId, organizationId),
      eq(schoolDocumentFiles.schoolDocumentId, schoolDocumentId),
    ),
    columns: { id: true },
    orderBy: [
      asc(schoolDocumentFiles.sortOrder),
      asc(schoolDocumentFiles.createdAt),
    ],
  });

  const index = files.findIndex((file) => file.id === schoolDocumentFileId);
  if (index === -1) return;

  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= files.length) return;

  const next = [...files];
  const [moved] = next.splice(index, 1);
  next.splice(targetIndex, 0, moved);

  await db.transaction(async (tx) => {
    for (let i = 0; i < next.length; i++) {
      await tx
        .update(schoolDocumentFiles)
        .set({ sortOrder: i })
        .where(
          and(
            eq(schoolDocumentFiles.organizationId, organizationId),
            eq(schoolDocumentFiles.id, next[i].id),
          ),
        );
    }
  });

  const document = await getDocumentForOrg(organizationId, schoolDocumentId);
  revalidatePath("/documents");
  if (document?.resourceId) {
    revalidatePath(`/shelf/${document.resourceId}`);
  }
}

export async function uploadSchoolDocumentFiles(
  schoolDocumentId: string,
  formData: FormData,
) {
  const db = getDb();
  const { organizationId } = await getTenantContext();

  const document = await getDocumentForOrg(organizationId, schoolDocumentId);
  if (!document) {
    throw new Error("Document not found.");
  }

  const files = formData
    .getAll("files")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (files.length === 0) {
    throw new Error("Please choose at least one file.");
  }

  for (const file of files) {
    const validation = validateImageFile(file, { maxBytes: 12 * 1024 * 1024 });
    if (!validation.ok) {
      throw new Error(validation.message);
    }
  }

  const existing = await db.query.schoolDocumentFiles.findMany({
    where: and(
      eq(schoolDocumentFiles.organizationId, organizationId),
      eq(schoolDocumentFiles.schoolDocumentId, schoolDocumentId),
    ),
    columns: { id: true },
  });
  let sortOrder = existing.length;

  const imageStore = getImageStore();
  for (const file of files) {
    const savedImage = await imageStore.saveImage({
      contentType: file.type,
      byteSize: file.size,
      imageData: Buffer.from(await file.arrayBuffer()),
    });
    await db
      .update(curriculumImages)
      .set({ organizationId })
      .where(eq(curriculumImages.id, savedImage.id));

    await db.insert(schoolDocumentFiles).values({
      organizationId,
      schoolDocumentId,
      imageId: savedImage.id,
      sortOrder,
      rotationDegrees: 0,
    });
    sortOrder++;
  }

  revalidatePath("/documents");
  if (document.resourceId) {
    revalidatePath(`/shelf/${document.resourceId}`);
  }
}
