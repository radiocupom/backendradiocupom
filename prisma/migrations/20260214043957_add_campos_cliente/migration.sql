/*
  Warnings:

  - Added the required column `bairro` to the `clientes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cidade` to the `clientes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `data_nascimento` to the `clientes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estado` to the `clientes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `genero` to the `clientes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `whatsapp` to the `clientes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "bairro" TEXT NOT NULL,
ADD COLUMN     "cidade" TEXT NOT NULL,
ADD COLUMN     "como_conheceu" TEXT,
ADD COLUMN     "data_nascimento" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "estado" TEXT NOT NULL,
ADD COLUMN     "facebook" TEXT,
ADD COLUMN     "genero" TEXT NOT NULL,
ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "observacoes" TEXT,
ADD COLUMN     "pais" TEXT NOT NULL DEFAULT 'Brasil',
ADD COLUMN     "receber_ofertas" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "tiktok" TEXT,
ADD COLUMN     "whatsapp" TEXT NOT NULL;
