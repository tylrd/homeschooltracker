export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AbsenceReasonForm } from "@/components/settings/absence-reason-form";
import { ShowCompletedToggle } from "@/components/settings/show-completed-toggle";
import { SchoolDaysToggle } from "@/components/settings/school-days-toggle";
import { DefaultLessonCountInput } from "@/components/settings/default-lesson-count-input";
import { AbsenceAutoBumpToggle } from "@/components/settings/absence-auto-bump-toggle";
import { NoteButtonsToggle } from "@/components/settings/note-buttons-toggle";
import { DashboardGroupingSelect } from "@/components/settings/dashboard-grouping-select";
import { BumpBehaviorSelect } from "@/components/settings/bump-behavior-select";
import { getOrCreateDefaultReasons } from "@/lib/queries/absence-reasons";
import {
  getShowCompletedLessons,
  getSchoolDays,
  getDefaultLessonCount,
  getAbsenceAutoBump,
  getShowNoteButtons,
  getDashboardGrouping,
  getBumpBehavior,
} from "@/lib/queries/settings";

export default async function SettingsPage() {
  const [
    reasons,
    showCompleted,
    schoolDays,
    defaultLessonCount,
    absenceAutoBump,
    showNoteButtons,
    dashboardGrouping,
    bumpBehavior,
  ] = await Promise.all([
    getOrCreateDefaultReasons(),
    getShowCompletedLessons(),
    getSchoolDays(),
    getDefaultLessonCount(),
    getAbsenceAutoBump(),
    getShowNoteButtons(),
    getDashboardGrouping(),
    getBumpBehavior(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <Separator />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Dashboard</h2>
        <ShowCompletedToggle defaultValue={showCompleted} />
        <DashboardGroupingSelect defaultValue={dashboardGrouping} />
        <NoteButtonsToggle defaultValue={showNoteButtons} />
      </div>

      <Separator />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Schedule</h2>
        <SchoolDaysToggle defaultValue={schoolDays} />
        <DefaultLessonCountInput defaultValue={defaultLessonCount} />
        <BumpBehaviorSelect defaultValue={bumpBehavior} />
      </div>

      <Separator />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Absences</h2>
        <AbsenceAutoBumpToggle defaultValue={absenceAutoBump} />
      </div>

      <Separator />

      <AbsenceReasonForm reasons={reasons} />
    </div>
  );
}
