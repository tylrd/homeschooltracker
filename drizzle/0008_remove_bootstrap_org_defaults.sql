ALTER TABLE "students" ALTER COLUMN "organization_id" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "subjects" ALTER COLUMN "organization_id" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "curriculum_images" ALTER COLUMN "organization_id" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "resources" ALTER COLUMN "organization_id" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "shared_curricula" ALTER COLUMN "organization_id" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "shared_curriculum_students" ALTER COLUMN "organization_id" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "lessons" ALTER COLUMN "organization_id" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "shared_lessons" ALTER COLUMN "organization_id" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "lesson_work_samples" ALTER COLUMN "organization_id" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "shared_lesson_work_samples" ALTER COLUMN "organization_id" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "daily_notes" ALTER COLUMN "organization_id" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "absence_reasons" ALTER COLUMN "organization_id" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "absences" ALTER COLUMN "organization_id" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "global_absences" ALTER COLUMN "organization_id" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "app_settings" ALTER COLUMN "organization_id" DROP DEFAULT;
