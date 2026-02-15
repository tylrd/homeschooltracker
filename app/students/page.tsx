export const dynamic = "force-dynamic";

import { Plus, Users } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { StudentCard } from "@/components/students/student-card";
import { StudentForm } from "@/components/students/student-form";
import { Button } from "@/components/ui/button";
import { requireAppRouteAccess } from "@/lib/auth/session";
import { getStudents } from "@/lib/queries/students";

export default async function StudentsPage() {
  await requireAppRouteAccess("/students");

  const students = await getStudents();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Students</h1>
        <StudentForm
          trigger={
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          }
        />
      </div>
      {students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students yet"
          description="Add your first student to get started."
          action={
            <StudentForm
              trigger={
                <Button>
                  <Plus className="mr-1 h-4 w-4" />
                  Add Student
                </Button>
              }
            />
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {students.map((student) => (
            <StudentCard key={student.id} student={student} />
          ))}
        </div>
      )}
    </div>
  );
}
