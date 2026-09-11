-- Corrige pedidos cuja Ordem de Pedido já estava concluída na produção, mas o
-- Pedido tinha ficado para trás (ex.: mostrando "Em Produção" enquanto a
-- Ordem de Pedido já mostrava "Concluída"). Alinha o status do pedido e marca
-- a fase de entrega como "Finalizada pela produção" quando ainda não houver.

UPDATE "Pedido" p
SET "status" = 'AGUARDANDO_EXPEDICAO'
FROM "OS" o
WHERE o."pedidoId" = p."id"
  AND o."status" = 'CONCLUIDA'
  AND p."status" IN ('AGUARDANDO_FINANCEIRO', 'AGUARDANDO_CORRECAO', 'FINANCEIRO_APROVADO', 'EM_PRODUCAO');

UPDATE "Pedido" p
SET "faseEntrega" = 'PRODUCAO_FINALIZADA',
    "faseEntregaPor" = 'Produção',
    "faseEntregaEm" = now()
FROM "OS" o
WHERE o."pedidoId" = p."id"
  AND o."status" = 'CONCLUIDA'
  AND p."faseEntrega" IS NULL;
