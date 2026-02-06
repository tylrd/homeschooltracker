"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { StudentColorDot } from "@/components/student-color-dot";
import { toDateString } from "@/lib/dates";

type StudentOption = {
  id: string;
  name: string;
  color: string;
};

export function ExportForm({ students }: { students: StudentOption[] }) {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [startDate, setStartDate] = useState(toDateString(firstOfMonth));
  const [endDate, setEndDate] = useState(toDateString(now));
  const [selectedStudents, setSelectedStudents] = useState<string[]>(
    students.map((s) => s.id),
  );

  function toggleStudent(id: string) {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  function handlePrint() {
    const params = new URLSearchParams({
      start: startDate,
      end: endDate,
      students: selectedStudents.join(","),
    });
    window.open(`/export/print?${params.toString()}`, "_blank");
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <DatePicker value={startDate} onChange={setStartDate} />
        </div>
        <div className="space-y-2">
          <Label>End Date</Label>
          <DatePicker value={endDate} onChange={setEndDate} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Students</Label>
        <div className="space-y-2">
          {students.map((student) => (
            <label
              key={student.id}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Checkbox
                checked={selectedStudents.includes(student.id)}
                onCheckedChange={() => toggleStudent(student.id)}
              />
              <StudentColorDot color={student.color} />
              <span className="text-sm">{student.name}</span>
            </label>
          ))}
        </div>
      </div>

      <Button
        onClick={handlePrint}
        className="w-full"
        disabled={selectedStudents.length === 0}
      >
        Generate Report
      </Button>
    </div>
  );
}
