/*
  Warnings:

  - Made the column `logo` on table `lojas` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `categoria` to the `lojas` table without a default value. This is not possible if the table is not empty.
  - Made the column `descricao` on table `lojas` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "CategoriaLoja" AS ENUM ('RESTAURANTE', 'SUPERMERCADO', 'PADARIA', 'LOJA_DE_ROUPAS', 'ELETRONICOS', 'OUTROS');

-- AlterTable
ALTER TABLE "lojas" ALTER COLUMN "logo" SET NOT NULL,
DROP COLUMN "categoria",
ADD COLUMN     "categoria" "CategoriaLoja" NOT NULL,
ALTER COLUMN "descricao" SET NOT NULL;
