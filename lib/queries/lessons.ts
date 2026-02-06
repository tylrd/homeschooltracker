import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { lessons } from "@/db/schema";

export async function getLessonWithContext(lessonId: string) {
  const db = getDb();
  const lesson = await db.query.lessons.findFirst({
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

  return lesson;
}
