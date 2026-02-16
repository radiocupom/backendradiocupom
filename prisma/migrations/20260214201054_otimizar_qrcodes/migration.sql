/*
  Warnings:

  - You are about to drop the `qrcodes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "qrcodes" DROP CONSTRAINT "qrcodes_cupom_id_fkey";

-- AlterTable
ALTER TABLE "cupons" ADD COLUMN     "qr_codes_usados" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_qr_codes" INTEGER NOT NULL DEFAULT 1000;

-- DropTable
DROP TABLE "qrcodes";

-- CreateTable
CREATE TABLE "qrcodes_usados" (
    "id" UUID NOT NULL,
    "cupom_id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "cliente_id" UUID NOT NULL,
    "usado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qrcodes_usados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "qrcodes_usados_codigo_key" ON "qrcodes_usados"("codigo");

-- AddForeignKey
ALTER TABLE "qrcodes_usados" ADD CONSTRAINT "qrcodes_usados_cupom_id_fkey" FOREIGN KEY ("cupom_id") REFERENCES "cupons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
