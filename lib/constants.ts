export const STUDENT_COLORS = [
  {
    name: "Rose",
    value: "rose",
    bg: "bg-rose-100/80 dark:bg-rose-900/40",
    bgSolid: "bg-rose-500 dark:bg-rose-500",
    border: "border-rose-400 dark:border-rose-600",
    text: "text-rose-700 dark:text-rose-300",
    dot: "bg-rose-500",
  },
  {
    name: "Sky",
    value: "sky",
    bg: "bg-sky-100/80 dark:bg-sky-900/40",
    bgSolid: "bg-sky-500 dark:bg-sky-500",
    border: "border-sky-400 dark:border-sky-600",
    text: "text-sky-700 dark:text-sky-300",
    dot: "bg-sky-500",
  },
  {
    name: "Amber",
    value: "amber",
    bg: "bg-amber-100/80 dark:bg-amber-900/40",
    bgSolid: "bg-amber-500 dark:bg-amber-500",
    border: "border-amber-400 dark:border-amber-600",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  {
    name: "Emerald",
    value: "emerald",
    bg: "bg-emerald-100/80 dark:bg-emerald-900/40",
    bgSolid: "bg-emerald-500 dark:bg-emerald-500",
    border: "border-emerald-400 dark:border-emerald-600",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  {
    name: "Violet",
    value: "violet",
    bg: "bg-violet-100/80 dark:bg-violet-900/40",
    bgSolid: "bg-violet-500 dark:bg-violet-500",
    border: "border-violet-400 dark:border-violet-600",
    text: "text-violet-700 dark:text-violet-300",
    dot: "bg-violet-500",
  },
  {
    name: "Orange",
    value: "orange",
    bg: "bg-orange-100/80 dark:bg-orange-900/40",
    bgSolid: "bg-orange-500 dark:bg-orange-500",
    border: "border-orange-400 dark:border-orange-600",
    text: "text-orange-700 dark:text-orange-300",
    dot: "bg-orange-500",
  },
  {
    name: "Teal",
    value: "teal",
    bg: "bg-teal-100/80 dark:bg-teal-900/40",
    bgSolid: "bg-teal-500 dark:bg-teal-500",
    border: "border-teal-400 dark:border-teal-600",
    text: "text-teal-700 dark:text-teal-300",
    dot: "bg-teal-500",
  },
  {
    name: "Pink",
    value: "pink",
    bg: "bg-pink-100/80 dark:bg-pink-900/40",
    bgSolid: "bg-pink-500 dark:bg-pink-500",
    border: "border-pink-400 dark:border-pink-600",
    text: "text-pink-700 dark:text-pink-300",
    dot: "bg-pink-500",
  },
] as const;

export type StudentColor = (typeof STUDENT_COLORS)[number]["value"];

export function getColorClasses(colorValue: string) {
  return (
    STUDENT_COLORS.find((c) => c.value === colorValue) ?? STUDENT_COLORS[0]
  );
}
