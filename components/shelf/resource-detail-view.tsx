"use client";

import { SlidersHorizontal } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { BackButton } from "@/components/back-button";
import { AddLessonForm } from "@/components/shelf/add-lesson-form";
import { BatchCreateForm } from "@/components/shelf/batch-create-form";
import { LessonTable } from "@/components/shelf/lesson-table";
import { ResourceEditForm } from "@/components/shelf/resource-edit-form";
import { StudentColorDot } from "@/components/student-color-dot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Lesson } from "@/db/schema";

export function ResourceDetailView({
  resourceId,
  studentId,
  resourceName,
  coverImageId,
  subjectName,
  studentName,
  studentColor,
  lessons,
  defaultLessonDate,
  schoolDays,
  defaultLessonCount,
  absenceByDate,
  yearDocs,
}: {
  resourceId: string;
  studentId: string;
  resourceName: string;
  coverImageId: string | null;
  subjectName: string;
  studentName: string;
  studentColor: string;
  lessons: Lesson[];
  defaultLessonDate: string;
  schoolDays: number[];
  defaultLessonCount: number;
  absenceByDate: Record<
    string,
    { reasonName: string; reasonColor: string; source: "individual" | "global" }
  >;
  yearDocs: {
    id: string;
    type: "weekly_plan" | "curriculum_outline" | "pacing_calendar";
    title: string;
    notes: string | null;
    schoolYearLabel: string | null;
    files: { id: string; imageId: string; rotationDegrees: number }[];
  }[];
}) {
  const [showPlanningTools, setShowPlanningTools] = useState(false);
  const total = lessons.length;
  const completed = lessons.filter(
    (lesson) => lesson.status === "completed",
  ).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <BackButton />
          {coverImageId ? (
            <Image
              src={`/api/curriculum-images/${coverImageId}`}
              alt={`${resourceName} cover`}
              width={48}
              height={64}
              unoptimized
              className="h-16 w-12 rounded object-cover"
            />
          ) : null}
          <div className="relative min-w-0 flex-1 pr-8">
            <div className="absolute right-0 top-0">
              <ResourceEditForm
                resourceId={resourceId}
                studentId={studentId}
                currentName={resourceName}
              />
            </div>
            <h1 className="break-words text-xl font-bold leading-tight">
              {resourceName}
            </h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <StudentColorDot color={studentColor} className="h-3 w-3" />
              <span>
                {subjectName} &middot; {studentName}
              </span>
            </div>
          </div>
        </div>
        <TooltipProvider>
          <div className="flex items-center gap-1 self-start sm:shrink-0 sm:self-auto">
            <AddLessonForm
              resourceId={resourceId}
              nextLessonNumber={total + 1}
              defaultDate={defaultLessonDate}
            />
            <BatchCreateForm
              resourceId={resourceId}
              existingCount={total}
              defaultSchoolDays={schoolDays}
              defaultLessonCount={defaultLessonCount}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showPlanningTools ? "secondary" : "ghost"}
                  size="sm"
                  aria-label={showPlanningTools ? "Hide tools" : "Show tools"}
                  onClick={() => setShowPlanningTools((current) => !current)}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {showPlanningTools ? "Hide tools" : "Show tools"}
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      <div className="flex items-center gap-3">
        <Progress value={percent} className="h-2 flex-1" />
        <Badge variant="secondary">
          {completed}/{total} done
        </Badge>
      </div>

      {yearDocs.length > 0 && (
        <section className="space-y-2 rounded-md border p-3">
          <h2 className="text-sm font-semibold">Year Docs</h2>
          <div className="space-y-2">
            {yearDocs.map((doc) => (
              <div key={doc.id} className="rounded-md border p-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{doc.title}</p>
                  {doc.type === "curriculum_outline" && (
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] text-violet-700">
                      Outline
                    </span>
                  )}
                  {doc.type === "pacing_calendar" && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-700">
                      Pacing
                    </span>
                  )}
                  {doc.schoolYearLabel && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      {doc.schoolYearLabel}
                    </span>
                  )}
                </div>
                {doc.notes && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {doc.notes}
                  </p>
                )}
                {doc.files.length > 0 && (
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {doc.files.slice(0, 4).map((file) => (
                      <a
                        key={file.id}
                        href={`/api/curriculum-images/${file.imageId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="block"
                      >
                        <Image
                          src={`/api/curriculum-images/${file.imageId}`}
                          alt="Year doc page"
                          width={200}
                          height={160}
                          unoptimized
                          className="h-16 w-full rounded border object-cover"
                          style={{
                            transform: `rotate(${file.rotationDegrees}deg)`,
                          }}
                        />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
      <LessonTable
        lessons={lessons}
        showPlanningTools={showPlanningTools}
        resourceId={resourceId}
        schoolDays={schoolDays}
        absenceByDate={absenceByDate}
      />
    </div>
  );
}
