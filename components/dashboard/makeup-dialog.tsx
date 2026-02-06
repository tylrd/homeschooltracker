"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { scheduleMakeupLesson } from "@/lib/actions/lessons";

type Resource = {
  resourceId: string;
  resourceName: string;
  subjectName: string;
};

export function MakeupDialog({
  open,
  onOpenChange,
  studentName,
  date,
  resources,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  date: string;
  resources: Resource[];
}) {
  const [isPending, startTransition] = useTransition();

  function handleSelect(resourceId: string) {
    startTransition(async () => {
      await scheduleMakeupLesson(resourceId, date);
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Makeup Lesson for {studentName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Select a resource to add a lesson for today:
          </p>
          <div className="grid grid-cols-1 gap-2">
            {resources.map((r) => (
              <Button
                key={r.resourceId}
                variant="outline"
                onClick={() => handleSelect(r.resourceId)}
                disabled={isPending}
                className="justify-start"
              >
                <div className="text-left">
                  <p className="text-sm font-medium">{r.resourceName}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.subjectName}
                  </p>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
