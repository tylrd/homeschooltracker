export const dynamic = "force-dynamic";

import { ShelfPageContent } from "@/components/shelf/shelf-page-content";
import { requireAppRouteAccess } from "@/lib/auth/session";
import {
  getAllResourcesWithProgress,
  getAllSharedCurriculaWithProgress,
} from "@/lib/queries/shelf";
import { getStudentsWithSubjectsForCurriculumAdd } from "@/lib/queries/students";

export default async function ShelfPage() {
  await requireAppRouteAccess("/shelf");

  const [resources, sharedCurricula, students] = await Promise.all([
    getAllResourcesWithProgress(),
    getAllSharedCurriculaWithProgress(),
    getStudentsWithSubjectsForCurriculumAdd(),
  ]);

  if (resources.length === 0 && sharedCurricula.length === 0) {
    return (
      <ShelfPageContent
        resources={resources}
        sharedCurricula={sharedCurricula}
        students={students}
      />
    );
  }

  return (
    <ShelfPageContent
      resources={resources}
      sharedCurricula={sharedCurricula}
      students={students}
    />
  );
}
