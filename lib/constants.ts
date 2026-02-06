export const STUDENT_COLORS = [
  {
    name: "Rose",
    value: "rose",
    bg: "bg-rose-100",
    bgSolid: "bg-rose-500",
    border: "border-rose-400",
    text: "text-rose-700",
    dot: "bg-rose-500",
  },
  {
    name: "Sky",
    value: "sky",
    bg: "bg-sky-100",
    bgSolid: "bg-sky-500",
    border: "border-sky-400",
    text: "text-sky-700",
    dot: "bg-sky-500",
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
    name: "Teal",
    value: "teal",
    bg: "bg-teal-100",
    bgSolid: "bg-teal-500",
    border: "border-teal-400",
    text: "text-teal-700",
    dot: "bg-teal-500",
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
] as const;

export type StudentColor = (typeof STUDENT_COLORS)[number]["value"];

export function getColorClasses(colorValue: string) {
  return (
    STUDENT_COLORS.find((c) => c.value === colorValue) ?? STUDENT_COLORS[0]
  );
}
