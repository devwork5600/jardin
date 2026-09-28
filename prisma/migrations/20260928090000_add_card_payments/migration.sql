-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'EN_ATTENTE_PAIEMENT';

-- AlterTable
ALTER TABLE "order" ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "stripeSessionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "order_stripeSessionId_key" ON "order"("stripeSessionId");
