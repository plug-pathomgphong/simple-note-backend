-- This is an empty migration.
ALTER TABLE "Note" DROP COLUMN "embedding";
ALTER TABLE "Note" ADD COLUMN "embedding" vector(384);