-- AlterTable
ALTER TABLE "Todo" ADD COLUMN     "persistent" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Todo_userId_dayNoteId_idx" ON "Todo"("userId", "dayNoteId");

-- CreateIndex
CREATE INDEX "Todo_userId_persistent_completed_idx" ON "Todo"("userId", "persistent", "completed");
