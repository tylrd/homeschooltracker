export const STUDENT_COLORS = [
  {
    name: "Rose",
    value: "rose",
    bg: "bg-rose-100/50 dark:bg-rose-900/40",
    bgSolid: "bg-rose-400/80 dark:bg-rose-500",
    border: "border-rose-300 dark:border-rose-600",
    text: "text-rose-600 dark:text-rose-300",
    dot: "bg-rose-400",
  },
  {
    name: "Sky",
    value: "sky",
    bg: "bg-sky-100/50 dark:bg-sky-900/40",
    bgSolid: "bg-sky-400/80 dark:bg-sky-500",
    border: "border-sky-300 dark:border-sky-600",
    text: "text-sky-600 dark:text-sky-300",
    dot: "bg-sky-400",
  },
  {
    name: "Amber",
    value: "amber",
    bg: "bg-amber-100/50 dark:bg-amber-900/40",
    bgSolid: "bg-amber-400/80 dark:bg-amber-500",
    border: "border-amber-300 dark:border-amber-600",
    text: "text-amber-600 dark:text-amber-300",
    dot: "bg-amber-400",
  },
  {
    name: "Emerald",
    value: "emerald",
    bg: "bg-emerald-100/50 dark:bg-emerald-900/40",
    bgSolid: "bg-emerald-400/80 dark:bg-emerald-500",
    border: "border-emerald-300 dark:border-emerald-600",
    text: "text-emerald-600 dark:text-emerald-300",
    dot: "bg-emerald-400",
  },
  {
    name: "Violet",
    value: "violet",
    bg: "bg-violet-100/50 dark:bg-violet-900/40",
    bgSolid: "bg-violet-400/80 dark:bg-violet-500",
    border: "border-violet-300 dark:border-violet-600",
    text: "text-violet-600 dark:text-violet-300",
    dot: "bg-violet-400",
  },
  {
    name: "Orange",
    value: "orange",
    bg: "bg-orange-100/50 dark:bg-orange-900/40",
    bgSolid: "bg-orange-400/80 dark:bg-orange-500",
    border: "border-orange-300 dark:border-orange-600",
    text: "text-orange-600 dark:text-orange-300",
    dot: "bg-orange-400",
  },
  {
    name: "Teal",
    value: "teal",
    bg: "bg-teal-100/50 dark:bg-teal-900/40",
    bgSolid: "bg-teal-400/80 dark:bg-teal-500",
    border: "border-teal-300 dark:border-teal-600",
    text: "text-teal-600 dark:text-teal-300",
    dot: "bg-teal-400",
  },
  {
    name: "Pink",
    value: "pink",
    bg: "bg-pink-100/50 dark:bg-pink-900/40",
    bgSolid: "bg-pink-400/80 dark:bg-pink-500",
    border: "border-pink-300 dark:border-pink-600",
    text: "text-pink-600 dark:text-pink-300",
    dot: "bg-pink-400",
  },
] as const;

export type StudentColor = (typeof STUDENT_COLORS)[number]["value"];

export function getColorClasses(colorValue: string) {
  return (
    STUDENT_COLORS.find((c) => c.value === colorValue) ?? STUDENT_COLORS[0]
  );
}
