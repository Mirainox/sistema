-- AlterTable
ALTER TABLE "Pedido"
  ADD COLUMN "faseEntrega" TEXT,
  ADD COLUMN "faseEntregaPor" TEXT,
  ADD COLUMN "faseEntregaEm" TIMESTAMP(3),
  ADD COLUMN "entregueEm" TIMESTAMP(3);
