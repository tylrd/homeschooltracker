"use client";

import { Gamepad2, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
const POINTER_ANGLE_DEG = 270;
const WHEEL_START_OFFSET_DEG = -90;
const BURST_COLORS = [
  "oklch(0.8 0.12 32)",
  "oklch(0.84 0.15 68)",
  "oklch(0.77 0.12 160)",
  "oklch(0.74 0.11 236)",
  "oklch(0.8 0.12 305)",
];

type ConfettiPiece = {
  id: string;
  x: number;
  y: number;
  rotate: number;
  color: string;
  delayMs: number;
  durationMs: number;
  width: number;
  height: number;
};

function normalizeDegrees(value: number) {
  return ((value % 360) + 360) % 360;
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function SpinSubjectWheelDialog({
  candidates,
}: {
  candidates: WheelSubjectCandidate[];
}) {
  const [selectedStudentId, setSelectedStudentId] = useState<"all" | string>(
    "all",
  );
  const [open, setOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [spinDurationMs, setSpinDurationMs] = useState(3800);
  const [burstActive, setBurstActive] = useState(false);
  const [burstCycle, setBurstCycle] = useState(0);
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  const [winner, setWinner] = useState<WheelSubjectCandidate | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const spinTimeoutRef = useRef<number | null>(null);
  const burstTimeoutRef = useRef<number | null>(null);
  const confettiTimeoutRef = useRef<number | null>(null);

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
      if (burstTimeoutRef.current !== null) {
        window.clearTimeout(burstTimeoutRef.current);
      }
      if (confettiTimeoutRef.current !== null) {
        window.clearTimeout(confettiTimeoutRef.current);
      }
    };
  }, []);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    setSpinning(false);
    setWinnerIndex(null);
    setWinner(null);
    setBurstActive(false);
    setConfettiPieces([]);
    setSelectedStudentId("all");
    if (spinTimeoutRef.current !== null) {
      window.clearTimeout(spinTimeoutRef.current);
    }
    if (burstTimeoutRef.current !== null) {
      window.clearTimeout(burstTimeoutRef.current);
    }
    if (confettiTimeoutRef.current !== null) {
      window.clearTimeout(confettiTimeoutRef.current);
    }
  }

  function triggerSpinEffects() {
    if (reduceMotion) return;

    if (burstTimeoutRef.current !== null) {
      window.clearTimeout(burstTimeoutRef.current);
    }
    if (confettiTimeoutRef.current !== null) {
      window.clearTimeout(confettiTimeoutRef.current);
    }

    const pieces = Array.from({ length: randomInt(16, 24) }, (_, index) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = randomInt(86, 168);
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      return {
        id: `${Date.now()}-${index}`,
        x,
        y,
        rotate: randomInt(-240, 240),
        color: BURST_COLORS[randomInt(0, BURST_COLORS.length - 1)],
        delayMs: randomInt(0, 120),
        durationMs: randomInt(700, 1200),
        width: randomInt(5, 10),
        height: randomInt(8, 16),
      };
    });

    setConfettiPieces(pieces);
    setBurstActive(true);
    setBurstCycle((prev) => prev + 1);

    burstTimeoutRef.current = window.setTimeout(() => {
      setBurstActive(false);
    }, 450);

    confettiTimeoutRef.current = window.setTimeout(() => {
      setConfettiPieces([]);
    }, 1400);
  }

  const studentOptions = useMemo(() => {
    const byStudent = new Map<
      string,
      { id: string; name: string; color: string }
    >();
    for (const candidate of candidates) {
      if (byStudent.has(candidate.studentId)) continue;
      byStudent.set(candidate.studentId, {
        id: candidate.studentId,
        name: candidate.studentName,
        color: candidate.studentColor,
      });
    }
    return Array.from(byStudent.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [candidates]);

  useEffect(() => {
    if (selectedStudentId === "all") return;
    if (studentOptions.some((student) => student.id === selectedStudentId))
      return;
    setSelectedStudentId("all");
  }, [selectedStudentId, studentOptions]);

  const visibleCandidates = useMemo(() => {
    if (selectedStudentId === "all") return candidates;
    return candidates.filter(
      (candidate) => candidate.studentId === selectedStudentId,
    );
  }, [candidates, selectedStudentId]);

  function selectStudent(studentId: "all" | string) {
    if (spinning) return;
    setSelectedStudentId(studentId);
    setWinner(null);
    setWinnerIndex(null);
  }

  const segmentAngle =
    visibleCandidates.length > 0 ? 360 / visibleCandidates.length : 360;
  const hasFilteredOutCandidates =
    candidates.length > 0 && visibleCandidates.length === 0;

  const wheelGradient = useMemo(() => {
    if (visibleCandidates.length === 0) {
      return "conic-gradient(from -90deg, oklch(0.9 0 0), oklch(0.9 0 0))";
    }

    const stops = visibleCandidates.map((_, index) => {
      const start = index * segmentAngle;
      const end = (index + 1) * segmentAngle;
      const color = WHEEL_COLORS[index % WHEEL_COLORS.length];
      return `${color} ${start}deg ${end}deg`;
    });

    return `conic-gradient(from -90deg, ${stops.join(", ")})`;
  }, [segmentAngle, visibleCandidates]);

  function spinWheel() {
    if (spinning || visibleCandidates.length === 0) return;
    triggerSpinEffects();

    const selectedIndex = Math.floor(Math.random() * visibleCandidates.length);
    const target = visibleCandidates[selectedIndex];

    const segmentStartAngle =
      WHEEL_START_OFFSET_DEG + selectedIndex * segmentAngle;
    const segmentPadding = Math.min(10, Math.max(2, segmentAngle * 0.12));
    const minTargetAngle = segmentStartAngle + segmentPadding;
    const maxTargetAngle = segmentStartAngle + segmentAngle - segmentPadding;
    const targetAngleWithinSegment =
      minTargetAngle + Math.random() * (maxTargetAngle - minTargetAngle);
    const targetNormalized = normalizeDegrees(
      POINTER_ANGLE_DEG - targetAngleWithinSegment,
    );

    const currentNormalized = normalizeDegrees(rotation);
    const correction = normalizeDegrees(targetNormalized - currentNormalized);

    const fullTurns = reduceMotion ? 0 : randomInt(4, 8);
    const extraTurns = fullTurns * 360;
    const duration = reduceMotion ? 450 : 2600 + fullTurns * 380;
    const nextRotation = rotation + extraTurns + correction;

    setSpinning(true);
    setSpinDurationMs(duration);
    setWinnerIndex(selectedIndex);
    setWinner(null);
    setRotation(nextRotation);

    spinTimeoutRef.current = window.setTimeout(() => {
      setSpinning(false);
      setWinner(target);
    }, duration);
  }

  function resetWinner() {
    if (spinning) return;
    setWinner(null);
    setWinnerIndex(null);
  }

  const winnerLabel = winner?.lessonTitle?.trim()
    ? winner.lessonTitle
    : `Lesson ${winner?.lessonNumber ?? ""}`;
  const hasWinner = winner !== null && winnerIndex !== null;

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
        <div
          className={cn(
            "spin-wheel-shell relative overflow-hidden rounded-3xl border bg-card px-4 py-5 shadow-2xl sm:px-6 sm:py-6",
            hasWinner && "px-3 py-4 sm:px-5 sm:py-5",
          )}
        >
          <div className="spin-wheel-halo spin-wheel-halo-1" />
          <div className="spin-wheel-halo spin-wheel-halo-2" />
          <div className="spin-wheel-particles" />
          <div
            key={`burst-${burstCycle}`}
            className={cn(
              "spin-wheel-burst-ring pointer-events-none absolute inset-0 z-30",
              burstActive && "spin-wheel-burst-ring-active",
            )}
          />
          {confettiPieces.length > 0 && (
            <div className="spin-wheel-confetti pointer-events-none absolute inset-0 z-30">
              {confettiPieces.map((piece) => (
                <span
                  key={piece.id}
                  className="spin-wheel-confetti-piece"
                  style={
                    {
                      "--tx": `${piece.x}px`,
                      "--ty": `${piece.y}px`,
                      "--r": `${piece.rotate}deg`,
                      "--delay": `${piece.delayMs}ms`,
                      "--dur": `${piece.durationMs}ms`,
                      width: `${piece.width}px`,
                      height: `${piece.height}px`,
                      background: piece.color,
                    } as CSSProperties
                  }
                />
              ))}
            </div>
          )}
          {burstActive && (
            <div className="spin-wheel-launch-text pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
              LET'S GO!
            </div>
          )}

          <DialogHeader className="relative z-10 mb-3">
            <DialogTitle className="flex items-center justify-center gap-2 text-center text-xl sm:text-2xl">
              <Sparkles className="h-5 w-5 text-primary" />
              Spin the Subject Wheel
            </DialogTitle>
            <p className="text-muted-foreground text-center text-sm">
              Let the wheel pick your next quest.
            </p>
          </DialogHeader>

          {studentOptions.length > 0 && (
            <div className="relative z-10 mb-4 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                disabled={spinning}
                onClick={() => selectStudent("all")}
                className={cn(
                  "inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50",
                  selectedStudentId === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                All
              </button>
              {studentOptions.map((student) => (
                <button
                  type="button"
                  key={student.id}
                  disabled={spinning}
                  onClick={() => selectStudent(student.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50",
                    selectedStudentId === student.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:text-foreground",
                  )}
                >
                  <StudentColorDot
                    color={student.color}
                    className="h-2.5 w-2.5"
                  />
                  {student.name}
                </button>
              ))}
            </div>
          )}

          {visibleCandidates.length === 0 ? (
            <div className="relative z-10 mx-auto flex max-w-sm flex-col items-center gap-3 rounded-2xl border bg-card/80 p-6 text-center">
              <Trophy className="h-8 w-8 text-primary" />
              <p className="text-base font-semibold">
                No quests available right now
              </p>
              <p className="text-muted-foreground text-sm">
                {hasFilteredOutCandidates
                  ? "No quests for this student. Choose another student or All."
                  : "You crushed the board. Add or unhide lessons to spin again."}
              </p>
              <Button onClick={() => handleOpenChange(false)}>Close</Button>
            </div>
          ) : (
            <div className="relative z-10">
              <div
                className={cn(
                  "relative mx-auto aspect-square w-full max-w-[26rem]",
                  hasWinner && "max-w-[15.5rem] sm:max-w-[21rem]",
                )}
              >
                <div
                  className={cn(
                    "spin-wheel-pointer",
                    burstActive && "spin-wheel-pointer-launch",
                  )}
                />
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
                    {visibleCandidates.map((candidate, index) => {
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

              <div
                className={cn("mt-5 flex justify-center", hasWinner && "mt-3")}
              >
                <Button
                  className={cn(
                    "spin-wheel-spin-button h-12 rounded-full px-8 text-base font-black tracking-wide uppercase",
                    hasWinner && "h-10 px-6 text-sm",
                    burstActive && "spin-wheel-spin-button-launch",
                  )}
                  disabled={spinning || visibleCandidates.length === 0}
                  onClick={spinWheel}
                >
                  {spinning ? "Spinning..." : "SPIN!"}
                </Button>
              </div>

              {hasWinner && winner && (
                <div className="spin-wheel-winner mt-3 rounded-2xl border bg-background/90 p-3 shadow-lg sm:mt-4 sm:p-4">
                  <div className="mb-1.5 flex items-center justify-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    <p className="text-sm font-semibold uppercase tracking-wide text-amber-600">
                      Winner
                    </p>
                  </div>
                  <p className="text-center text-xl font-black tracking-tight sm:text-2xl">
                    {winner.subjectName}
                  </p>
                  <p className="text-muted-foreground mt-1 text-center text-xs sm:mt-2 sm:text-sm">
                    {winner.entryCount}{" "}
                    {winner.entryCount === 1 ? "lesson" : "lessons"} waiting
                  </p>
                  <div className="mt-2 flex items-center justify-center gap-1.5 text-xs sm:mt-3 sm:text-sm">
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
                  <p className="mt-1 text-center text-xs font-medium sm:text-sm">
                    {winnerLabel}
                  </p>

                  <div className="mt-3 grid grid-cols-1 gap-2 sm:mt-4 sm:flex sm:justify-center">
                    <Button
                      asChild
                      className="h-9 rounded-full px-5 text-sm sm:h-10 sm:px-6"
                    >
                      <Link href={`/lessons/${winner.lessonId}`}>
                        Start this lesson
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-9 rounded-full px-5 text-sm sm:h-10 sm:px-6"
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
