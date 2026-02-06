import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StudentColorDot } from "@/components/student-color-dot";
import type { Student } from "@/db/schema";

export function StudentCard({ student }: { student: Student }) {
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
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}
