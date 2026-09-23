-- CreateEnum
CREATE TYPE "ProductBadge" AS ENUM ('BEST_SELLER', 'NEW', 'ADVICE');

-- AlterTable
ALTER TABLE "category" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "product" ADD COLUMN     "badge" "ProductBadge";
