-- AlterTable
ALTER TABLE "Foto" ADD COLUMN     "pedidoId" TEXT;

-- AddForeignKey
ALTER TABLE "Foto" ADD CONSTRAINT "Foto_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE SET NULL ON UPDATE CASCADE;
