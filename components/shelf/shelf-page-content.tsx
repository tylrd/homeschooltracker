"use client";

import { BookOpen, LayoutGrid, List, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { ResourceCard } from "@/components/shelf/resource-card";
import { SharedCurriculumCard } from "@/components/shelf/shared-curriculum-card";
import { ShelfAddCurriculumDialog } from "@/components/shelf/shelf-add-curriculum-dialog";
import { StudentColorDot } from "@/components/student-color-dot";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type ResourceRow = {
  resourceId: string;
  resourceName: string;
  coverImageId: string | null;
  subjectName: string;
  studentId: string;
  studentName: string;
  studentColor: string;
  totalLessons: number;
  completedLessons: number;
};

type SharedCurriculumRow = {
  sharedCurriculumId: string;
  sharedCurriculumName: string;
  sharedCurriculumDescription: string | null;
  coverImageId: string | null;
  memberCount: number;
  totalLessons: number;
  completedLessons: number;
};

type StudentsForAdd = {
  id: string;
  name: string;
  color: string;
  subjects: { id: string; name: string }[];
}[];

type ViewMode = "cards" | "table";

export function ShelfPageContent({
  resources,
  sharedCurricula,
  students,
}: {
  resources: ResourceRow[];
  sharedCurricula: SharedCurriculumRow[];
  students: StudentsForAdd;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>("cards");

  const byStudent = useMemo(() => {
    const map = new Map<
      string,
      { name: string; color: string; resources: ResourceRow[] }
    >();

    for (const resource of resources) {
      const existing = map.get(resource.studentId);
      if (existing) {
        existing.resources.push(resource);
      } else {
        map.set(resource.studentId, {
          name: resource.studentName,
          color: resource.studentColor,
          resources: [resource],
        });
      }
    }

    return map;
  }, [resources]);

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Curriculum Shelf</h1>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border p-0.5">
            <Button
              type="button"
              size="sm"
              variant={viewMode === "cards" ? "secondary" : "ghost"}
              className={cn(
                "h-8 px-2",
                viewMode !== "cards" && "text-muted-foreground",
              )}
              onClick={() => setViewMode("cards")}
              aria-pressed={viewMode === "cards"}
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Cards</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewMode === "table" ? "secondary" : "ghost"}
              className={cn(
                "h-8 px-2",
                viewMode !== "table" && "text-muted-foreground",
              )}
              onClick={() => setViewMode("table")}
              aria-pressed={viewMode === "table"}
            >
              <List className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">Table</span>
            </Button>
          </div>
          <ShelfAddCurriculumDialog students={students} />
        </div>
      </div>

      {sharedCurricula.length > 0 && (
        <section className="mb-8 space-y-3">
          <h2 className="font-semibold">Shared Curriculum</h2>
          {viewMode === "cards" ? (
            <div className="flex flex-col gap-3">
              {sharedCurricula.map((curriculum) => (
                <SharedCurriculumCard
                  key={curriculum.sharedCurriculumId}
                  curriculum={curriculum}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead className="text-right">Progress</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sharedCurricula.map((curriculum) => (
                    <TableRow key={curriculum.sharedCurriculumId}>
                      <TableCell>
                        <Link
                          href={`/shared-curriculum/${curriculum.sharedCurriculumId}`}
                          className="font-medium hover:underline"
                        >
                          {curriculum.sharedCurriculumName}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {curriculum.memberCount}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {curriculum.completedLessons}/{curriculum.totalLessons}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      )}

      {viewMode === "cards" ? (
        Array.from(byStudent.entries()).map(([studentId, group]) => (
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
        ))
      ) : (
        <section className="space-y-3">
          <h2 className="font-semibold">Resources</h2>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead className="text-right">Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources.map((resource) => (
                  <TableRow key={resource.resourceId}>
                    <TableCell>
                      <span className="inline-flex items-center gap-2">
                        <StudentColorDot
                          color={resource.studentColor}
                          className="h-2.5 w-2.5"
                        />
                        {resource.studentName}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {resource.subjectName}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/shelf/${resource.resourceId}`}
                        className="font-medium hover:underline"
                      >
                        {resource.resourceName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {resource.completedLessons}/{resource.totalLessons}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}
    </div>
  );
}
