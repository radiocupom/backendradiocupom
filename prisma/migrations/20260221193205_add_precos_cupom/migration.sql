-- AlterTable
ALTER TABLE "cupons" ADD COLUMN     "nome_produto" TEXT,
ADD COLUMN     "percentual_desconto" INTEGER,
ADD COLUMN     "preco_com_desconto" DOUBLE PRECISION,
ADD COLUMN     "preco_original" DOUBLE PRECISION;
