-- DropIndex
DROP INDEX "Notification_userId_lida_createdAt_idx";

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "excluida" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Notification_userId_excluida_lida_createdAt_idx" ON "Notification"("userId", "excluida", "lida", "createdAt");
