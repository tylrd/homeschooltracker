"use client";

import { Plus, X } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setRewardTemplates } from "@/lib/actions/settings";
import {
  normalizeRewardTemplates,
  type RewardTemplate,
} from "@/lib/rewards/templates";

type RewardTemplatesInputProps = {
  defaultTemplates: RewardTemplate[];
};

export function RewardTemplatesInput({
  defaultTemplates,
}: RewardTemplatesInputProps) {
  const [templates, setTemplates] = useState(defaultTemplates);
  const [name, setName] = useState("");
  const [xpCost, setXpCost] = useState("10");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();

  function persist(nextTemplates: RewardTemplate[]) {
    const normalized = normalizeRewardTemplates(nextTemplates);
    setTemplates(normalized);
    startTransition(async () => {
      await setRewardTemplates(normalized);
    });
  }

  function handleAdd() {
    const trimmedName = name.trim();
    const parsedCost = Number.parseInt(xpCost, 10);
    if (!trimmedName || !Number.isInteger(parsedCost) || parsedCost < 1) {
      return;
    }

    const next = [
      ...templates,
      {
        id: `${trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${Date.now()}`,
        name: trimmedName,
        xpCost: parsedCost,
        description: description.trim() || undefined,
      },
    ];

    persist(next);
    setName("");
    setXpCost("10");
    setDescription("");
  }

  function handleTemplateChange(
    id: string,
    field: "name" | "xpCost" | "description",
    value: string,
  ) {
    setTemplates((current) =>
      current.map((template) => {
        if (template.id !== id) return template;
        if (field === "xpCost") {
          const parsed = Number.parseInt(value, 10);
          return {
            ...template,
            xpCost:
              Number.isInteger(parsed) && parsed > 0 ? parsed : template.xpCost,
          };
        }
        if (field === "description") {
          return {
            ...template,
            description: value.trim().length > 0 ? value : undefined,
          };
        }
        return {
          ...template,
          name: value,
        };
      }),
    );
  }

  function handleRemove(id: string) {
    persist(templates.filter((template) => template.id !== id));
  }

  return (
    <div className="space-y-3 rounded-md border px-3 py-2">
      <Label className="text-sm font-medium">Reward templates</Label>

      <div className="space-y-2">
        {templates.map((template) => (
          <div key={template.id} className="space-y-2 rounded-md border p-2">
            <div className="flex items-center gap-2">
              <Input
                value={template.name}
                onChange={(e) =>
                  handleTemplateChange(template.id, "name", e.target.value)
                }
                onBlur={() => persist(templates)}
                placeholder="Reward name"
                disabled={isPending}
              />
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={1}
                  value={String(template.xpCost)}
                  onChange={(e) =>
                    handleTemplateChange(template.id, "xpCost", e.target.value)
                  }
                  onBlur={() => persist(templates)}
                  className="w-24 text-right"
                  disabled={isPending}
                />
                <span className="text-xs text-muted-foreground">XP</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleRemove(template.id)}
                disabled={isPending}
                title={`Remove ${template.name}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Input
              value={template.description ?? ""}
              onChange={(e) =>
                handleTemplateChange(template.id, "description", e.target.value)
              }
              onBlur={() => persist(templates)}
              placeholder="Description (optional)"
              disabled={isPending}
            />
          </div>
        ))}
      </div>

      <div className="space-y-2 rounded-md border border-dashed p-2">
        <div className="flex items-center gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New reward"
            disabled={isPending}
          />
          <Input
            type="number"
            min={1}
            value={xpCost}
            onChange={(e) => setXpCost(e.target.value)}
            className="w-24 text-right"
            disabled={isPending}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleAdd}
            disabled={
              isPending ||
              name.trim().length === 0 ||
              !Number.isInteger(Number.parseInt(xpCost, 10)) ||
              Number.parseInt(xpCost, 10) < 1
            }
            title="Add reward template"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          disabled={isPending}
        />
      </div>
    </div>
  );
}
