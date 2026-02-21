export const LESSON_MOODS = [
  { value: "loved_it", emoji: "😊", label: "Loved it" },
  { value: "tears", emoji: "😭", label: "Tears" },
  { value: "meltdown", emoji: "😡", label: "Meltdown" },
  { value: "pulling_teeth", emoji: "🦷", label: "Pulling teeth" },
] as const;

export type LessonMood = (typeof LESSON_MOODS)[number]["value"];

export function getLessonMoodMeta(mood: string | null | undefined) {
  if (!mood) return null;
  return LESSON_MOODS.find((item) => item.value === mood) ?? null;
}
