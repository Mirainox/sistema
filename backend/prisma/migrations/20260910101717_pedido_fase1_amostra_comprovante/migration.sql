-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN     "aguardandoSinal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "amostraChegou" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "amostraEnviada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "amostraNaoSeAplica" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "amostraPedidaCliente" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "compBanco" TEXT,
ADD COLUMN     "compClienteConfere" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "compData" TIMESTAMP(3),
ADD COLUMN     "compPedidoConfere" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "compValor" DOUBLE PRECISION;
