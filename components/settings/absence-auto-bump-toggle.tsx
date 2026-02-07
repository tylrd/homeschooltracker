"use client";

import { useTransition } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { setAbsenceAutoBump } from "@/lib/actions/settings";

export function AbsenceAutoBumpToggle({
  defaultValue,
}: {
  defaultValue: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2">
      <Label htmlFor="absence-auto-bump" className="text-sm font-medium">
        Auto-bump lessons on absence
      </Label>
      <Switch
        id="absence-auto-bump"
        defaultChecked={defaultValue}
        disabled={isPending}
        onCheckedChange={(checked) => {
          startTransition(async () => {
            await setAbsenceAutoBump(checked);
          });
        }}
      />
    </div>
  );
}
