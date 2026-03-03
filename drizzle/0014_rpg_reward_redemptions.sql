ALTER TYPE "public"."xp_event_type" ADD VALUE IF NOT EXISTS 'reward_redemption';
ALTER TYPE "public"."xp_event_type" ADD VALUE IF NOT EXISTS 'reward_refund';

CREATE TYPE "public"."reward_redemption_status" AS ENUM(
  'pending',
  'approved',
  'cancelled',
  'fulfilled'
);

CREATE TABLE "student_reward_redemptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "student_id" uuid NOT NULL,
  "reward_template_id" text NOT NULL,
  "reward_name_snapshot" text NOT NULL,
  "xp_cost_snapshot" integer NOT NULL,
  "description_snapshot" text,
  "status" "reward_redemption_status" DEFAULT 'pending' NOT NULL,
  "requested_at" timestamp with time zone DEFAULT now() NOT NULL,
  "fulfilled_at" timestamp with time zone,
  "cancelled_at" timestamp with time zone,
  "notes" text
);

ALTER TABLE "student_reward_redemptions" ADD CONSTRAINT "student_reward_redemptions_organization_id_organization_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "student_reward_redemptions" ADD CONSTRAINT "student_reward_redemptions_student_id_students_id_fk"
  FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "student_reward_redemptions_organization_id_idx"
  ON "student_reward_redemptions" USING btree ("organization_id");
CREATE INDEX "student_reward_redemptions_student_id_idx"
  ON "student_reward_redemptions" USING btree ("student_id");
CREATE INDEX "student_reward_redemptions_org_student_status_requested_at_idx"
  ON "student_reward_redemptions" USING btree ("organization_id", "student_id", "status", "requested_at");
CREATE INDEX "student_reward_redemptions_org_status_requested_at_idx"
  ON "student_reward_redemptions" USING btree ("organization_id", "status", "requested_at");
CREATE INDEX "student_reward_redemptions_org_student_requested_at_idx"
  ON "student_reward_redemptions" USING btree ("organization_id", "student_id", "requested_at");
CREATE UNIQUE INDEX "student_reward_redemptions_org_student_template_active_unique_idx"
  ON "student_reward_redemptions" USING btree ("organization_id", "student_id", "reward_template_id")
  WHERE "status" IN ('pending', 'approved');
