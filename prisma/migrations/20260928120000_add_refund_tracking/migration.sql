-- AlterTable
ALTER TABLE "order" ADD COLUMN     "refundedAt" TIMESTAMP(3),
ADD COLUMN     "stripePaymentIntentId" TEXT;
