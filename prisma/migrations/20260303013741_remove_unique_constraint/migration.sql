-- DropIndex
DROP INDEX "resgates_cliente_id_cupom_id_key";

-- CreateIndex
CREATE INDEX "resgates_cliente_id_cupom_id_idx" ON "resgates"("cliente_id", "cupom_id");
