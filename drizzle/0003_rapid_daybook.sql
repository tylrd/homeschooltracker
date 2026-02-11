CREATE TABLE "global_absences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"reason_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "global_absences" ADD CONSTRAINT "global_absences_reason_id_absence_reasons_id_fk" FOREIGN KEY ("reason_id") REFERENCES "public"."absence_reasons"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "global_absences_date_unique_idx" ON "global_absences" USING btree ("date");
--> statement-breakpoint
CREATE INDEX "global_absences_date_idx" ON "global_absences" USING btree ("date");
