-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('CLIENT', 'BOOSTER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."Game" AS ENUM ('CS2');

-- CreateEnum
CREATE TYPE "public"."ServiceType" AS ENUM ('RANK_BOOST');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'CLIENT',
    "avatar" TEXT,
    "phone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Service" (
    "id" SERIAL NOT NULL,
    "game" "public"."Game" NOT NULL,
    "type" "public"."ServiceType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "duration" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "image" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Order" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "boosterId" INTEGER,
    "status" "public"."OrderStatus" NOT NULL DEFAULT 'PENDING',
    "total" DOUBLE PRECISION NOT NULL,
    "currentRank" TEXT,
    "targetRank" TEXT,
    "currentRating" INTEGER,
    "targetRating" INTEGER,
    "gameMode" TEXT,
    "gameType" TEXT,
    "metadata" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'PIX',
    "pixCode" TEXT,
    "qrCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "total" DOUBLE PRECISION NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "Order_userId_gameMode_status_idx" ON "public"."Order"("userId", "gameMode", "status");

-- CreateIndex
CREATE INDEX "Order_userId_status_idx" ON "public"."Order"("userId", "status");

-- CreateIndex
CREATE INDEX "Order_boosterId_status_idx" ON "public"."Order"("boosterId", "status");

-- CreateIndex
CREATE INDEX "Order_serviceId_idx" ON "public"."Order"("serviceId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "public"."Order"("status");

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_boosterId_fkey" FOREIGN KEY ("boosterId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
