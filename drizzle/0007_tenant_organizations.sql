CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_unique_idx" ON "user" USING btree ("email");
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "organization_slug_unique_idx" ON "organization" USING btree ("slug");
--> statement-breakpoint
CREATE TABLE "session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL,
	"active_organization_id" uuid
);
--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_unique_idx" ON "session" USING btree ("token");
--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "session_active_organization_id_idx" ON "session" USING btree ("active_organization_id");
--> statement-breakpoint
CREATE TABLE "account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "account_provider_account_unique_idx" ON "account" USING btree ("provider_id","account_id");
--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");
--> statement-breakpoint
CREATE TABLE "member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "member_organization_user_unique_idx" ON "member" USING btree ("organization_id","user_id");
--> statement-breakpoint
CREATE INDEX "member_organization_id_idx" ON "member" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "member_user_id_idx" ON "member" USING btree ("user_id");
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"inviter_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "invitation_organization_id_idx" ON "invitation" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "invitation" USING btree ("email");
--> statement-breakpoint
CREATE UNIQUE INDEX "invitation_organization_email_unique_idx" ON "invitation" USING btree ("organization_id","email");
--> statement-breakpoint
CREATE TABLE "team" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "team_organization_id_idx" ON "team" USING btree ("organization_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "team_organization_name_unique_idx" ON "team" USING btree ("organization_id","name");
--> statement-breakpoint
CREATE TABLE "team_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "team_member_team_id_idx" ON "team_member" USING btree ("team_id");
--> statement-breakpoint
CREATE INDEX "team_member_user_id_idx" ON "team_member" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "team_member_team_user_unique_idx" ON "team_member" USING btree ("team_id","user_id");
--> statement-breakpoint

INSERT INTO "organization" ("id", "name", "slug")
VALUES (
	'00000000-0000-0000-0000-000000000001'::uuid,
	'Bootstrap Organization',
	'bootstrap-organization'
)
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint

ALTER TABLE "students" ADD COLUMN "organization_id" uuid;
--> statement-breakpoint
UPDATE "students" SET "organization_id" = '00000000-0000-0000-0000-000000000001'::uuid WHERE "organization_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "students" ALTER COLUMN "organization_id" SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
--> statement-breakpoint
ALTER TABLE "students" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "students_organization_id_idx" ON "students" USING btree ("organization_id");
--> statement-breakpoint

ALTER TABLE "subjects" ADD COLUMN "organization_id" uuid;
--> statement-breakpoint
UPDATE "subjects" s
SET "organization_id" = st."organization_id"
FROM "students" st
WHERE s."student_id" = st."id" AND s."organization_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "subjects" ALTER COLUMN "organization_id" SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
--> statement-breakpoint
ALTER TABLE "subjects" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "subjects_organization_id_idx" ON "subjects" USING btree ("organization_id");
--> statement-breakpoint

ALTER TABLE "curriculum_images" ADD COLUMN "organization_id" uuid;
--> statement-breakpoint
UPDATE "curriculum_images" SET "organization_id" = '00000000-0000-0000-0000-000000000001'::uuid WHERE "organization_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "curriculum_images" ALTER COLUMN "organization_id" SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
--> statement-breakpoint
ALTER TABLE "curriculum_images" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "curriculum_images" ADD CONSTRAINT "curriculum_images_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "curriculum_images_organization_id_idx" ON "curriculum_images" USING btree ("organization_id");
--> statement-breakpoint

ALTER TABLE "resources" ADD COLUMN "organization_id" uuid;
--> statement-breakpoint
UPDATE "resources" r
SET "organization_id" = s."organization_id"
FROM "subjects" s
WHERE r."subject_id" = s."id" AND r."organization_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "resources" ALTER COLUMN "organization_id" SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
--> statement-breakpoint
ALTER TABLE "resources" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "resources_organization_id_idx" ON "resources" USING btree ("organization_id");
--> statement-breakpoint

ALTER TABLE "shared_curricula" ADD COLUMN "organization_id" uuid;
--> statement-breakpoint
UPDATE "shared_curricula" SET "organization_id" = '00000000-0000-0000-0000-000000000001'::uuid WHERE "organization_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "shared_curricula" ALTER COLUMN "organization_id" SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
--> statement-breakpoint
ALTER TABLE "shared_curricula" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "shared_curricula" ADD CONSTRAINT "shared_curricula_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "shared_curricula_organization_id_idx" ON "shared_curricula" USING btree ("organization_id");
--> statement-breakpoint

ALTER TABLE "shared_curriculum_students" ADD COLUMN "organization_id" uuid;
--> statement-breakpoint
UPDATE "shared_curriculum_students" scs
SET "organization_id" = sc."organization_id"
FROM "shared_curricula" sc
WHERE scs."shared_curriculum_id" = sc."id" AND scs."organization_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "shared_curriculum_students" ALTER COLUMN "organization_id" SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
--> statement-breakpoint
ALTER TABLE "shared_curriculum_students" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "shared_curriculum_students" ADD CONSTRAINT "shared_curriculum_students_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "shared_curriculum_students_organization_id_idx" ON "shared_curriculum_students" USING btree ("organization_id");
--> statement-breakpoint

ALTER TABLE "lessons" ADD COLUMN "organization_id" uuid;
--> statement-breakpoint
UPDATE "lessons" l
SET "organization_id" = r."organization_id"
FROM "resources" r
WHERE l."resource_id" = r."id" AND l."organization_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "lessons" ALTER COLUMN "organization_id" SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
--> statement-breakpoint
ALTER TABLE "lessons" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "lessons_organization_id_idx" ON "lessons" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "lessons_organization_scheduled_date_status_idx" ON "lessons" USING btree ("organization_id","scheduled_date","status");
--> statement-breakpoint

ALTER TABLE "shared_lessons" ADD COLUMN "organization_id" uuid;
--> statement-breakpoint
UPDATE "shared_lessons" sl
SET "organization_id" = sc."organization_id"
FROM "shared_curricula" sc
WHERE sl."shared_curriculum_id" = sc."id" AND sl."organization_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "shared_lessons" ALTER COLUMN "organization_id" SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
--> statement-breakpoint
ALTER TABLE "shared_lessons" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "shared_lessons" ADD CONSTRAINT "shared_lessons_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "shared_lessons_organization_id_idx" ON "shared_lessons" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "shared_lessons_organization_scheduled_date_status_idx" ON "shared_lessons" USING btree ("organization_id","scheduled_date","status");
--> statement-breakpoint

ALTER TABLE "lesson_work_samples" ADD COLUMN "organization_id" uuid;
--> statement-breakpoint
UPDATE "lesson_work_samples" lws
SET "organization_id" = l."organization_id"
FROM "lessons" l
WHERE lws."lesson_id" = l."id" AND lws."organization_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "lesson_work_samples" ALTER COLUMN "organization_id" SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
--> statement-breakpoint
ALTER TABLE "lesson_work_samples" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "lesson_work_samples" ADD CONSTRAINT "lesson_work_samples_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "lesson_work_samples_organization_id_idx" ON "lesson_work_samples" USING btree ("organization_id");
--> statement-breakpoint

ALTER TABLE "shared_lesson_work_samples" ADD COLUMN "organization_id" uuid;
--> statement-breakpoint
UPDATE "shared_lesson_work_samples" slws
SET "organization_id" = sl."organization_id"
FROM "shared_lessons" sl
WHERE slws."shared_lesson_id" = sl."id" AND slws."organization_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "shared_lesson_work_samples" ALTER COLUMN "organization_id" SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
--> statement-breakpoint
ALTER TABLE "shared_lesson_work_samples" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "shared_lesson_work_samples" ADD CONSTRAINT "shared_lesson_work_samples_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "shared_lesson_work_samples_organization_id_idx" ON "shared_lesson_work_samples" USING btree ("organization_id");
--> statement-breakpoint

ALTER TABLE "daily_notes" ADD COLUMN "organization_id" uuid;
--> statement-breakpoint
UPDATE "daily_notes" dn
SET "organization_id" = st."organization_id"
FROM "students" st
WHERE dn."student_id" = st."id" AND dn."organization_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "daily_notes" ALTER COLUMN "organization_id" SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
--> statement-breakpoint
ALTER TABLE "daily_notes" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "daily_notes" ADD CONSTRAINT "daily_notes_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "daily_notes_organization_id_idx" ON "daily_notes" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "daily_notes_organization_student_id_date_idx" ON "daily_notes" USING btree ("organization_id","student_id","date");
--> statement-breakpoint

ALTER TABLE "absence_reasons" ADD COLUMN "organization_id" uuid;
--> statement-breakpoint
UPDATE "absence_reasons" SET "organization_id" = '00000000-0000-0000-0000-000000000001'::uuid WHERE "organization_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "absence_reasons" ALTER COLUMN "organization_id" SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
--> statement-breakpoint
ALTER TABLE "absence_reasons" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "absence_reasons" ADD CONSTRAINT "absence_reasons_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "absence_reasons_organization_id_idx" ON "absence_reasons" USING btree ("organization_id");
--> statement-breakpoint

ALTER TABLE "absences" ADD COLUMN "organization_id" uuid;
--> statement-breakpoint
UPDATE "absences" a
SET "organization_id" = st."organization_id"
FROM "students" st
WHERE a."student_id" = st."id" AND a."organization_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "absences" ALTER COLUMN "organization_id" SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
--> statement-breakpoint
ALTER TABLE "absences" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "absences" ADD CONSTRAINT "absences_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "absences_organization_id_idx" ON "absences" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "absences_organization_student_date_idx" ON "absences" USING btree ("organization_id","student_id","date");
--> statement-breakpoint

ALTER TABLE "global_absences" ADD COLUMN "organization_id" uuid;
--> statement-breakpoint
UPDATE "global_absences" SET "organization_id" = '00000000-0000-0000-0000-000000000001'::uuid WHERE "organization_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "global_absences" ALTER COLUMN "organization_id" SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
--> statement-breakpoint
ALTER TABLE "global_absences" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "global_absences" ADD CONSTRAINT "global_absences_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
DROP INDEX IF EXISTS "global_absences_date_unique_idx";
--> statement-breakpoint
CREATE UNIQUE INDEX "global_absences_organization_date_unique_idx" ON "global_absences" USING btree ("organization_id","date");
--> statement-breakpoint
CREATE INDEX "global_absences_organization_id_idx" ON "global_absences" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "global_absences_organization_date_idx" ON "global_absences" USING btree ("organization_id","date");
--> statement-breakpoint

ALTER TABLE "app_settings" ADD COLUMN "id" uuid DEFAULT gen_random_uuid();
--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "organization_id" uuid;
--> statement-breakpoint
UPDATE "app_settings" SET "organization_id" = '00000000-0000-0000-0000-000000000001'::uuid WHERE "organization_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "app_settings" ALTER COLUMN "id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "app_settings" ALTER COLUMN "organization_id" SET DEFAULT '00000000-0000-0000-0000-000000000001'::uuid;
--> statement-breakpoint
ALTER TABLE "app_settings" ALTER COLUMN "organization_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "app_settings" DROP CONSTRAINT "app_settings_pkey";
--> statement-breakpoint
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id");
--> statement-breakpoint
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "app_settings_organization_id_idx" ON "app_settings" USING btree ("organization_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "app_settings_organization_key_unique_idx" ON "app_settings" USING btree ("organization_id","key");
--> statement-breakpoint

ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_active_organization_id_organization_id_fk" FOREIGN KEY ("active_organization_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
