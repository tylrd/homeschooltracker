"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { getColorClasses } from "@/lib/constants";
import { cn } from "@/lib/utils";

type FilterStudent = {
  id: string;
  name: string;
  color: string;
};

export function StudentFilter({
  students,
  activeStudentId,
  basePath = "/dashboard",
}: {
  students: FilterStudent[];
  activeStudentId?: string;
  basePath?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSelect(studentId?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (studentId) {
      params.set("student", studentId);
    } else {
      params.delete("student");
    }
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <button
        type="button"
        onClick={() => handleSelect(undefined)}
        className={cn(
          "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
          !activeStudentId
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:text-foreground",
        )}
      >
        All
      </button>
      {students.map((student) => {
        const colors = getColorClasses(student.color);
        const isActive = activeStudentId === student.id;
        return (
          <button
            type="button"
            key={student.id}
            onClick={() => handleSelect(student.id)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? `${colors.bgSolid} text-white`
                : `${colors.bg} ${colors.text} hover:opacity-80`,
            )}
          >
            {student.name}
          </button>
        );
      })}
    </div>
  );
}
