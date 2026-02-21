import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  resources,
  schoolDocumentFiles,
  schoolDocumentStudents,
  schoolDocuments,
  students,
  subjects,
} from "@/db/schema";
import { getTenantContext } from "@/lib/auth/session";

type SchoolDocumentType =
  | "weekly_plan"
  | "curriculum_outline"
  | "pacing_calendar";

export type SchoolDocumentView = {
  id: string;
  type: SchoolDocumentType;
  title: string;
  notes: string | null;
  resourceId: string | null;
  resourceName: string | null;
  weekStartDate: string | null;
  weekEndDate: string | null;
  schoolYearLabel: string | null;
  createdAt: Date;
  files: {
    id: string;
    imageId: string;
    sortOrder: number;
    rotationDegrees: number;
  }[];
  students: { id: string; name: string; color: string }[];
};

export async function getSchoolDocuments() {
  const db = getDb();
  const { organizationId } = await getTenantContext();

  const docs = await db.query.schoolDocuments.findMany({
    where: eq(schoolDocuments.organizationId, organizationId),
    with: {
      resource: {
        columns: { id: true, name: true },
      },
      files: {
        columns: {
          id: true,
          imageId: true,
          sortOrder: true,
          rotationDegrees: true,
        },
        orderBy: [
          asc(schoolDocumentFiles.sortOrder),
          asc(schoolDocumentFiles.createdAt),
        ],
      },
      students: {
        columns: { id: true },
        with: {
          student: {
            columns: { id: true, name: true, color: true },
          },
        },
        orderBy: [asc(schoolDocumentStudents.createdAt)],
      },
    },
    orderBy: [desc(schoolDocuments.createdAt)],
  });

  return docs.map<SchoolDocumentView>((doc) => ({
    id: doc.id,
    type: doc.type,
    title: doc.title,
    notes: doc.notes,
    resourceId: doc.resourceId,
    resourceName: doc.resource?.name ?? null,
    weekStartDate: doc.weekStartDate,
    weekEndDate: doc.weekEndDate,
    schoolYearLabel: doc.schoolYearLabel,
    createdAt: doc.createdAt,
    files: doc.files.map((file) => ({
      id: file.id,
      imageId: file.imageId,
      sortOrder: file.sortOrder,
      rotationDegrees: file.rotationDegrees,
    })),
    students: doc.students.map((membership) => ({
      id: membership.student.id,
      name: membership.student.name,
      color: membership.student.color,
    })),
  }));
}

export async function getSchoolDocumentsForResource(resourceId: string) {
  const db = getDb();
  const { organizationId } = await getTenantContext();

  const docs = await db.query.schoolDocuments.findMany({
    where: and(
      eq(schoolDocuments.organizationId, organizationId),
      eq(schoolDocuments.resourceId, resourceId),
    ),
    with: {
      files: {
        columns: {
          id: true,
          imageId: true,
          sortOrder: true,
          rotationDegrees: true,
        },
        orderBy: [
          asc(schoolDocumentFiles.sortOrder),
          asc(schoolDocumentFiles.createdAt),
        ],
      },
      students: {
        columns: { id: true },
        with: {
          student: {
            columns: { id: true, name: true, color: true },
          },
        },
      },
    },
    orderBy: [desc(schoolDocuments.createdAt)],
  });

  return docs.map<SchoolDocumentView>((doc) => ({
    id: doc.id,
    type: doc.type,
    title: doc.title,
    notes: doc.notes,
    resourceId: doc.resourceId,
    resourceName: null,
    weekStartDate: doc.weekStartDate,
    weekEndDate: doc.weekEndDate,
    schoolYearLabel: doc.schoolYearLabel,
    createdAt: doc.createdAt,
    files: doc.files.map((file) => ({
      id: file.id,
      imageId: file.imageId,
      sortOrder: file.sortOrder,
      rotationDegrees: file.rotationDegrees,
    })),
    students: doc.students.map((membership) => ({
      id: membership.student.id,
      name: membership.student.name,
      color: membership.student.color,
    })),
  }));
}

export async function getResourceOptionsForSchoolDocuments() {
  const db = getDb();
  const { organizationId } = await getTenantContext();
  return db
    .select({
      resourceId: resources.id,
      resourceName: resources.name,
      studentId: students.id,
      studentName: students.name,
      studentColor: students.color,
    })
    .from(resources)
    .innerJoin(subjects, eq(resources.subjectId, subjects.id))
    .innerJoin(students, eq(subjects.studentId, students.id))
    .where(eq(resources.organizationId, organizationId))
    .orderBy(asc(students.name), asc(resources.name));
}
