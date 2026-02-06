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
import { setDashboardGrouping } from "@/lib/actions/settings";

export function DashboardGroupingSelect({
  defaultValue,
}: {
  defaultValue: "student" | "subject";
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2">
      <Label className="text-sm font-medium">Group lessons by</Label>
      <Select
        defaultValue={defaultValue}
        disabled={isPending}
        onValueChange={(value: "student" | "subject") => {
          startTransition(async () => {
            await setDashboardGrouping(value);
          });
        }}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="student">Student</SelectItem>
          <SelectItem value="subject">Subject</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
