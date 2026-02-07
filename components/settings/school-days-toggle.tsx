"use client";

import { useTransition } from "react";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { setSchoolDays } from "@/lib/actions/settings";

const ALL_DAYS = [
  { value: "0", label: "Sun" },
  { value: "1", label: "Mon" },
  { value: "2", label: "Tue" },
  { value: "3", label: "Wed" },
  { value: "4", label: "Thu" },
  { value: "5", label: "Fri" },
  { value: "6", label: "Sat" },
];

export function SchoolDaysToggle({ defaultValue }: { defaultValue: number[] }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-2 rounded-md border px-3 py-2">
      <Label className="text-sm font-medium">School days</Label>
      <ToggleGroup
        type="multiple"
        defaultValue={defaultValue.map(String)}
        onValueChange={(value) => {
          if (value.length === 0) return;
          startTransition(async () => {
            await setSchoolDays(value.map(Number));
          });
        }}
        className="justify-start"
        disabled={isPending}
      >
        {ALL_DAYS.map((day) => (
          <ToggleGroupItem key={day.value} value={day.value} size="sm">
            {day.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
