"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ABSENCE_COLORS, getAbsenceColorClasses } from "@/lib/absence-colors";
import { cn } from "@/lib/utils";
import {
  createAbsenceReason,
  deleteAbsenceReason,
  reorderAbsenceReasons,
} from "@/lib/actions/absence-reasons";
import type { AbsenceReason } from "@/db/schema";

function SortableReasonItem({
  reason,
  onDelete,
  disabled,
}: {
  reason: AbsenceReason;
  onDelete: (id: string) => void;
  disabled: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: reason.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const colorClasses = getAbsenceColorClasses(reason.color);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between rounded-md border px-3 py-2 bg-background",
        isDragging && "opacity-50 shadow-lg",
      )}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className={cn("h-3 w-3 rounded-full", colorClasses.dot)} />
        <span className="text-sm font-medium">{reason.name}</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={() => onDelete(reason.id)}
        disabled={disabled}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function AbsenceReasonForm({ reasons }: { reasons: AbsenceReason[] }) {
  const [items, setItems] = useState(reasons);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>(
    ABSENCE_COLORS[0].value,
  );
  const [isPending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newItems = [...items];
    const [moved] = newItems.splice(oldIndex, 1);
    newItems.splice(newIndex, 0, moved);
    setItems(newItems);

    startTransition(async () => {
      await reorderAbsenceReasons(newItems.map((i) => i.id));
    });
  }

  function handleAdd() {
    if (!name.trim()) return;
    startTransition(async () => {
      await createAbsenceReason(name, selectedColor);
      setName("");
      setSelectedColor(ABSENCE_COLORS[0].value);
      setShowAdd(false);
    });
  }

  function handleDelete(reasonId: string) {
    if (
      !confirm(
        "Delete this absence reason? Existing absence records using it will also be removed.",
      )
    )
      return;
    startTransition(async () => {
      await deleteAbsenceReason(reasonId);
      setItems((prev) => prev.filter((i) => i.id !== reasonId));
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Absence Reasons</h2>
        {!showAdd && (
          <Button variant="outline" size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Add Reason
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            {items.map((reason) => (
              <SortableReasonItem
                key={reason.id}
                reason={reason}
                onDelete={handleDelete}
                disabled={isPending}
              />
            ))}
          </SortableContext>
        </DndContext>

        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No absence reasons configured yet.
          </p>
        )}
      </div>

      {showAdd && (
        <div className="space-y-3 rounded-md border p-3">
          <div className="space-y-2">
            <Label>Reason Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Field Trip"
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {ABSENCE_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={cn(
                    "h-8 w-8 rounded-full transition-all",
                    color.dot,
                    selectedColor === color.value
                      ? "ring-2 ring-offset-2 ring-primary"
                      : "opacity-60 hover:opacity-100",
                  )}
                  aria-label={color.name}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleAdd}
              disabled={!name.trim() || isPending}
              className="flex-1"
            >
              {isPending ? "Adding..." : "Add"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowAdd(false);
                setName("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
