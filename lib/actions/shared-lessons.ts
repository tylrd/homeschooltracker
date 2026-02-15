"use server";

import { and, asc, eq, gt, gte, inArray, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import {
  curriculumImages,
  sharedLessons,
  sharedLessonWorkSamples,
} from "@/db/schema";
import { getTenantContext } from "@/lib/auth/session";
import {
  generateLessonDates,
  getNextBumpDate,
  nextSchoolDayStr,
  toDateString,
} from "@/lib/dates";
import { validateImageFile } from "@/lib/images/validation";
import { getBumpBehavior, getSchoolDays } from "@/lib/queries/settings";
import { getImageStore } from "@/lib/storage/image-store";

export async function batchCreateSharedLessons(
  sharedCurriculumId: string,
  startLesson: number,
  endLesson: number,
  startDate: string,
  schoolDays: number[],
) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  const count = endLesson - startLesson + 1;
  if (count <= 0) throw new Error("Invalid lesson range");

  const existing = await db.query.sharedLessons.findMany({
    where: and(
      eq(sharedLessons.organizationId, organizationId),
      eq(sharedLessons.sharedCurriculumId, sharedCurriculumId),
      gte(sharedLessons.lessonNumber, startLesson),
    ),
  });
  const existingNumbers = new Set(existing.map((l) => l.lessonNumber));

  const startDateObj = new Date(`${startDate}T00:00:00`);
  const dates = generateLessonDates(startDateObj, count, schoolDays);

  const newLessons = [];
  let dateIndex = 0;
  for (let num = startLesson; num <= endLesson; num++) {
    if (!existingNumbers.has(num)) {
      newLessons.push({
        organizationId,
        sharedCurriculumId,
        lessonNumber: num,
        title: `Lesson ${num}`,
        scheduledDate: toDateString(dates[dateIndex]),
        status: "planned" as const,
      });
    }
    dateIndex++;
  }

  if (newLessons.length > 0) {
    await db.insert(sharedLessons).values(newLessons);
  }

  revalidatePath("/");
  revalidatePath("/shelf");
  revalidatePath("/attendance");
}

export async function createSharedLesson(
  sharedCurriculumId: string,
  lessonNumber: number,
  title: string,
  scheduledDate: string,
  plan?: string,
) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  await db.insert(sharedLessons).values({
    organizationId,
    sharedCurriculumId,
    lessonNumber,
    title: title.trim() || `Lesson ${lessonNumber}`,
    scheduledDate: scheduledDate || null,
    plan: plan?.trim() ? plan.trim() : null,
    status: "planned",
  });

  revalidatePath("/");
  revalidatePath("/shelf");
  revalidatePath("/attendance");
}

export async function completeSharedLesson(sharedLessonId: string) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  const today = toDateString(new Date());
  await db
    .update(sharedLessons)
    .set({ status: "completed", completionDate: today })
    .where(
      and(
        eq(sharedLessons.id, sharedLessonId),
        eq(sharedLessons.organizationId, organizationId),
      ),
    );

  revalidatePath("/");
  revalidatePath("/shelf");
  revalidatePath("/attendance");
  revalidatePath(`/lessons/${sharedLessonId}`);
}

export async function uncompleteSharedLesson(sharedLessonId: string) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  await db
    .update(sharedLessons)
    .set({ status: "planned", completionDate: null })
    .where(
      and(
        eq(sharedLessons.id, sharedLessonId),
        eq(sharedLessons.organizationId, organizationId),
      ),
    );

  revalidatePath("/");
  revalidatePath("/shelf");
  revalidatePath("/attendance");
  revalidatePath(`/lessons/${sharedLessonId}`);
}

export async function bumpSharedLesson(sharedLessonId: string) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  const [lesson, schoolDays, bumpBehavior] = await Promise.all([
    db.query.sharedLessons.findFirst({
      where: and(
        eq(sharedLessons.id, sharedLessonId),
        eq(sharedLessons.organizationId, organizationId),
      ),
    }),
    getSchoolDays(),
    getBumpBehavior(),
  ]);

  if (!lesson || !lesson.scheduledDate) return;

  const futureLessons = await db
    .select()
    .from(sharedLessons)
    .where(
      and(
        eq(sharedLessons.organizationId, organizationId),
        eq(sharedLessons.sharedCurriculumId, lesson.sharedCurriculumId),
        eq(sharedLessons.status, "planned"),
        gte(sharedLessons.scheduledDate, lesson.scheduledDate),
      ),
    )
    .orderBy(asc(sharedLessons.scheduledDate), asc(sharedLessons.lessonNumber));

  if (futureLessons.length === 0) return;

  let currentDate = getNextBumpDate(
    lesson.scheduledDate,
    bumpBehavior,
    schoolDays,
  );

  await db.transaction(async (tx) => {
    for (let i = 0; i < futureLessons.length; i++) {
      await tx
        .update(sharedLessons)
        .set({ scheduledDate: currentDate })
        .where(
          and(
            eq(sharedLessons.id, futureLessons[i].id),
            eq(sharedLessons.organizationId, organizationId),
          ),
        );
      currentDate = nextSchoolDayStr(currentDate, schoolDays);
    }
  });

  revalidatePath("/");
  revalidatePath("/shelf");
  revalidatePath("/attendance");
  revalidatePath(`/lessons/${sharedLessonId}`);
}

export async function updateSharedLessonScheduledDate(
  sharedLessonId: string,
  newDate: string,
) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  await db
    .update(sharedLessons)
    .set({ scheduledDate: newDate || null })
    .where(
      and(
        eq(sharedLessons.id, sharedLessonId),
        eq(sharedLessons.organizationId, organizationId),
      ),
    );

  revalidatePath("/");
  revalidatePath("/shelf");
  revalidatePath("/attendance");
  revalidatePath(`/lessons/${sharedLessonId}`);
}

export async function bulkCompleteSharedLessons(sharedLessonIds: string[]) {
  const ids = Array.from(new Set(sharedLessonIds)).filter(Boolean);
  if (ids.length === 0) return;
  const db = getDb();
  const { organizationId } = await getTenantContext();
  const today = toDateString(new Date());

  await db
    .update(sharedLessons)
    .set({ status: "completed", completionDate: today })
    .where(
      and(
        eq(sharedLessons.organizationId, organizationId),
        inArray(sharedLessons.id, ids),
      ),
    );

  revalidatePath("/");
  revalidatePath("/shelf");
  revalidatePath("/attendance");
}

export async function bulkDeleteSharedLessons(sharedLessonIds: string[]) {
  const ids = Array.from(new Set(sharedLessonIds)).filter(Boolean);
  if (ids.length === 0) return;
  const db = getDb();
  const { organizationId } = await getTenantContext();
  const sampleRows = await db.query.sharedLessonWorkSamples.findMany({
    where: and(
      eq(sharedLessonWorkSamples.organizationId, organizationId),
      inArray(sharedLessonWorkSamples.sharedLessonId, ids),
    ),
    columns: { imageId: true },
  });
  await db
    .delete(sharedLessons)
    .where(
      and(
        eq(sharedLessons.organizationId, organizationId),
        inArray(sharedLessons.id, ids),
      ),
    );
  const imageStore = getImageStore();
  for (const { imageId } of sampleRows) {
    await imageStore.deleteImage(imageId);
  }

  revalidatePath("/");
  revalidatePath("/shelf");
  revalidatePath("/attendance");
}

export async function deleteSharedLesson(sharedLessonId: string) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  const sampleRows = await db.query.sharedLessonWorkSamples.findMany({
    where: and(
      eq(sharedLessonWorkSamples.organizationId, organizationId),
      eq(sharedLessonWorkSamples.sharedLessonId, sharedLessonId),
    ),
    columns: { imageId: true },
  });
  await db
    .delete(sharedLessons)
    .where(
      and(
        eq(sharedLessons.id, sharedLessonId),
        eq(sharedLessons.organizationId, organizationId),
      ),
    );
  const imageStore = getImageStore();
  for (const { imageId } of sampleRows) {
    await imageStore.deleteImage(imageId);
  }

  revalidatePath("/");
  revalidatePath("/shelf");
  revalidatePath("/attendance");
}

export async function updateSharedLessonPlan(
  sharedLessonId: string,
  plan: string,
) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  await db
    .update(sharedLessons)
    .set({ plan: plan.trim() || null })
    .where(
      and(
        eq(sharedLessons.id, sharedLessonId),
        eq(sharedLessons.organizationId, organizationId),
      ),
    );

  revalidatePath("/");
  revalidatePath("/shelf");
  revalidatePath(`/lessons/${sharedLessonId}`);
}

export async function updateSharedLessonContent(
  sharedLessonId: string,
  title: string,
  plan: string,
  notes: string,
) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  await db
    .update(sharedLessons)
    .set({
      title: title.trim() || null,
      plan: plan.trim() || null,
      notes: notes.trim() || null,
    })
    .where(
      and(
        eq(sharedLessons.id, sharedLessonId),
        eq(sharedLessons.organizationId, organizationId),
      ),
    );

  revalidatePath("/");
  revalidatePath("/shelf");
  revalidatePath("/attendance");
  revalidatePath(`/lessons/${sharedLessonId}`);
}

export async function uploadSharedLessonWorkSamples(
  sharedLessonId: string,
  formData: FormData,
) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  const lesson = await db.query.sharedLessons.findFirst({
    where: and(
      eq(sharedLessons.id, sharedLessonId),
      eq(sharedLessons.organizationId, organizationId),
    ),
    columns: { id: true },
  });

  if (!lesson) {
    throw new Error("Shared lesson not found");
  }

  const files = formData
    .getAll("files")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (files.length === 0) {
    throw new Error("Please choose at least one image.");
  }

  const imageStore = getImageStore();
  for (const file of files) {
    const validation = validateImageFile(file);
    if (!validation.ok) {
      throw new Error(validation.message);
    }

    const savedImage = await imageStore.saveImage({
      contentType: file.type,
      byteSize: file.size,
      imageData: Buffer.from(await file.arrayBuffer()),
    });
    await db
      .update(curriculumImages)
      .set({ organizationId })
      .where(eq(curriculumImages.id, savedImage.id));

    await db.insert(sharedLessonWorkSamples).values({
      organizationId,
      sharedLessonId,
      imageId: savedImage.id,
    });
  }

  revalidatePath("/");
  revalidatePath("/shelf");
  revalidatePath("/attendance");
  revalidatePath(`/lessons/${sharedLessonId}`);
}

export async function deleteSharedLessonWorkSample(
  sharedLessonId: string,
  workSampleId: string,
) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  const sample = await db.query.sharedLessonWorkSamples.findFirst({
    where: and(
      eq(sharedLessonWorkSamples.organizationId, organizationId),
      eq(sharedLessonWorkSamples.id, workSampleId),
      eq(sharedLessonWorkSamples.sharedLessonId, sharedLessonId),
    ),
    columns: { id: true, imageId: true },
  });

  if (!sample) {
    throw new Error("Work sample not found");
  }

  await db
    .delete(sharedLessonWorkSamples)
    .where(
      and(
        eq(sharedLessonWorkSamples.organizationId, organizationId),
        eq(sharedLessonWorkSamples.id, workSampleId),
        eq(sharedLessonWorkSamples.sharedLessonId, sharedLessonId),
      ),
    );

  const imageStore = getImageStore();
  await imageStore.deleteImage(sample.imageId);

  revalidatePath("/");
  revalidatePath("/shelf");
  revalidatePath("/attendance");
  revalidatePath(`/lessons/${sharedLessonId}`);
}

export async function scheduleMakeupSharedLesson(
  sharedCurriculumId: string,
  date: string,
  options?: { title?: string; notes?: string },
) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  const nextLesson = await db.query.sharedLessons.findFirst({
    where: and(
      eq(sharedLessons.organizationId, organizationId),
      eq(sharedLessons.sharedCurriculumId, sharedCurriculumId),
      eq(sharedLessons.status, "planned"),
      gt(sharedLessons.scheduledDate, date),
    ),
    orderBy: [
      asc(sharedLessons.scheduledDate),
      asc(sharedLessons.lessonNumber),
    ],
  });

  if (nextLesson) {
    const updates: Record<string, string | null> = { scheduledDate: date };
    if (options?.title?.trim()) updates.title = options.title.trim();
    if (options?.notes !== undefined)
      updates.notes = options.notes.trim() || null;
    await db
      .update(sharedLessons)
      .set(updates)
      .where(
        and(
          eq(sharedLessons.id, nextLesson.id),
          eq(sharedLessons.organizationId, organizationId),
        ),
      );
  } else {
    const result = await db
      .select({ maxNum: max(sharedLessons.lessonNumber) })
      .from(sharedLessons)
      .where(
        and(
          eq(sharedLessons.organizationId, organizationId),
          eq(sharedLessons.sharedCurriculumId, sharedCurriculumId),
        ),
      );
    const nextNum = (result[0]?.maxNum ?? 0) + 1;

    await db.insert(sharedLessons).values({
      organizationId,
      sharedCurriculumId,
      lessonNumber: nextNum,
      title: options?.title?.trim() || `Lesson ${nextNum}`,
      scheduledDate: date,
      status: "planned",
      notes: options?.notes?.trim() || null,
    });
  }

  revalidatePath("/");
  revalidatePath("/shelf");
  revalidatePath("/attendance");
}
