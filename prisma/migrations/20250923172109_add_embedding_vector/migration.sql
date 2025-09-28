-- This is an empty migration.
ALTER TABLE "Note" ADD COLUMN "embedding" VECTOR(1536);