-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('AVAILABLE', 'SOLD', 'MADE_TO_ORDER');

-- CreateEnum
CREATE TYPE "ProductKind" AS ENUM ('BAG', 'CLOTHING');

-- CreateEnum
CREATE TYPE "CustomOrderStatus" AS ENUM ('NEW', 'RESPONDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('SHIPPING', 'PICKUP');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'READY', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" "ProductKind" NOT NULL DEFAULT 'BAG',
    "category" TEXT NOT NULL,
    "sizes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "priceCents" INTEGER NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "details" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "ProductStatus" NOT NULL DEFAULT 'AVAILABLE',
    "tag" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "colors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "allowsMultipleColors" BOOLEAN NOT NULL DEFAULT false,
    "leadTimeMinDays" INTEGER,
    "leadTimeMaxDays" INTEGER,
    "weightGrams" INTEGER NOT NULL DEFAULT 350,
    "heightCm" INTEGER NOT NULL DEFAULT 12,
    "widthCm" INTEGER NOT NULL DEFAULT 22,
    "lengthCm" INTEGER NOT NULL DEFAULT 28,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomOrderRequest" (
    "id" TEXT NOT NULL,
    "pieceType" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "colors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deadline" TEXT NOT NULL DEFAULT '',
    "details" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "status" "CustomOrderStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomOrderRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingHealth" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "lastSuccessAt" TIMESTAMP(3),
    "lastFailureAt" TIMESTAMP(3),
    "lastFailureReason" TEXT,

    CONSTRAINT "ShippingHealth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "publicToken" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "subtotalCents" INTEGER NOT NULL,
    "deliveryMethod" "DeliveryMethod" NOT NULL,
    "shippingCents" INTEGER NOT NULL DEFAULT 0,
    "shippingLabel" TEXT,
    "shippingDays" INTEGER,
    "trackingCode" TEXT,
    "cep" TEXT,
    "street" TEXT,
    "district" TEXT,
    "city" TEXT,
    "uf" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "totalCents" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "mpPreferenceId" TEXT,
    "mpPaymentId" TEXT,
    "emailSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_kind_idx" ON "Product"("kind");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- CreateIndex
CREATE INDEX "Product_featured_idx" ON "Product"("featured");

-- CreateIndex
CREATE INDEX "CustomOrderRequest_status_idx" ON "CustomOrderRequest"("status");

-- CreateIndex
CREATE INDEX "CustomOrderRequest_createdAt_idx" ON "CustomOrderRequest"("createdAt");

-- CreateIndex
CREATE INDEX "Task_done_idx" ON "Task"("done");

-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Order_publicToken_key" ON "Order"("publicToken");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

