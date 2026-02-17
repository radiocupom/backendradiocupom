/*
  Warnings:
  - Added the required column `updated_at` to the `qrcodes_usados` table. 
  - This migration handles existing data safely.
*/

-- DropForeignKey
ALTER TABLE "qrcodes_usados" DROP CONSTRAINT "qrcodes_usados_cliente_id_fkey";

-- DropForeignKey
ALTER TABLE "qrcodes_usados" DROP CONSTRAINT "qrcodes_usados_cupom_id_fkey";

-- 🔥 1. Adicionar colunas como opcionais primeiro
ALTER TABLE "qrcodes_usados" ADD COLUMN "created_at" TIMESTAMP(3);
ALTER TABLE "qrcodes_usados" ADD COLUMN "updated_at" TIMESTAMP(3);

-- 🔥 2. Preencher dados existentes
UPDATE "qrcodes_usados" SET "created_at" = CURRENT_TIMESTAMP WHERE "created_at" IS NULL;
UPDATE "qrcodes_usados" SET "updated_at" = CURRENT_TIMESTAMP WHERE "updated_at" IS NULL;

-- 🔥 3. Agora sim, tornar obrigatórias
ALTER TABLE "qrcodes_usados" ALTER COLUMN "created_at" SET NOT NULL;
ALTER TABLE "qrcodes_usados" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "qrcodes_usados" ALTER COLUMN "updated_at" SET NOT NULL;

-- Criar índices
CREATE INDEX "qrcodes_usados_cupom_id_idx" ON "qrcodes_usados"("cupom_id");
CREATE INDEX "qrcodes_usados_cliente_id_idx" ON "qrcodes_usados"("cliente_id");
CREATE INDEX "qrcodes_usados_usado_em_idx" ON "qrcodes_usados"("usado_em");
CREATE INDEX "qrcodes_usados_validado_idx" ON "qrcodes_usados"("validado");
CREATE INDEX "qrcodes_usados_cupom_id_validado_idx" ON "qrcodes_usados"("cupom_id", "validado");
CREATE INDEX "qrcodes_usados_cliente_id_validado_idx" ON "qrcodes_usados"("cliente_id", "validado");
CREATE INDEX "qrcodes_usados_cupom_id_cliente_id_idx" ON "qrcodes_usados"("cupom_id", "cliente_id");
CREATE INDEX "qrcodes_usados_validado_em_idx" ON "qrcodes_usados"("validado_em");
CREATE INDEX "qrcodes_usados_created_at_idx" ON "qrcodes_usados"("created_at");
CREATE INDEX "qrcodes_usados_cupom_id_cliente_id_validado_idx" ON "qrcodes_usados"("cupom_id", "cliente_id", "validado");

-- Restaurar foreign keys
ALTER TABLE "qrcodes_usados" ADD CONSTRAINT "qrcodes_usados_cupom_id_fkey" FOREIGN KEY ("cupom_id") REFERENCES "cupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "qrcodes_usados" ADD CONSTRAINT "qrcodes_usados_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Renomear índice único
ALTER INDEX "qrcodes_usados_codigo_key" RENAME TO "qrcodes_usados_codigo_unique";