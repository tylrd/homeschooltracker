"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function MonthNav({ year, month }: { year: number; month: number }) {
  const router = useRouter();

  function navigate(newYear: number, newMonth: number) {
    if (newMonth < 1) {
      newYear--;
      newMonth = 12;
    } else if (newMonth > 12) {
      newYear++;
      newMonth = 1;
    }
    router.push(`/attendance?year=${newYear}&month=${newMonth}`);
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => navigate(year, month - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-[140px] text-center font-medium">
        {MONTH_NAMES[month - 1]} {year}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => navigate(year, month + 1)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
