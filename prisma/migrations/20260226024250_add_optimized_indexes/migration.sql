-- CreateIndex
CREATE INDEX "clientes_email_idx" ON "clientes"("email");

-- CreateIndex
CREATE INDEX "clientes_whatsapp_idx" ON "clientes"("whatsapp");

-- CreateIndex
CREATE INDEX "clientes_cidade_estado_idx" ON "clientes"("cidade", "estado");

-- CreateIndex
CREATE INDEX "clientes_data_nascimento_idx" ON "clientes"("data_nascimento");

-- CreateIndex
CREATE INDEX "clientes_created_at_idx" ON "clientes"("created_at");

-- CreateIndex
CREATE INDEX "clientes_ativo_idx" ON "clientes"("ativo");

-- CreateIndex
CREATE INDEX "cupons_loja_id_idx" ON "cupons"("loja_id");

-- CreateIndex
CREATE INDEX "cupons_data_expiracao_idx" ON "cupons"("data_expiracao");

-- CreateIndex
CREATE INDEX "cupons_loja_id_data_expiracao_idx" ON "cupons"("loja_id", "data_expiracao");

-- CreateIndex
CREATE INDEX "cupons_preco_com_desconto_idx" ON "cupons"("preco_com_desconto");

-- CreateIndex
CREATE INDEX "lojas_payment_idx" ON "lojas"("payment");

-- CreateIndex
CREATE INDEX "lojas_categoria_idx" ON "lojas"("categoria");

-- CreateIndex
CREATE INDEX "lojas_created_at_idx" ON "lojas"("created_at");

-- CreateIndex
CREATE INDEX "lojas_payment_categoria_idx" ON "lojas"("payment", "categoria");

-- CreateIndex
CREATE INDEX "resgates_cliente_id_idx" ON "resgates"("cliente_id");

-- CreateIndex
CREATE INDEX "resgates_cupom_id_idx" ON "resgates"("cupom_id");

-- CreateIndex
CREATE INDEX "resgates_resgatado_em_idx" ON "resgates"("resgatado_em");

-- CreateIndex
CREATE INDEX "resgates_cliente_id_resgatado_em_idx" ON "resgates"("cliente_id", "resgatado_em");

-- CreateIndex
CREATE INDEX "resgates_cupom_id_resgatado_em_idx" ON "resgates"("cupom_id", "resgatado_em");

-- CreateIndex
CREATE INDEX "usuarios_email_idx" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_role_idx" ON "usuarios"("role");
