CREATE TABLE "daily_rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"reward_date" date NOT NULL,
	"reward_type" text DEFAULT 'all_lessons_completed' NOT NULL,
	"points" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_rewards" ADD CONSTRAINT "daily_rewards_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "daily_rewards_organization_id_idx" ON "daily_rewards" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "daily_rewards_organization_reward_date_idx" ON "daily_rewards" USING btree ("organization_id","reward_date");
--> statement-breakpoint
CREATE UNIQUE INDEX "daily_rewards_organization_date_type_unique_idx" ON "daily_rewards" USING btree ("organization_id","reward_date","reward_type");
