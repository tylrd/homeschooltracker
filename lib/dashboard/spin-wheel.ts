export type WheelLessonInput = {
  lessonKind: "personal" | "shared";
  lessonId: string;
  lessonNumber: number;
  lessonTitle: string | null;
  lessonStatus: string;
  resourceName: string;
  subjectName: string;
  studentId: string;
  studentName: string;
  studentColor: string;
};

export type WheelSubjectCandidate = {
  subjectName: string;
  studentId: string;
  studentName: string;
  studentColor: string;
  lessonId: string;
  lessonTitle: string | null;
  lessonNumber: number;
  resourceName: string;
  entryCount: number;
};

export function getWheelCandidates(
  lessons: WheelLessonInput[],
): WheelSubjectCandidate[] {
  const eligible = lessons.filter(
    (lesson) =>
      lesson.lessonKind === "personal" && lesson.lessonStatus !== "completed",
  );

  const bySubject = new Map<string, WheelLessonInput[]>();
  for (const lesson of eligible) {
    const subjectKey = `${lesson.studentId}:${lesson.subjectName}`;
    const existing = bySubject.get(subjectKey);
    if (existing) {
      existing.push(lesson);
    } else {
      bySubject.set(subjectKey, [lesson]);
    }
  }

  const candidates = Array.from(bySubject.entries()).map(
    ([, subjectLessons]) => {
      const sorted = [...subjectLessons].sort((a, b) => {
        if (a.lessonNumber !== b.lessonNumber) {
          return a.lessonNumber - b.lessonNumber;
        }
        return a.lessonId.localeCompare(b.lessonId);
      });
      const nextLesson = sorted[0];
      return {
        subjectName: nextLesson.subjectName,
        studentId: nextLesson.studentId,
        studentName: nextLesson.studentName,
        studentColor: nextLesson.studentColor,
        lessonId: nextLesson.lessonId,
        lessonTitle: nextLesson.lessonTitle,
        lessonNumber: nextLesson.lessonNumber,
        resourceName: nextLesson.resourceName,
        entryCount: sorted.length,
      };
    },
  );

  return candidates.sort((a, b) => {
    if (a.studentName !== b.studentName) {
      return a.studentName.localeCompare(b.studentName);
    }
    return a.subjectName.localeCompare(b.subjectName);
  });
}
