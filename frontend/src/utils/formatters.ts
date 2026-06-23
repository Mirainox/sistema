export function formatarData(data: string | Date) {
  return new Date(data).toLocaleDateString('pt-BR')
}

export function formatarDataHora(data: string | Date) {
  return new Date(data).toLocaleString('pt-BR')
}

export function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export const STATUS_PEDIDO_LABEL: Record<string, string> = {
  AGUARDANDO_FINANCEIRO: 'Aguardando Financeiro',
  FINANCEIRO_APROVADO: 'Financeiro Aprovado',
  EM_PRODUCAO: 'Em Produção',
  AGUARDANDO_EXPEDICAO: 'Aguardando Expedição',
  EXPEDIDO: 'Expedido',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
}

export const STATUS_PEDIDO_COR: Record<string, string> = {
  AGUARDANDO_FINANCEIRO: 'bg-yellow-100 text-yellow-800',
  FINANCEIRO_APROVADO: 'bg-blue-100 text-blue-800',
  EM_PRODUCAO: 'bg-purple-100 text-purple-800',
  AGUARDANDO_EXPEDICAO: 'bg-orange-100 text-orange-800',
  EXPEDIDO: 'bg-indigo-100 text-indigo-800',
  ENTREGUE: 'bg-green-100 text-green-800',
  CANCELADO: 'bg-red-100 text-red-800',
}

export const STATUS_OS_LABEL: Record<string, string> = {
  GERADA: 'Gerada',
  DISTRIBUIDA_FISICAMENTE: 'Distribuída Fisicamente',
  DISTRIBUIDA_VIRTUALMENTE: 'Distribuída Virtualmente',
  EM_ANDAMENTO: 'Em Andamento',
  AGUARDANDO_PECAS: 'Aguardando Peças',
  EM_TESTE: 'Em Teste',
  CONCLUIDA: 'Concluída',
  EXPEDIDA: 'Expedida',
}

export const STATUS_OS_COR: Record<string, string> = {
  GERADA: 'bg-gray-100 text-gray-800',
  DISTRIBUIDA_FISICAMENTE: 'bg-blue-100 text-blue-800',
  DISTRIBUIDA_VIRTUALMENTE: 'bg-indigo-100 text-indigo-800',
  EM_ANDAMENTO: 'bg-purple-100 text-purple-800',
  AGUARDANDO_PECAS: 'bg-yellow-100 text-yellow-800',
  EM_TESTE: 'bg-orange-100 text-orange-800',
  CONCLUIDA: 'bg-green-100 text-green-800',
  EXPEDIDA: 'bg-teal-100 text-teal-800',
}

export const STATUS_COMPRA_LABEL: Record<string, string> = {
  SOLICITADO: 'Solicitado',
  CIENTE: 'Ciente',
  COTANDO: 'Cotando',
  PEDIDO_REALIZADO: 'Pedido Realizado',
  EM_TRANSITO: 'Em Trânsito',
  RECEBIDO: 'Recebido',
  CANCELADO: 'Cancelado',
}

export const STATUS_COMPRA_COR: Record<string, string> = {
  SOLICITADO: 'bg-red-100 text-red-800',
  CIENTE: 'bg-yellow-100 text-yellow-800',
  COTANDO: 'bg-blue-100 text-blue-800',
  PEDIDO_REALIZADO: 'bg-indigo-100 text-indigo-800',
  EM_TRANSITO: 'bg-purple-100 text-purple-800',
  RECEBIDO: 'bg-green-100 text-green-800',
  CANCELADO: 'bg-gray-100 text-gray-800',
}

export const SETOR_LABEL: Record<string, string> = {
  DIRETORIA: 'Diretoria',
  ADMINISTRATIVO: 'Administrativo',
  MARKETING: 'Marketing',
  VENDAS: 'Vendas',
  COMPRAS: 'Compras',
  FINANCEIRO: 'Financeiro',
  FISCAL: 'Fiscal',
  RH: 'RH',
  PRODUCAO_INOX: 'Produção Inox',
  CALDEIRARIA: 'Caldeiraria',
  USINAGEM: 'Usinagem',
  ELETRICA: 'Elétrica',
  MONTAGEM_AUTOMATIZADA: 'Montagem Automatizada',
  ALMOXARIFADO_GERAL: 'Almoxarifado Geral',
  ALMOXARIFADO_CONSUMIVEIS: 'Almoxarifado Consumíveis',
  LOJA_PECAS: 'Loja de Peças',
  MANUTENCAO: 'Manutenção',
  EXPEDICAO: 'Expedição',
  TI: 'TI',
}

export const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Administrador',
  DIRETOR: 'Diretor',
  GESTOR_ADMIN: 'Gestor Administrativo',
  GESTOR_PRODUCAO: 'Gestor de Produção',
  GERENTE_OPERACIONAL: 'Gerente Operacional',
  VENDEDOR: 'Vendedor',
  COMPRADOR: 'Comprador',
  FINANCEIRO: 'Financeiro',
  FISCAL: 'Fiscal',
  PRODUCAO: 'Produção',
  ALMOXARIFE: 'Almoxarife',
  RH: 'RH',
  MANUTENCAO: 'Manutenção',
  MARKETING: 'Marketing',
  LOJA_PECAS: 'Loja de Peças',
  EXPEDICAO: 'Expedição',
}
