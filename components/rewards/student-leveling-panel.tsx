"use client";

import { Crown, Sparkles, Star, TrendingUp, Zap } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  levelUpStudent,
  prestigeStudent,
  toggleStudentPerk,
  unlockStudentPerk,
} from "@/lib/actions/rewards";
import { getXpRequiredForLevel } from "@/lib/rewards/perks";
import { cn } from "@/lib/utils";

type PerkState = {
  key: string;
  name: string;
  description: string;
  rarity: "common" | "rare" | "epic";
  unlockLevel: number;
  owned: boolean;
  equipped: boolean;
};

function rarityVariant(rarity: PerkState["rarity"]) {
  if (rarity === "epic") return "default";
  if (rarity === "rare") return "secondary";
  return "outline";
}

export function StudentLevelingPanel({
  studentId,
  xpBalance,
  level,
  maxLevel,
  prestigeCount,
  perkSlots,
  perkPoints,
  perks,
}: {
  studentId: string;
  xpBalance: number;
  level: number;
  maxLevel: number;
  prestigeCount: number;
  perkSlots: number;
  perkPoints: number;
  perks: PerkState[];
}) {
  const [isPending, startTransition] = useTransition();
  const [activePerk, setActivePerk] = useState<string | null>(null);
  const equipped = perks.filter((perk) => perk.equipped);
  const canPrestige = level >= maxLevel;
  const nextLevel = Math.min(level + 1, maxLevel);
  const xpRequiredForNextLevel = getXpRequiredForLevel(nextLevel);
  const canLevelUp =
    level < maxLevel && xpBalance >= xpRequiredForNextLevel && !isPending;

  const currentLevelXpFloor = getXpRequiredForLevel(level);
  const xpSpan = Math.max(1, xpRequiredForNextLevel - currentLevelXpFloor);
  const xpIntoCurrentLevel = Math.max(
    0,
    Math.min(xpSpan, xpBalance - currentLevelXpFloor),
  );
  const progressPercent =
    level >= maxLevel ? 100 : Math.round((xpIntoCurrentLevel / xpSpan) * 100);
  const xpToNext = Math.max(0, xpRequiredForNextLevel - xpBalance);

  function handleLevelUp() {
    startTransition(async () => {
      try {
        await levelUpStudent(studentId);
        toast.success("Level increased");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to level up";
        toast.error(message);
      }
    });
  }

  function handlePrestige() {
    if (
      !confirm(
        "Prestige this student? Level resets to 1, all perks are removed, and +1 perk slot is granted.",
      )
    ) {
      return;
    }

    startTransition(async () => {
      try {
        await prestigeStudent(studentId);
        toast.success("Prestige complete");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to prestige";
        toast.error(message);
      }
    });
  }

  function handleUnlock(perkKey: string) {
    setActivePerk(perkKey);
    startTransition(async () => {
      try {
        await unlockStudentPerk({ studentId, perkKey });
        toast.success("Perk unlocked");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to unlock perk";
        toast.error(message);
      } finally {
        setActivePerk(null);
      }
    });
  }

  function handleToggle(perkKey: string) {
    setActivePerk(perkKey);
    startTransition(async () => {
      try {
        await toggleStudentPerk({ studentId, perkKey });
        toast.success("Perk loadout updated");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to update loadout";
        toast.error(message);
      } finally {
        setActivePerk(null);
      }
    });
  }

  return (
    <div className="space-y-3">
      <Card
        className={cn(
          "overflow-hidden border-2",
          canLevelUp
            ? "border-amber-400/80 bg-gradient-to-br from-amber-300/20 via-background to-orange-400/20 shadow-lg shadow-amber-500/20"
            : "border-primary/25 bg-gradient-to-br from-primary/10 via-background to-sky-500/10",
        )}
      >
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            Level Command
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Level
              </p>
              <div className="mt-1 flex items-end gap-2">
                <p className="text-5xl font-black leading-none">L{level}</p>
                <Badge variant="outline" className="mb-1">
                  Prestige {prestigeCount}
                </Badge>
              </div>
              {canLevelUp ? (
                <p className="mt-2 inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-1 text-sm font-semibold text-amber-700 dark:text-amber-300">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  Level up available now
                </p>
              ) : level < maxLevel ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {xpToNext} XP needed for Level {nextLevel}.
                </p>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  Max level reached. Prestige is unlocked.
                </p>
              )}
            </div>

            <div className="rounded-lg border bg-background/70 px-3 py-2">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  <Zap className="mr-1 h-3.5 w-3.5" />
                  {xpBalance} XP
                </Badge>
                <Badge variant="outline">
                  {equipped.length}/{perkSlots} equipped
                </Badge>
                <Badge variant="secondary">{perkPoints} perk points</Badge>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress to L{nextLevel}</span>
              <span>{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={handleLevelUp}
              disabled={!canLevelUp}
              className={cn(
                canLevelUp && "bg-amber-500 text-black hover:bg-amber-400",
              )}
            >
              <Sparkles
                className={cn("mr-1 h-4 w-4", canLevelUp && "animate-pulse")}
              />
              {canLevelUp ? "Level Up Ready" : "Level Up"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrestige}
              disabled={isPending || !canPrestige}
            >
              <Crown className="mr-1 h-4 w-4" />
              Prestige
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Star className="h-4 w-4" />
            Perk Loadout
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {equipped.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No perks equipped yet. Unlock perks below, then equip up to
              {` ${perkSlots}`}.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {equipped.map((perk) => (
                <Badge key={perk.key} variant={rarityVariant(perk.rarity)}>
                  {perk.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4" />
            Perk Armory
          </CardTitle>
        </CardHeader>
        <CardContent className="max-h-[30rem] space-y-2 overflow-y-auto">
          {perks.map((perk) => {
            const isLockedByLevel = level < perk.unlockLevel;
            return (
              <div
                key={perk.key}
                className={cn(
                  "rounded-md border px-3 py-2",
                  perk.equipped && "border-primary/40 bg-primary/10",
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{perk.name}</p>
                      <Badge variant={rarityVariant(perk.rarity)}>
                        {perk.rarity}
                      </Badge>
                      <Badge variant="outline">
                        Unlock L{perk.unlockLevel}
                      </Badge>
                      {perk.equipped && <Badge>Equipped</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {perk.description}
                    </p>
                  </div>
                  <div>
                    {!perk.owned ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={
                          isPending ||
                          isLockedByLevel ||
                          perkPoints < 1 ||
                          activePerk === perk.key
                        }
                        onClick={() => handleUnlock(perk.key)}
                      >
                        Unlock
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant={perk.equipped ? "secondary" : "outline"}
                        disabled={isPending || activePerk === perk.key}
                        onClick={() => handleToggle(perk.key)}
                      >
                        {perk.equipped ? "Unequip" : "Equip"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
