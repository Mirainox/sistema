export type Role =
  | 'ADMIN' | 'DIRETOR' | 'GESTOR_ADMIN' | 'GESTOR_PRODUCAO'
  | 'GERENTE_OPERACIONAL' | 'VENDEDOR' | 'COMPRADOR' | 'FINANCEIRO'
  | 'FISCAL' | 'PRODUCAO' | 'ALMOXARIFE' | 'RH' | 'MANUTENCAO'
  | 'MARKETING' | 'LOJA_PECAS' | 'EXPEDICAO'

export type Setor =
  | 'DIRETORIA' | 'ADMINISTRATIVO' | 'MARKETING' | 'VENDAS' | 'COMPRAS'
  | 'FINANCEIRO' | 'FISCAL' | 'RH' | 'PRODUCAO_INOX' | 'CALDEIRARIA'
  | 'USINAGEM' | 'ELETRICA' | 'MONTAGEM_AUTOMATIZADA' | 'ALMOXARIFADO_GERAL'
  | 'ALMOXARIFADO_CONSUMIVEIS' | 'LOJA_PECAS' | 'MANUTENCAO' | 'EXPEDICAO' | 'TI'

export type StatusPedido =
  | 'AGUARDANDO_FINANCEIRO' | 'FINANCEIRO_APROVADO' | 'EM_PRODUCAO'
  | 'AGUARDANDO_EXPEDICAO' | 'EXPEDIDO' | 'ENTREGUE' | 'CANCELADO'

export type StatusOS =
  | 'GERADA' | 'DISTRIBUIDA_FISICAMENTE' | 'DISTRIBUIDA_VIRTUALMENTE'
  | 'EM_ANDAMENTO' | 'AGUARDANDO_PECAS' | 'EM_TESTE' | 'CONCLUIDA' | 'EXPEDIDA'

export type StatusCompra =
  | 'SOLICITADO' | 'CIENTE' | 'COTANDO' | 'PEDIDO_REALIZADO'
  | 'EM_TRANSITO' | 'RECEBIDO' | 'CANCELADO'

export interface Usuario {
  id: string
  nome: string
  email: string
  cargo: string
  setor: Setor
  role: Role
  ativo: boolean
  senhaTemporaria?: boolean
  senhaAlteradaEm?: string | null
}

export interface Cliente {
  id: string
  nome: string
  cidade: string
  estado: string
  telefone?: string
  email?: string
}

export interface Pedido {
  id: string
  numero: string
  cliente: Cliente
  vendedor: { nome: string }
  equipamento: string
  modelo: string
  condicaoPagamento: string
  prazoEntrega: string
  valorTotal: number
  status: StatusPedido
  checklistComercial: boolean
  pagamentoConfirmado: boolean
  observacoesTecnicas?: string
  comprovanteSinal?: string | null
  createdAt: string
  os?: OS[]
  fotos?: { id: string; url: string; descricao?: string; usuario?: { nome: string }; createdAt: string }[]
}

export interface OS {
  id: string
  numero: string
  pedido: Pedido
  distribuidor?: { nome: string }
  status: StatusOS
  setoresOS: SetorOS[]
  createdAt: string
}

export interface SetorOS {
  id: string
  setor: Setor
  responsavel: string
  recebeuFisico: boolean
  recebeuVirtual: boolean
  pessoaRecebeu?: string
}

export interface Compra {
  id: string
  produto: string
  quantidade: number
  unidade?: string
  numeroPedido?: string
  nomeCliente?: string
  cidadeCliente?: string
  fornecedor?: string
  valor?: number
  status: StatusCompra
  urgencia: string
  ciencia: boolean
  pedidoRealizado: boolean
  previsaoChegada?: string
  comprador?: { nome: string }
  createdAt: string
}

export interface Estoque {
  id: string
  tipo: string
  codigo: string
  descricao: string
  unidade: string
  quantidade: number
  quantidadeMinima: number
  localizacao?: string
}

export interface Notificacao {
  id: string
  titulo: string
  mensagem: string
  tipo: string
  lida: boolean
  createdAt: string
}

export interface Manutencao {
  id: string
  cliente: Cliente
  equipamento: string
  problema: string
  status: string
  prioridade: string
  garantia: boolean
  tecnico?: { nome: string }
  createdAt: string
}

export interface Checklist {
  id: string
  tipo: string
  setor: Setor
  responsavel: string
  concluido: boolean
  itens: ChecklistItem[]
  respostas: ChecklistResposta[]
  createdAt: string
}

export interface ChecklistItem {
  id: string
  descricao: string
  obrigatorio: boolean
  ordem: number
}

export interface ChecklistResposta {
  id: string
  itemId: string
  resposta: boolean
  observacao?: string
  usuario: { nome: string }
}

export interface DashboardResumo {
  totais: {
    totalPedidos: number
    pedidosEmProducao: number
    pedidosAguardandoFinanceiro: number
    totalOS: number
    comprasPendentes: number
    manutencaoAberta: number
    expedicaoPendente: number
    notificacoesNaoLidas: number
  }
  ultimosPedidos: Pedido[]
  comprasUrgentes: Compra[]
  osPorStatus: { status: string; _count: number }[]
}
