export type LessonMoodOption = {
  value: string;
  emoji: string;
  label: string;
};

export const DEFAULT_LESSON_MOODS: LessonMoodOption[] = [
  { value: "loved_it", emoji: "😊", label: "Loved it" },
  { value: "tears", emoji: "😭", label: "Tears" },
  { value: "meltdown", emoji: "😡", label: "Meltdown" },
  { value: "pulling_teeth", emoji: "🦷", label: "Pulling teeth" },
];

export const LESSON_MOODS = DEFAULT_LESSON_MOODS;

function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug || "mood";
}

function isLessonMoodOption(value: unknown): value is LessonMoodOption {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<LessonMoodOption>;
  return (
    typeof candidate.value === "string" &&
    typeof candidate.emoji === "string" &&
    typeof candidate.label === "string"
  );
}

export function normalizeLessonMoodOptions(input: unknown): LessonMoodOption[] {
  if (!Array.isArray(input)) return DEFAULT_LESSON_MOODS;

  const valueCounts = new Map<string, number>();
  const normalized: LessonMoodOption[] = [];

  for (const raw of input) {
    let label = "";
    let emoji = "";
    let baseValue = "";

    if (typeof raw === "string") {
      label = raw.trim();
      emoji = "🙂";
      baseValue = slugify(label);
    } else if (isLessonMoodOption(raw)) {
      label = raw.label.trim();
      emoji = raw.emoji.trim();
      baseValue = slugify(raw.value.trim() || label);
    } else {
      continue;
    }

    if (!label || !emoji) continue;
    const currentCount = valueCounts.get(baseValue) ?? 0;
    valueCounts.set(baseValue, currentCount + 1);
    const value =
      currentCount === 0 ? baseValue : `${baseValue}_${currentCount + 1}`;
    normalized.push({ value, emoji, label });
  }

  if (normalized.length === 0) return DEFAULT_LESSON_MOODS;
  return normalized.slice(0, 24);
}

export function getLessonMoodMeta(
  mood: string | null | undefined,
  options: LessonMoodOption[] = DEFAULT_LESSON_MOODS,
) {
  if (!mood) return null;
  return options.find((item) => item.value === mood) ?? null;
}
