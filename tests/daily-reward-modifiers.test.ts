import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateDailyRewardAwards,
  DAILY_REWARD_MODIFIERS,
  getDailyRewardModifier,
} from "../lib/rewards/daily-modifiers";

test("daily modifier catalog has exactly 100 unique modifiers", () => {
  assert.equal(DAILY_REWARD_MODIFIERS.length, 100);
  const ids = new Set(DAILY_REWARD_MODIFIERS.map((modifier) => modifier.id));
  assert.equal(ids.size, 100);
});

test("daily modifier selection is deterministic by org + date", () => {
  const args = {
    organizationId: "00000000-0000-0000-0000-000000000123",
    date: "2026-04-10",
  };

  const one = getDailyRewardModifier(args);
  const two = getDailyRewardModifier(args);
  assert.equal(one.id, two.id);
  assert.equal(one.name, two.name);

  const otherDate = getDailyRewardModifier({
    ...args,
    date: "2026-04-11",
  });
  assert.notEqual(one.id, otherDate.id);
});

test("daily reward award plan is deterministic and always positive", () => {
  const students = [
    {
      studentId: "s1",
      totalLessons: 3,
      xpBalance: 25,
      currentStreak: 1,
    },
    {
      studentId: "s2",
      totalLessons: 4,
      xpBalance: 90,
      currentStreak: 5,
    },
    {
      studentId: "s3",
      totalLessons: 2,
      xpBalance: 10,
      currentStreak: 0,
    },
  ];

  const input = {
    organizationId: "00000000-0000-0000-0000-000000000123",
    date: "2026-04-10",
    students,
  };

  const one = calculateDailyRewardAwards(input);
  const two = calculateDailyRewardAwards(input);

  assert.equal(one.modifier.id, two.modifier.id);
  assert.equal(one.totalAwardedXp, two.totalAwardedXp);
  assert.equal(one.awards.length, students.length);
  assert.equal(
    one.awards.every((award) => award.totalXp >= 1),
    true,
  );
});
