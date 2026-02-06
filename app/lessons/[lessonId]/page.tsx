export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BackButton } from "@/components/back-button";
import { StudentColorDot } from "@/components/student-color-dot";
import { LessonDetailForm } from "@/components/lessons/lesson-detail-form";
import { getLessonWithContext } from "@/lib/queries/lessons";
import { formatDate } from "@/lib/dates";

export default async function LessonDetailPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const lesson = await getLessonWithContext(lessonId);

  if (!lesson) {
    notFound();
  }

  const { resource } = lesson;
  const { subject } = resource;
  const { student } = subject;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BackButton />
        <StudentColorDot color={student.color} className="h-4 w-4" />
        <div className="flex-1">
          <h1 className="text-xl font-bold">
            {lesson.title ?? `Lesson ${lesson.lessonNumber}`}
          </h1>
          <p className="text-sm text-muted-foreground">
            {student.name} &middot; {subject.name} &middot; {resource.name}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge
          variant={lesson.status === "completed" ? "default" : "secondary"}
        >
          {lesson.status}
        </Badge>
        {lesson.scheduledDate && (
          <span className="text-muted-foreground">
            Scheduled: {formatDate(lesson.scheduledDate)}
          </span>
        )}
        {lesson.completionDate && (
          <span className="text-muted-foreground">
            Completed: {formatDate(lesson.completionDate)}
          </span>
        )}
      </div>

      <Separator />

      <LessonDetailForm
        lessonId={lesson.id}
        status={lesson.status}
        plan={lesson.plan}
        notes={lesson.notes}
        scheduledDate={lesson.scheduledDate}
      />
    </div>
  );
}
