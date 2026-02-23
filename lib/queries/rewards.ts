import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  dailyRewards,
  lessons,
  resources,
  sharedCurriculumStudents,
  sharedLessons,
  students,
  subjects,
} from "@/db/schema";
import { getTenantContext } from "@/lib/auth/session";

const DAILY_COMPLETION_REWARD_TYPE = "all_lessons_completed";

type StudentProgress = {
  studentId: string;
  studentName: string;
  totalLessons: number;
  completedLessons: number;
};

export type DailyCompletionRewardStatus = {
  date: string;
  totalStudents: number;
  studentsWithLessons: number;
  completedStudents: number;
  totalLessons: number;
  completedLessons: number;
  isEligible: boolean;
  isTracked: boolean;
  trackedAt: Date | null;
  points: number;
  students: StudentProgress[];
};

export async function getDailyCompletionRewardStatus(
  date: string,
): Promise<DailyCompletionRewardStatus> {
  const db = getDb();
  const { organizationId } = await getTenantContext();

  const [studentRows, personalRows, sharedRows, rewardRow] = await Promise.all([
    db
      .select({
        studentId: students.id,
        studentName: students.name,
      })
      .from(students)
      .where(eq(students.organizationId, organizationId)),
    db
      .select({
        studentId: students.id,
        lessonStatus: lessons.status,
      })
      .from(lessons)
      .innerJoin(resources, eq(lessons.resourceId, resources.id))
      .innerJoin(subjects, eq(resources.subjectId, subjects.id))
      .innerJoin(students, eq(subjects.studentId, students.id))
      .where(
        and(
          eq(lessons.organizationId, organizationId),
          eq(lessons.scheduledDate, date),
        ),
      ),
    db
      .select({
        studentId: students.id,
        lessonStatus: sharedLessons.status,
      })
      .from(sharedLessons)
      .innerJoin(
        sharedCurriculumStudents,
        eq(
          sharedCurriculumStudents.sharedCurriculumId,
          sharedLessons.sharedCurriculumId,
        ),
      )
      .innerJoin(students, eq(sharedCurriculumStudents.studentId, students.id))
      .where(
        and(
          eq(sharedLessons.organizationId, organizationId),
          eq(sharedCurriculumStudents.organizationId, organizationId),
          eq(sharedLessons.scheduledDate, date),
        ),
      ),
    db.query.dailyRewards.findFirst({
      where: and(
        eq(dailyRewards.organizationId, organizationId),
        eq(dailyRewards.rewardDate, date),
        eq(dailyRewards.rewardType, DAILY_COMPLETION_REWARD_TYPE),
      ),
    }),
  ]);

  const progressMap = new Map<string, StudentProgress>();

  for (const student of studentRows) {
    progressMap.set(student.studentId, {
      studentId: student.studentId,
      studentName: student.studentName,
      totalLessons: 0,
      completedLessons: 0,
    });
  }

  const allRows = [...personalRows, ...sharedRows];
  for (const row of allRows) {
    const entry = progressMap.get(row.studentId);
    if (!entry) continue;
    entry.totalLessons += 1;
    if (row.lessonStatus === "completed") {
      entry.completedLessons += 1;
    }
  }

  const studentsProgress = Array.from(progressMap.values());
  const studentsWithLessonsRows = studentsProgress.filter(
    (student) => student.totalLessons > 0,
  );

  const totalLessons = allRows.length;
  const completedLessons = allRows.filter(
    (row) => row.lessonStatus === "completed",
  ).length;
  const studentsWithLessons = studentsWithLessonsRows.length;
  const completedStudents = studentsWithLessonsRows.filter(
    (student) => student.totalLessons === student.completedLessons,
  ).length;

  const isEligible =
    totalLessons > 0 &&
    studentsWithLessons > 0 &&
    completedStudents === studentsWithLessons;

  return {
    date,
    totalStudents: studentRows.length,
    studentsWithLessons,
    completedStudents,
    totalLessons,
    completedLessons,
    isEligible,
    isTracked: Boolean(rewardRow),
    trackedAt: rewardRow?.createdAt ?? null,
    points: rewardRow?.points ?? 1,
    students: studentsProgress,
  };
}
