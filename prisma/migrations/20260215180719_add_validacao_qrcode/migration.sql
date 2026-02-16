-- AlterTable
ALTER TABLE "qrcodes_usados" ADD COLUMN     "validado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "validado_em" TIMESTAMP(3);
