-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'DIRETOR', 'GESTOR_ADMIN', 'GESTOR_PRODUCAO', 'GERENTE_OPERACIONAL', 'VENDEDOR', 'COMPRADOR', 'FINANCEIRO', 'FISCAL', 'PRODUCAO', 'ALMOXARIFE', 'RH', 'MANUTENCAO', 'MARKETING', 'LOJA_PECAS', 'EXPEDICAO');

-- CreateEnum
CREATE TYPE "Setor" AS ENUM ('DIRETORIA', 'ADMINISTRATIVO', 'MARKETING', 'VENDAS', 'COMPRAS', 'FINANCEIRO', 'FISCAL', 'RH', 'PRODUCAO_INOX', 'CALDEIRARIA', 'USINAGEM', 'ELETRICA', 'MONTAGEM_AUTOMATIZADA', 'ALMOXARIFADO_GERAL', 'ALMOXARIFADO_CONSUMIVEIS', 'LOJA_PECAS', 'MANUTENCAO', 'EXPEDICAO', 'TI');

-- CreateEnum
CREATE TYPE "StatusPedido" AS ENUM ('AGUARDANDO_FINANCEIRO', 'FINANCEIRO_APROVADO', 'EM_PRODUCAO', 'AGUARDANDO_EXPEDICAO', 'EXPEDIDO', 'ENTREGUE', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusOS" AS ENUM ('GERADA', 'DISTRIBUIDA_FISICAMENTE', 'DISTRIBUIDA_VIRTUALMENTE', 'EM_ANDAMENTO', 'AGUARDANDO_PECAS', 'EM_TESTE', 'CONCLUIDA', 'EXPEDIDA');

-- CreateEnum
CREATE TYPE "StatusCompra" AS ENUM ('SOLICITADO', 'CIENTE', 'COTANDO', 'PEDIDO_REALIZADO', 'EM_TRANSITO', 'RECEBIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoEstoque" AS ENUM ('MATERIA_PRIMA_BRUTA', 'PECA_PRONTA', 'CONSUMIVEL', 'EPI');

-- CreateEnum
CREATE TYPE "StatusManutencao" AS ENUM ('ABERTO', 'EM_ANALISE', 'AGUARDANDO_PECAS', 'EM_ATENDIMENTO', 'CONCLUIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoNotificacao" AS ENUM ('NOVO_PEDIDO', 'OS_GERADA', 'OS_DISTRIBUIDA', 'COMPRA_SOLICITADA', 'COMPRA_PRAZO', 'FOTO_SOLICITADA', 'CHECKLIST_PENDENTE', 'MANUTENCAO_SOLICITADA', 'EXPEDICAO_PENDENTE', 'FINANCEIRO_CONFIRMAR', 'FISCAL_NOTA', 'RH_EPI', 'GERAL');

-- CreateEnum
CREATE TYPE "TipoChecklist" AS ENUM ('COMERCIAL_VENDEDOR', 'DISTRIBUICAO_OS', 'FOTO_PRODUCAO', 'ORGANIZACAO_SEXTA', 'TORNO_SEXTA', 'USINAGEM_PECA', 'EPI', 'COMPRA_REALIZADA');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "setor" "Setor" NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PRODUCAO',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "cpfCnpj" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pedido" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "vendedorId" TEXT NOT NULL,
    "equipamento" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "opcionais" TEXT,
    "personalizacoes" TEXT,
    "condicaoPagamento" TEXT NOT NULL,
    "prazoEntrega" TIMESTAMP(3) NOT NULL,
    "voltagem" TEXT,
    "embalagem" TEXT,
    "valorTotal" DOUBLE PRECISION NOT NULL,
    "status" "StatusPedido" NOT NULL DEFAULT 'AGUARDANDO_FINANCEIRO',
    "observacoesTecnicas" TEXT,
    "observacoesComerciais" TEXT,
    "contratoAssinado" BOOLEAN NOT NULL DEFAULT false,
    "comprovanteSinal" TEXT,
    "checklistComercial" BOOLEAN NOT NULL DEFAULT false,
    "pagamentoConfirmado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OS" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "distribuidorId" TEXT,
    "status" "StatusOS" NOT NULL DEFAULT 'GERADA',
    "dataEntregaFisica" TIMESTAMP(3),
    "dataEnvioVirtual" TIMESTAMP(3),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SetorOS" (
    "id" TEXT NOT NULL,
    "osId" TEXT NOT NULL,
    "setor" "Setor" NOT NULL,
    "responsavel" TEXT NOT NULL,
    "recebeuFisico" BOOLEAN NOT NULL DEFAULT false,
    "recebeuVirtual" BOOLEAN NOT NULL DEFAULT false,
    "dataRecebimento" TIMESTAMP(3),
    "pessoaRecebeu" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SetorOS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Checklist" (
    "id" TEXT NOT NULL,
    "osId" TEXT,
    "tipo" "TipoChecklist" NOT NULL,
    "setor" "Setor" NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responsavel" TEXT NOT NULL,
    "concluido" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Checklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL,
    "checklistId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistResposta" (
    "id" TEXT NOT NULL,
    "checklistId" TEXT NOT NULL,
    "itemId" TEXT,
    "usuarioId" TEXT NOT NULL,
    "resposta" BOOLEAN NOT NULL,
    "observacao" TEXT,
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChecklistResposta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Foto" (
    "id" TEXT NOT NULL,
    "osId" TEXT,
    "checklistId" TEXT,
    "usuarioId" TEXT NOT NULL,
    "setor" "Setor" NOT NULL,
    "url" TEXT NOT NULL,
    "descricao" TEXT,
    "numeroPedido" TEXT,
    "nomeCliente" TEXT,
    "cidadeCliente" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Foto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Compra" (
    "id" TEXT NOT NULL,
    "osId" TEXT,
    "numeroPedido" TEXT,
    "nomeCliente" TEXT,
    "cidadeCliente" TEXT,
    "compradorId" TEXT,
    "produto" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "unidade" TEXT,
    "fornecedor" TEXT,
    "valor" DOUBLE PRECISION,
    "condicaoPagamento" TEXT,
    "prazoEntrega" TIMESTAMP(3),
    "transportadora" TEXT,
    "previsaoChegada" TIMESTAMP(3),
    "status" "StatusCompra" NOT NULL DEFAULT 'SOLICITADO',
    "urgencia" TEXT NOT NULL DEFAULT 'NORMAL',
    "setorSolicitante" "Setor",
    "ciencia" BOOLEAN NOT NULL DEFAULT false,
    "dataCiencia" TIMESTAMP(3),
    "pedidoRealizado" BOOLEAN NOT NULL DEFAULT false,
    "dataPedido" TIMESTAMP(3),
    "pdfPedido" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Estoque" (
    "id" TEXT NOT NULL,
    "tipo" "TipoEstoque" NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "unidade" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantidadeMinima" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "localizacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimentacaoEstoque" (
    "id" TEXT NOT NULL,
    "estoqueId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "motivo" TEXT,
    "numeroPedido" TEXT,
    "nomeCliente" TEXT,
    "usuarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimentacaoEstoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EpiEntrega" (
    "id" TEXT NOT NULL,
    "funcionarioId" TEXT NOT NULL,
    "entregadoPorId" TEXT,
    "tipoEpi" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "dataEntrega" TIMESTAMP(3) NOT NULL,
    "confirmacaoRecebimento" BOOLEAN NOT NULL DEFAULT false,
    "setor" "Setor" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EpiEntrega_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Manutencao" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "equipamento" TEXT NOT NULL,
    "problema" TEXT NOT NULL,
    "status" "StatusManutencao" NOT NULL DEFAULT 'ABERTO',
    "prioridade" TEXT NOT NULL DEFAULT 'NORMAL',
    "dataEntregaEquipamento" TIMESTAMP(3),
    "garantia" BOOLEAN NOT NULL DEFAULT false,
    "tecnicoId" TEXT,
    "prazoAtendimento" TIMESTAMP(3),
    "solucao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Manutencao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expedicao" (
    "id" TEXT NOT NULL,
    "numeroPedido" TEXT NOT NULL,
    "nomeCliente" TEXT NOT NULL,
    "cidadeCliente" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "equipamento" TEXT NOT NULL,
    "peso" DOUBLE PRECISION,
    "volume" DOUBLE PRECISION,
    "dimensoes" TEXT,
    "dataPrevisao" TIMESTAMP(3) NOT NULL,
    "caminhao" TEXT,
    "transportadora" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AGUARDANDO',
    "rotaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expedicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacao" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "tipo" "TipoNotificacao" NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "pedidoId" TEXT,
    "osId" TEXT,
    "compraId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_numero_key" ON "Pedido"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "OS_numero_key" ON "OS"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Estoque_codigo_key" ON "Estoque"("codigo");

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OS" ADD CONSTRAINT "OS_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OS" ADD CONSTRAINT "OS_distribuidorId_fkey" FOREIGN KEY ("distribuidorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetorOS" ADD CONSTRAINT "SetorOS_osId_fkey" FOREIGN KEY ("osId") REFERENCES "OS"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Checklist" ADD CONSTRAINT "Checklist_osId_fkey" FOREIGN KEY ("osId") REFERENCES "OS"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "Checklist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistResposta" ADD CONSTRAINT "ChecklistResposta_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "Checklist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistResposta" ADD CONSTRAINT "ChecklistResposta_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ChecklistItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistResposta" ADD CONSTRAINT "ChecklistResposta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Foto" ADD CONSTRAINT "Foto_osId_fkey" FOREIGN KEY ("osId") REFERENCES "OS"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Foto" ADD CONSTRAINT "Foto_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "Checklist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Foto" ADD CONSTRAINT "Foto_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_osId_fkey" FOREIGN KEY ("osId") REFERENCES "OS"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_compradorId_fkey" FOREIGN KEY ("compradorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentacaoEstoque" ADD CONSTRAINT "MovimentacaoEstoque_estoqueId_fkey" FOREIGN KEY ("estoqueId") REFERENCES "Estoque"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EpiEntrega" ADD CONSTRAINT "EpiEntrega_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EpiEntrega" ADD CONSTRAINT "EpiEntrega_entregadoPorId_fkey" FOREIGN KEY ("entregadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Manutencao" ADD CONSTRAINT "Manutencao_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Manutencao" ADD CONSTRAINT "Manutencao_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_osId_fkey" FOREIGN KEY ("osId") REFERENCES "OS"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "Compra"("id") ON DELETE SET NULL ON UPDATE CASCADE;
