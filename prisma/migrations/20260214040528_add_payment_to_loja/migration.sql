/*
  Warnings:

  - The values [lojista] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('superadmin', 'admin', 'loja');
ALTER TABLE "usuarios" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "usuarios" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "usuarios" ALTER COLUMN "role" SET DEFAULT 'loja';
COMMIT;

-- AlterTable
ALTER TABLE "lojas" ADD COLUMN     "payment_status" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "usuarios" ALTER COLUMN "role" SET DEFAULT 'loja';
