"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  CalendarIcon,
  Check,
  GripVertical,
  RotateCcw,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import type { Lesson } from "@/db/schema";
import {
  bulkCompleteLessons,
  bulkDeleteLessons,
  deleteLesson,
  updateLessonScheduledDate,
} from "@/lib/actions/lessons";
import { formatDate, getTodayDate, parseDate, toDateString } from "@/lib/dates";
import { cn } from "@/lib/utils";

function DateDropZone({
  date,
  children,
}: {
  date: string;
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: `date:${date}` });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-sm py-1 transition-colors",
        isOver && "bg-primary/5 ring-1 ring-primary/40",
      )}
    >
      {children}
    </div>
  );
}

function DraggableLessonRow({
  lesson,
  selected,
  onSelect,
  onDelete,
  disabled,
  showSelection,
}: {
  lesson: Lesson;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onDelete: () => void;
  disabled: boolean;
  showSelection: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: `lesson:${lesson.id}` });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        showSelection
          ? "grid grid-cols-[auto_auto_1fr_auto_auto_auto] items-center gap-3 rounded border px-2 py-2"
          : "grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-3 rounded border px-2 py-2",
        isDragging && "opacity-50",
      )}
    >
      {showSelection && (
        <Checkbox
          checked={selected}
          onCheckedChange={(checked) => onSelect(Boolean(checked))}
          aria-label={`Select lesson ${lesson.lessonNumber}`}
        />
      )}
      <button
        type="button"
        className="cursor-grab text-muted-foreground active:cursor-grabbing"
        {...listeners}
        {...attributes}
        aria-label={`Drag lesson ${lesson.lessonNumber}`}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0">
        <Link
          href={`/lessons/${lesson.id}`}
          className="font-medium hover:underline"
        >
          {lesson.title ?? `Lesson ${lesson.lessonNumber}`}
        </Link>
        <p className="text-xs text-muted-foreground">
          Lesson {lesson.lessonNumber}
        </p>
      </div>
      <Badge variant={lesson.status === "completed" ? "default" : "secondary"}>
        {lesson.status}
      </Badge>
      <span className="text-xs text-muted-foreground">
        {lesson.scheduledDate
          ? formatDate(lesson.scheduledDate)
          : "Unscheduled"}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={onDelete}
        disabled={disabled}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function CompactDateFilterButton({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (date: string) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseDate(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant={value ? "secondary" : "outline"}>
          <CalendarIcon className="h-4 w-4" />
          {label}: {value ? formatDate(value) : "Any"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (date) onChange(toDateString(date));
            setOpen(false);
          }}
          defaultMonth={selected}
        />
      </PopoverContent>
    </Popover>
  );
}

export function LessonTable({
  lessons,
  showPlanningTools,
}: {
  lessons: Lesson[];
  showPlanningTools: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([]);
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      if (!lesson.scheduledDate) return true;
      if (dateFrom && lesson.scheduledDate < dateFrom) return false;
      if (dateTo && lesson.scheduledDate > dateTo) return false;
      return true;
    });
  }, [lessons, dateFrom, dateTo]);

  const grouped = useMemo(() => {
    const byDate = new Map<string, Lesson[]>();
    for (const lesson of filteredLessons) {
      const key = lesson.scheduledDate ?? "unscheduled";
      const bucket = byDate.get(key) ?? [];
      bucket.push(lesson);
      byDate.set(key, bucket);
    }

    const today = getTodayDate();
    const upcomingDates = Array.from(byDate.keys())
      .filter((date) => date !== "unscheduled" && date >= today)
      .sort((a, b) => b.localeCompare(a));
    const earlierDates = Array.from(byDate.keys())
      .filter((date) => date !== "unscheduled" && date < today)
      .sort((a, b) => b.localeCompare(a));

    return {
      byDate,
      upcomingDates,
      earlierDates,
      unscheduled: byDate.get("unscheduled") ?? [],
    };
  }, [filteredLessons]);

  if (lessons.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No lessons yet. Generate lessons to get started.
      </p>
    );
  }

  function toggleSelect(lessonId: string, checked: boolean) {
    setSelectedLessonIds((current) => {
      if (checked) {
        return Array.from(new Set([...current, lessonId]));
      }
      return current.filter((id) => id !== lessonId);
    });
  }

  function handleDelete(lessonId: string) {
    if (!confirm("Delete this lesson?")) return;
    startTransition(async () => {
      await deleteLesson(lessonId);
      setSelectedLessonIds((current) =>
        current.filter((id) => id !== lessonId),
      );
    });
  }

  function handleSelectAllFiltered(checked: boolean) {
    if (!checked) {
      setSelectedLessonIds([]);
      return;
    }
    setSelectedLessonIds(filteredLessons.map((lesson) => lesson.id));
  }

  function handleBulkComplete() {
    if (selectedLessonIds.length === 0) return;
    startTransition(async () => {
      await bulkCompleteLessons(selectedLessonIds);
      setSelectedLessonIds([]);
    });
  }

  function handleBulkDelete() {
    if (selectedLessonIds.length === 0) return;
    if (!confirm(`Delete ${selectedLessonIds.length} selected lessons?`))
      return;
    startTransition(async () => {
      await bulkDeleteLessons(selectedLessonIds);
      setSelectedLessonIds([]);
    });
  }

  function renderLessonGroup(date: string, groupLessons: Lesson[]) {
    return (
      <DateDropZone date={date} key={date}>
        <div className="mb-2 flex items-center gap-2 px-1">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Link
              href={`/?date=${date}`}
              className="underline-offset-2 hover:text-foreground hover:underline"
            >
              {formatDate(date)}
            </Link>
          </h3>
          <span className="text-xs text-muted-foreground">
            {groupLessons.length}
          </span>
        </div>
        <div className="space-y-2">
          {groupLessons
            .slice()
            .sort((a, b) => a.lessonNumber - b.lessonNumber)
            .map((lesson) => (
              <DraggableLessonRow
                key={lesson.id}
                lesson={lesson}
                selected={selectedLessonIds.includes(lesson.id)}
                onSelect={(checked) => toggleSelect(lesson.id, checked)}
                onDelete={() => handleDelete(lesson.id)}
                disabled={isPending}
                showSelection={isBulkEditMode}
              />
            ))}
        </div>
      </DateDropZone>
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : "";
    if (!activeId.startsWith("lesson:") || !overId.startsWith("date:")) return;

    const lessonId = activeId.replace("lesson:", "");
    const newDate = overId.replace("date:", "");

    startTransition(async () => {
      await updateLessonScheduledDate(lessonId, newDate);
    });
  }

  const allFilteredSelected =
    filteredLessons.length > 0 &&
    filteredLessons.every((lesson) => selectedLessonIds.includes(lesson.id));

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        {showPlanningTools && (
          <div className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2">
            <CompactDateFilterButton
              value={dateFrom}
              onChange={setDateFrom}
              label="From"
            />
            <CompactDateFilterButton
              value={dateTo}
              onChange={setDateTo}
              label="To"
            />

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
              }}
              disabled={!dateFrom && !dateTo}
            >
              <RotateCcw className="h-4 w-4" />
              Clear
            </Button>

            <Button
              variant={isBulkEditMode ? "secondary" : "outline"}
              size="sm"
              onClick={() =>
                setIsBulkEditMode((current) => {
                  if (current) {
                    setSelectedLessonIds([]);
                  }
                  return !current;
                })
              }
            >
              {isBulkEditMode ? "Exit bulk edit" : "Bulk edit"}
            </Button>

            {isBulkEditMode && (
              <>
                <Button
                  variant={allFilteredSelected ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => handleSelectAllFiltered(!allFilteredSelected)}
                >
                  {allFilteredSelected ? "Unselect all" : "Select all"}
                </Button>

                <span className="text-sm text-muted-foreground">
                  {selectedLessonIds.length} selected
                </span>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleBulkComplete}
                  disabled={isPending || selectedLessonIds.length === 0}
                  aria-label="Mark complete"
                >
                  <Check className="h-4 w-4" />
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleBulkDelete}
                  disabled={isPending || selectedLessonIds.length === 0}
                  aria-label="Delete selected"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        )}

        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Upcoming dates
          </h2>
          {grouped.upcomingDates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No upcoming lessons in this filter.
            </p>
          ) : (
            grouped.upcomingDates.map((date) =>
              renderLessonGroup(date, grouped.byDate.get(date) ?? []),
            )
          )}
        </div>

        {(grouped.earlierDates.length > 0 ||
          grouped.unscheduled.length > 0) && (
          <>
            <Separator />
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Earlier / unscheduled
              </h2>
              {grouped.earlierDates.map((date) =>
                renderLessonGroup(date, grouped.byDate.get(date) ?? []),
              )}
              {grouped.unscheduled.length > 0 && (
                <div className="py-1">
                  <div className="mb-2 flex items-center gap-2 px-1">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Unscheduled
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {grouped.unscheduled.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {grouped.unscheduled
                      .slice()
                      .sort((a, b) => a.lessonNumber - b.lessonNumber)
                      .map((lesson) => (
                        <DraggableLessonRow
                          key={lesson.id}
                          lesson={lesson}
                          selected={selectedLessonIds.includes(lesson.id)}
                          onSelect={(checked) =>
                            toggleSelect(lesson.id, checked)
                          }
                          onDelete={() => handleDelete(lesson.id)}
                          disabled={isPending}
                          showSelection={isBulkEditMode}
                        />
                      ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DndContext>
  );
}
