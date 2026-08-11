-- CreateTable
CREATE TABLE "ManualSale" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManualSale_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ManualSale_date_idx" ON "ManualSale"("date");
