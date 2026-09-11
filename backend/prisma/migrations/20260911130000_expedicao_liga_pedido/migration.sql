-- AlterTable
ALTER TABLE "Expedicao" ADD COLUMN "pedidoId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Expedicao_pedidoId_key" ON "Expedicao"("pedidoId");

-- AddForeignKey
ALTER TABLE "Expedicao" ADD CONSTRAINT "Expedicao_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Cria a expedição automaticamente para pedidos que já estão aguardando
-- expedição, em rota ou entregues e ainda não têm um registro de expedição
-- (corrige pedidos que avançaram de status antes desta automação existir).
INSERT INTO "Expedicao" (id, "pedidoId", "numeroPedido", "nomeCliente", "cidadeCliente", "estado", "equipamento", "dataPrevisao", status, "createdAt", "updatedAt")
SELECT
  'exp_' || substr(md5(p.id || clock_timestamp()::text || random()::text), 1, 20),
  p.id,
  p.numero,
  c.nome,
  c.cidade,
  COALESCE(c.estado, ''),
  p.equipamento || ' ' || p.modelo,
  p."prazoEntrega",
  'AGUARDANDO',
  now(),
  now()
FROM "Pedido" p
JOIN "Cliente" c ON c.id = p."clienteId"
WHERE p.status IN ('AGUARDANDO_EXPEDICAO', 'EXPEDIDO', 'ENTREGUE')
  AND NOT EXISTS (
    SELECT 1 FROM "Expedicao" e WHERE e."pedidoId" = p.id OR e."numeroPedido" = p.numero
  );
