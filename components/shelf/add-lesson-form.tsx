"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  const [plan, setPlan] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleOpen(isOpen: boolean) {
    if (isOpen) {
      setLessonNumber(nextLessonNumber);
      setTitle(`Lesson ${nextLessonNumber}`);
      setScheduledDate(defaultDate);
      setPlan("");
    }
    setOpen(isOpen);
  }

  function handleSubmit() {
    startTransition(async () => {
      await createLesson(resourceId, lessonNumber, title, scheduledDate, plan);
      router.refresh();
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Add Lesson"
                className="text-muted-foreground"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>Add Lesson</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Lesson</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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

          <div className="space-y-2">
            <Label>Plan</Label>
            <Textarea
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              placeholder="What should be covered in this lesson?"
              rows={4}
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
      </DialogContent>
    </Dialog>
  );
}
