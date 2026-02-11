"use client";

import { UserX } from "lucide-react";
import { useState, useTransition } from "react";
import { AbsenceDialog } from "@/components/dashboard/absence-dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getAbsenceColorClasses } from "@/lib/absence-colors";
import { removeGlobalAbsence } from "@/lib/actions/absences";
import { cn } from "@/lib/utils";

type AbsenceReason = {
  id: string;
  name: string;
  color: string;
};

export function SickDayButton({
  date,
  reasons,
  existingGlobalAbsence,
}: {
  date: string;
  reasons: AbsenceReason[];
  existingGlobalAbsence?: {
    absenceId: string;
    reasonName: string;
    reasonColor: string;
  } | null;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <div className="flex items-center gap-2">
        {existingGlobalAbsence && (
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs",
              getAbsenceColorClasses(existingGlobalAbsence.reasonColor).bg,
              getAbsenceColorClasses(existingGlobalAbsence.reasonColor).text,
            )}
          >
            {existingGlobalAbsence.reasonName}
            <button
              type="button"
              className="font-semibold hover:opacity-80 disabled:opacity-50"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await removeGlobalAbsence(existingGlobalAbsence.absenceId);
                })
              }
            >
              Clear
            </button>
          </span>
        )}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setOpen(true)}
              >
                <UserX className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>All Absent</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <AbsenceDialog
        open={open}
        onOpenChange={setOpen}
        studentId={null}
        studentName={null}
        date={date}
        reasons={reasons}
        existingAbsence={
          existingGlobalAbsence
            ? {
                ...existingGlobalAbsence,
                source: "global",
                canRemove: true,
              }
            : null
        }
      />
    </>
  );
}
