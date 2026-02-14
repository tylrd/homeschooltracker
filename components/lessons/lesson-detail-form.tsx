"use client";

import {
  Camera,
  Images,
  RotateCcw,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  completeLesson,
  deleteLesson,
  deleteLessonWorkSample,
  uncompleteLesson,
  updateLessonContent,
  updateLessonScheduledDate,
  uploadLessonWorkSamples,
} from "@/lib/actions/lessons";
import {
  completeSharedLesson,
  deleteSharedLesson,
  deleteSharedLessonWorkSample,
  uncompleteSharedLesson,
  updateSharedLessonContent,
  updateSharedLessonScheduledDate,
  uploadSharedLessonWorkSamples,
} from "@/lib/actions/shared-lessons";
import { validateImageFile } from "@/lib/images/validation";

type LessonDetailFormProps = {
  lessonId: string;
  title: string | null;
  status: string;
  plan: string | null;
  notes: string | null;
  scheduledDate: string | null;
  lessonKind?: "personal" | "shared";
  workSamples: { id: string; imageId: string }[];
};

export function LessonDetailForm({
  lessonId,
  title,
  status,
  plan,
  notes,
  scheduledDate,
  lessonKind = "personal",
  workSamples,
}: LessonDetailFormProps) {
  const [planText, setPlanText] = useState(plan ?? "");
  const [notesText, setNotesText] = useState(notes ?? "");
  const [titleText, setTitleText] = useState(title ?? "");
  const [pendingFiles, setPendingFiles] = useState<File[] | null>(null);
  const [failedFiles, setFailedFiles] = useState<File[] | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isUploadPending, startUploadTransition] = useTransition();
  const [isDeletingSample, startDeleteSampleTransition] = useTransition();
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const libraryInputRef = useRef<HTMLInputElement | null>(null);
  const [activeSample, setActiveSample] = useState<{
    id: string;
    imageId: string;
  } | null>(null);
  const [zoom, setZoom] = useState(1);

  const isCompleted = status === "completed";
  const savedPlan = plan ?? "";
  const savedNotes = notes ?? "";
  const savedTitle = title ?? "";
  const hasChanges =
    titleText !== savedTitle ||
    planText !== savedPlan ||
    notesText !== savedNotes;

  function handleToggle() {
    startTransition(async () => {
      if (lessonKind === "shared") {
        if (isCompleted) {
          await uncompleteSharedLesson(lessonId);
        } else {
          await completeSharedLesson(lessonId);
        }
        return;
      }

      if (isCompleted) {
        await uncompleteLesson(lessonId);
      } else {
        await completeLesson(lessonId);
      }
    });
  }

  function handleDateChange(newDate: string) {
    startTransition(async () => {
      if (lessonKind === "shared") {
        await updateSharedLessonScheduledDate(lessonId, newDate);
      } else {
        await updateLessonScheduledDate(lessonId, newDate);
      }
      toast.success("Date updated");
    });
  }

  function handleSave() {
    startTransition(async () => {
      if (lessonKind === "shared") {
        await updateSharedLessonContent(
          lessonId,
          titleText,
          planText,
          notesText,
        );
      } else {
        await updateLessonContent(lessonId, titleText, planText, notesText);
      }
      toast.success("Lesson saved");
    });
  }

  function handleDelete() {
    if (!confirm("Delete this lesson? This cannot be undone.")) return;
    startTransition(async () => {
      try {
        if (lessonKind === "shared") {
          await deleteSharedLesson(lessonId);
          window.location.href = "/";
        } else {
          await deleteLesson(lessonId, { redirectTo: "/" });
        }
      } catch {
        toast.error("Failed to delete lesson");
      }
    });
  }

  function handleFilesSelected(fileList: FileList | null) {
    const files = Array.from(fileList ?? []).filter((file) => file.size > 0);
    if (files.length === 0) {
      return;
    }
    uploadFiles(files);
  }

  function uploadFiles(files: File[]) {
    for (const file of files) {
      const validation = validateImageFile(file);
      if (!validation.ok) {
        setFailedFiles(files);
        toast.error(validation.message);
        return;
      }
    }

    const loadingToastId = toast.loading(
      files.length === 1 ? "Uploading photo..." : "Uploading photos...",
    );
    setPendingFiles(files);
    setFailedFiles(null);
    startUploadTransition(async () => {
      try {
        const formData = new FormData();
        for (const file of files) {
          formData.append("files", file);
        }

        if (lessonKind === "shared") {
          await uploadSharedLessonWorkSamples(lessonId, formData);
        } else {
          await uploadLessonWorkSamples(lessonId, formData);
        }

        setPendingFiles(null);
        setFailedFiles(null);
        toast.dismiss(loadingToastId);
        toast.success("Work samples uploaded");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Upload failed";
        setPendingFiles(null);
        setFailedFiles(files);
        toast.dismiss(loadingToastId);
        toast.error(message);
      }
    });
  }

  function handleDeleteWorkSample(workSampleId: string) {
    startDeleteSampleTransition(async () => {
      try {
        if (lessonKind === "shared") {
          await deleteSharedLessonWorkSample(lessonId, workSampleId);
        } else {
          await deleteLessonWorkSample(lessonId, workSampleId);
        }
        toast.success("Work sample deleted");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to delete sample";
        toast.error(message);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Checkbox
          id="completed"
          checked={isCompleted}
          onCheckedChange={handleToggle}
          className="h-6 w-6 rounded-md"
          disabled={isPending}
        />
        <Label htmlFor="completed" className="text-sm font-medium">
          Mark as completed
        </Label>
      </div>

      <div className="space-y-2">
        <Label>Scheduled Date</Label>
        <DatePicker
          value={scheduledDate ?? ""}
          onChange={handleDateChange}
          placeholder="No date scheduled"
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Lesson Name</Label>
        <Input
          id="title"
          placeholder="Lesson name"
          value={titleText}
          onChange={(e) => setTitleText(e.target.value)}
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="plan">Plan</Label>
        <Textarea
          id="plan"
          rows={6}
          placeholder="What to cover in this lesson..."
          value={planText}
          onChange={(e) => setPlanText(e.target.value)}
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          rows={6}
          placeholder="How did the lesson go?"
          value={notesText}
          onChange={(e) => setNotesText(e.target.value)}
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label>Work Samples</Label>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => {
            handleFilesSelected(e.target.files);
            e.currentTarget.value = "";
          }}
        />
        <input
          ref={libraryInputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => {
            handleFilesSelected(e.target.files);
            e.currentTarget.value = "";
          }}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isUploadPending}
          >
            <Camera className="mr-1 h-4 w-4" />
            Take Photo
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => libraryInputRef.current?.click()}
            disabled={isUploadPending}
          >
            <Images className="mr-1 h-4 w-4" />
            Add from Library
          </Button>
          {failedFiles && failedFiles.length > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => uploadFiles(failedFiles)}
              disabled={isUploadPending}
            >
              <RotateCcw className="mr-1 h-4 w-4" />
              Retry ({failedFiles.length})
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {workSamples.length} attached
          {(pendingFiles?.length ?? 0) > 0
            ? ` · ${pendingFiles?.length} uploading`
            : ""}
        </p>
        {workSamples.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {workSamples.map((sample) => (
              <div key={sample.id} className="relative">
                <button
                  type="button"
                  aria-label="View work sample"
                  className="block w-full"
                  onClick={() => {
                    setActiveSample(sample);
                    setZoom(1);
                  }}
                >
                  <Image
                    src={`/api/curriculum-images/${sample.imageId}`}
                    alt="Work sample"
                    width={320}
                    height={240}
                    className="h-20 w-full rounded-md border object-cover"
                  />
                </button>
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="absolute right-1 top-1 h-6 w-6 rounded-full"
                  disabled={isDeletingSample}
                  onClick={() => handleDeleteWorkSample(sample.id)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={activeSample !== null}
        onOpenChange={() => setActiveSample(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Work Sample</DialogTitle>
          </DialogHeader>
          {activeSample && (
            <div className="space-y-3">
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setZoom((value) => Math.max(1, value - 0.25))}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="w-14 text-center text-xs text-muted-foreground">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setZoom((value) => Math.min(4, value + 0.25))}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
              <div className="max-h-[70vh] overflow-auto rounded-md border bg-muted/20 p-2">
                <Image
                  src={`/api/curriculum-images/${activeSample.imageId}`}
                  alt="Work sample"
                  width={1280}
                  height={960}
                  className="mx-auto h-auto max-w-none origin-top rounded-md"
                  style={{ transform: `scale(${zoom})` }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Button
        className="w-full"
        onClick={handleSave}
        disabled={!hasChanges || isPending}
      >
        {isPending ? "Saving..." : "Save"}
      </Button>

      <Button
        variant="outline"
        className="w-full text-destructive hover:bg-destructive hover:text-destructive-foreground"
        disabled={isPending}
        onClick={handleDelete}
      >
        <Trash2 className="mr-1 h-4 w-4" />
        {isPending ? "Deleting..." : "Delete Lesson"}
      </Button>
    </div>
  );
}
