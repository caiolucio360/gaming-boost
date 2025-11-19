/*
  Warnings:

  - You are about to drop the column `accountHolder` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `accountType` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `bankAccount` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `bankAgency` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `bankName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `bankPix` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `taxId` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "accountHolder",
DROP COLUMN "accountType",
DROP COLUMN "bankAccount",
DROP COLUMN "bankAgency",
DROP COLUMN "bankName",
DROP COLUMN "bankPix",
DROP COLUMN "taxId",
ADD COLUMN     "pixKey" TEXT;

-- CreateTable
CREATE TABLE "public"."CommissionConfig" (
    "id" SERIAL NOT NULL,
    "boosterPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0.70,
    "adminPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0.30,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommissionConfig_enabled_key" ON "public"."CommissionConfig"("enabled");
