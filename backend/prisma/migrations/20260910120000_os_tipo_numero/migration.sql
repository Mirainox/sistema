-- CreateEnum
CREATE TYPE "TipoOS" AS ENUM ('MANUTENCAO', 'CONSERTO', 'REFORMA', 'GARANTIA', 'DETALHE_TECNICO', 'INTERVENCAO');

-- AlterTable
ALTER TABLE "Manutencao" ADD COLUMN     "numero" TEXT,
ADD COLUMN     "tipo" "TipoOS" NOT NULL DEFAULT 'MANUTENCAO';

-- CreateIndex
CREATE UNIQUE INDEX "Manutencao_numero_key" ON "Manutencao"("numero");
