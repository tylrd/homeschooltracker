export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { ResourceDetailView } from "@/components/shelf/resource-detail-view";
import { requireAppRouteAccess } from "@/lib/auth/session";
import { getFirstOpenDateOnOrAfter, toDateString } from "@/lib/dates";
import { getSchoolDocumentsForResource } from "@/lib/queries/school-documents";
import { getDefaultLessonCount, getSchoolDays } from "@/lib/queries/settings";
import {
  getEffectiveAbsencesForStudent,
  getResourceWithLessons,
} from "@/lib/queries/shelf";

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ resourceId: string }>;
}) {
  await requireAppRouteAccess();

  const { resourceId } = await params;
  const [resource, schoolDays, defaultLessonCount, yearDocs] =
    await Promise.all([
      getResourceWithLessons(resourceId),
      getSchoolDays(),
      getDefaultLessonCount(),
      getSchoolDocumentsForResource(resourceId),
    ]);

  if (!resource) {
    notFound();
  }

  const absenceByDate = await getEffectiveAbsencesForStudent(
    resource.subject.student.id,
  );

  const today = toDateString(new Date());
  const scheduledDates = resource.lessons
    .map((lesson) => lesson.scheduledDate)
    .filter((date): date is string => Boolean(date));
  const defaultLessonDate = getFirstOpenDateOnOrAfter(today, scheduledDates);

  return (
    <ResourceDetailView
      resourceId={resource.id}
      studentId={resource.subject.student.id}
      resourceName={resource.name}
      coverImageId={resource.coverImageId}
      subjectName={resource.subject.name}
      studentName={resource.subject.student.name}
      studentColor={resource.subject.student.color}
      lessons={resource.lessons}
      defaultLessonDate={defaultLessonDate}
      schoolDays={schoolDays}
      defaultLessonCount={defaultLessonCount}
      absenceByDate={absenceByDate}
      yearDocs={yearDocs}
    />
  );
}
