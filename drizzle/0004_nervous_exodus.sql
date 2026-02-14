CREATE TABLE "shared_curricula" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shared_curriculum_students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shared_curriculum_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shared_lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shared_curriculum_id" uuid NOT NULL,
	"lesson_number" integer NOT NULL,
	"title" text,
	"status" "lesson_status" DEFAULT 'planned' NOT NULL,
	"scheduled_date" date,
	"completion_date" date,
	"plan" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shared_curriculum_students" ADD CONSTRAINT "shared_curriculum_students_shared_curriculum_id_shared_curricula_id_fk" FOREIGN KEY ("shared_curriculum_id") REFERENCES "public"."shared_curricula"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_curriculum_students" ADD CONSTRAINT "shared_curriculum_students_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_lessons" ADD CONSTRAINT "shared_lessons_shared_curriculum_id_shared_curricula_id_fk" FOREIGN KEY ("shared_curriculum_id") REFERENCES "public"."shared_curricula"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "shared_curriculum_students_shared_curriculum_id_idx" ON "shared_curriculum_students" USING btree ("shared_curriculum_id");--> statement-breakpoint
CREATE INDEX "shared_curriculum_students_student_id_idx" ON "shared_curriculum_students" USING btree ("student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shared_curriculum_students_unique_idx" ON "shared_curriculum_students" USING btree ("shared_curriculum_id","student_id");--> statement-breakpoint
CREATE INDEX "shared_lessons_shared_curriculum_id_idx" ON "shared_lessons" USING btree ("shared_curriculum_id");--> statement-breakpoint
CREATE INDEX "shared_lessons_scheduled_date_idx" ON "shared_lessons" USING btree ("scheduled_date");--> statement-breakpoint
CREATE INDEX "shared_lessons_scheduled_date_status_idx" ON "shared_lessons" USING btree ("scheduled_date","status");
