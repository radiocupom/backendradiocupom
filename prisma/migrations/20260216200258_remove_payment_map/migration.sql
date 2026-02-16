/*
  Warnings:

  - You are about to drop the column `payment_status` on the `lojas` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "lojas" DROP COLUMN "payment_status",
ADD COLUMN     "payment" BOOLEAN NOT NULL DEFAULT false;
