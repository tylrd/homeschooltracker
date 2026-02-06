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
import { setBumpBehavior } from "@/lib/actions/settings";

export function BumpBehaviorSelect({
  defaultValue,
}: {
  defaultValue: "next_school_day" | "same_day_next_week";
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2">
      <Label className="text-sm font-medium">Bump destination</Label>
      <Select
        defaultValue={defaultValue}
        disabled={isPending}
        onValueChange={(value: "next_school_day" | "same_day_next_week") => {
          startTransition(async () => {
            await setBumpBehavior(value);
          });
        }}
      >
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="next_school_day">Next school day</SelectItem>
          <SelectItem value="same_day_next_week">Same day next week</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
