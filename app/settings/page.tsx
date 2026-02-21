export const dynamic = "force-dynamic";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AbsenceAutoBumpToggle } from "@/components/settings/absence-auto-bump-toggle";
import { AbsenceReasonForm } from "@/components/settings/absence-reason-form";
import { BumpBehaviorSelect } from "@/components/settings/bump-behavior-select";
import { CustomMoodsInput } from "@/components/settings/custom-moods-input";
import { DailyLogNotesToggle } from "@/components/settings/daily-log-notes-toggle";
import { DashboardGroupingSelect } from "@/components/settings/dashboard-grouping-select";
import { DashboardSharedLessonViewSelect } from "@/components/settings/dashboard-shared-lesson-view-select";
import { DefaultLessonCountInput } from "@/components/settings/default-lesson-count-input";
import { NoteButtonsToggle } from "@/components/settings/note-buttons-toggle";
import { SchoolDaysToggle } from "@/components/settings/school-days-toggle";
import { ShowCompletedToggle } from "@/components/settings/show-completed-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { requireAppRouteAccess } from "@/lib/auth/session";
import { getOrCreateDefaultReasons } from "@/lib/queries/absence-reasons";
import {
  getAbsenceAutoBump,
  getBumpBehavior,
  getCustomMoods,
  getDashboardGrouping,
  getDashboardSharedLessonView,
  getDefaultLessonCount,
  getSchoolDays,
  getShowCompletedLessons,
  getShowDailyLogNotes,
  getShowNoteButtons,
} from "@/lib/queries/settings";

export default async function SettingsPage() {
  await requireAppRouteAccess("/settings");

  const [
    reasons,
    showCompleted,
    schoolDays,
    defaultLessonCount,
    absenceAutoBump,
    showNoteButtons,
    showDailyLogNotes,
    dashboardGrouping,
    dashboardSharedLessonView,
    bumpBehavior,
    customMoods,
  ] = await Promise.all([
    getOrCreateDefaultReasons(),
    getShowCompletedLessons(),
    getSchoolDays(),
    getDefaultLessonCount(),
    getAbsenceAutoBump(),
    getShowNoteButtons(),
    getShowDailyLogNotes(),
    getDashboardGrouping(),
    getDashboardSharedLessonView(),
    getBumpBehavior(),
    getCustomMoods(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/dashboard">
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
        <DashboardSharedLessonViewSelect
          defaultValue={dashboardSharedLessonView}
        />
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

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Attendance</h2>
        <DailyLogNotesToggle defaultValue={showDailyLogNotes} />
        <CustomMoodsInput defaultMoods={customMoods} />
      </div>

      <Separator />

      <AbsenceReasonForm reasons={reasons} />
    </div>
  );
}
