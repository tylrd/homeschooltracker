"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/dates";
import { deleteLesson } from "@/lib/actions/lessons";
import type { Lesson } from "@/db/schema";

export function LessonTable({ lessons }: { lessons: Lesson[] }) {
  const [isPending, startTransition] = useTransition();

  if (lessons.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No lessons yet. Generate lessons to get started.
      </p>
    );
  }

  function handleDelete(lessonId: string) {
    if (!confirm("Delete this lesson?")) return;
    startTransition(async () => {
      await deleteLesson(lessonId);
    });
  }

  return (
    <div className="max-h-96 overflow-y-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">#</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="w-24">Status</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {lessons.map((lesson) => (
            <TableRow key={lesson.id}>
              <TableCell className="font-mono text-sm">
                {lesson.lessonNumber}
              </TableCell>
              <TableCell>
                <Link
                  href={`/lessons/${lesson.id}`}
                  className="hover:underline"
                >
                  {lesson.title ?? `Lesson ${lesson.lessonNumber}`}
                </Link>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {lesson.scheduledDate ? formatDate(lesson.scheduledDate) : "—"}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    lesson.status === "completed" ? "default" : "secondary"
                  }
                >
                  {lesson.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(lesson.id)}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
