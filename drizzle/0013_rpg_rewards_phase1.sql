CREATE TYPE "public"."xp_event_type" AS ENUM('lesson_completion', 'lesson_completion_reversal', 'shared_lesson_completion', 'shared_lesson_completion_reversal', 'streak_bonus');

CREATE TABLE "student_xp_ledger" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "student_id" uuid NOT NULL,
  "event_type" "xp_event_type" NOT NULL,
  "points" integer NOT NULL,
  "event_date" date NOT NULL,
  "lesson_id" uuid,
  "shared_lesson_id" uuid,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "student_streaks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "student_id" uuid NOT NULL,
  "current_streak" integer DEFAULT 0 NOT NULL,
  "longest_streak" integer DEFAULT 0 NOT NULL,
  "last_reward_date" date,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "student_badges" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "student_id" uuid NOT NULL,
  "badge_key" text NOT NULL,
  "milestone_days" integer NOT NULL,
  "earned_date" date NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "student_xp_ledger" ADD CONSTRAINT "student_xp_ledger_organization_id_organization_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "student_xp_ledger" ADD CONSTRAINT "student_xp_ledger_student_id_students_id_fk"
  FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "student_xp_ledger" ADD CONSTRAINT "student_xp_ledger_lesson_id_lessons_id_fk"
  FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "student_xp_ledger" ADD CONSTRAINT "student_xp_ledger_shared_lesson_id_shared_lessons_id_fk"
  FOREIGN KEY ("shared_lesson_id") REFERENCES "public"."shared_lessons"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "student_streaks" ADD CONSTRAINT "student_streaks_organization_id_organization_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "student_streaks" ADD CONSTRAINT "student_streaks_student_id_students_id_fk"
  FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "student_badges" ADD CONSTRAINT "student_badges_organization_id_organization_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "student_badges" ADD CONSTRAINT "student_badges_student_id_students_id_fk"
  FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "student_xp_ledger_organization_id_idx" ON "student_xp_ledger" USING btree ("organization_id");
CREATE INDEX "student_xp_ledger_student_id_idx" ON "student_xp_ledger" USING btree ("student_id");
CREATE INDEX "student_xp_ledger_lesson_id_idx" ON "student_xp_ledger" USING btree ("lesson_id");
CREATE INDEX "student_xp_ledger_shared_lesson_id_idx" ON "student_xp_ledger" USING btree ("shared_lesson_id");
CREATE INDEX "student_xp_ledger_org_student_event_date_idx" ON "student_xp_ledger" USING btree ("organization_id", "student_id", "event_date");
CREATE INDEX "student_xp_ledger_org_student_created_at_idx" ON "student_xp_ledger" USING btree ("organization_id", "student_id", "created_at");
CREATE INDEX "student_xp_ledger_org_event_type_event_date_idx" ON "student_xp_ledger" USING btree ("organization_id", "event_type", "event_date");

CREATE INDEX "student_streaks_organization_id_idx" ON "student_streaks" USING btree ("organization_id");
CREATE INDEX "student_streaks_student_id_idx" ON "student_streaks" USING btree ("student_id");
CREATE UNIQUE INDEX "student_streaks_organization_student_unique_idx" ON "student_streaks" USING btree ("organization_id", "student_id");

CREATE INDEX "student_badges_organization_id_idx" ON "student_badges" USING btree ("organization_id");
CREATE INDEX "student_badges_student_id_idx" ON "student_badges" USING btree ("student_id");
CREATE UNIQUE INDEX "student_badges_organization_student_badge_key_unique_idx" ON "student_badges" USING btree ("organization_id", "student_id", "badge_key");
