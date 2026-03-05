-- DropForeignKey
ALTER TABLE "resgates" DROP CONSTRAINT "resgates_cupom_id_fkey";

-- AddForeignKey
ALTER TABLE "resgates" ADD CONSTRAINT "resgates_cupom_id_fkey" FOREIGN KEY ("cupom_id") REFERENCES "cupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
