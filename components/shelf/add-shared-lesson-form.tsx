"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
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
import {
  createSharedLesson,
  uploadSharedLessonWorkSamples,
} from "@/lib/actions/shared-lessons";
import { validateImageFile } from "@/lib/images/validation";

export function AddSharedLessonForm({
  sharedCurriculumId,
  nextLessonNumber,
  defaultDate,
}: {
  sharedCurriculumId: string;
  nextLessonNumber: number;
  defaultDate: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [lessonNumber, setLessonNumber] = useState(nextLessonNumber);
  const [title, setTitle] = useState(`Lesson ${nextLessonNumber}`);
  const [scheduledDate, setScheduledDate] = useState(defaultDate);
  const [plan, setPlan] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isPending, startTransition] = useTransition();
  const libraryInputRef = useRef<HTMLInputElement | null>(null);

  function handleOpen(isOpen: boolean) {
    if (isOpen) {
      setLessonNumber(nextLessonNumber);
      setTitle(`Lesson ${nextLessonNumber}`);
      setScheduledDate(defaultDate);
      setPlan("");
      setFiles([]);
    }
    setOpen(isOpen);
  }

  function handleSubmit() {
    for (const file of files) {
      const validation = validateImageFile(file);
      if (!validation.ok) {
        alert(validation.message);
        return;
      }
    }

    startTransition(async () => {
      const lessonId = await createSharedLesson(
        sharedCurriculumId,
        lessonNumber,
        title,
        scheduledDate,
        plan,
      );

      if (lessonId && files.length > 0) {
        const formData = new FormData();
        for (const file of files) {
          formData.append("files", file);
        }
        await uploadSharedLessonWorkSamples(lessonId, formData);
      }
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
          <DialogTitle>Add Shared Lesson</DialogTitle>
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

          <div className="space-y-2">
            <Label>Plan Images</Label>
            <input
              ref={libraryInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              multiple
              className="sr-only"
              onChange={(e) => {
                const nextFiles = Array.from(e.target.files ?? []).filter(
                  (file) => file.size > 0,
                );
                setFiles(nextFiles);
                e.currentTarget.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => libraryInputRef.current?.click()}
              disabled={isPending}
            >
              Select Images
            </Button>
            <p className="text-xs text-muted-foreground">
              {files.length > 0
                ? `${files.length} image${files.length === 1 ? "" : "s"} selected`
                : "Optional: attach plan photos to this lesson"}
            </p>
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
