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
