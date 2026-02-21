"use client";

import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Download,
  FileImage,
  FolderOpen,
  RotateCcw,
  RotateCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import { StudentColorDot } from "@/components/student-color-dot";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  createSchoolDocument,
  deleteSchoolDocument,
  deleteSchoolDocumentFile,
  moveSchoolDocumentFile,
  rotateSchoolDocumentFile,
  uploadSchoolDocumentFiles,
} from "@/lib/actions/school-documents";
import type {
  SchoolDocumentView,
  WorkSampleView,
} from "@/lib/queries/school-documents";
import { cn } from "@/lib/utils";

type DocType = "weekly_plan" | "curriculum_outline" | "pacing_calendar";

function toDateInputValue(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getNextWeekWindow() {
  const now = new Date();
  const day = now.getDay();
  const diffToWed = (3 - day + 7) % 7 || 7;
  const start = new Date(now);
  start.setDate(now.getDate() + diffToWed);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    start: toDateInputValue(start),
    end: toDateInputValue(end),
  };
}

function getDefaultSchoolYearLabel() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const startYear = month >= 6 ? year : year - 1;
  const endYear = String(startYear + 1).slice(-2);
  return `${startYear}/${endYear}`;
}

function DocTypeBadge({ type }: { type: DocType }) {
  if (type === "weekly_plan") {
    return (
      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
        Weekly Plan
      </span>
    );
  }
  if (type === "curriculum_outline") {
    return (
      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-700">
        Curriculum Outline
      </span>
    );
  }
  return (
    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
      Pacing Calendar
    </span>
  );
}

function FileRow({
  docId,
  file,
  index,
  total,
  onOpen,
}: {
  docId: string;
  file: {
    id: string;
    imageId: string;
    sortOrder: number;
    rotationDegrees: number;
  };
  index: number;
  total: number;
  onOpen: (fileId: string) => void;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="rounded-md border p-2">
      <button
        type="button"
        className="block w-full"
        onClick={() => onOpen(file.id)}
      >
        <span className="block aspect-[3/4] w-full overflow-hidden rounded border bg-muted">
          <Image
            src={`/api/curriculum-images/${file.imageId}`}
            alt="Document page"
            width={320}
            height={480}
            unoptimized
            className="h-full w-full object-cover"
            style={{
              transform: `rotate(${file.rotationDegrees}deg)`,
              transformOrigin: "center",
            }}
          />
        </span>
      </button>
      <div className="mt-2 flex items-center justify-between gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={isPending || index === 0}
          onClick={() =>
            startTransition(async () => {
              await moveSchoolDocumentFile(docId, file.id, "up");
            })
          }
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={isPending || index === total - 1}
          onClick={() =>
            startTransition(async () => {
              await moveSchoolDocumentFile(docId, file.id, "down");
            })
          }
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await rotateSchoolDocumentFile(docId, file.id, -90);
            })
          }
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await rotateSchoolDocumentFile(docId, file.id, 90);
            })
          }
        >
          <RotateCw className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await deleteSchoolDocumentFile(docId, file.id);
            })
          }
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function DocumentCard({
  doc,
  onOpenFile,
}: {
  doc: SchoolDocumentView;
  onOpenFile: (docId: string, fileId: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const addPagesRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex flex-wrap items-center gap-2">
        <DocTypeBadge type={doc.type} />
        <h3 className="font-medium">{doc.title}</h3>
        {doc.resourceName && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {doc.resourceName}
          </span>
        )}
        {doc.schoolYearLabel && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {doc.schoolYearLabel}
          </span>
        )}
        {doc.weekStartDate && doc.weekEndDate && (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {doc.weekStartDate} - {doc.weekEndDate}
          </span>
        )}
      </div>

      {doc.notes && (
        <p className="mt-1 text-sm text-muted-foreground">{doc.notes}</p>
      )}

      {doc.students.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {doc.students.map((student) => (
            <span
              key={student.id}
              className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
            >
              <StudentColorDot color={student.color} className="h-2.5 w-2.5" />
              {student.name}
            </span>
          ))}
        </div>
      )}

      <input
        ref={addPagesRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="sr-only"
        onChange={(event) => {
          const files = event.target.files;
          if (!files || files.length === 0) return;
          startTransition(async () => {
            const fd = new FormData();
            for (const file of files) {
              fd.append("files", file);
            }
            await uploadSchoolDocumentFiles(doc.id, fd);
          });
          event.currentTarget.value = "";
        }}
      />

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {doc.files.map((file, index) => (
          <FileRow
            key={file.id}
            docId={doc.id}
            file={file}
            index={index}
            total={doc.files.length}
            onOpen={(fileId) => onOpenFile(doc.id, fileId)}
          />
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => addPagesRef.current?.click()}
        >
          <Upload className="mr-1 h-4 w-4" />
          Add Pages
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-destructive"
          disabled={isPending}
          onClick={() => {
            if (!confirm("Delete this document and all pages?")) return;
            startTransition(async () => {
              await deleteSchoolDocument(doc.id);
            });
          }}
        >
          <Trash2 className="mr-1 h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}

export function DocumentsView({
  documents,
  students,
  resources,
  workSamples,
}: {
  documents: SchoolDocumentView[];
  students: { id: string; name: string; color: string }[];
  resources: {
    resourceId: string;
    resourceName: string;
    studentName: string;
  }[];
  workSamples: WorkSampleView[];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [activeDocType, setActiveDocType] = useState<DocType>("weekly_plan");
  const [activeView, setActiveView] = useState<
    "weekly_plan" | "curriculum_outline" | "pacing_calendar" | "work_samples"
  >("weekly_plan");
  const weekWindow = useMemo(() => getNextWeekWindow(), []);
  const [weekStartDate, setWeekStartDate] = useState(weekWindow.start);
  const [weekEndDate, setWeekEndDate] = useState(weekWindow.end);
  const [schoolYearLabel, setSchoolYearLabel] = useState(
    getDefaultSchoolYearLabel(),
  );
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [activePreview, setActivePreview] = useState<{
    imageId: string;
    rotationDegrees: number;
  } | null>(null);

  const grouped = {
    weekly_plan: documents.filter((doc) => doc.type === "weekly_plan"),
    curriculum_outline: documents.filter(
      (doc) => doc.type === "curriculum_outline",
    ),
    pacing_calendar: documents.filter((doc) => doc.type === "pacing_calendar"),
  };

  function openFile(docId: string, fileId: string) {
    const doc = documents.find((item) => item.id === docId);
    const file = doc?.files.find((item) => item.id === fileId);
    if (!file) return;
    setActivePreview({
      imageId: file.imageId,
      rotationDegrees: file.rotationDegrees,
    });
  }

  function openWorkSample(imageId: string) {
    setActivePreview({
      imageId,
      rotationDegrees: 0,
    });
  }

  function toggleStudent(studentId: string) {
    setSelectedStudents((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId],
    );
  }

  function resetForm() {
    setActiveDocType("weekly_plan");
    setWeekStartDate(weekWindow.start);
    setWeekEndDate(weekWindow.end);
    setSchoolYearLabel(getDefaultSchoolYearLabel());
    setSelectedStudents([]);
  }

  return (
    <div className="space-y-4 overflow-x-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Docs</h1>
        </div>
        <Button onClick={() => setCreateOpen(true)}>Add Document</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: "weekly_plan", label: "Weekly Plans" },
          { key: "curriculum_outline", label: "Curriculum Outlines" },
          { key: "pacing_calendar", label: "Pacing Calendars" },
          { key: "work_samples", label: "Work Samples" },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() =>
              setActiveView(
                item.key as
                  | "weekly_plan"
                  | "curriculum_outline"
                  | "pacing_calendar"
                  | "work_samples",
              )
            }
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              activeView === item.key
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-muted/40 text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {activeView === "weekly_plan" && (
        <div className="space-y-3">
          {grouped.weekly_plan.length === 0 ? (
            <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
              No weekly plans yet.
            </p>
          ) : (
            grouped.weekly_plan.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} onOpenFile={openFile} />
            ))
          )}
        </div>
      )}

      {activeView === "curriculum_outline" && (
        <div className="space-y-3">
          {grouped.curriculum_outline.length === 0 ? (
            <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
              No curriculum outlines yet.
            </p>
          ) : (
            grouped.curriculum_outline.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} onOpenFile={openFile} />
            ))
          )}
        </div>
      )}

      {activeView === "pacing_calendar" && (
        <div className="space-y-3">
          {grouped.pacing_calendar.length === 0 ? (
            <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
              No pacing calendars yet.
            </p>
          ) : (
            grouped.pacing_calendar.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} onOpenFile={openFile} />
            ))
          )}
        </div>
      )}

      {activeView === "work_samples" && (
        <div className="space-y-3">
          {workSamples.length === 0 ? (
            <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
              No work samples yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {workSamples.map((sample) => (
                <div
                  key={sample.workSampleId}
                  className="rounded-md border p-2"
                >
                  <button
                    type="button"
                    className="block w-full"
                    onClick={() => openWorkSample(sample.imageId)}
                  >
                    <span className="block aspect-[3/4] w-full overflow-hidden rounded border bg-muted">
                      <Image
                        src={`/api/curriculum-images/${sample.imageId}`}
                        alt="Work sample"
                        width={360}
                        height={480}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    </span>
                  </button>
                  <div className="mt-2 space-y-1">
                    <p className="truncate text-xs font-medium">
                      {sample.lessonTitle ?? `Lesson ${sample.lessonNumber}`}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {sample.subjectName} · {sample.resourceName}
                    </p>
                    <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <StudentColorDot
                        color={sample.studentColor}
                        className="h-2.5 w-2.5"
                      />
                      {sample.studentName}
                    </p>
                    <Link
                      href={`/lessons/${sample.lessonId}`}
                      className="text-xs text-primary hover:underline"
                    >
                      Open lesson
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add School Document</DialogTitle>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const formData = new FormData(form);
              formData.set("type", activeDocType);
              for (const studentId of selectedStudents) {
                formData.append("studentIds", studentId);
              }

              startTransition(async () => {
                await createSchoolDocument(formData);
                setCreateOpen(false);
                resetForm();
                form.reset();
              });
            }}
          >
            <div className="space-y-2">
              <Label>Type</Label>
              <Tabs
                value={activeDocType}
                onValueChange={(value) => setActiveDocType(value as DocType)}
              >
                <TabsList className="w-full">
                  <TabsTrigger value="weekly_plan">Weekly Plan</TabsTrigger>
                  <TabsTrigger value="curriculum_outline">
                    Curriculum Outline
                  </TabsTrigger>
                  <TabsTrigger value="pacing_calendar">
                    Pacing Calendar
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label htmlFor="doc-title">Title</Label>
              <Input id="doc-title" name="title" required placeholder="Title" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doc-notes">Notes</Label>
              <Textarea
                id="doc-notes"
                name="notes"
                rows={3}
                placeholder="Optional notes"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doc-resource">Resource</Label>
              <select
                id="doc-resource"
                name="resourceId"
                required={activeDocType !== "weekly_plan"}
                className={cn(
                  "h-10 w-full rounded-md border bg-background px-3 text-sm",
                )}
                defaultValue=""
              >
                <option value="">
                  {activeDocType === "weekly_plan"
                    ? "Optional resource"
                    : "Select a resource"}
                </option>
                {resources.map((resource) => (
                  <option key={resource.resourceId} value={resource.resourceId}>
                    {resource.resourceName} ({resource.studentName})
                  </option>
                ))}
              </select>
            </div>

            {activeDocType === "weekly_plan" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="week-start">Week Start</Label>
                  <Input
                    id="week-start"
                    name="weekStartDate"
                    type="date"
                    value={weekStartDate}
                    onChange={(event) => setWeekStartDate(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="week-end">Week End</Label>
                  <Input
                    id="week-end"
                    name="weekEndDate"
                    type="date"
                    value={weekEndDate}
                    onChange={(event) => setWeekEndDate(event.target.value)}
                  />
                </div>
              </div>
            )}

            {activeDocType === "pacing_calendar" && (
              <div className="space-y-2">
                <Label htmlFor="school-year">School Year Label</Label>
                <Input
                  id="school-year"
                  name="schoolYearLabel"
                  value={schoolYearLabel}
                  onChange={(event) => setSchoolYearLabel(event.target.value)}
                  placeholder="2025/26"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Students</Label>
              <div className="grid grid-cols-2 gap-2">
                {students.map((student) => (
                  <label
                    key={student.id}
                    htmlFor={`doc-student-${student.id}`}
                    className="inline-flex items-center gap-2 text-sm"
                  >
                    <Checkbox
                      id={`doc-student-${student.id}`}
                      checked={selectedStudents.includes(student.id)}
                      onCheckedChange={() => toggleStudent(student.id)}
                    />
                    <StudentColorDot
                      color={student.color}
                      className="h-2.5 w-2.5"
                    />
                    {student.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="doc-files">Pages</Label>
              <Input
                id="doc-files"
                name="files"
                type="file"
                multiple
                required
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              />
              <p className="text-xs text-muted-foreground">
                JPG, PNG, WEBP, and HEIC/HEIF supported.
              </p>
            </div>

            <Button className="w-full" disabled={isPending}>
              {isPending ? "Saving..." : "Save Document"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {activePreview && (
        <div className="fixed inset-0 z-50 bg-black">
          <div className="absolute inset-0 overflow-auto pb-4 pt-16">
            <Image
              src={`/api/curriculum-images/${activePreview.imageId}`}
              alt="Document page"
              width={1600}
              height={1200}
              unoptimized
              className="mx-auto block h-auto w-full max-w-none"
              style={{
                transform: `rotate(${activePreview.rotationDegrees}deg)`,
              }}
            />
          </div>
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-3">
            <a
              href={`/api/curriculum-images/${activePreview.imageId}`}
              download
              className="pointer-events-auto inline-flex h-9 items-center rounded-md border border-white/30 bg-black/50 px-3 text-sm text-white"
            >
              <Download className="mr-1 h-4 w-4" />
              Download
            </a>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="pointer-events-auto border-white/30 bg-black/50 text-white hover:bg-black/70"
              onClick={() => setActivePreview(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="absolute bottom-3 right-3 rounded-md border border-white/20 bg-black/60 p-2 text-xs text-white/80">
            <div className="inline-flex items-center gap-2">
              <FileImage className="h-4 w-4" />
              Preview uses saved rotation. Download keeps original file bytes.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
