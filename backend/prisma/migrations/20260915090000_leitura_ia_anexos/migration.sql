-- AlterTable
ALTER TABLE "Foto" ADD COLUMN "dadosExtraidos" JSONB;

-- AlterTable
ALTER TABLE "Pedido"
  ADD COLUMN "compExtraidoValor" DOUBLE PRECISION,
  ADD COLUMN "compExtraidoData" TIMESTAMP(3),
  ADD COLUMN "compExtraidoBanco" TEXT,
  ADD COLUMN "compExtraidoCliente" TEXT;
