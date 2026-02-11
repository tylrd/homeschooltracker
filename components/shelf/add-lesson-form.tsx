"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createLesson } from "@/lib/actions/lessons";

export function AddLessonForm({
  resourceId,
  nextLessonNumber,
  defaultDate,
}: {
  resourceId: string;
  nextLessonNumber: number;
  defaultDate: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [lessonNumber, setLessonNumber] = useState(nextLessonNumber);
  const [title, setTitle] = useState(`Lesson ${nextLessonNumber}`);
  const [scheduledDate, setScheduledDate] = useState(defaultDate);
  const [isPending, startTransition] = useTransition();

  function handleOpen(isOpen: boolean) {
    if (isOpen) {
      setLessonNumber(nextLessonNumber);
      setTitle(`Lesson ${nextLessonNumber}`);
      setScheduledDate(defaultDate);
    }
    setOpen(isOpen);
  }

  function handleSubmit() {
    startTransition(async () => {
      await createLesson(resourceId, lessonNumber, title, scheduledDate);
      router.refresh();
      setOpen(false);
    });
  }

  return (
    <Drawer open={open} onOpenChange={handleOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline">
          <Plus className="mr-1 h-4 w-4" />
          Add Lesson
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Add Lesson</DrawerTitle>
        </DrawerHeader>
        <div className="space-y-4 px-4 pb-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Lesson #</Label>
              <Input
                type="number"
                min={1}
                value={lessonNumber}
                onChange={(e) => setLessonNumber(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Scheduled Date</Label>
              <DatePicker value={scheduledDate} onChange={setScheduledDate} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Lesson title"
            />
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={isPending || lessonNumber < 1}
          >
            {isPending ? "Adding..." : "Add Lesson"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
