import { and, eq, sql } from "drizzle-orm";
import type { getDb } from "../../db";
import {
  studentPerks,
  studentRpgProgress,
  students,
  studentXpLedger,
} from "../../db/schema";
import {
  BASE_PERK_SLOTS,
  getPerkDefinition,
  getXpRequiredForLevel,
  MAX_STUDENT_LEVEL,
} from "./perks";

export type LevelingDbTransaction = Parameters<
  Parameters<ReturnType<typeof getDb>["transaction"]>[0]
>[0];

type BaseArgs = {
  organizationId: string;
  studentId: string;
};

type PerkArgs = BaseArgs & {
  perkKey: string;
};

async function ensureStudentInTenant(
  tx: LevelingDbTransaction,
  { organizationId, studentId }: BaseArgs,
) {
  const student = await tx.query.students.findFirst({
    where: and(
      eq(students.organizationId, organizationId),
      eq(students.id, studentId),
    ),
    columns: { id: true },
  });

  if (!student) {
    throw new Error("Student not found.");
  }
}

export async function getOrCreateStudentRpgProgress(
  tx: LevelingDbTransaction,
  args: BaseArgs,
) {
  await ensureStudentInTenant(tx, args);
  const existing = await tx.query.studentRpgProgress.findFirst({
    where: and(
      eq(studentRpgProgress.organizationId, args.organizationId),
      eq(studentRpgProgress.studentId, args.studentId),
    ),
  });

  if (existing) {
    return existing;
  }

  const [created] = await tx
    .insert(studentRpgProgress)
    .values({
      organizationId: args.organizationId,
      studentId: args.studentId,
      level: 1,
      prestigeCount: 0,
      perkSlots: BASE_PERK_SLOTS,
      perkPoints: 0,
    })
    .returning();

  if (!created) {
    throw new Error("Failed to initialize student RPG progress.");
  }

  return created;
}

async function getStudentXpBalanceInTransaction(
  tx: LevelingDbTransaction,
  { organizationId, studentId }: BaseArgs,
) {
  const [row] = await tx
    .select({
      balance: sql<number>`coalesce(sum(${studentXpLedger.points}), 0)`.mapWith(
        Number,
      ),
    })
    .from(studentXpLedger)
    .where(
      and(
        eq(studentXpLedger.organizationId, organizationId),
        eq(studentXpLedger.studentId, studentId),
      ),
    );

  return row?.balance ?? 0;
}

export async function levelUpStudentInTransaction(
  tx: LevelingDbTransaction,
  args: BaseArgs,
) {
  const progress = await getOrCreateStudentRpgProgress(tx, args);
  if (progress.level >= MAX_STUDENT_LEVEL) {
    throw new Error(
      `Student is already at max level ${MAX_STUDENT_LEVEL}. Prestige to continue.`,
    );
  }

  const nextLevel = progress.level + 1;
  const requiredXp = getXpRequiredForLevel(nextLevel);
  const xpBalance = await getStudentXpBalanceInTransaction(tx, args);
  if (xpBalance < requiredXp) {
    throw new Error(
      `${requiredXp} XP required for level ${nextLevel}. Current XP: ${xpBalance}.`,
    );
  }

  const [updated] = await tx
    .update(studentRpgProgress)
    .set({
      level: progress.level + 1,
      perkPoints: progress.perkPoints + 1,
    })
    .where(
      and(
        eq(studentRpgProgress.organizationId, args.organizationId),
        eq(studentRpgProgress.studentId, args.studentId),
      ),
    )
    .returning();

  if (!updated) {
    throw new Error("Failed to level up student.");
  }

  return updated;
}

export async function unlockPerkInTransaction(
  tx: LevelingDbTransaction,
  args: PerkArgs,
) {
  const progress = await getOrCreateStudentRpgProgress(tx, args);
  const perk = getPerkDefinition(args.perkKey);
  if (!perk) {
    throw new Error("Perk not found.");
  }

  if (progress.level < perk.unlockLevel) {
    throw new Error(`Perk unlocks at level ${perk.unlockLevel}.`);
  }

  if (progress.perkPoints < 1) {
    throw new Error("No perk points available.");
  }

  const existing = await tx.query.studentPerks.findFirst({
    where: and(
      eq(studentPerks.organizationId, args.organizationId),
      eq(studentPerks.studentId, args.studentId),
      eq(studentPerks.perkKey, args.perkKey),
    ),
  });

  if (existing) {
    return { changed: false, progress };
  }

  await tx.insert(studentPerks).values({
    organizationId: args.organizationId,
    studentId: args.studentId,
    perkKey: args.perkKey,
    isEquipped: false,
  });

  const [updatedProgress] = await tx
    .update(studentRpgProgress)
    .set({ perkPoints: progress.perkPoints - 1 })
    .where(
      and(
        eq(studentRpgProgress.organizationId, args.organizationId),
        eq(studentRpgProgress.studentId, args.studentId),
      ),
    )
    .returning();

  if (!updatedProgress) {
    throw new Error("Failed to update perk points.");
  }

  return { changed: true, progress: updatedProgress };
}

export async function togglePerkEquippedInTransaction(
  tx: LevelingDbTransaction,
  args: PerkArgs,
) {
  await getOrCreateStudentRpgProgress(tx, args);

  const ownedPerk = await tx.query.studentPerks.findFirst({
    where: and(
      eq(studentPerks.organizationId, args.organizationId),
      eq(studentPerks.studentId, args.studentId),
      eq(studentPerks.perkKey, args.perkKey),
    ),
  });

  if (!ownedPerk) {
    throw new Error("Perk is not unlocked.");
  }

  const progress = await getOrCreateStudentRpgProgress(tx, args);

  if (ownedPerk.isEquipped) {
    await tx
      .update(studentPerks)
      .set({
        isEquipped: false,
        equippedAt: null,
      })
      .where(
        and(
          eq(studentPerks.organizationId, args.organizationId),
          eq(studentPerks.studentId, args.studentId),
          eq(studentPerks.perkKey, args.perkKey),
        ),
      );

    return { equipped: false };
  }

  const equippedPerks = await tx.query.studentPerks.findMany({
    where: and(
      eq(studentPerks.organizationId, args.organizationId),
      eq(studentPerks.studentId, args.studentId),
      eq(studentPerks.isEquipped, true),
    ),
    columns: { id: true },
  });

  if (equippedPerks.length >= progress.perkSlots) {
    throw new Error(`Only ${progress.perkSlots} perks can be equipped.`);
  }

  await tx
    .update(studentPerks)
    .set({
      isEquipped: true,
      equippedAt: new Date(),
    })
    .where(
      and(
        eq(studentPerks.organizationId, args.organizationId),
        eq(studentPerks.studentId, args.studentId),
        eq(studentPerks.perkKey, args.perkKey),
      ),
    );

  return { equipped: true };
}

export async function prestigeStudentInTransaction(
  tx: LevelingDbTransaction,
  args: BaseArgs,
) {
  const progress = await getOrCreateStudentRpgProgress(tx, args);
  if (progress.level < MAX_STUDENT_LEVEL) {
    throw new Error(`Prestige unlocks at level ${MAX_STUDENT_LEVEL}.`);
  }

  await tx
    .delete(studentPerks)
    .where(
      and(
        eq(studentPerks.organizationId, args.organizationId),
        eq(studentPerks.studentId, args.studentId),
      ),
    );

  const [updated] = await tx
    .update(studentRpgProgress)
    .set({
      level: 1,
      prestigeCount: progress.prestigeCount + 1,
      perkSlots: progress.perkSlots + 1,
      perkPoints: 0,
    })
    .where(
      and(
        eq(studentRpgProgress.organizationId, args.organizationId),
        eq(studentRpgProgress.studentId, args.studentId),
      ),
    )
    .returning();

  if (!updated) {
    throw new Error("Failed to prestige student.");
  }

  return updated;
}
