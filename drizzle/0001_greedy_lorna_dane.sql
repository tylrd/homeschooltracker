CREATE TABLE "absence_reasons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "absences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"date" date NOT NULL,
	"reason_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "absences" ADD CONSTRAINT "absences_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "absences" ADD CONSTRAINT "absences_reason_id_absence_reasons_id_fk" FOREIGN KEY ("reason_id") REFERENCES "public"."absence_reasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "absences_student_date_idx" ON "absences" USING btree ("student_id","date");--> statement-breakpoint
CREATE INDEX "absences_date_idx" ON "absences" USING btree ("date");