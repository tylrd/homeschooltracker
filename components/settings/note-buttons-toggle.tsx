"use client";

import { useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { setShowNoteButtons } from "@/lib/actions/settings";

export function NoteButtonsToggle({
  defaultValue,
}: {
  defaultValue: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2">
      <Label htmlFor="show-note-buttons" className="text-sm font-medium">
        Show note buttons
      </Label>
      <Switch
        id="show-note-buttons"
        defaultChecked={defaultValue}
        disabled={isPending}
        onCheckedChange={(checked) => {
          startTransition(async () => {
            await setShowNoteButtons(checked);
          });
        }}
      />
    </div>
  );
}
