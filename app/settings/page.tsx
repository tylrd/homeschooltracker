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
import { RewardTemplatesInput } from "@/components/settings/reward-templates-input";
import { SchoolDaysToggle } from "@/components/settings/school-days-toggle";
import { ShowCompletedToggle } from "@/components/settings/show-completed-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { requireAppRouteAccess } from "@/lib/auth/session";
import { getOrCreateDefaultReasons } from "@/lib/queries/absence-reasons";
import { getWeeklyXpSummary } from "@/lib/queries/rewards";
import {
  getAbsenceAutoBump,
  getBumpBehavior,
  getCustomMoods,
  getDashboardGrouping,
  getDashboardSharedLessonView,
  getDefaultLessonCount,
  getRewardTemplates,
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
    rewardTemplates,
    weeklyXpSummary,
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
    getRewardTemplates(),
    getWeeklyXpSummary(),
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

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Rewards</h2>
        <RewardTemplatesInput defaultTemplates={rewardTemplates} />
      </div>

      <Separator />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">RPG Insights</h2>
        <p className="text-sm text-muted-foreground">
          Weekly window: {weeklyXpSummary.fromDate} to {weeklyXpSummary.toDate}
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">XP Earned (7d)</p>
            <p className="text-xl font-semibold">
              {weeklyXpSummary.totalEarned}
            </p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">XP Spent (7d)</p>
            <p className="text-xl font-semibold">
              {weeklyXpSummary.totalSpent}
            </p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Net XP (7d)</p>
            <p className="text-xl font-semibold">
              {weeklyXpSummary.totalEarned - weeklyXpSummary.totalSpent}
            </p>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-md border p-3">
            <p className="mb-2 text-sm font-medium">Daily XP</p>
            <div className="space-y-1">
              {weeklyXpSummary.daily.map((row) => (
                <div
                  key={row.date}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">{row.date}</span>
                  <span>
                    +{row.earned} / -{row.spent} (net {row.net})
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border p-3">
            <p className="mb-2 text-sm font-medium">
              Current Streak Distribution
            </p>
            <div className="space-y-1">
              {weeklyXpSummary.streakDistribution.map((row) => (
                <div
                  key={row.bucket}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">
                    {row.bucket} days
                  </span>
                  <span>{row.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <AbsenceReasonForm reasons={reasons} />
    </div>
  );
}
