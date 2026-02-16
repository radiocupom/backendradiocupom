/*
  Warnings:

  - A unique constraint covering the columns `[cliente_id,cupom_id]` on the table `resgates` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "resgates_cliente_id_cupom_id_key" ON "resgates"("cliente_id", "cupom_id");
