"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  MouseSensor,
  TouchSensor,
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
import { AddSharedLessonForm } from "@/components/shelf/add-shared-lesson-form";
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
import type { SharedLesson } from "@/db/schema";
import {
  bulkCompleteSharedLessons,
  bulkDeleteSharedLessons,
  deleteSharedLesson,
  updateSharedLessonScheduledDate,
} from "@/lib/actions/shared-lessons";
import {
  formatDate,
  getTodayDate,
  isSchoolDay,
  parseDate,
  toDateString,
} from "@/lib/dates";
import { cn } from "@/lib/utils";

function DateDropZone({
  date,
  children,
}: {
  date: string;
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: `shared-date:${date}` });

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

function DraggableSharedLessonRow({
  lesson,
  selected,
  onSelect,
  onDelete,
  disabled,
  showSelection,
}: {
  lesson: SharedLesson;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onDelete: () => void;
  disabled: boolean;
  showSelection: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: `shared-lesson:${lesson.id}` });

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
        className="cursor-grab touch-none select-none text-muted-foreground active:cursor-grabbing"
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

export function SharedLessonTable({
  lessons,
  showPlanningTools,
  sharedCurriculumId,
  schoolDays = [1, 2, 3, 4, 5],
}: {
  lessons: SharedLesson[];
  showPlanningTools: boolean;
  sharedCurriculumId: string;
  schoolDays?: number[];
}) {
  const [isPending, startTransition] = useTransition();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([]);
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);
  const [showEmptyEarlierDays, setShowEmptyEarlierDays] = useState(true);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
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
    const byDate = new Map<string, SharedLesson[]>();
    for (const lesson of filteredLessons) {
      const key = lesson.scheduledDate ?? "unscheduled";
      const bucket = byDate.get(key) ?? [];
      bucket.push(lesson);
      byDate.set(key, bucket);
    }

    const today = getTodayDate();
    const existingScheduledDates = Array.from(byDate.keys())
      .filter((date) => date !== "unscheduled")
      .sort((a, b) => a.localeCompare(b));

    const existingUpcomingDates = existingScheduledDates
      .filter((date) => date >= today)
      .sort((a, b) => b.localeCompare(a));
    const existingEarlierDates = existingScheduledDates
      .filter((date) => date < today)
      .sort((a, b) => b.localeCompare(a));

    const upcomingDateSet = new Set(existingUpcomingDates);
    const startFutureDate = dateFrom && dateFrom > today ? dateFrom : today;
    const cursor = parseDate(startFutureDate);
    let addedFutureSchoolDays = 0;
    let iterations = 0;
    while (addedFutureSchoolDays < 5 && iterations < 3660) {
      const dateStr = toDateString(cursor);
      if (dateTo && dateStr > dateTo) {
        break;
      }
      if (isSchoolDay(cursor, schoolDays)) {
        upcomingDateSet.add(dateStr);
        addedFutureSchoolDays++;
      }
      cursor.setDate(cursor.getDate() + 1);
      iterations++;
    }

    const upcomingDates = Array.from(upcomingDateSet)
      .filter((date) => date !== "unscheduled" && date >= today)
      .sort((a, b) => b.localeCompare(a));

    const earlierDateSet = new Set(existingEarlierDates);
    if (existingEarlierDates.length > 0) {
      const oldestPast = existingEarlierDates[existingEarlierDates.length - 1];
      const rangeStart = dateFrom && dateFrom < today ? dateFrom : oldestPast;
      const yesterdayDate = parseDate(today);
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterday = toDateString(yesterdayDate);
      const rangeEnd = dateTo && dateTo < today ? dateTo : yesterday;

      if (rangeStart <= rangeEnd) {
        const pastCursor = parseDate(rangeStart);
        while (toDateString(pastCursor) <= rangeEnd) {
          const dateStr = toDateString(pastCursor);
          if (isSchoolDay(pastCursor, schoolDays)) {
            earlierDateSet.add(dateStr);
          }
          pastCursor.setDate(pastCursor.getDate() + 1);
        }
      }
    }

    const earlierDates = Array.from(earlierDateSet)
      .filter((date) => date < today)
      .sort((a, b) => b.localeCompare(a));

    return {
      byDate,
      upcomingDates,
      earlierDates,
      unscheduled: byDate.get("unscheduled") ?? [],
    };
  }, [dateFrom, dateTo, filteredLessons, schoolDays]);

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
      await deleteSharedLesson(lessonId);
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
      await bulkCompleteSharedLessons(selectedLessonIds);
      setSelectedLessonIds([]);
    });
  }

  function handleBulkDelete() {
    if (selectedLessonIds.length === 0) return;
    if (!confirm(`Delete ${selectedLessonIds.length} selected lessons?`)) {
      return;
    }
    startTransition(async () => {
      await bulkDeleteSharedLessons(selectedLessonIds);
      setSelectedLessonIds([]);
    });
  }

  const nextLessonNumber =
    lessons.reduce((max, lesson) => Math.max(max, lesson.lessonNumber), 0) + 1;

  function renderLessonGroup(date: string, groupLessons: SharedLesson[]) {
    return (
      <DateDropZone date={date} key={date}>
        <div className="mb-2 flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Link
                href={`/dashboard?date=${date}`}
                className="underline-offset-2 hover:text-foreground hover:underline"
              >
                {formatDate(date)}
              </Link>
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <AddSharedLessonForm
              sharedCurriculumId={sharedCurriculumId}
              nextLessonNumber={nextLessonNumber}
              defaultDate={date}
            />
          </div>
        </div>
        {groupLessons.length === 0 ? (
          <p className="rounded border border-dashed px-3 py-2 text-sm text-muted-foreground">
            No lesson planned
          </p>
        ) : (
          <div className="space-y-2">
            {groupLessons
              .slice()
              .sort((a, b) => a.lessonNumber - b.lessonNumber)
              .map((lesson) => (
                <DraggableSharedLessonRow
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
        )}
      </DateDropZone>
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : "";
    if (
      !activeId.startsWith("shared-lesson:") ||
      !overId.startsWith("shared-date:")
    ) {
      return;
    }

    const lessonId = activeId.replace("shared-lesson:", "");
    const newDate = overId.replace("shared-date:", "");

    startTransition(async () => {
      await updateSharedLessonScheduledDate(lessonId, newDate);
    });
  }

  const allFilteredSelected =
    filteredLessons.length > 0 &&
    filteredLessons.every((lesson) => selectedLessonIds.includes(lesson.id));
  const visibleEarlierDates = showEmptyEarlierDays
    ? grouped.earlierDates
    : grouped.earlierDates.filter(
        (date) => (grouped.byDate.get(date) ?? []).length > 0,
      );

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

            <div className="ml-auto flex items-center gap-2">
              <Button
                variant={showEmptyEarlierDays ? "secondary" : "outline"}
                size="sm"
                onClick={() => setShowEmptyEarlierDays((current) => !current)}
              >
                {showEmptyEarlierDays
                  ? "Hide empty past days"
                  : "Show empty past days"}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {grouped.upcomingDates.map((date) =>
            renderLessonGroup(date, grouped.byDate.get(date) ?? []),
          )}

          {grouped.unscheduled.length > 0 && (
            <div className="space-y-2">
              <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Unscheduled
              </h3>
              <div className="space-y-2">
                {grouped.unscheduled.map((lesson) => (
                  <DraggableSharedLessonRow
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
            </div>
          )}

          {visibleEarlierDates.length > 0 && <Separator />}

          {visibleEarlierDates.map((date) =>
            renderLessonGroup(date, grouped.byDate.get(date) ?? []),
          )}
        </div>
      </div>
    </DndContext>
  );
}
