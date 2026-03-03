CREATE TABLE "student_rpg_progress" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "student_id" uuid NOT NULL,
  "level" integer DEFAULT 1 NOT NULL,
  "prestige_count" integer DEFAULT 0 NOT NULL,
  "perk_slots" integer DEFAULT 3 NOT NULL,
  "perk_points" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "student_perks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "student_id" uuid NOT NULL,
  "perk_key" text NOT NULL,
  "is_equipped" boolean DEFAULT false NOT NULL,
  "unlocked_at" timestamp with time zone DEFAULT now() NOT NULL,
  "equipped_at" timestamp with time zone
);

ALTER TABLE "student_rpg_progress" ADD CONSTRAINT "student_rpg_progress_organization_id_organization_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "student_rpg_progress" ADD CONSTRAINT "student_rpg_progress_student_id_students_id_fk"
  FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "student_perks" ADD CONSTRAINT "student_perks_organization_id_organization_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "student_perks" ADD CONSTRAINT "student_perks_student_id_students_id_fk"
  FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "student_rpg_progress_organization_id_idx"
  ON "student_rpg_progress" USING btree ("organization_id");
CREATE INDEX "student_rpg_progress_student_id_idx"
  ON "student_rpg_progress" USING btree ("student_id");
CREATE UNIQUE INDEX "student_rpg_progress_organization_student_unique_idx"
  ON "student_rpg_progress" USING btree ("organization_id", "student_id");

CREATE INDEX "student_perks_organization_id_idx"
  ON "student_perks" USING btree ("organization_id");
CREATE INDEX "student_perks_student_id_idx"
  ON "student_perks" USING btree ("student_id");
CREATE INDEX "student_perks_org_student_equipped_idx"
  ON "student_perks" USING btree ("organization_id", "student_id", "is_equipped");
CREATE UNIQUE INDEX "student_perks_organization_student_perk_key_unique_idx"
  ON "student_perks" USING btree ("organization_id", "student_id", "perk_key");
