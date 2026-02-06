"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setDefaultLessonCount } from "@/lib/actions/settings";

export function DefaultLessonCountInput({
  defaultValue,
}: {
  defaultValue: number;
}) {
  const [value, setValue] = useState(String(defaultValue));
  const [isPending, startTransition] = useTransition();

  function handleBlur() {
    const num = parseInt(value, 10);
    if (Number.isNaN(num) || num < 1) {
      setValue(String(defaultValue));
      return;
    }
    if (num === defaultValue) return;
    startTransition(async () => {
      await setDefaultLessonCount(num);
    });
  }

  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2">
      <Label htmlFor="default-lesson-count" className="text-sm font-medium">
        Default lesson count
      </Label>
      <Input
        id="default-lesson-count"
        type="number"
        min={1}
        className="w-20 text-right"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        disabled={isPending}
      />
    </div>
  );
}
