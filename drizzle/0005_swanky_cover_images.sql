CREATE TABLE "curriculum_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text DEFAULT 'postgres' NOT NULL,
	"content_type" text NOT NULL,
	"byte_size" integer NOT NULL,
	"width" integer,
	"height" integer,
	"image_data" bytea NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "cover_image_id" uuid;
--> statement-breakpoint
ALTER TABLE "shared_curricula" ADD COLUMN "cover_image_id" uuid;
--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_cover_image_id_curriculum_images_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."curriculum_images"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "shared_curricula" ADD CONSTRAINT "shared_curricula_cover_image_id_curriculum_images_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."curriculum_images"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "resources_cover_image_id_idx" ON "resources" USING btree ("cover_image_id");
--> statement-breakpoint
CREATE INDEX "shared_curricula_cover_image_id_idx" ON "shared_curricula" USING btree ("cover_image_id");
