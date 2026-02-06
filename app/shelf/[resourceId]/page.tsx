export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/back-button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StudentColorDot } from "@/components/student-color-dot";
import { LessonTable } from "@/components/shelf/lesson-table";
import { BatchCreateForm } from "@/components/shelf/batch-create-form";
import { AddLessonForm } from "@/components/shelf/add-lesson-form";
import { getResourceWithLessons } from "@/lib/queries/shelf";
import {
  getSchoolDays,
  getDefaultLessonCount,
} from "@/lib/queries/settings";
import { nextSchoolDayStr, toDateString } from "@/lib/dates";

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ resourceId: string }>;
}) {
  const { resourceId } = await params;
  const [resource, schoolDays, defaultLessonCount] = await Promise.all([
    getResourceWithLessons(resourceId),
    getSchoolDays(),
    getDefaultLessonCount(),
  ]);

  if (!resource) {
    notFound();
  }

  const total = resource.lessons.length;
  const completed = resource.lessons.filter(
    (l) => l.status === "completed",
  ).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BackButton />
        <StudentColorDot
          color={resource.subject.student.color}
          className="h-4 w-4"
        />
        <div className="flex-1">
          <h1 className="text-xl font-bold">{resource.name}</h1>
          <p className="text-sm text-muted-foreground">
            {resource.subject.name} &middot; {resource.subject.student.name}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Progress value={percent} className="h-2 flex-1" />
        <Badge variant="secondary">
          {completed}/{total} done
        </Badge>
      </div>

      <div className="flex justify-end gap-2">
        <AddLessonForm
          resourceId={resource.id}
          nextLessonNumber={total + 1}
          defaultDate={
            resource.lessons.length > 0 &&
            resource.lessons[resource.lessons.length - 1].scheduledDate
              ? nextSchoolDayStr(
                  resource.lessons[resource.lessons.length - 1].scheduledDate!,
                  schoolDays,
                )
              : toDateString(new Date())
          }
        />
        <BatchCreateForm
          resourceId={resource.id}
          existingCount={total}
          defaultSchoolDays={schoolDays}
          defaultLessonCount={defaultLessonCount}
        />
      </div>

      <LessonTable lessons={resource.lessons} />
    </div>
  );
}
