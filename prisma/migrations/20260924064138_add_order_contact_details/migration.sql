/*
  Warnings:

  - Added the required column `contactEmail` to the `order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contactName` to the `order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contactPhone` to the `order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "order" ADD COLUMN     "contactEmail" TEXT NOT NULL,
ADD COLUMN     "contactName" TEXT NOT NULL,
ADD COLUMN     "contactPhone" TEXT NOT NULL;
