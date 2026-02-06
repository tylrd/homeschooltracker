export const ABSENCE_COLORS = [
  {
    name: "Red",
    value: "red",
    bg: "bg-red-100",
    bgSolid: "bg-red-500",
    border: "border-red-400",
    text: "text-red-700",
    dot: "bg-red-500",
  },
  {
    name: "Blue",
    value: "blue",
    bg: "bg-blue-100",
    bgSolid: "bg-blue-500",
    border: "border-blue-400",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  {
    name: "Amber",
    value: "amber",
    bg: "bg-amber-100",
    bgSolid: "bg-amber-500",
    border: "border-amber-400",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  {
    name: "Emerald",
    value: "emerald",
    bg: "bg-emerald-100",
    bgSolid: "bg-emerald-500",
    border: "border-emerald-400",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  {
    name: "Violet",
    value: "violet",
    bg: "bg-violet-100",
    bgSolid: "bg-violet-500",
    border: "border-violet-400",
    text: "text-violet-700",
    dot: "bg-violet-500",
  },
  {
    name: "Orange",
    value: "orange",
    bg: "bg-orange-100",
    bgSolid: "bg-orange-500",
    border: "border-orange-400",
    text: "text-orange-700",
    dot: "bg-orange-500",
  },
  {
    name: "Pink",
    value: "pink",
    bg: "bg-pink-100",
    bgSolid: "bg-pink-500",
    border: "border-pink-400",
    text: "text-pink-700",
    dot: "bg-pink-500",
  },
  {
    name: "Slate",
    value: "slate",
    bg: "bg-slate-100",
    bgSolid: "bg-slate-500",
    border: "border-slate-400",
    text: "text-slate-700",
    dot: "bg-slate-500",
  },
] as const;

export type AbsenceColor = (typeof ABSENCE_COLORS)[number]["value"];

export function getAbsenceColorClasses(colorValue: string) {
  return (
    ABSENCE_COLORS.find((c) => c.value === colorValue) ?? ABSENCE_COLORS[0]
  );
}
