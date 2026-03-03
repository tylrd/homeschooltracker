export const DAILY_REWARD_BASE_XP = 5;
const MODIFIER_COUNT = 100;
const MODIFIER_PATTERN_COUNT = 10;

type ModifierPattern =
  | "momentum_surge"
  | "double_time"
  | "streak_echo"
  | "catch_up_boost"
  | "lucky_star"
  | "lucky_duo"
  | "lesson_loadout"
  | "parity_shift"
  | "squad_goal"
  | "jackpot_relay";

export type DailyRewardModifier = {
  index: number;
  id: string;
  tier: number;
  pattern: ModifierPattern;
  name: string;
  description: string;
};

export type DailyRewardStudentContext = {
  studentId: string;
  totalLessons: number;
  xpBalance: number;
  currentStreak: number;
};

export type DailyRewardStudentAward = {
  studentId: string;
  baseXp: number;
  bonusXp: number;
  totalXp: number;
  reason: string;
};

const MODIFIER_PATTERNS: {
  pattern: ModifierPattern;
  name: string;
  describe: (tier: number) => string;
}[] = [
  {
    pattern: "momentum_surge",
    name: "Momentum Surge",
    describe: (tier) => `Everyone gains +${tier} bonus XP.`,
  },
  {
    pattern: "double_time",
    name: "Double Time",
    describe: (tier) =>
      `Everyone gets a ${Math.round((1 + tier * 0.08) * 100)}% XP multiplier.`,
  },
  {
    pattern: "streak_echo",
    name: "Streak Echo",
    describe: (tier) =>
      `Students at streak ${tier}+ gain +${tier + 2} extra XP.`,
  },
  {
    pattern: "catch_up_boost",
    name: "Catch-Up Boost",
    describe: (tier) =>
      `Students below team average XP gain +${tier * 2} bonus XP.`,
  },
  {
    pattern: "lucky_star",
    name: "Lucky Star",
    describe: (tier) => `One student wins +${tier * 4} bonus XP.`,
  },
  {
    pattern: "lucky_duo",
    name: "Lucky Duo",
    describe: (tier) => `Two students each win +${tier * 3} bonus XP.`,
  },
  {
    pattern: "lesson_loadout",
    name: "Lesson Loadout",
    describe: (tier) => `Bonus XP equals lesson count, capped at ${tier + 1}.`,
  },
  {
    pattern: "parity_shift",
    name: "Parity Shift",
    describe: (tier) =>
      `Split bonus: major +${tier * 2}, minor +${Math.floor(tier / 2)}.`,
  },
  {
    pattern: "squad_goal",
    name: "Squad Goal",
    describe: (tier) =>
      `If 3+ students qualify, everyone gets +${tier * 2}; otherwise one gets +${tier * 5}.`,
  },
  {
    pattern: "jackpot_relay",
    name: "Jackpot Relay",
    describe: (tier) =>
      `Everyone gains +${tier}; one student gains an extra +${tier * 5}.`,
  },
];

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function getTier(index: number) {
  return Math.floor(index / MODIFIER_PATTERN_COUNT) + 1;
}

function getPattern(index: number) {
  const pattern = MODIFIER_PATTERNS[index % MODIFIER_PATTERN_COUNT];
  if (!pattern) {
    throw new Error(`Invalid modifier pattern index: ${index}`);
  }
  return pattern;
}

function modifierFromIndex(index: number): DailyRewardModifier {
  const pattern = getPattern(index);
  const tier = getTier(index);
  const number = String(index + 1).padStart(3, "0");
  return {
    index,
    id: `mod_${number}`,
    tier,
    pattern: pattern.pattern,
    name: `${pattern.name} ${tier}`,
    description: pattern.describe(tier),
  };
}

export const DAILY_REWARD_MODIFIERS: DailyRewardModifier[] = Array.from(
  { length: MODIFIER_COUNT },
  (_, index) => modifierFromIndex(index),
);

export function getDailyRewardModifier({
  organizationId,
  date,
}: {
  organizationId: string;
  date: string;
}) {
  const roll = hashString(`${organizationId}:${date}`) % MODIFIER_COUNT;
  const modifier = DAILY_REWARD_MODIFIERS[roll];
  if (!modifier) {
    throw new Error(`Invalid daily reward modifier roll: ${roll}`);
  }
  return modifier;
}

function getDeterministicOrder(
  students: DailyRewardStudentContext[],
  seed: string,
): string[] {
  return students
    .map((student) => ({
      studentId: student.studentId,
      score: hashString(`${seed}:${student.studentId}`),
    }))
    .sort((a, b) => a.score - b.score || a.studentId.localeCompare(b.studentId))
    .map((entry) => entry.studentId);
}

export function calculateDailyRewardAwards({
  organizationId,
  date,
  students,
  baseXp = DAILY_REWARD_BASE_XP,
}: {
  organizationId: string;
  date: string;
  students: DailyRewardStudentContext[];
  baseXp?: number;
}) {
  const modifier = getDailyRewardModifier({ organizationId, date });
  const orderedIds = getDeterministicOrder(students, `${date}:${modifier.id}`);
  const luckyOne = orderedIds[0] ?? null;
  const luckyTwo = new Set(orderedIds.slice(0, 2));
  const averageBalance =
    students.length === 0
      ? 0
      : students.reduce((sum, student) => sum + student.xpBalance, 0) /
        students.length;

  const awards: DailyRewardStudentAward[] = students.map((student) => {
    let bonusXp = 0;
    let reason = modifier.pattern;

    switch (modifier.pattern) {
      case "momentum_surge": {
        bonusXp += modifier.tier;
        reason = `momentum:+${modifier.tier}`;
        break;
      }
      case "double_time": {
        const multiplier = 1 + modifier.tier * 0.08;
        bonusXp += Math.round(baseXp * (multiplier - 1));
        reason = `multiplier:${Math.round(multiplier * 100)}pct`;
        break;
      }
      case "streak_echo": {
        if (student.currentStreak >= modifier.tier) {
          bonusXp += modifier.tier + 2;
          reason = `streak:${student.currentStreak}`;
        } else {
          reason = `streak_miss:${student.currentStreak}`;
        }
        break;
      }
      case "catch_up_boost": {
        if (student.xpBalance < averageBalance) {
          bonusXp += modifier.tier * 2;
          reason = "catch_up";
        } else {
          reason = "catch_up_miss";
        }
        break;
      }
      case "lucky_star": {
        if (student.studentId === luckyOne) {
          bonusXp += modifier.tier * 4;
          reason = "lucky_star";
        } else {
          reason = "lucky_star_miss";
        }
        break;
      }
      case "lucky_duo": {
        if (luckyTwo.has(student.studentId)) {
          bonusXp += modifier.tier * 3;
          reason = "lucky_duo";
        } else {
          reason = "lucky_duo_miss";
        }
        break;
      }
      case "lesson_loadout": {
        bonusXp += Math.min(student.totalLessons, modifier.tier + 1);
        reason = `lesson_loadout:${student.totalLessons}`;
        break;
      }
      case "parity_shift": {
        const parity = hashString(`${modifier.id}:${student.studentId}`) % 2;
        bonusXp +=
          parity === 0 ? modifier.tier * 2 : Math.floor(modifier.tier / 2);
        reason = parity === 0 ? "parity_major" : "parity_minor";
        break;
      }
      case "squad_goal": {
        if (students.length >= 3) {
          bonusXp += modifier.tier * 2;
          reason = "squad_group";
        } else if (student.studentId === luckyOne) {
          bonusXp += modifier.tier * 5;
          reason = "squad_single";
        } else {
          reason = "squad_single_miss";
        }
        break;
      }
      case "jackpot_relay": {
        bonusXp += modifier.tier;
        if (student.studentId === luckyOne) {
          bonusXp += modifier.tier * 5;
          reason = "jackpot_winner";
        } else {
          reason = "jackpot_base";
        }
        break;
      }
    }

    const totalXp = Math.max(1, baseXp + bonusXp);
    return {
      studentId: student.studentId,
      baseXp,
      bonusXp,
      totalXp,
      reason,
    };
  });

  return {
    modifier,
    awards,
    totalAwardedXp: awards.reduce((sum, award) => sum + award.totalXp, 0),
    luckyOne,
    luckyTwo: Array.from(luckyTwo),
  };
}
