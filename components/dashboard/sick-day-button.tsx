"use client";

import { useTransition } from "react";
import { ThermometerSun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bumpAllToday } from "@/lib/actions/lessons";

export function SickDayButton({ date }: { date: string }) {
  const [isPending, startTransition] = useTransition();

  function handleSickDay() {
    if (!confirm("Bump ALL of today's lessons to the next school day?")) return;
    startTransition(async () => {
      await bumpAllToday(date);
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSickDay}
      disabled={isPending}
    >
      <ThermometerSun className="mr-1 h-4 w-4" />
      Sick Day
    </Button>
  );
}
