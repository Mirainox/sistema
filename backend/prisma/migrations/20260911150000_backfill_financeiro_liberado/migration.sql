-- Alguns pedidos foram liberados pelo Financeiro antes de o sistema passar a
-- gravar "financeiroLiberadoEm" (ou por um fluxo mais antigo) e por isso não
-- apareciam na aba "Liberados" do Painel Financeiro, mesmo já estando em
-- produção/expedição/entregues. Preenche a data que faltou usando a última
-- atualização do pedido como referência, para esses casos entrarem no
-- controle do Financeiro.
UPDATE "Pedido"
SET "financeiroLiberadoEm" = COALESCE("financeiroLiberadoEm", "updatedAt")
WHERE "financeiroLiberadoEm" IS NULL
  AND "status" IN ('FINANCEIRO_APROVADO', 'EM_PRODUCAO', 'AGUARDANDO_EXPEDICAO', 'EXPEDIDO', 'ENTREGUE');
