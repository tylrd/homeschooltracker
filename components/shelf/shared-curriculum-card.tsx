import { ChevronRight, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function SharedCurriculumCard({
  curriculum,
}: {
  curriculum: {
    sharedCurriculumId: string;
    sharedCurriculumName: string;
    sharedCurriculumDescription: string | null;
    coverImageId: string | null;
    memberCount: number;
    totalLessons: number;
    completedLessons: number;
  };
}) {
  const percent =
    curriculum.totalLessons > 0
      ? Math.round(
          (curriculum.completedLessons / curriculum.totalLessons) * 100,
        )
      : 0;

  return (
    <Link href={`/shared-curriculum/${curriculum.sharedCurriculumId}`}>
      <Card className="gap-0 py-0 transition-colors hover:bg-accent">
        <CardContent className="space-y-2 p-4">
          <div className="flex items-center gap-3">
            {curriculum.coverImageId ? (
              <Image
                src={`/api/curriculum-images/${curriculum.coverImageId}`}
                alt={`${curriculum.sharedCurriculumName} cover`}
                width={40}
                height={48}
                className="h-12 w-10 rounded object-cover"
              />
            ) : (
              <div className="flex h-12 w-10 items-center justify-center rounded bg-muted">
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <span className="flex-1 font-medium">
              {curriculum.sharedCurriculumName}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
          {curriculum.sharedCurriculumDescription && (
            <p className="text-sm text-muted-foreground">
              {curriculum.sharedCurriculumDescription}
            </p>
          )}
          <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <Users className="h-3 w-3" />
            {curriculum.memberCount}{" "}
            {curriculum.memberCount === 1 ? "student" : "students"}
          </div>
          <div className="flex items-center gap-2">
            <Progress value={percent} className="h-2 flex-1" />
            <span className="text-xs text-muted-foreground">
              {curriculum.completedLessons}/{curriculum.totalLessons}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
