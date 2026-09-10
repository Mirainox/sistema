-- AlterEnum
ALTER TYPE "StatusPedido" ADD VALUE IF NOT EXISTS 'AGUARDANDO_CORRECAO';

-- AlterTable
ALTER TABLE "Pedido"
  ADD COLUMN "dadosConferidos" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "desenhoNecessario" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "desenhoStatus" TEXT,
  ADD COLUMN "conferenciaGerenteEm" TIMESTAMP(3),
  ADD COLUMN "erroPedido" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "erroPedidoObs" TEXT,
  ADD COLUMN "erroPedidoPor" TEXT,
  ADD COLUMN "erroPedidoEm" TIMESTAMP(3),
  ADD COLUMN "erroPedidoPrazo" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SetorOS" ADD COLUMN "pendencias" TEXT;
