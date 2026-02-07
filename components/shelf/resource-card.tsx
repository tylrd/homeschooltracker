import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { StudentColorDot } from "@/components/student-color-dot";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function ResourceCard({
  resource,
}: {
  resource: {
    resourceId: string;
    resourceName: string;
    subjectName: string;
    studentColor: string;
    totalLessons: number;
    completedLessons: number;
  };
}) {
  const percent =
    resource.totalLessons > 0
      ? Math.round((resource.completedLessons / resource.totalLessons) * 100)
      : 0;

  return (
    <Link href={`/shelf/${resource.resourceId}`}>
      <Card className="gap-0 py-0 transition-colors hover:bg-accent">
        <CardContent className="space-y-2 p-4">
          <div className="flex items-center gap-2">
            <StudentColorDot color={resource.studentColor} />
            <span className="flex-1 font-medium">{resource.resourceName}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            {resource.subjectName}
          </p>
          <div className="flex items-center gap-2">
            <Progress value={percent} className="h-2 flex-1" />
            <span className="text-xs text-muted-foreground">
              {resource.completedLessons}/{resource.totalLessons}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
