-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "senhaAlteradaEm" TIMESTAMP(3),
ADD COLUMN     "senhaTemporaria" BOOLEAN NOT NULL DEFAULT true;
