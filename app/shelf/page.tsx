export const dynamic = "force-dynamic";

import { BookOpen } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ResourceCard } from "@/components/shelf/resource-card";
import { SharedCurriculumCard } from "@/components/shelf/shared-curriculum-card";
import { ShelfAddCurriculumDialog } from "@/components/shelf/shelf-add-curriculum-dialog";
import { StudentColorDot } from "@/components/student-color-dot";
import {
  getAllResourcesWithProgress,
  getAllSharedCurriculaWithProgress,
} from "@/lib/queries/shelf";
import { getStudentsWithSubjectsForCurriculumAdd } from "@/lib/queries/students";

export default async function ShelfPage() {
  const [resources, sharedCurricula, students] = await Promise.all([
    getAllResourcesWithProgress(),
    getAllSharedCurriculaWithProgress(),
    getStudentsWithSubjectsForCurriculumAdd(),
  ]);

  if (resources.length === 0 && sharedCurricula.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Curriculum Shelf</h1>
          <ShelfAddCurriculumDialog students={students} />
        </div>
        <EmptyState
          icon={BookOpen}
          title="No resources yet"
          description="Add resources to your students to build your curriculum shelf."
        />
      </div>
    );
  }

  // Group by student
  const byStudent = new Map<
    string,
    { name: string; color: string; resources: typeof resources }
  >();
  for (const r of resources) {
    const existing = byStudent.get(r.studentId);
    if (existing) {
      existing.resources.push(r);
    } else {
      byStudent.set(r.studentId, {
        name: r.studentName,
        color: r.studentColor,
        resources: [r],
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Curriculum Shelf</h1>
        <ShelfAddCurriculumDialog students={students} />
      </div>

      {sharedCurricula.length > 0 && (
        <section className="mb-8 space-y-3">
          <h2 className="font-semibold">Shared Curriculum</h2>
          <div className="flex flex-col gap-3">
            {sharedCurricula.map((curriculum) => (
              <SharedCurriculumCard
                key={curriculum.sharedCurriculumId}
                curriculum={curriculum}
              />
            ))}
          </div>
        </section>
      )}

      {Array.from(byStudent.entries()).map(([studentId, group]) => (
        <section key={studentId} className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <StudentColorDot color={group.color} className="h-3 w-3" />
            <h2 className="font-semibold">{group.name}</h2>
          </div>
          <div className="flex flex-col gap-3">
            {group.resources.map((resource) => (
              <ResourceCard key={resource.resourceId} resource={resource} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
