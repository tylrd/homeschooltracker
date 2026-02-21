"use client";

import { Plus, X } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { setCustomMoods } from "@/lib/actions/settings";
import {
  type LessonMoodOption,
  normalizeLessonMoodOptions,
} from "@/lib/lesson-moods";

type CustomMoodsInputProps = {
  defaultMoods: LessonMoodOption[];
};

const EMOJI_OPTIONS = [
  "😊",
  "🙂",
  "😀",
  "😁",
  "😄",
  "🤩",
  "😍",
  "🥳",
  "😭",
  "😢",
  "🥲",
  "😞",
  "😕",
  "😐",
  "😴",
  "😤",
  "😡",
  "🤯",
  "😬",
  "🙃",
  "🤔",
  "😌",
  "😅",
  "😎",
  "👍",
  "👏",
  "💪",
  "🧠",
  "🫶",
  "❤️",
  "⭐",
  "🎉",
  "📚",
  "✏️",
  "🧪",
  "🔬",
  "🎨",
  "🎵",
  "⚽",
  "🦷",
];

function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug || "mood";
}

export function CustomMoodsInput({ defaultMoods }: CustomMoodsInputProps) {
  const [moods, setMoods] = useState(defaultMoods);
  const [emoji, setEmoji] = useState("");
  const [label, setLabel] = useState("");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function persist(nextMoods: LessonMoodOption[]) {
    const normalized = normalizeLessonMoodOptions(nextMoods);
    setMoods(normalized);
    startTransition(async () => {
      await setCustomMoods(normalized);
    });
  }

  function handleAdd() {
    const trimmedEmoji = emoji.trim();
    const trimmedLabel = label.trim();
    if (!trimmedEmoji || !trimmedLabel) return;

    const baseValue = slugify(trimmedLabel);
    const existing = new Set(moods.map((mood) => mood.value));
    let value = baseValue;
    let index = 2;
    while (existing.has(value)) {
      value = `${baseValue}_${index}`;
      index += 1;
    }

    persist([...moods, { value, emoji: trimmedEmoji, label: trimmedLabel }]);
    setEmoji("");
    setLabel("");
  }

  function handleRemove(value: string) {
    persist(moods.filter((mood) => mood.value !== value));
  }

  return (
    <div className="space-y-2 rounded-md border px-3 py-2">
      <Label className="text-sm font-medium">Custom lesson moods</Label>
      <div className="flex items-center gap-2">
        <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-20 justify-start"
              disabled={isPending}
              title="Pick emoji"
            >
              {emoji || "🙂"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="start">
            <div className="grid grid-cols-8 gap-1">
              {EMOJI_OPTIONS.map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-base"
                  onClick={() => {
                    setEmoji(option);
                    setEmojiPickerOpen(false);
                  }}
                >
                  {option}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Mood name"
          disabled={isPending}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleAdd}
          disabled={
            isPending || emoji.trim().length === 0 || label.trim().length === 0
          }
          title="Add custom mood"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {moods.length > 0 && (
        <div className="space-y-1">
          {moods.map((mood) => (
            <div
              key={mood.value}
              className="flex items-center justify-between rounded-sm border px-2 py-1.5 text-sm"
            >
              <span className="inline-flex items-center gap-2">
                <span aria-hidden="true">{mood.emoji}</span>
                {mood.label}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleRemove(mood.value)}
                disabled={isPending}
                title={`Remove ${mood.label}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
