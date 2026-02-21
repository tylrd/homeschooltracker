ALTER TABLE "lessons"
  ALTER COLUMN "mood" TYPE text USING "mood"::text;

ALTER TABLE "shared_lessons"
  ALTER COLUMN "mood" TYPE text USING "mood"::text;

DROP TYPE "public"."lesson_mood";
