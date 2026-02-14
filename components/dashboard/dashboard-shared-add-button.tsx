"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { AddSharedLessonDialog } from "@/components/dashboard/add-shared-lesson-dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type SharedCurriculumOption = {
  sharedCurriculumId: string;
  sharedCurriculumName: string;
  students: { id: string; name: string; color: string }[];
  isScheduledToday: boolean;
  existingLessonId: string | null;
};

export function DashboardSharedAddButton({
  date,
  options,
}: {
  date: string;
  options: SharedCurriculumOption[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground"
              onClick={() => setOpen(true)}
              aria-label="Add Lesson"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add Lesson</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <AddSharedLessonDialog
        open={open}
        onOpenChange={setOpen}
        date={date}
        options={options}
      />
    </>
  );
}
