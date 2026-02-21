CREATE TYPE "public"."lesson_mood" AS ENUM('loved_it', 'tears', 'meltdown', 'pulling_teeth');
CREATE TYPE "public"."school_document_type" AS ENUM('weekly_plan', 'curriculum_outline', 'pacing_calendar');

ALTER TABLE "lessons" ADD COLUMN "mood" "lesson_mood";
ALTER TABLE "shared_lessons" ADD COLUMN "mood" "lesson_mood";
ALTER TABLE "absence_reasons" ADD COLUMN "counts_as_present" boolean DEFAULT false NOT NULL;

CREATE TABLE "school_documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "type" "school_document_type" NOT NULL,
  "title" text NOT NULL,
  "notes" text,
  "resource_id" uuid,
  "week_start_date" date,
  "week_end_date" date,
  "school_year_label" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "school_document_files" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "school_document_id" uuid NOT NULL,
  "image_id" uuid NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "rotation_degrees" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "school_document_students" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "school_document_id" uuid NOT NULL,
  "student_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "school_documents" ADD CONSTRAINT "school_documents_organization_id_organization_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "school_documents" ADD CONSTRAINT "school_documents_resource_id_resources_id_fk"
  FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "school_document_files" ADD CONSTRAINT "school_document_files_organization_id_organization_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "school_document_files" ADD CONSTRAINT "school_document_files_school_document_id_school_documents_id_fk"
  FOREIGN KEY ("school_document_id") REFERENCES "public"."school_documents"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "school_document_files" ADD CONSTRAINT "school_document_files_image_id_curriculum_images_id_fk"
  FOREIGN KEY ("image_id") REFERENCES "public"."curriculum_images"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "school_document_students" ADD CONSTRAINT "school_document_students_organization_id_organization_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "school_document_students" ADD CONSTRAINT "school_document_students_school_document_id_school_documents_id_fk"
  FOREIGN KEY ("school_document_id") REFERENCES "public"."school_documents"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "school_document_students" ADD CONSTRAINT "school_document_students_student_id_students_id_fk"
  FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "school_documents_organization_id_idx" ON "school_documents" USING btree ("organization_id");
CREATE INDEX "school_documents_resource_id_idx" ON "school_documents" USING btree ("resource_id");
CREATE INDEX "school_documents_type_idx" ON "school_documents" USING btree ("type");
CREATE INDEX "school_documents_week_start_date_idx" ON "school_documents" USING btree ("week_start_date");

CREATE INDEX "school_document_files_organization_id_idx" ON "school_document_files" USING btree ("organization_id");
CREATE INDEX "school_document_files_school_document_id_idx" ON "school_document_files" USING btree ("school_document_id");
CREATE INDEX "school_document_files_image_id_idx" ON "school_document_files" USING btree ("image_id");
CREATE UNIQUE INDEX "school_document_files_doc_sort_unique_idx" ON "school_document_files" USING btree ("school_document_id", "sort_order");

CREATE INDEX "school_document_students_organization_id_idx" ON "school_document_students" USING btree ("organization_id");
CREATE INDEX "school_document_students_school_document_id_idx" ON "school_document_students" USING btree ("school_document_id");
CREATE INDEX "school_document_students_student_id_idx" ON "school_document_students" USING btree ("student_id");
CREATE UNIQUE INDEX "school_document_students_unique_idx" ON "school_document_students" USING btree ("school_document_id", "student_id");
