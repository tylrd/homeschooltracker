CREATE TABLE "lesson_work_samples" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid NOT NULL,
	"image_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shared_lesson_work_samples" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shared_lesson_id" uuid NOT NULL,
	"image_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lesson_work_samples" ADD CONSTRAINT "lesson_work_samples_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "lesson_work_samples" ADD CONSTRAINT "lesson_work_samples_image_id_curriculum_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."curriculum_images"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "shared_lesson_work_samples" ADD CONSTRAINT "shared_lesson_work_samples_shared_lesson_id_shared_lessons_id_fk" FOREIGN KEY ("shared_lesson_id") REFERENCES "public"."shared_lessons"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "shared_lesson_work_samples" ADD CONSTRAINT "shared_lesson_work_samples_image_id_curriculum_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."curriculum_images"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "lesson_work_samples_lesson_id_idx" ON "lesson_work_samples" USING btree ("lesson_id");
--> statement-breakpoint
CREATE INDEX "lesson_work_samples_image_id_idx" ON "lesson_work_samples" USING btree ("image_id");
--> statement-breakpoint
CREATE INDEX "shared_lesson_work_samples_shared_lesson_id_idx" ON "shared_lesson_work_samples" USING btree ("shared_lesson_id");
--> statement-breakpoint
CREATE INDEX "shared_lesson_work_samples_image_id_idx" ON "shared_lesson_work_samples" USING btree ("image_id");
