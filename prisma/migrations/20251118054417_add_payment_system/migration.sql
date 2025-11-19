-- CreateEnum
CREATE TYPE "public"."CommissionStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."RevenueStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "adminId" INTEGER,
ADD COLUMN     "adminPercentage" DOUBLE PRECISION,
ADD COLUMN     "adminRevenue" DOUBLE PRECISION,
ADD COLUMN     "boosterCommission" DOUBLE PRECISION,
ADD COLUMN     "boosterPercentage" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "accountHolder" TEXT,
ADD COLUMN     "accountType" TEXT,
ADD COLUMN     "bankAccount" TEXT,
ADD COLUMN     "bankAgency" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "bankPix" TEXT,
ADD COLUMN     "taxId" TEXT;

-- CreateTable
CREATE TABLE "public"."BoosterCommission" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "boosterId" INTEGER NOT NULL,
    "orderTotal" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "public"."CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoosterCommission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdminRevenue" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "adminId" INTEGER NOT NULL,
    "orderTotal" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "public"."RevenueStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminRevenue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BoosterCommission_orderId_key" ON "public"."BoosterCommission"("orderId");

-- CreateIndex
CREATE INDEX "BoosterCommission_boosterId_status_idx" ON "public"."BoosterCommission"("boosterId", "status");

-- CreateIndex
CREATE INDEX "BoosterCommission_status_idx" ON "public"."BoosterCommission"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AdminRevenue_orderId_key" ON "public"."AdminRevenue"("orderId");

-- CreateIndex
CREATE INDEX "AdminRevenue_adminId_status_idx" ON "public"."AdminRevenue"("adminId", "status");

-- CreateIndex
CREATE INDEX "AdminRevenue_status_idx" ON "public"."AdminRevenue"("status");

-- CreateIndex
CREATE INDEX "Order_adminId_status_idx" ON "public"."Order"("adminId", "status");

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BoosterCommission" ADD CONSTRAINT "BoosterCommission_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BoosterCommission" ADD CONSTRAINT "BoosterCommission_boosterId_fkey" FOREIGN KEY ("boosterId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdminRevenue" ADD CONSTRAINT "AdminRevenue_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdminRevenue" ADD CONSTRAINT "AdminRevenue_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
