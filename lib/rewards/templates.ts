export type RewardTemplate = {
  id: string;
  name: string;
  xpCost: number;
  description?: string;
};

export const DEFAULT_REWARD_TEMPLATES: RewardTemplate[] = [
  {
    id: "movie_night",
    name: "Movie night",
    xpCost: 50,
  },
  {
    id: "extra_screen_time",
    name: "Extra screen time",
    xpCost: 30,
  },
];

function toTemplateId(input: string): string {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug || "reward";
}

function parseTemplate(
  value: unknown,
  index: number,
): (Omit<RewardTemplate, "id"> & { idHint: string }) | null {
  if (!value || typeof value !== "object") return null;

  const row = value as {
    id?: unknown;
    name?: unknown;
    xpCost?: unknown;
    description?: unknown;
  };

  const name = typeof row.name === "string" ? row.name.trim() : "";
  if (!name) return null;

  const xpCostRaw =
    typeof row.xpCost === "number"
      ? row.xpCost
      : typeof row.xpCost === "string"
        ? Number.parseInt(row.xpCost, 10)
        : Number.NaN;

  if (!Number.isInteger(xpCostRaw) || xpCostRaw < 1) {
    return null;
  }

  const description =
    typeof row.description === "string" && row.description.trim().length > 0
      ? row.description.trim()
      : undefined;

  const idHintBase =
    typeof row.id === "string" && row.id.trim().length > 0
      ? row.id.trim()
      : `${name}_${index + 1}`;

  return {
    idHint: idHintBase,
    name,
    xpCost: xpCostRaw,
    description,
  };
}

export function normalizeRewardTemplates(input: unknown): RewardTemplate[] {
  if (!Array.isArray(input)) {
    return DEFAULT_REWARD_TEMPLATES;
  }

  const usedIds = new Set<string>();
  const normalized: RewardTemplate[] = [];

  for (let i = 0; i < input.length; i++) {
    const parsed = parseTemplate(input[i], i);
    if (!parsed) continue;

    const idBase = toTemplateId(parsed.idHint);
    let id = idBase;
    let suffix = 2;

    while (usedIds.has(id)) {
      id = `${idBase}_${suffix}`;
      suffix += 1;
    }

    usedIds.add(id);
    normalized.push({
      id,
      name: parsed.name,
      xpCost: parsed.xpCost,
      description: parsed.description,
    });
  }

  return normalized.length > 0 ? normalized : DEFAULT_REWARD_TEMPLATES;
}
