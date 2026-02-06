export const dynamic = "force-dynamic";

import { BookOpen } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ResourceCard } from "@/components/shelf/resource-card";
import { StudentColorDot } from "@/components/student-color-dot";
import { getAllResourcesWithProgress } from "@/lib/queries/shelf";

export default async function ShelfPage() {
  const resources = await getAllResourcesWithProgress();

  if (resources.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Curriculum Shelf</h1>
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Curriculum Shelf</h1>
      {Array.from(byStudent.entries()).map(([studentId, group]) => (
        <div key={studentId} className="space-y-2">
          <div className="flex items-center gap-2">
            <StudentColorDot color={group.color} className="h-3 w-3" />
            <h2 className="font-semibold">{group.name}</h2>
          </div>
          <div className="space-y-2">
            {group.resources.map((resource) => (
              <ResourceCard key={resource.resourceId} resource={resource} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
