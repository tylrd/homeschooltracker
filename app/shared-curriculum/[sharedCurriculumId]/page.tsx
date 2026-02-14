export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { SharedCurriculumDetailView } from "@/components/shelf/shared-curriculum-detail-view";
import { getFirstOpenDateOnOrAfter, toDateString } from "@/lib/dates";
import { getDefaultLessonCount, getSchoolDays } from "@/lib/queries/settings";
import {
  getSharedCurriculumWithLessons,
  getStudentsNotInSharedCurriculum,
} from "@/lib/queries/shared-curricula";

export default async function SharedCurriculumDetailPage({
  params,
}: {
  params: Promise<{ sharedCurriculumId: string }>;
}) {
  const { sharedCurriculumId } = await params;
  const [curriculum, schoolDays, defaultLessonCount] = await Promise.all([
    getSharedCurriculumWithLessons(sharedCurriculumId),
    getSchoolDays(),
    getDefaultLessonCount(),
  ]);

  if (!curriculum) {
    notFound();
  }

  const availableStudents = await getStudentsNotInSharedCurriculum(
    curriculum.id,
  );

  const today = toDateString(new Date());
  const scheduledDates = curriculum.lessons
    .map((lesson) => lesson.scheduledDate)
    .filter((date): date is string => Boolean(date));
  const defaultLessonDate = getFirstOpenDateOnOrAfter(today, scheduledDates);

  return (
    <SharedCurriculumDetailView
      sharedCurriculumId={curriculum.id}
      name={curriculum.name}
      description={curriculum.description}
      lessons={curriculum.lessons}
      members={curriculum.students.map((member) => member.student)}
      availableStudents={availableStudents}
      defaultLessonDate={defaultLessonDate}
      schoolDays={schoolDays}
      defaultLessonCount={defaultLessonCount}
    />
  );
}
