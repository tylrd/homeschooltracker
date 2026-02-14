export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { LessonDetailForm } from "@/components/lessons/lesson-detail-form";
import { StudentColorDot } from "@/components/student-color-dot";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/dates";
import { getLessonWithContext } from "@/lib/queries/lessons";

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

  if (lesson.kind === "personal") {
    const { resource } = lesson.lesson;
    const { subject } = resource;
    const { student } = subject;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BackButton />
          <StudentColorDot color={student.color} className="h-4 w-4" />
          <div className="flex-1">
            <h1 className="text-xl font-bold">
              {lesson.lesson.title ?? `Lesson ${lesson.lesson.lessonNumber}`}
            </h1>
            <p className="text-sm text-muted-foreground">
              {student.name} &middot; {subject.name} &middot; {resource.name}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge
            variant={
              lesson.lesson.status === "completed" ? "default" : "secondary"
            }
          >
            {lesson.lesson.status}
          </Badge>
          {lesson.lesson.scheduledDate && (
            <span className="text-muted-foreground">
              Scheduled: {formatDate(lesson.lesson.scheduledDate)}
            </span>
          )}
          {lesson.lesson.completionDate && (
            <span className="text-muted-foreground">
              Completed: {formatDate(lesson.lesson.completionDate)}
            </span>
          )}
        </div>

        <Separator />

        <LessonDetailForm
          lessonId={lesson.lesson.id}
          title={lesson.lesson.title}
          status={lesson.lesson.status}
          plan={lesson.lesson.plan}
          notes={lesson.lesson.notes}
          scheduledDate={lesson.lesson.scheduledDate}
        />
      </div>
    );
  }

  const members = lesson.lesson.sharedCurriculum.students.map((m) => m.student);
  const leadColor = members[0]?.color ?? "blue";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BackButton />
        <StudentColorDot color={leadColor} className="h-4 w-4" />
        <div className="flex-1">
          <h1 className="text-xl font-bold">
            {lesson.lesson.title ?? `Lesson ${lesson.lesson.lessonNumber}`}
          </h1>
          <p className="text-sm text-muted-foreground">
            Shared &middot; {lesson.lesson.sharedCurriculum.name} &middot;{" "}
            {members.length} students
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge
          variant={
            lesson.lesson.status === "completed" ? "default" : "secondary"
          }
        >
          {lesson.lesson.status}
        </Badge>
        {lesson.lesson.scheduledDate && (
          <span className="text-muted-foreground">
            Scheduled: {formatDate(lesson.lesson.scheduledDate)}
          </span>
        )}
        {lesson.lesson.completionDate && (
          <span className="text-muted-foreground">
            Completed: {formatDate(lesson.lesson.completionDate)}
          </span>
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        Students: {members.map((m) => m.name).join(", ")}
      </div>

      <Separator />

      <LessonDetailForm
        lessonId={lesson.lesson.id}
        title={lesson.lesson.title}
        status={lesson.lesson.status}
        plan={lesson.lesson.plan}
        notes={lesson.lesson.notes}
        scheduledDate={lesson.lesson.scheduledDate}
        lessonKind="shared"
      />
    </div>
  );
}
