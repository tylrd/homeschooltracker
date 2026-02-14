import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { lessons, sharedLessons } from "@/db/schema";

export async function getLessonWithContext(lessonId: string) {
  const db = getDb();
  const personalLesson = await db.query.lessons.findFirst({
    where: eq(lessons.id, lessonId),
    with: {
      resource: {
        with: {
          subject: {
            with: {
              student: true,
            },
          },
        },
      },
    },
  });

  if (personalLesson) {
    return {
      kind: "personal" as const,
      lesson: personalLesson,
    };
  }

  const sharedLesson = await db.query.sharedLessons.findFirst({
    where: eq(sharedLessons.id, lessonId),
    with: {
      sharedCurriculum: {
        with: {
          students: {
            with: {
              student: true,
            },
          },
        },
      },
    },
  });

  if (!sharedLesson) {
    return null;
  }

  return {
    kind: "shared" as const,
    lesson: sharedLesson,
  };
}
