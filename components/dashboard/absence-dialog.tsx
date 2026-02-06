"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAbsenceColorClasses } from "@/lib/absence-colors";
import { cn } from "@/lib/utils";
import {
  logAbsence,
  logAbsenceForAll,
  removeAbsence,
} from "@/lib/actions/absences";

type AbsenceReason = {
  id: string;
  name: string;
  color: string;
};

type ExistingAbsence = {
  absenceId: string;
  reasonName: string;
  reasonColor: string;
};

export function AbsenceDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
  date,
  reasons,
  existingAbsence,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string | null; // null = all students
  studentName: string | null;
  date: string;
  reasons: AbsenceReason[];
  existingAbsence?: ExistingAbsence | null;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSelectReason(reasonId: string) {
    startTransition(async () => {
      if (studentId) {
        await logAbsence(studentId, date, reasonId);
      } else {
        await logAbsenceForAll(date, reasonId);
      }
      onOpenChange(false);
    });
  }

  function handleRemoveAbsence() {
    if (!existingAbsence) return;
    startTransition(async () => {
      await removeAbsence(existingAbsence.absenceId);
      onOpenChange(false);
    });
  }

  const title = studentId
    ? `Mark ${studentName} Absent`
    : "Mark All Students Absent";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {existingAbsence && (
          <div className="rounded-md border p-3">
            <p className="text-sm text-muted-foreground mb-2">
              Already marked absent:
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-3 w-3 rounded-full",
                    getAbsenceColorClasses(existingAbsence.reasonColor).dot,
                  )}
                />
                <span className="text-sm font-medium">
                  {existingAbsence.reasonName}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveAbsence}
                disabled={isPending}
                className="text-destructive hover:text-destructive"
              >
                <X className="mr-1 h-3 w-3" />
                Remove
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {existingAbsence ? "Change reason:" : "Select a reason:"}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {reasons.map((reason) => {
              const colorClasses = getAbsenceColorClasses(reason.color);
              return (
                <Button
                  key={reason.id}
                  variant="outline"
                  onClick={() => handleSelectReason(reason.id)}
                  disabled={isPending}
                  className={cn(
                    "justify-start gap-2",
                    colorClasses.text,
                    colorClasses.border,
                  )}
                >
                  <div
                    className={cn("h-3 w-3 rounded-full", colorClasses.dot)}
                  />
                  {reason.name}
                </Button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
