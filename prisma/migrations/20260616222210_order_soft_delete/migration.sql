-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "removedAt" TIMESTAMP(3),
ADD COLUMN     "removedById" TEXT,
ADD COLUMN     "removedReason" TEXT;

-- CreateIndex
CREATE INDEX "Order_removedAt_idx" ON "Order"("removedAt");
