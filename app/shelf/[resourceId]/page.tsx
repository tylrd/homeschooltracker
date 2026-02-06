export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StudentColorDot } from "@/components/student-color-dot";
import { LessonTable } from "@/components/shelf/lesson-table";
import { BatchCreateForm } from "@/components/shelf/batch-create-form";
import { getResourceWithLessons } from "@/lib/queries/shelf";

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ resourceId: string }>;
}) {
  const { resourceId } = await params;
  const resource = await getResourceWithLessons(resourceId);

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
        <Link href="/shelf">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <StudentColorDot color={resource.subject.student.color} className="h-4 w-4" />
        <div className="flex-1">
          <h1 className="text-xl font-bold">{resource.name}</h1>
          <p className="text-sm text-muted-foreground">
            {resource.subject.name} &middot;{" "}
            {resource.subject.student.name}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Progress value={percent} className="h-2 flex-1" />
        <Badge variant="secondary">
          {completed}/{total} done
        </Badge>
      </div>

      <div className="flex justify-end">
        <BatchCreateForm
          resourceId={resource.id}
          existingCount={total}
        />
      </div>

      <LessonTable lessons={resource.lessons} />
    </div>
  );
}
