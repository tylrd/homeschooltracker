export const MAX_STUDENT_LEVEL = 20;
export const BASE_PERK_SLOTS = 3;
export const FIRST_LEVEL_UP_XP = 100;
export const STANDARD_LEVEL_STEP_XP = 1000;

export type PerkRarity = "common" | "rare" | "epic";

export type PerkDefinition = {
  key: string;
  name: string;
  description: string;
  rarity: PerkRarity;
  unlockLevel: number;
};

export const PERK_LIBRARY: PerkDefinition[] = [
  {
    key: "keen_focus",
    name: "Keen Focus",
    description: "Daily rewards grant +1 XP.",
    rarity: "common",
    unlockLevel: 1,
  },
  {
    key: "steady_hands",
    name: "Steady Hands",
    description: "Streak bonuses grant +1 extra XP.",
    rarity: "common",
    unlockLevel: 1,
  },
  {
    key: "daily_ritual",
    name: "Daily Ritual",
    description: "First lesson completion each day grants +2 XP.",
    rarity: "common",
    unlockLevel: 2,
  },
  {
    key: "comeback_drive",
    name: "Comeback Drive",
    description: "If streak was broken yesterday, gain +3 XP today.",
    rarity: "rare",
    unlockLevel: 3,
  },
  {
    key: "mentor_note",
    name: "Mentor Note",
    description: "Shared lesson completions grant +1 XP.",
    rarity: "common",
    unlockLevel: 4,
  },
  {
    key: "quick_recovery",
    name: "Quick Recovery",
    description: "Reversal penalties are reduced by 1 XP.",
    rarity: "rare",
    unlockLevel: 5,
  },
  {
    key: "team_synergy",
    name: "Team Synergy",
    description: "If all assigned lessons are completed, gain +3 XP.",
    rarity: "rare",
    unlockLevel: 6,
  },
  {
    key: "high_spirits",
    name: "High Spirits",
    description: "Mood-tagged completions grant +1 XP.",
    rarity: "common",
    unlockLevel: 7,
  },
  {
    key: "prepared_path",
    name: "Prepared Path",
    description: "Planned lessons finished on time grant +2 XP.",
    rarity: "rare",
    unlockLevel: 8,
  },
  {
    key: "learning_aura",
    name: "Learning Aura",
    description: "Every 5th completion grants a +4 XP burst.",
    rarity: "epic",
    unlockLevel: 9,
  },
  {
    key: "golden_hour",
    name: "Golden Hour",
    description: "Daily reward modifier bonuses are increased by +1 XP.",
    rarity: "rare",
    unlockLevel: 10,
  },
  {
    key: "badge_hunter",
    name: "Badge Hunter",
    description: "Milestone badge days grant +5 XP.",
    rarity: "epic",
    unlockLevel: 11,
  },
  {
    key: "streak_guard",
    name: "Streak Guard",
    description: "Keep +1 streak progress once per week after a miss.",
    rarity: "epic",
    unlockLevel: 12,
  },
  {
    key: "velocity",
    name: "Velocity",
    description: "Complete 3 lessons in a day for +4 XP.",
    rarity: "rare",
    unlockLevel: 13,
  },
  {
    key: "echo_point",
    name: "Echo Point",
    description: "Every streak bonus echoes +1 XP the next day.",
    rarity: "epic",
    unlockLevel: 14,
  },
  {
    key: "legend_mark",
    name: "Legend Mark",
    description: "Daily reward track grants +2 bonus XP.",
    rarity: "epic",
    unlockLevel: 15,
  },
  {
    key: "mastery_loop",
    name: "Mastery Loop",
    description: "Every 10th lesson completion grants +6 XP.",
    rarity: "epic",
    unlockLevel: 16,
  },
  {
    key: "horizon_boost",
    name: "Horizon Boost",
    description: "Lessons completed after a bump gain +2 XP.",
    rarity: "rare",
    unlockLevel: 17,
  },
  {
    key: "star_saver",
    name: "Star Saver",
    description: "Refund events gain +1 XP.",
    rarity: "rare",
    unlockLevel: 18,
  },
  {
    key: "prestige_prep",
    name: "Prestige Prep",
    description: "At level 20, gain +10 XP on next daily track.",
    rarity: "epic",
    unlockLevel: 19,
  },
  {
    key: "apex_form",
    name: "Apex Form",
    description: "Level 20 grants +3 XP to all daily reward awards.",
    rarity: "epic",
    unlockLevel: 20,
  },
];

const PERK_MAP = new Map(PERK_LIBRARY.map((perk) => [perk.key, perk]));

export function getPerkDefinition(perkKey: string) {
  return PERK_MAP.get(perkKey) ?? null;
}

export function getXpRequiredForLevel(level: number) {
  if (level <= 1) return 0;
  if (level === 2) return FIRST_LEVEL_UP_XP;
  return (level - 2) * STANDARD_LEVEL_STEP_XP;
}
