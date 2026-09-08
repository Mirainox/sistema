-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN     "comprovanteSinalConferido" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "financeiroLiberadoEm" TIMESTAMP(3),
ADD COLUMN     "financeiroObservacao" TEXT;
