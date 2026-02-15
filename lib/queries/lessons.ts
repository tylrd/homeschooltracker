import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { lessons, sharedLessons } from "@/db/schema";
import { getTenantContext } from "@/lib/auth/session";

export async function getLessonWithContext(lessonId: string) {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  const personalLesson = await db.query.lessons.findFirst({
    where: and(
      eq(lessons.id, lessonId),
      eq(lessons.organizationId, organizationId),
    ),
    with: {
      workSamples: {
        columns: { id: true, imageId: true, createdAt: true },
      },
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
    where: and(
      eq(sharedLessons.id, lessonId),
      eq(sharedLessons.organizationId, organizationId),
    ),
    with: {
      workSamples: {
        columns: { id: true, imageId: true, createdAt: true },
      },
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
