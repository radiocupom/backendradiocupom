/*
  Warnings:

  - A unique constraint covering the columns `[loja_id]` on the table `usuarios` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "loja_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_loja_id_key" ON "usuarios"("loja_id");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_loja_id_fkey" FOREIGN KEY ("loja_id") REFERENCES "lojas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
