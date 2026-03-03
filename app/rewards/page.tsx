export const dynamic = "force-dynamic";

import { Compass, Sparkles, Target, Trophy, Users } from "lucide-react";
import { DailyRewardCard } from "@/components/dashboard/daily-reward-card";
import { StudentFilter } from "@/components/dashboard/student-filter";
import { EmptyState } from "@/components/empty-state";
import { ModifierLibrary } from "@/components/rewards/modifier-library";
import { StudentLevelingPanel } from "@/components/rewards/student-leveling-panel";
import { RewardRedemptionsPanel } from "@/components/students/reward-redemptions-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAppRouteAccess } from "@/lib/auth/session";
import { getColorClasses } from "@/lib/constants";
import { getTodayDate } from "@/lib/dates";
import {
  getDailyCompletionRewardStatus,
  getStudentLevelingState,
  getStudentRedemptions,
} from "@/lib/queries/rewards";
import { getRewardTemplates } from "@/lib/queries/settings";
import { getStudents } from "@/lib/queries/students";
import { cn } from "@/lib/utils";

function formatBadgeLabel(badgeKey: string | null | undefined) {
  if (!badgeKey) return "No badge yet";
  if (badgeKey.startsWith("streak_")) {
    return `${badgeKey.replace("streak_", "")}-day streak`;
  }
  return badgeKey.replace(/_/g, " ");
}

export default async function RewardsPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>;
}) {
  await requireAppRouteAccess("/rewards");

  const { student: selectedStudentIdParam } = await searchParams;
  const today = getTodayDate();

  const [students, dailyReward, templates] = await Promise.all([
    getStudents(),
    getDailyCompletionRewardStatus(today),
    getRewardTemplates(),
  ]);

  const selectedStudent =
    students.find((student) => student.id === selectedStudentIdParam) ??
    students[0] ??
    null;

  const [selectedRedemptions, selectedLevelingState] = selectedStudent
    ? await Promise.all([
        getStudentRedemptions(selectedStudent.id),
        getStudentLevelingState(selectedStudent.id),
      ])
    : [[], null];

  const selectedStudentColors = selectedStudent
    ? getColorClasses(selectedStudent.color)
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rewards</h1>
          <p className="text-sm text-muted-foreground">
            Student XP, perks, redemption workflow, and daily modifier effects.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3.5 w-3.5" />
          RPG Center
        </Badge>
      </div>

      {students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students yet"
          description="Add students to start earning XP and redeeming rewards."
        />
      ) : (
        <Card className="border-primary/25 bg-gradient-to-br from-primary/10 via-background to-orange-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4" />
              Active Student Context
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Pick one student. Reward redemptions and perk actions below only
              apply to that selected student.
            </p>
            <StudentFilter
              students={students.map((student) => ({
                id: student.id,
                name: student.name,
                color: student.color,
              }))}
              activeStudentId={selectedStudent?.id}
              basePath="/rewards"
              showAllOption={false}
            />
            {selectedStudent ? (
              <div
                className={cn(
                  "rounded-lg border px-3 py-2",
                  selectedStudentColors?.bg,
                  selectedStudentColors?.border,
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p
                    className={cn("font-semibold", selectedStudentColors?.text)}
                  >
                    Currently managing: {selectedStudent.name}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {selectedStudent.xpBalance ?? 0} XP
                    </Badge>
                    <Badge variant="outline">
                      {selectedStudent.currentStreak ?? 0}d streak
                    </Badge>
                    <Badge variant="outline">
                      {formatBadgeLabel(selectedStudent.newestBadgeKey)}
                    </Badge>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm font-medium text-muted-foreground">
                Select a student above to unlock rewards and perk controls.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {selectedStudent ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="space-y-4">
            {selectedLevelingState && (
              <StudentLevelingPanel
                studentId={selectedStudent.id}
                xpBalance={selectedStudent.xpBalance ?? 0}
                level={selectedLevelingState.level}
                maxLevel={selectedLevelingState.maxLevel}
                prestigeCount={selectedLevelingState.prestigeCount}
                perkSlots={selectedLevelingState.perkSlots}
                perkPoints={selectedLevelingState.perkPoints}
                perks={selectedLevelingState.perks}
              />
            )}

            <Card className="border-primary/25">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Trophy className="h-4 w-4" />
                  Today&apos;s Team Reward
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{dailyReward.modifierId}</Badge>
                    <p className="font-medium">{dailyReward.modifierName}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {dailyReward.modifierDescription}
                  </p>
                </div>
                <DailyRewardCard
                  date={dailyReward.date}
                  totalLessons={dailyReward.totalLessons}
                  completedLessons={dailyReward.completedLessons}
                  studentsWithLessons={dailyReward.studentsWithLessons}
                  completedStudents={dailyReward.completedStudents}
                  isEligible={dailyReward.isEligible}
                  isTracked={dailyReward.isTracked}
                  points={dailyReward.points}
                  projectedPoints={dailyReward.projectedPoints}
                  modifierName={dailyReward.modifierName}
                  modifierDescription={dailyReward.modifierDescription}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <RewardRedemptionsPanel
              studentId={selectedStudent.id}
              xpBalance={selectedStudent.xpBalance ?? 0}
              templates={templates}
              redemptions={selectedRedemptions}
            />

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Compass className="h-4 w-4" />
                  Modifier Library
                </CardTitle>
              </CardHeader>
              <CardContent>
                <details>
                  <summary className="cursor-pointer text-sm font-medium">
                    Browse all 100 modifiers and their effects
                  </summary>
                  <p className="mt-2 text-xs text-muted-foreground">
                    One modifier is chosen daily and changes how that day&apos;s
                    team reward behaves.
                  </p>
                  <div className="mt-3">
                    <ModifierLibrary
                      activeModifierId={dailyReward.modifierId}
                    />
                  </div>
                </details>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
