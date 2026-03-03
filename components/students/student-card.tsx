import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { StudentColorDot } from "@/components/student-color-dot";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type StudentCardData = {
  id: string;
  name: string;
  color: string;
  gradeLevel: string | null;
  xpBalance?: number;
  currentStreak?: number;
  newestBadgeKey?: string | null;
};

function formatBadgeLabel(badgeKey: string | null | undefined) {
  if (!badgeKey) return null;
  if (badgeKey.startsWith("streak_")) {
    const days = badgeKey.replace("streak_", "");
    return `${days}-day streak`;
  }
  return badgeKey.replace(/_/g, " ");
}

export function StudentCard({ student }: { student: StudentCardData }) {
  const badgeLabel = formatBadgeLabel(student.newestBadgeKey);

  return (
    <Link href={`/students/${student.id}`}>
      <Card className="gap-0 py-0 transition-colors hover:bg-accent">
        <CardContent className="flex items-center gap-3 p-4">
          <StudentColorDot color={student.color} className="h-4 w-4" />
          <div className="flex-1">
            <p className="font-medium">{student.name}</p>
            {student.gradeLevel && (
              <p className="text-sm text-muted-foreground">
                {student.gradeLevel}
              </p>
            )}
            <div className="mt-1 flex flex-wrap gap-1.5">
              <Badge variant="outline" className="text-[11px]">
                {student.xpBalance ?? 0} XP
              </Badge>
              <Badge variant="outline" className="text-[11px]">
                {student.currentStreak ?? 0}d streak
              </Badge>
              {badgeLabel && (
                <Badge variant="secondary" className="text-[11px]">
                  {badgeLabel}
                </Badge>
              )}
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}
