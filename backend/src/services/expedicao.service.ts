import prisma from '../config/database'
import { notificarPorRole } from './notificacao.service'

// Garante que exista um registro de Expedição para o pedido (criando se
// necessário) assim que a produção o dá por finalizado. É isso que faz o
// pedido aparecer sozinho na Área de Trabalho da Expedição.
export async function garantirExpedicao(pedidoId: string) {
  const existente = await prisma.expedicao.findFirst({ where: { pedidoId } })
  if (existente) return existente

  const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId }, include: { cliente: true } })
  if (!pedido) return null

  // Pode já existir um lançamento manual antigo com o mesmo número, feito
  // antes desta automação — nesse caso só vincula, sem duplicar.
  const porNumero = await prisma.expedicao.findFirst({ where: { numeroPedido: pedido.numero, pedidoId: null } })
  if (porNumero) {
    return prisma.expedicao.update({ where: { id: porNumero.id }, data: { pedidoId: pedido.id } })
  }

  const expedicao = await prisma.expedicao.create({
    data: {
      pedidoId: pedido.id,
      numeroPedido: pedido.numero,
      nomeCliente: pedido.cliente.nome,
      cidadeCliente: pedido.cliente.cidade,
      estado: pedido.cliente.estado || '',
      equipamento: `${pedido.equipamento} ${pedido.modelo}`,
      dataPrevisao: pedido.prazoEntrega,
    },
  })

  await notificarPorRole(
    ['EXPEDICAO', 'GERENTE_OPERACIONAL', 'GESTOR_ADMIN'],
    `Pedido #${pedido.numero} pronto para expedição`,
    `${pedido.cliente.nome} - ${pedido.cliente.cidade} | ${pedido.equipamento} ${pedido.modelo} | Prazo: ${pedido.prazoEntrega.toLocaleDateString('pt-BR')}`,
    'EXPEDICAO_PENDENTE',
    { pedidoId: pedido.id }
  )

  return expedicao
}
