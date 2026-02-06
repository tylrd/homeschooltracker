"use client";

import { useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { setShowCompletedLessons } from "@/lib/actions/settings";

export function ShowCompletedToggle({
  defaultValue,
}: {
  defaultValue: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2">
      <Label htmlFor="show-completed" className="text-sm font-medium">
        Show completed lessons
      </Label>
      <Switch
        id="show-completed"
        defaultChecked={defaultValue}
        disabled={isPending}
        onCheckedChange={(checked) => {
          startTransition(async () => {
            await setShowCompletedLessons(checked);
          });
        }}
      />
    </div>
  );
}
