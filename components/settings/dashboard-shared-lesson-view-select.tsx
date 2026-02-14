"use client";

import { useTransition } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setDashboardSharedLessonView } from "@/lib/actions/settings";

export function DashboardSharedLessonViewSelect({
  defaultValue,
}: {
  defaultValue: "group" | "student";
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2">
      <Label className="text-sm font-medium">Shared lessons view</Label>
      <Select
        defaultValue={defaultValue}
        disabled={isPending}
        onValueChange={(value: "group" | "student") => {
          startTransition(async () => {
            await setDashboardSharedLessonView(value);
          });
        }}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="group">Group cards</SelectItem>
          <SelectItem value="student">Student cards</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
