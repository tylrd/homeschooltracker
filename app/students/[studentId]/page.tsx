export const dynamic = "force-dynamic";

import { BookOpen, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { StudentColorDot } from "@/components/student-color-dot";
import { DeleteResourceButton } from "@/components/students/delete-resource-button";
import { DeleteStudentButton } from "@/components/students/delete-student-button";
import { DeleteSubjectButton } from "@/components/students/delete-subject-button";
import { ResourceForm } from "@/components/students/resource-form";
import { StudentForm } from "@/components/students/student-form";
import { SubjectForm } from "@/components/students/subject-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getStudentWithSubjectsAndResources } from "@/lib/queries/students";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const student = await getStudentWithSubjectsAndResources(studentId);

  if (!student) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BackButton />
        <StudentColorDot color={student.color} className="h-4 w-4" />
        <h1 className="flex-1 text-2xl font-bold">{student.name}</h1>
        <StudentForm
          student={student}
          trigger={
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Pencil className="h-4 w-4" />
            </Button>
          }
        />
        <DeleteStudentButton studentId={student.id} />
      </div>

      {student.gradeLevel && (
        <p className="text-sm text-muted-foreground">{student.gradeLevel}</p>
      )}

      <Separator />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Subjects & Resources</h2>
        <SubjectForm studentId={student.id} />
      </div>

      {student.subjects.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No subjects yet. Add one to get started.
        </p>
      ) : (
        <div className="space-y-3">
          {student.subjects.map((subject) => (
            <Card key={subject.id}>
              <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
                <CardTitle className="flex-1 text-base">
                  {subject.name}
                </CardTitle>
                <Badge variant="secondary">
                  {subject.resources.length}{" "}
                  {subject.resources.length === 1 ? "resource" : "resources"}
                </Badge>
                <DeleteSubjectButton
                  subjectId={subject.id}
                  studentId={student.id}
                />
              </CardHeader>
              <CardContent className="space-y-2">
                {subject.resources.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2"
                  >
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 text-sm">{resource.name}</span>
                    <Link href={`/shelf/${resource.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        View
                      </Button>
                    </Link>
                    <DeleteResourceButton
                      resourceId={resource.id}
                      studentId={student.id}
                    />
                  </div>
                ))}
                <ResourceForm subjectId={subject.id} studentId={student.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
