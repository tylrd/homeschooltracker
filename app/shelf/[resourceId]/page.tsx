export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { AddLessonForm } from "@/components/shelf/add-lesson-form";
import { BatchCreateForm } from "@/components/shelf/batch-create-form";
import { LessonTable } from "@/components/shelf/lesson-table";
import { StudentColorDot } from "@/components/student-color-dot";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { nextSchoolDayStr, toDateString } from "@/lib/dates";
import { getDefaultLessonCount, getSchoolDays } from "@/lib/queries/settings";
import { getResourceWithLessons } from "@/lib/queries/shelf";

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

      <details className="rounded-md border bg-muted/30" open={false}>
        <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-muted-foreground">
          Lesson tools
        </summary>
        <div className="flex flex-wrap justify-end gap-2 border-t px-3 py-3">
          <AddLessonForm
            resourceId={resource.id}
            nextLessonNumber={total + 1}
            defaultDate={(() => {
              const lastLesson = resource.lessons[resource.lessons.length - 1];
              const lastDate = lastLesson?.scheduledDate;
              return lastDate
                ? nextSchoolDayStr(lastDate, schoolDays)
                : toDateString(new Date());
            })()}
          />
          <BatchCreateForm
            resourceId={resource.id}
            existingCount={total}
            defaultSchoolDays={schoolDays}
            defaultLessonCount={defaultLessonCount}
          />
        </div>
      </details>

      <LessonTable lessons={resource.lessons} />
    </div>
  );
}
