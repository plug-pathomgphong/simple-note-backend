/*
  Warnings:

  - You are about to drop the column `attachmentUrl` on the `Note` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Note" DROP COLUMN "attachmentUrl",
ADD COLUMN     "attachment_url" TEXT;

-- CreateIndex
CREATE INDEX "Note_user_id_idx" ON "Note"("user_id");
