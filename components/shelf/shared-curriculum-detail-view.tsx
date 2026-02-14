"use client";

import { SlidersHorizontal, UserPlus } from "lucide-react";
import Image from "next/image";
import { useState, useTransition } from "react";
import { BackButton } from "@/components/back-button";
import { AddSharedLessonForm } from "@/components/shelf/add-shared-lesson-form";
import { BatchCreateSharedForm } from "@/components/shelf/batch-create-shared-form";
import { SharedCurriculumEditForm } from "@/components/shelf/shared-curriculum-edit-form";
import { SharedLessonTable } from "@/components/shelf/shared-lesson-table";
import { StudentColorDot } from "@/components/student-color-dot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SharedLesson } from "@/db/schema";
import {
  addStudentToSharedCurriculum,
  removeStudentFromSharedCurriculum,
} from "@/lib/actions/shared-curricula";

export function SharedCurriculumDetailView({
  sharedCurriculumId,
  name,
  description,
  coverImageId,
  lessons,
  members,
  availableStudents,
  defaultLessonDate,
  schoolDays,
  defaultLessonCount,
}: {
  sharedCurriculumId: string;
  name: string;
  description: string | null;
  coverImageId: string | null;
  lessons: SharedLesson[];
  members: { id: string; name: string; color: string }[];
  availableStudents: { id: string; name: string; color: string }[];
  defaultLessonDate: string;
  schoolDays: number[];
  defaultLessonCount: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [showPlanningTools, setShowPlanningTools] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
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
              alt={`${name} cover`}
              width={48}
              height={64}
              className="h-16 w-12 rounded object-cover"
            />
          ) : null}
          <div className="relative min-w-0 flex-1 pr-8">
            <div className="absolute right-0 top-0">
              <SharedCurriculumEditForm
                sharedCurriculumId={sharedCurriculumId}
                currentName={name}
                currentDescription={description}
              />
            </div>
            <h1 className="break-words text-xl font-bold leading-tight">
              {name}
            </h1>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>
        <TooltipProvider>
          <div className="flex items-center gap-1 self-start sm:shrink-0 sm:self-auto">
            <AddSharedLessonForm
              sharedCurriculumId={sharedCurriculumId}
              nextLessonNumber={total + 1}
              defaultDate={defaultLessonDate}
            />
            <BatchCreateSharedForm
              sharedCurriculumId={sharedCurriculumId}
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

      <div className="space-y-2 rounded-md border p-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Students</h2>
          <Badge variant="secondary">
            {members.length} {members.length === 1 ? "student" : "students"}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {members.map((member) => (
            <span
              key={member.id}
              className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs"
            >
              <StudentColorDot color={member.color} className="h-2.5 w-2.5" />
              {member.name}
              <button
                type="button"
                className="ml-1 text-muted-foreground hover:text-destructive"
                onClick={() =>
                  startTransition(async () => {
                    await removeStudentFromSharedCurriculum(
                      sharedCurriculumId,
                      member.id,
                    );
                  })
                }
                disabled={isPending}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        {availableStudents.length > 0 && (
          <div className="flex items-center gap-2 pt-2">
            <Select
              value={selectedStudentId}
              onValueChange={setSelectedStudentId}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Add student..." />
              </SelectTrigger>
              <SelectContent>
                {availableStudents.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              disabled={isPending || !selectedStudentId}
              onClick={() =>
                startTransition(async () => {
                  await addStudentToSharedCurriculum(
                    sharedCurriculumId,
                    selectedStudentId,
                  );
                  setSelectedStudentId("");
                })
              }
            >
              <UserPlus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Progress value={percent} className="h-2 flex-1" />
        <Badge variant="secondary">
          {completed}/{total} done
        </Badge>
      </div>

      <SharedLessonTable
        lessons={lessons}
        showPlanningTools={showPlanningTools}
        sharedCurriculumId={sharedCurriculumId}
        schoolDays={schoolDays}
      />
    </div>
  );
}
