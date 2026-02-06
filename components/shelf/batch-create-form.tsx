"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { batchCreateLessons } from "@/lib/actions/lessons";
import { generateLessonDates, toDateString } from "@/lib/dates";

const WEEKDAYS = [
  { value: "1", label: "Mon" },
  { value: "2", label: "Tue" },
  { value: "3", label: "Wed" },
  { value: "4", label: "Thu" },
  { value: "5", label: "Fri" },
];

export function BatchCreateForm({
  resourceId,
  existingCount,
}: {
  resourceId: string;
  existingCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [startLesson, setStartLesson] = useState(existingCount + 1);
  const [endLesson, setEndLesson] = useState(existingCount + 20);
  const [startDate, setStartDate] = useState(toDateString(new Date()));
  const [selectedDays, setSelectedDays] = useState(["1", "2", "3", "4", "5"]);

  const count = Math.max(0, endLesson - startLesson + 1);
  const schoolDays = selectedDays.map(Number);

  // Preview end date
  let endDateStr = "";
  if (count > 0 && schoolDays.length > 0) {
    const dates = generateLessonDates(
      new Date(startDate + "T00:00:00"),
      count,
      schoolDays,
    );
    if (dates.length > 0) {
      endDateStr = toDateString(dates[dates.length - 1]);
    }
  }

  async function handleSubmit() {
    if (count <= 0 || schoolDays.length === 0) return;
    await batchCreateLessons(
      resourceId,
      startLesson,
      endLesson,
      startDate,
      schoolDays,
    );
    setOpen(false);
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button>
          <Plus className="mr-1 h-4 w-4" />
          Generate Lessons
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Generate Lessons</DrawerTitle>
        </DrawerHeader>
        <div className="space-y-4 px-4 pb-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Lesson #</Label>
              <Input
                type="number"
                min={1}
                value={startLesson}
                onChange={(e) => setStartLesson(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>End Lesson #</Label>
              <Input
                type="number"
                min={startLesson}
                value={endLesson}
                onChange={(e) => setEndLesson(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Start Date</Label>
            <DatePicker value={startDate} onChange={setStartDate} />
          </div>

          <div className="space-y-2">
            <Label>School Days</Label>
            <ToggleGroup
              type="multiple"
              value={selectedDays}
              onValueChange={(value) => {
                if (value.length > 0) setSelectedDays(value);
              }}
              className="justify-start"
            >
              {WEEKDAYS.map((day) => (
                <ToggleGroupItem key={day.value} value={day.value} size="sm">
                  {day.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {count > 0 && endDateStr && (
            <p className="text-sm text-muted-foreground">
              {count} lessons, {startDate} &rarr; {endDateStr}
            </p>
          )}

          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={count <= 0 || schoolDays.length === 0}
          >
            Generate {count} Lessons
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
