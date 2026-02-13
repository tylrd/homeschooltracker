"use client";

import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { BackButton } from "@/components/back-button";
import { AddLessonForm } from "@/components/shelf/add-lesson-form";
import { BatchCreateForm } from "@/components/shelf/batch-create-form";
import { LessonTable } from "@/components/shelf/lesson-table";
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
  resourceName,
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
  resourceName: string;
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
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <BackButton />
          <StudentColorDot color={studentColor} className="h-4 w-4" />
          <div className="flex-1">
            <h1 className="text-xl font-bold">{resourceName}</h1>
            <p className="text-sm text-muted-foreground">
              {subjectName} &middot; {studentName}
            </p>
          </div>
        </div>
        <TooltipProvider>
          <div className="flex shrink-0 items-center gap-1">
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
                  Tools
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
