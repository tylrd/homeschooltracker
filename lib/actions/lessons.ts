"use server";

import { eq, and, gte, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { lessons, resources, subjects } from "@/db/schema";
import {
  generateLessonDates,
  nextSchoolDayStr,
  toDateString,
} from "@/lib/dates";

export async function batchCreateLessons(
  resourceId: string,
  startLesson: number,
  endLesson: number,
  startDate: string,
  schoolDays: number[],
) {
  const db = getDb();
  const count = endLesson - startLesson + 1;
  if (count <= 0) throw new Error("Invalid lesson range");

  // Check for existing lessons in this range
  const existing = await db.query.lessons.findMany({
    where: and(
      eq(lessons.resourceId, resourceId),
      gte(lessons.lessonNumber, startLesson),
    ),
  });
  const existingNumbers = new Set(existing.map((l) => l.lessonNumber));

  const startDateObj = new Date(startDate + "T00:00:00");
  const dates = generateLessonDates(startDateObj, count, schoolDays);

  const newLessons = [];
  let dateIndex = 0;
  for (let num = startLesson; num <= endLesson; num++) {
    if (!existingNumbers.has(num)) {
      newLessons.push({
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
  const today = toDateString(new Date());
  await db
    .update(lessons)
    .set({ status: "completed", completionDate: today })
    .where(eq(lessons.id, lessonId));

  revalidatePath("/");
  revalidatePath("/shelf");
  revalidatePath("/attendance");
  revalidatePath(`/lessons/${lessonId}`);
}

export async function uncompleteLesson(lessonId: string) {
  const db = getDb();
  await db
    .update(lessons)
    .set({ status: "planned", completionDate: null })
    .where(eq(lessons.id, lessonId));

  revalidatePath("/");
  revalidatePath("/shelf");
  revalidatePath("/attendance");
  revalidatePath(`/lessons/${lessonId}`);
}

export async function bumpLesson(lessonId: string) {
  const db = getDb();
  const lesson = await db.query.lessons.findFirst({
    where: eq(lessons.id, lessonId),
  });

  if (!lesson || !lesson.scheduledDate) return;

  // Find all planned lessons for the same resource from this date onward
  const futureLessons = await db
    .select()
    .from(lessons)
    .where(
      and(
        eq(lessons.resourceId, lesson.resourceId),
        eq(lessons.status, "planned"),
        gte(lessons.scheduledDate, lesson.scheduledDate),
      ),
    )
    .orderBy(asc(lessons.scheduledDate), asc(lessons.lessonNumber));

  if (futureLessons.length === 0) return;

  // Reassign dates: first one gets nextSchoolDay(bumpedDate), rest cascade
  let currentDate = nextSchoolDayStr(lesson.scheduledDate);

  await db.transaction(async (tx) => {
    for (const fl of futureLessons) {
      await tx
        .update(lessons)
        .set({ scheduledDate: currentDate })
        .where(eq(lessons.id, fl.id));
      currentDate = nextSchoolDayStr(currentDate);
    }
  });

  revalidatePath("/");
  revalidatePath("/shelf");
  revalidatePath(`/lessons/${lessonId}`);
}

export async function bumpAllToday(date: string) {
  const db = getDb();
  // Find all planned lessons scheduled for this date
  const todayLessons = await db
    .select()
    .from(lessons)
    .where(and(eq(lessons.scheduledDate, date), eq(lessons.status, "planned")));

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
            eq(lessons.resourceId, resourceId),
            eq(lessons.status, "planned"),
            gte(lessons.scheduledDate, date),
          ),
        )
        .orderBy(asc(lessons.scheduledDate), asc(lessons.lessonNumber));

      let currentDate = nextSchoolDayStr(date);
      for (const fl of futureLessons) {
        await tx
          .update(lessons)
          .set({ scheduledDate: currentDate })
          .where(eq(lessons.id, fl.id));
        currentDate = nextSchoolDayStr(currentDate);
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
) {
  const db = getDb();
  await db.insert(lessons).values({
    resourceId,
    lessonNumber,
    title: title.trim() || `Lesson ${lessonNumber}`,
    scheduledDate: scheduledDate || null,
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
  await db
    .update(lessons)
    .set({ scheduledDate: newDate || null })
    .where(eq(lessons.id, lessonId));

  revalidatePath("/");
  revalidatePath("/shelf");
  revalidatePath(`/lessons/${lessonId}`);
}

export async function bumpStudentLessons(studentId: string, date: string) {
  const db = getDb();

  // Find planned lessons for this date that belong to this student
  const todayLessons = await db
    .select({ lessonId: lessons.id, resourceId: lessons.resourceId })
    .from(lessons)
    .innerJoin(resources, eq(lessons.resourceId, resources.id))
    .innerJoin(subjects, eq(resources.subjectId, subjects.id))
    .where(
      and(
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
            eq(lessons.resourceId, resourceId),
            eq(lessons.status, "planned"),
            gte(lessons.scheduledDate, date),
          ),
        )
        .orderBy(asc(lessons.scheduledDate), asc(lessons.lessonNumber));

      let currentDate = nextSchoolDayStr(date);
      for (const fl of futureLessons) {
        await tx
          .update(lessons)
          .set({ scheduledDate: currentDate })
          .where(eq(lessons.id, fl.id));
        currentDate = nextSchoolDayStr(currentDate);
      }
    }
  });

  revalidatePath("/");
  revalidatePath("/shelf");
}

export async function updateLessonContent(
  lessonId: string,
  plan: string,
  notes: string,
) {
  const db = getDb();
  await db
    .update(lessons)
    .set({
      plan: plan.trim() || null,
      notes: notes.trim() || null,
    })
    .where(eq(lessons.id, lessonId));

  revalidatePath(`/lessons/${lessonId}`);
  revalidatePath("/");
  revalidatePath("/shelf");
}
