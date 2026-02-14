"use client";

import { Plus, X } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addStudentToSharedCurriculum,
  removeStudentFromSharedCurriculum,
} from "@/lib/actions/shared-curricula";

type MembershipOption = {
  sharedCurriculumId: string;
  sharedCurriculumName: string;
  isMember: boolean;
};

export function SharedCurriculumMemberships({
  studentId,
  options,
}: {
  studentId: string;
  options: MembershipOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState("");

  const memberships = options.filter((option) => option.isMember);
  const nonMemberships = options.filter((option) => !option.isMember);

  return (
    <div className="space-y-3 rounded-md border p-4">
      <h3 className="text-sm font-semibold">Shared Curriculum Memberships</h3>

      {memberships.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Not enrolled in shared curriculum yet.
        </p>
      ) : (
        <div className="space-y-2">
          {memberships.map((membership) => (
            <div
              key={membership.sharedCurriculumId}
              className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
            >
              <span className="text-sm">{membership.sharedCurriculumName}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-destructive hover:text-destructive"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await removeStudentFromSharedCurriculum(
                      membership.sharedCurriculumId,
                      studentId,
                    );
                  })
                }
              >
                <X className="mr-1 h-3 w-3" />
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}

      {nonMemberships.length > 0 && (
        <div className="flex items-center gap-2">
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Add to shared curriculum..." />
            </SelectTrigger>
            <SelectContent>
              {nonMemberships.map((option) => (
                <SelectItem
                  key={option.sharedCurriculumId}
                  value={option.sharedCurriculumId}
                >
                  {option.sharedCurriculumName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            disabled={isPending || !selectedId}
            onClick={() =>
              startTransition(async () => {
                await addStudentToSharedCurriculum(selectedId, studentId);
                setSelectedId("");
              })
            }
          >
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>
      )}
    </div>
  );
}
