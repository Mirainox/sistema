-- AlterTable
ALTER TABLE "Pedido"
  ADD COLUMN "desenhoRecebido" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "desenhoRecebidoPor" TEXT,
  ADD COLUMN "desenhoRecebidoEm" TIMESTAMP(3),
  ADD COLUMN "desenhoAndamento" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "desenhoAndamentoPor" TEXT,
  ADD COLUMN "desenhoAndamentoEm" TIMESTAMP(3),
  ADD COLUMN "desenhoFinalizado" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "desenhoFinalizadoPor" TEXT,
  ADD COLUMN "desenhoFinalizadoEm" TIMESTAMP(3);
