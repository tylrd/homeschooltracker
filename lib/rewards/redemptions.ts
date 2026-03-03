import { and, eq, inArray, sql } from "drizzle-orm";
import type { getDb } from "../../db";
import {
  appSettings,
  type StudentRewardRedemption,
  studentRewardRedemptions,
  students,
  studentXpLedger,
} from "../../db/schema";
import { toDateString } from "../dates";
import { normalizeRewardTemplates } from "./templates";

export type RedemptionsDbTransaction = Parameters<
  Parameters<ReturnType<typeof getDb>["transaction"]>[0]
>[0];

type RedeemRewardArgs = {
  organizationId: string;
  studentId: string;
  templateId: string;
  date?: string;
  notes?: string;
};

type RedemptionStatusArgs = {
  organizationId: string;
  redemptionId: string;
  date?: string;
};

type RedemptionResult = {
  redemption: StudentRewardRedemption;
  changed: boolean;
};

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

async function ensureStudentInTenant(
  tx: RedemptionsDbTransaction,
  organizationId: string,
  studentId: string,
) {
  const student = await tx.query.students.findFirst({
    where: and(
      eq(students.id, studentId),
      eq(students.organizationId, organizationId),
    ),
    columns: { id: true },
  });

  if (!student) {
    throw new Error("Student not found.");
  }
}

async function getRewardTemplatesForOrganization(
  tx: RedemptionsDbTransaction,
  organizationId: string,
) {
  const [row] = await tx
    .select({ value: appSettings.value })
    .from(appSettings)
    .where(
      and(
        eq(appSettings.organizationId, organizationId),
        eq(appSettings.key, "rewardTemplates"),
      ),
    )
    .limit(1);

  if (!row) {
    return normalizeRewardTemplates(undefined);
  }

  try {
    return normalizeRewardTemplates(JSON.parse(row.value));
  } catch {
    return normalizeRewardTemplates(undefined);
  }
}

async function getStudentXpBalanceInTransaction(
  tx: RedemptionsDbTransaction,
  organizationId: string,
  studentId: string,
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

export async function redeemRewardTemplateInTransaction(
  tx: RedemptionsDbTransaction,
  { organizationId, studentId, templateId, date, notes }: RedeemRewardArgs,
): Promise<RedemptionResult> {
  await ensureStudentInTenant(tx, organizationId, studentId);

  const existingActive = await tx.query.studentRewardRedemptions.findFirst({
    where: and(
      eq(studentRewardRedemptions.organizationId, organizationId),
      eq(studentRewardRedemptions.studentId, studentId),
      eq(studentRewardRedemptions.rewardTemplateId, templateId),
      inArray(studentRewardRedemptions.status, ["pending", "approved"]),
    ),
    orderBy: (table, { desc }) => [desc(table.requestedAt)],
  });

  if (existingActive) {
    return { redemption: existingActive, changed: false };
  }

  const templates = await getRewardTemplatesForOrganization(tx, organizationId);
  const template = templates.find((item) => item.id === templateId);
  if (!template) {
    throw new Error("Reward template not found.");
  }

  const balance = await getStudentXpBalanceInTransaction(
    tx,
    organizationId,
    studentId,
  );
  if (balance < template.xpCost) {
    throw new Error("Not enough XP to redeem this reward.");
  }

  let redemption: StudentRewardRedemption;
  try {
    const [inserted] = await tx
      .insert(studentRewardRedemptions)
      .values({
        organizationId,
        studentId,
        rewardTemplateId: template.id,
        rewardNameSnapshot: template.name,
        xpCostSnapshot: template.xpCost,
        descriptionSnapshot: template.description ?? null,
        status: "pending",
        notes: notes?.trim() ? notes.trim() : null,
      })
      .returning();

    if (!inserted) {
      throw new Error("Failed to create reward redemption.");
    }
    redemption = inserted;
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw error;
    }

    const concurrent = await tx.query.studentRewardRedemptions.findFirst({
      where: and(
        eq(studentRewardRedemptions.organizationId, organizationId),
        eq(studentRewardRedemptions.studentId, studentId),
        eq(studentRewardRedemptions.rewardTemplateId, templateId),
        inArray(studentRewardRedemptions.status, ["pending", "approved"]),
      ),
      orderBy: (table, { desc }) => [desc(table.requestedAt)],
    });

    if (!concurrent) {
      throw error;
    }
    return { redemption: concurrent, changed: false };
  }

  const eventDate = date ?? toDateString(new Date());
  await tx.insert(studentXpLedger).values({
    organizationId,
    studentId,
    eventType: "reward_redemption",
    points: -template.xpCost,
    eventDate,
    metadata: {
      redemptionId: redemption.id,
      rewardTemplateId: template.id,
    },
  });

  return { redemption, changed: true };
}

export async function fulfillRewardRedemptionInTransaction(
  tx: RedemptionsDbTransaction,
  { organizationId, redemptionId }: RedemptionStatusArgs,
): Promise<RedemptionResult> {
  const existing = await tx.query.studentRewardRedemptions.findFirst({
    where: and(
      eq(studentRewardRedemptions.id, redemptionId),
      eq(studentRewardRedemptions.organizationId, organizationId),
    ),
  });

  if (!existing) {
    throw new Error("Reward redemption not found.");
  }
  if (existing.status === "fulfilled") {
    return { redemption: existing, changed: false };
  }
  if (existing.status === "cancelled") {
    throw new Error("Cancelled redemptions cannot be fulfilled.");
  }

  const [updated] = await tx
    .update(studentRewardRedemptions)
    .set({
      status: "fulfilled",
      fulfilledAt: new Date(),
    })
    .where(
      and(
        eq(studentRewardRedemptions.id, redemptionId),
        eq(studentRewardRedemptions.organizationId, organizationId),
        inArray(studentRewardRedemptions.status, ["pending", "approved"]),
      ),
    )
    .returning();

  if (!updated) {
    const row = await tx.query.studentRewardRedemptions.findFirst({
      where: and(
        eq(studentRewardRedemptions.id, redemptionId),
        eq(studentRewardRedemptions.organizationId, organizationId),
      ),
    });

    if (!row) {
      throw new Error("Reward redemption not found.");
    }
    return { redemption: row, changed: false };
  }

  return { redemption: updated, changed: true };
}

export async function cancelRewardRedemptionInTransaction(
  tx: RedemptionsDbTransaction,
  { organizationId, redemptionId, date }: RedemptionStatusArgs,
): Promise<RedemptionResult> {
  const existing = await tx.query.studentRewardRedemptions.findFirst({
    where: and(
      eq(studentRewardRedemptions.id, redemptionId),
      eq(studentRewardRedemptions.organizationId, organizationId),
    ),
  });

  if (!existing) {
    throw new Error("Reward redemption not found.");
  }
  if (existing.status === "cancelled") {
    return { redemption: existing, changed: false };
  }
  if (existing.status === "fulfilled") {
    throw new Error("Fulfilled redemptions cannot be cancelled.");
  }

  const [updated] = await tx
    .update(studentRewardRedemptions)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
    })
    .where(
      and(
        eq(studentRewardRedemptions.id, redemptionId),
        eq(studentRewardRedemptions.organizationId, organizationId),
        inArray(studentRewardRedemptions.status, ["pending", "approved"]),
      ),
    )
    .returning();

  if (!updated) {
    const row = await tx.query.studentRewardRedemptions.findFirst({
      where: and(
        eq(studentRewardRedemptions.id, redemptionId),
        eq(studentRewardRedemptions.organizationId, organizationId),
      ),
    });

    if (!row) {
      throw new Error("Reward redemption not found.");
    }
    return { redemption: row, changed: false };
  }

  const eventDate = date ?? toDateString(new Date());
  await tx.insert(studentXpLedger).values({
    organizationId,
    studentId: updated.studentId,
    eventType: "reward_refund",
    points: updated.xpCostSnapshot,
    eventDate,
    metadata: {
      redemptionId: updated.id,
      rewardTemplateId: updated.rewardTemplateId,
    },
  });

  return { redemption: updated, changed: true };
}
