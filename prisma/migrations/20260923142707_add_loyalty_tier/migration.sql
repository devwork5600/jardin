-- CreateTable
CREATE TABLE "loyalty_tier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minSpentCents" INTEGER NOT NULL,
    "discountPct" INTEGER NOT NULL,

    CONSTRAINT "loyalty_tier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_tier_name_key" ON "loyalty_tier"("name");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_tier_minSpentCents_key" ON "loyalty_tier"("minSpentCents");
