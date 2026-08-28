import { Role } from '@prisma/client'

// Perfis de liderança que devem enxergar todos os documentos do pedido,
// independente do setor de destino (hoje: Wellington=GERENTE_OPERACIONAL,
// Mayara=GESTOR_ADMIN, Claudiomir=DIRETOR, Sérgio=GESTOR_PRODUCAO).
export const PERFIS_VISAO_TOTAL: Role[] = ['ADMIN', 'DIRETOR', 'GESTOR_ADMIN', 'GESTOR_PRODUCAO', 'GERENTE_OPERACIONAL']

export const SETORES_PEDIDO_ADMINISTRATIVO: Role[] = ['FINANCEIRO', 'FISCAL', 'EXPEDICAO']

export const SETORES_PEDIDO_PRODUCAO: Role[] = ['PRODUCAO']

export function podeVerTudo(role: Role): boolean {
  return PERFIS_VISAO_TOTAL.includes(role)
}

export function podeVer(role: Role, visivelPara: Role[]): boolean {
  return podeVerTudo(role) || visivelPara.includes(role)
}
