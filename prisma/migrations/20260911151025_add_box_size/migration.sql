-- CreateEnum
CREATE TYPE "BoxSize" AS ENUM ('P', 'M', 'G');

-- AlterTable: add box size (existing rows default to M)
ALTER TABLE "Product" ADD COLUMN "boxSize" "BoxSize" NOT NULL DEFAULT 'M';
