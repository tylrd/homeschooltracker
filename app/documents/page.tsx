export const dynamic = "force-dynamic";

import { DocumentsView } from "@/components/documents/documents-view";
import { requireAppRouteAccess } from "@/lib/auth/session";
import { getStudentsForFilter } from "@/lib/queries/dashboard";
import {
  getResourceOptionsForSchoolDocuments,
  getSchoolDocuments,
} from "@/lib/queries/school-documents";

export default async function DocumentsPage() {
  await requireAppRouteAccess("/documents");

  const [documents, students, resources] = await Promise.all([
    getSchoolDocuments(),
    getStudentsForFilter(),
    getResourceOptionsForSchoolDocuments(),
  ]);

  return (
    <DocumentsView
      documents={documents}
      students={students.map((student) => ({
        id: student.id,
        name: student.name,
        color: student.color,
      }))}
      resources={resources.map((resource) => ({
        resourceId: resource.resourceId,
        resourceName: resource.resourceName,
        studentName: resource.studentName,
      }))}
    />
  );
}
