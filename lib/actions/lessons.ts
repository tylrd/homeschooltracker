"use server";

import { and, asc, eq, gt, gte, inArray, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import {
  curriculumImages,
  lessons,
  lessonWorkSamples,
  resources,
  subjects,
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

export async function batchCreateLessons(
  resourceId: string,
  startLesson: number,
  endLesson: number,
  startDate: string,
  schoolDays: number[],
) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  const count = endLesson - startLesson + 1;
  if (count <= 0) throw new Error("Invalid lesson range");

  // Check for existing lessons in this range
  const existing = await db.query.lessons.findMany({
    where: and(
      eq(lessons.organizationId, organizationId),
      eq(lessons.resourceId, resourceId),
      gte(lessons.lessonNumber, startLesson),
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
        resourceId,
        lessonNumber: num,
        title: `Lesson ${num}`,
        scheduledDate: toDateString(dates[dateIndex]),
        status: "planned" as const,
      });
    }
    dateIndex++;
  }

  if (newLessons.length > 0) {
    await db.insert(lessons).values(newLessons);
  }

  revalidatePath("/shelf");
  revalidatePath(`/shelf/${resourceId}`);
  revalidatePath("/");
}

export async function completeLesson(lessonId: string) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  const today = toDateString(new Date());
  await db
    .update(lessons)
    .set({ status: "completed", completionDate: today })
    .where(
      and(eq(lessons.id, lessonId), eq(lessons.organizationId, organizationId)),
    );

  revalidatePath("/");
  revalidatePath("/shelf");
  revalidatePath("/attendance");
  revalidatePath(`/lessons/${lessonId}`);
}

export async function uncompleteLesson(lessonId: string) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  await db
    .update(lessons)
    .set({ status: "planned", completionDate: null })
    .where(
      and(eq(lessons.id, lessonId), eq(lessons.organizationId, organizationId)),
    );

  revalidatePath("/");
  revalidatePath("/shelf");
  revalidatePath("/attendance");
  revalidatePath(`/lessons/${lessonId}`);
}

export async function bumpLesson(lessonId: string) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  const [lesson, schoolDays, bumpBehavior] = await Promise.all([
    db.query.lessons.findFirst({
      where: and(
        eq(lessons.id, lessonId),
        eq(lessons.organizationId, organizationId),
      ),
    }),
    getSchoolDays(),
    getBumpBehavior(),
  ]);

  if (!lesson || !lesson.scheduledDate) return;

  // Find all planned lessons for the same resource from this date onward
  const futureLessons = await db
    .select()
    .from(lessons)
    .where(
      and(
        eq(lessons.organizationId, organizationId),
        eq(lessons.resourceId, lesson.resourceId),
        eq(lessons.status, "planned"),
        gte(lessons.scheduledDate, lesson.scheduledDate),
      ),
    )
    .orderBy(asc(lessons.scheduledDate), asc(lessons.lessonNumber));

  if (futureLessons.length === 0) return;

  // First lesson uses bump behavior, rest cascade with nextSchoolDayStr
  let currentDate = getNextBumpDate(
    lesson.scheduledDate,
    bumpBehavior,
    schoolDays,
  );

  await db.transaction(async (tx) => {
    for (let i = 0; i < futureLessons.length; i++) {
      await tx
        .update(lessons)
        .set({ scheduledDate: currentDate })
        .where(
          and(
            eq(lessons.id, futureLessons[i].id),
            eq(lessons.organizationId, organizationId),
          ),
        );
      currentDate = nextSchoolDayStr(currentDate, schoolDays);
    }
  });

  revalidatePath("/");
  revalidatePath("/shelf");
  revalidatePath(`/lessons/${lessonId}`);
}

export async function bumpAllToday(date: string) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  const [schoolDays, bumpBehavior] = await Promise.all([
    getSchoolDays(),
    getBumpBehavior(),
  ]);

  // Find all planned lessons scheduled for this date
  const todayLessons = await db
    .select()
    .from(lessons)
    .where(
      and(
        eq(lessons.organizationId, organizationId),
        eq(lessons.scheduledDate, date),
        eq(lessons.status, "planned"),
      ),
    );

  if (todayLessons.length === 0) return;

  // Group by resourceId
  const byResource = new Map<string, typeof todayLessons>();
  for (const lesson of todayLessons) {
    const existing = byResource.get(lesson.resourceId) ?? [];
    existing.push(lesson);
    byResource.set(lesson.resourceId, existing);
  }

  await db.transaction(async (tx) => {
    for (const resourceId of byResource.keys()) {
      // Get all planned lessons for this resource from today onward
      const futureLessons = await tx
        .select()
        .from(lessons)
        .where(
          and(
            eq(lessons.organizationId, organizationId),
            eq(lessons.resourceId, resourceId),
            eq(lessons.status, "planned"),
            gte(lessons.scheduledDate, date),
          ),
        )
        .orderBy(asc(lessons.scheduledDate), asc(lessons.lessonNumber));

      let currentDate = getNextBumpDate(date, bumpBehavior, schoolDays);
      for (let i = 0; i < futureLessons.length; i++) {
        await tx
          .update(lessons)
          .set({ scheduledDate: currentDate })
          .where(
            and(
              eq(lessons.id, futureLessons[i].id),
              eq(lessons.organizationId, organizationId),
            ),
          );
        currentDate = nextSchoolDayStr(currentDate, schoolDays);
      }
    }
  });

  revalidatePath("/");
  revalidatePath("/shelf");
}

export async function createLesson(
  resourceId: string,
  lessonNumber: number,
  title: string,
  scheduledDate: string,
  plan?: string,
) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  await db.insert(lessons).values({
    organizationId,
    resourceId,
    lessonNumber,
    title: title.trim() || `Lesson ${lessonNumber}`,
    scheduledDate: scheduledDate || null,
    plan: plan?.trim() ? plan.trim() : null,
    status: "planned",
  });

  revalidatePath("/shelf");
  revalidatePath(`/shelf/${resourceId}`);
  revalidatePath("/");
}

export async function updateLessonScheduledDate(
  lessonId: string,
  newDate: string,
) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  const lesson = await db.query.lessons.findFirst({
    where: and(
      eq(lessons.id, lessonId),
      eq(lessons.organizationId, organizationId),
    ),
  });

  await db
    .update(lessons)
    .set({ scheduledDate: newDate || null })
    .where(
      and(eq(lessons.id, lessonId), eq(lessons.organizationId, organizationId)),
    );

  revalidatePath("/");
  revalidatePath("/shelf");
  revalidatePath(`/lessons/${lessonId}`);
  if (lesson) {
    revalidatePath(`/shelf/${lesson.resourceId}`);
  }
}

export async function bulkCompleteLessons(lessonIds: string[]) {
  const ids = Array.from(new Set(lessonIds)).filter(Boolean);
  if (ids.length === 0) return;

  const db = getDb();
  const { organizationId } = await getTenantContext();
  const today = toDateString(new Date());

  const affectedLessons = await db.query.lessons.findMany({
    where: and(
      eq(lessons.organizationId, organizationId),
      inArray(lessons.id, ids),
    ),
    columns: { id: true, resourceId: true },
  });

  await db
    .update(lessons)
    .set({ status: "completed", completionDate: today })
    .where(
      and(eq(lessons.organizationId, organizationId), inArray(lessons.id, ids)),
    );

  revalidatePath("/");
  revalidatePath("/shelf");
  revalidatePath("/attendance");

  const resourceIds = new Set(
    affectedLessons.map((lesson) => lesson.resourceId),
  );
  for (const resourceId of resourceIds) {
    revalidatePath(`/shelf/${resourceId}`);
  }
}

export async function bulkDeleteLessons(lessonIds: string[]) {
  const ids = Array.from(new Set(lessonIds)).filter(Boolean);
  if (ids.length === 0) return;

  const db = getDb();
  const { organizationId } = await getTenantContext();
  const affectedLessons = await db.query.lessons.findMany({
    where: and(
      eq(lessons.organizationId, organizationId),
      inArray(lessons.id, ids),
    ),
    columns: { id: true, resourceId: true },
  });
  const sampleRows = await db.query.lessonWorkSamples.findMany({
    where: and(
      eq(lessonWorkSamples.organizationId, organizationId),
      inArray(lessonWorkSamples.lessonId, ids),
    ),
    columns: { imageId: true },
  });

  await db
    .delete(lessons)
    .where(
      and(eq(lessons.organizationId, organizationId), inArray(lessons.id, ids)),
    );
  const imageStore = getImageStore();
  for (const { imageId } of sampleRows) {
    await imageStore.deleteImage(imageId);
  }

  revalidatePath("/");
  revalidatePath("/shelf");

  const resourceIds = new Set(
    affectedLessons.map((lesson) => lesson.resourceId),
  );
  for (const resourceId of resourceIds) {
    revalidatePath(`/shelf/${resourceId}`);
  }
}

export async function bumpStudentLessons(studentId: string, date: string) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  const [schoolDays, bumpBehavior] = await Promise.all([
    getSchoolDays(),
    getBumpBehavior(),
  ]);

  // Find planned lessons for this date that belong to this student
  const todayLessons = await db
    .select({ lessonId: lessons.id, resourceId: lessons.resourceId })
    .from(lessons)
    .innerJoin(resources, eq(lessons.resourceId, resources.id))
    .innerJoin(subjects, eq(resources.subjectId, subjects.id))
    .where(
      and(
        eq(lessons.organizationId, organizationId),
        eq(lessons.scheduledDate, date),
        eq(lessons.status, "planned"),
        eq(subjects.studentId, studentId),
      ),
    );

  if (todayLessons.length === 0) return;

  // Group by resourceId
  const resourceIds = new Set(todayLessons.map((l) => l.resourceId));

  await db.transaction(async (tx) => {
    for (const resourceId of resourceIds) {
      const futureLessons = await tx
        .select()
        .from(lessons)
        .where(
          and(
            eq(lessons.organizationId, organizationId),
            eq(lessons.resourceId, resourceId),
            eq(lessons.status, "planned"),
            gte(lessons.scheduledDate, date),
          ),
        )
        .orderBy(asc(lessons.scheduledDate), asc(lessons.lessonNumber));

      let currentDate = getNextBumpDate(date, bumpBehavior, schoolDays);
      for (let i = 0; i < futureLessons.length; i++) {
        await tx
          .update(lessons)
          .set({ scheduledDate: currentDate })
          .where(
            and(
              eq(lessons.id, futureLessons[i].id),
              eq(lessons.organizationId, organizationId),
            ),
          );
        currentDate = nextSchoolDayStr(currentDate, schoolDays);
      }
    }
  });

  revalidatePath("/");
  revalidatePath("/shelf");
}

export async function updateLessonPlan(lessonId: string, plan: string) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  await db
    .update(lessons)
    .set({ plan: plan.trim() || null })
    .where(
      and(eq(lessons.id, lessonId), eq(lessons.organizationId, organizationId)),
    );

  revalidatePath(`/lessons/${lessonId}`);
  revalidatePath("/");
  revalidatePath("/shelf");
}

export async function updateLessonContent(
  lessonId: string,
  title: string,
  plan: string,
  notes: string,
) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  await db
    .update(lessons)
    .set({
      title: title.trim() || null,
      plan: plan.trim() || null,
      notes: notes.trim() || null,
    })
    .where(
      and(eq(lessons.id, lessonId), eq(lessons.organizationId, organizationId)),
    );

  revalidatePath(`/lessons/${lessonId}`);
  revalidatePath("/");
  revalidatePath("/shelf");
}

export async function uploadLessonWorkSamples(
  lessonId: string,
  formData: FormData,
) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  const lesson = await db.query.lessons.findFirst({
    where: and(
      eq(lessons.id, lessonId),
      eq(lessons.organizationId, organizationId),
    ),
    columns: { id: true, resourceId: true },
  });

  if (!lesson) {
    throw new Error("Lesson not found");
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

    await db.insert(lessonWorkSamples).values({
      organizationId,
      lessonId,
      imageId: savedImage.id,
    });
  }

  revalidatePath("/");
  revalidatePath("/shelf");
  revalidatePath(`/shelf/${lesson.resourceId}`);
  revalidatePath(`/lessons/${lessonId}`);
}

export async function deleteLessonWorkSample(
  lessonId: string,
  workSampleId: string,
) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  const sample = await db.query.lessonWorkSamples.findFirst({
    where: and(
      eq(lessonWorkSamples.organizationId, organizationId),
      eq(lessonWorkSamples.id, workSampleId),
      eq(lessonWorkSamples.lessonId, lessonId),
    ),
    columns: { id: true, imageId: true },
    with: {
      lesson: {
        columns: { resourceId: true },
      },
    },
  });

  if (!sample) {
    throw new Error("Work sample not found");
  }

  await db
    .delete(lessonWorkSamples)
    .where(
      and(
        eq(lessonWorkSamples.organizationId, organizationId),
        eq(lessonWorkSamples.id, workSampleId),
        eq(lessonWorkSamples.lessonId, lessonId),
      ),
    );

  const imageStore = getImageStore();
  await imageStore.deleteImage(sample.imageId);

  revalidatePath("/");
  revalidatePath("/shelf");
  revalidatePath(`/shelf/${sample.lesson.resourceId}`);
  revalidatePath(`/lessons/${lessonId}`);
}

export async function scheduleMakeupLesson(
  resourceId: string,
  date: string,
  options?: { title?: string; notes?: string },
) {
  const db = getDb();
  const { organizationId } = await getTenantContext();

  // Find the next planned lesson after this date
  const nextLesson = await db.query.lessons.findFirst({
    where: and(
      eq(lessons.organizationId, organizationId),
      eq(lessons.resourceId, resourceId),
      eq(lessons.status, "planned"),
      gt(lessons.scheduledDate, date),
    ),
    orderBy: [asc(lessons.scheduledDate), asc(lessons.lessonNumber)],
  });

  if (nextLesson) {
    // Pull the next planned lesson forward to today
    const updates: Record<string, string | null> = { scheduledDate: date };
    if (options?.title?.trim()) updates.title = options.title.trim();
    if (options?.notes !== undefined)
      updates.notes = options.notes.trim() || null;
    await db
      .update(lessons)
      .set(updates)
      .where(
        and(
          eq(lessons.id, nextLesson.id),
          eq(lessons.organizationId, organizationId),
        ),
      );
  } else {
    // No future planned lesson — create a new one
    const result = await db
      .select({ maxNum: max(lessons.lessonNumber) })
      .from(lessons)
      .where(
        and(
          eq(lessons.organizationId, organizationId),
          eq(lessons.resourceId, resourceId),
        ),
      );
    const nextNum = (result[0]?.maxNum ?? 0) + 1;

    await db.insert(lessons).values({
      organizationId,
      resourceId,
      lessonNumber: nextNum,
      title: options?.title?.trim() || `Lesson ${nextNum}`,
      scheduledDate: date,
      status: "planned",
      notes: options?.notes?.trim() || null,
    });
  }

  revalidatePath("/");
  revalidatePath("/shelf");
}

export async function deleteLesson(
  lessonId: string,
  opts?: { redirectTo?: string },
) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  const lesson = await db.query.lessons.findFirst({
    where: and(
      eq(lessons.id, lessonId),
      eq(lessons.organizationId, organizationId),
    ),
  });
  const sampleRows = await db.query.lessonWorkSamples.findMany({
    where: and(
      eq(lessonWorkSamples.organizationId, organizationId),
      eq(lessonWorkSamples.lessonId, lessonId),
    ),
    columns: { imageId: true },
  });

  await db
    .delete(lessons)
    .where(
      and(eq(lessons.id, lessonId), eq(lessons.organizationId, organizationId)),
    );
  const imageStore = getImageStore();
  for (const { imageId } of sampleRows) {
    await imageStore.deleteImage(imageId);
  }

  revalidatePath("/");
  revalidatePath("/shelf");
  if (lesson) {
    revalidatePath(`/shelf/${lesson.resourceId}`);
  }

  if (opts?.redirectTo) {
    redirect(opts.redirectTo);
  }
}

export async function getUpcomingPlannedLessons(
  studentId: string,
  date: string,
) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  const rows = await db
    .select({
      lessonId: lessons.id,
      lessonNumber: lessons.lessonNumber,
      lessonTitle: lessons.title,
      scheduledDate: lessons.scheduledDate,
      resourceName: resources.name,
      subjectName: subjects.name,
    })
    .from(lessons)
    .innerJoin(resources, eq(lessons.resourceId, resources.id))
    .innerJoin(subjects, eq(resources.subjectId, subjects.id))
    .where(
      and(
        eq(lessons.organizationId, organizationId),
        eq(subjects.studentId, studentId),
        eq(lessons.status, "planned"),
        gt(lessons.scheduledDate, date),
      ),
    )
    .orderBy(
      asc(lessons.scheduledDate),
      asc(subjects.name),
      asc(lessons.lessonNumber),
    )
    .limit(30);

  return rows;
}
