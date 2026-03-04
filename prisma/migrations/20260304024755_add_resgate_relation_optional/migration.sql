-- AlterTable
ALTER TABLE "qrcodes_usados" ADD COLUMN     "resgate_id" UUID;

-- CreateIndex
CREATE INDEX "qrcodes_usados_resgate_id_idx" ON "qrcodes_usados"("resgate_id");

-- AddForeignKey
ALTER TABLE "qrcodes_usados" ADD CONSTRAINT "qrcodes_usados_resgate_id_fkey" FOREIGN KEY ("resgate_id") REFERENCES "resgates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
