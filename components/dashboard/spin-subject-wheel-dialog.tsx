"use client";

import { Gamepad2, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { StudentColorDot } from "@/components/student-color-dot";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { WheelSubjectCandidate } from "@/lib/dashboard/spin-wheel";
import { cn } from "@/lib/utils";

const WHEEL_COLORS = [
  "oklch(0.8 0.12 32)",
  "oklch(0.84 0.15 68)",
  "oklch(0.77 0.12 160)",
  "oklch(0.74 0.11 236)",
  "oklch(0.8 0.12 305)",
  "oklch(0.81 0.11 18)",
];

function normalizeDegrees(value: number) {
  return ((value % 360) + 360) % 360;
}

export function SpinSubjectWheelDialog({
  candidates,
}: {
  candidates: WheelSubjectCandidate[];
}) {
  const [open, setOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  const [winner, setWinner] = useState<WheelSubjectCandidate | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const spinTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const setFromMedia = () => setReduceMotion(media.matches);
    setFromMedia();
    media.addEventListener("change", setFromMedia);
    return () => media.removeEventListener("change", setFromMedia);
  }, []);

  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current !== null) {
        window.clearTimeout(spinTimeoutRef.current);
      }
    };
  }, []);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSpinning(false);
      setWinnerIndex(null);
      setWinner(null);
      if (spinTimeoutRef.current !== null) {
        window.clearTimeout(spinTimeoutRef.current);
      }
    }
  }

  const segmentAngle = candidates.length > 0 ? 360 / candidates.length : 360;
  const spinDurationMs = reduceMotion ? 450 : 3800;

  const wheelGradient = useMemo(() => {
    if (candidates.length === 0) {
      return "conic-gradient(from -90deg, oklch(0.9 0 0), oklch(0.9 0 0))";
    }

    const stops = candidates.map((_, index) => {
      const start = index * segmentAngle;
      const end = (index + 1) * segmentAngle;
      const color = WHEEL_COLORS[index % WHEEL_COLORS.length];
      return `${color} ${start}deg ${end}deg`;
    });

    return `conic-gradient(from -90deg, ${stops.join(", ")})`;
  }, [candidates, segmentAngle]);

  function spinWheel() {
    if (spinning || candidates.length === 0) return;

    const selectedIndex = Math.floor(Math.random() * candidates.length);
    const target = candidates[selectedIndex];
    const centerAngle = selectedIndex * segmentAngle + segmentAngle / 2;
    const targetNormalized = normalizeDegrees(270 - centerAngle);
    const currentNormalized = normalizeDegrees(rotation);
    const correction = normalizeDegrees(targetNormalized - currentNormalized);
    const extraTurns = reduceMotion
      ? 0
      : (3 + Math.floor(Math.random() * 3)) * 360;
    const nextRotation = rotation + extraTurns + correction;

    setSpinning(true);
    setWinnerIndex(selectedIndex);
    setWinner(null);
    setRotation(nextRotation);

    spinTimeoutRef.current = window.setTimeout(() => {
      setSpinning(false);
      setWinner(target);
    }, spinDurationMs);
  }

  function resetWinner() {
    if (spinning) return;
    setWinner(null);
    setWinnerIndex(null);
  }

  const winnerLabel = winner?.lessonTitle?.trim()
    ? winner.lessonTitle
    : `Lesson ${winner?.lessonNumber ?? ""}`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button
        variant="secondary"
        className="h-10 rounded-full border border-primary/20 bg-primary/10 px-5 text-primary hover:bg-primary/15"
        onClick={() => handleOpenChange(true)}
      >
        <Gamepad2 className="h-4 w-4" />
        Spin Subject Wheel
      </Button>

      <DialogContent className="max-w-2xl overflow-hidden border-0 bg-transparent p-0 shadow-none">
        <div className="spin-wheel-shell relative overflow-hidden rounded-3xl border bg-card px-4 py-5 shadow-2xl sm:px-6 sm:py-6">
          <div className="spin-wheel-halo spin-wheel-halo-1" />
          <div className="spin-wheel-halo spin-wheel-halo-2" />
          <div className="spin-wheel-particles" />

          <DialogHeader className="relative z-10 mb-3">
            <DialogTitle className="flex items-center justify-center gap-2 text-center text-xl sm:text-2xl">
              <Sparkles className="h-5 w-5 text-primary" />
              Spin the Subject Wheel
            </DialogTitle>
            <p className="text-muted-foreground text-center text-sm">
              Let the wheel pick your next quest.
            </p>
          </DialogHeader>

          {candidates.length === 0 ? (
            <div className="relative z-10 mx-auto flex max-w-sm flex-col items-center gap-3 rounded-2xl border bg-card/80 p-6 text-center">
              <Trophy className="h-8 w-8 text-primary" />
              <p className="text-base font-semibold">
                No quests available right now
              </p>
              <p className="text-muted-foreground text-sm">
                You crushed the board. Add or unhide lessons to spin again.
              </p>
              <Button onClick={() => handleOpenChange(false)}>Close</Button>
            </div>
          ) : (
            <div className="relative z-10">
              <div className="relative mx-auto aspect-square w-full max-w-[26rem]">
                <div className="spin-wheel-pointer" />
                <div className="spin-wheel-ring absolute inset-0 rounded-full border-8 border-primary/20 bg-background/20 p-2 shadow-xl">
                  <div
                    className={cn(
                      "spin-wheel-face relative h-full w-full rounded-full border-4 border-white/70",
                      spinning && "spin-wheel-face-spinning",
                    )}
                    style={{
                      background: wheelGradient,
                      transform: `rotate(${rotation}deg)`,
                      transitionDuration: `${spinDurationMs}ms`,
                      transitionTimingFunction: reduceMotion
                        ? "linear"
                        : "cubic-bezier(0.18, 0.88, 0.22, 1)",
                    }}
                    aria-label="Subject wheel"
                    role="img"
                  >
                    {candidates.map((candidate, index) => {
                      const labelRotation =
                        index * segmentAngle + segmentAngle / 2;
                      return (
                        <div
                          key={`${candidate.subjectName}:${candidate.lessonId}`}
                          className="spin-wheel-label absolute left-1/2 top-1/2 w-32 origin-center text-center text-[11px] font-semibold text-zinc-900/85 sm:text-xs"
                          style={{
                            transform: `translate(-50%, -50%) rotate(${labelRotation}deg) translateY(-36%)`,
                          }}
                        >
                          <span className="inline-block max-w-full rounded-full bg-white/75 px-2 py-1 leading-tight shadow-sm backdrop-blur-xs">
                            {candidate.subjectName}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="absolute inset-[33%] rounded-full border-4 border-white/70 bg-primary/10 backdrop-blur-sm">
                    <div className="absolute inset-2 rounded-full border border-white/80 bg-card/80" />
                  </div>
                </div>
              </div>

              <div className="mt-5 flex justify-center">
                <Button
                  className="spin-wheel-spin-button h-12 rounded-full px-8 text-base font-black tracking-wide uppercase"
                  disabled={spinning}
                  onClick={spinWheel}
                >
                  {spinning ? "Spinning..." : "SPIN!"}
                </Button>
              </div>

              {winner && winnerIndex !== null && (
                <div className="spin-wheel-winner mt-4 rounded-2xl border bg-background/90 p-4 shadow-lg sm:p-5">
                  <div className="mb-2 flex items-center justify-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    <p className="text-sm font-semibold uppercase tracking-wide text-amber-600">
                      Winner
                    </p>
                  </div>
                  <p className="text-center text-2xl font-black tracking-tight">
                    {winner.subjectName}
                  </p>
                  <p className="text-muted-foreground mt-2 text-center text-sm">
                    {winner.entryCount}{" "}
                    {winner.entryCount === 1 ? "lesson" : "lessons"} waiting
                  </p>
                  <div className="mt-3 flex items-center justify-center gap-1.5 text-sm">
                    <StudentColorDot
                      color={winner.studentColor}
                      className="h-3 w-3"
                    />
                    <span>{winner.studentName}</span>
                    <span className="text-muted-foreground">&middot;</span>
                    <span className="text-muted-foreground">
                      {winner.resourceName}
                    </span>
                  </div>
                  <p className="mt-1 text-center text-sm font-medium">
                    {winnerLabel}
                  </p>

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
                    <Button asChild className="h-10 rounded-full px-6">
                      <Link href={`/lessons/${winner.lessonId}`}>
                        Start this lesson
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-10 rounded-full px-6"
                      onClick={resetWinner}
                    >
                      Spin again
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
