"use client";

import { useState } from "react";
import { UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <UserX className="mr-1 h-4 w-4" />
        All Absent
      </Button>

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
