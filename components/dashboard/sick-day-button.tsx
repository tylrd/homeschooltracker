"use client";

import { useState } from "react";
import { UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AbsenceDialog } from "@/components/dashboard/absence-dialog";

type AbsenceReason = {
  id: string;
  name: string;
  color: string;
};

export function SickDayButton({
  date,
  reasons,
}: {
  date: string;
  reasons: AbsenceReason[];
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
              className="h-8 w-8"
              onClick={() => setOpen(true)}
            >
              <UserX className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>All Absent</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <AbsenceDialog
        open={open}
        onOpenChange={setOpen}
        studentId={null}
        studentName={null}
        date={date}
        reasons={reasons}
      />
    </>
  );
}
