"use client";

import { useTransition } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { setShowDailyLogNotes } from "@/lib/actions/settings";

export function DailyLogNotesToggle({
  defaultValue,
}: {
  defaultValue: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2">
      <Label htmlFor="show-daily-log-notes" className="text-sm font-medium">
        Show notes in daily log
      </Label>
      <Switch
        id="show-daily-log-notes"
        defaultChecked={defaultValue}
        disabled={isPending}
        onCheckedChange={(checked) => {
          startTransition(async () => {
            await setShowDailyLogNotes(checked);
          });
        }}
      />
    </div>
  );
}
