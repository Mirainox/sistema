import prisma from '../config/database'
import { TipoNotificacao } from '@prisma/client'

interface CriarNotificacaoParams {
  usuarioId: string
  titulo: string
  mensagem: string
  tipo: TipoNotificacao
  pedidoId?: string
  osId?: string
  compraId?: string
}

export async function criarNotificacao(params: CriarNotificacaoParams) {
  return prisma.notificacao.create({ data: params })
}

export async function notificarPorRole(
  roles: string[],
  titulo: string,
  mensagem: string,
  tipo: TipoNotificacao,
  extras?: { pedidoId?: string; osId?: string; compraId?: string }
) {
  const usuarios = await prisma.usuario.findMany({
    where: { role: { in: roles as any[] }, ativo: true },
    select: { id: true },
  })

  await Promise.all(
    usuarios.map((u) =>
      criarNotificacao({ usuarioId: u.id, titulo, mensagem, tipo, ...extras })
    )
  )
}

export async function notificarComprasPendentes() {
  const compras = await prisma.compra.findMany({
    where: { pedidoRealizado: false, status: { notIn: ['CANCELADO', 'RECEBIDO'] } },
    include: { comprador: true },
  })

  for (const compra of compras) {
    const usuarios = await prisma.usuario.findMany({
      where: { role: { in: ['COMPRADOR', 'GESTOR_ADMIN'] }, ativo: true },
      select: { id: true },
    })
    await Promise.all(
      usuarios.map((u) =>
        criarNotificacao({
          usuarioId: u.id,
          titulo: 'Compra pendente de efetivação',
          mensagem: `Pedido #${compra.numeroPedido} - ${compra.produto} (${compra.nomeCliente} / ${compra.cidadeCliente}) ainda não foi comprado.`,
          tipo: 'COMPRA_SOLICITADA',
          compraId: compra.id,
        })
      )
    )
  }
}

export async function notificarFotosPendentes() {
  const oss = await prisma.oS.findMany({
    where: { status: { in: ['EM_ANDAMENTO', 'AGUARDANDO_PECAS'] } },
    include: { pedido: { include: { cliente: true } } },
  })

  const responsaveis = await prisma.usuario.findMany({
    where: { role: 'PRODUCAO', ativo: true },
    select: { id: true },
  })

  for (const os of oss) {
    await Promise.all(
      responsaveis.map((u) =>
        criarNotificacao({
          usuarioId: u.id,
          titulo: 'Foto de produção pendente',
          mensagem: `Registre a foto de andamento - OS #${os.numero} / Pedido #${os.pedido.numero} - ${os.pedido.cliente.nome}`,
          tipo: 'FOTO_SOLICITADA',
          osId: os.id,
        })
      )
    )
  }
}

export async function notificarComprasPrazo() {
  const hoje = new Date()
  const em5dias = new Date()
  em5dias.setDate(hoje.getDate() + 5)

  const compras = await prisma.compra.findMany({
    where: {
      pedidoRealizado: true,
      status: { in: ['PEDIDO_REALIZADO', 'EM_TRANSITO'] },
      previsaoChegada: { lte: em5dias },
    },
  })

  const compradores = await prisma.usuario.findMany({
    where: { role: { in: ['COMPRADOR', 'GESTOR_ADMIN'] }, ativo: true },
    select: { id: true },
  })

  for (const compra of compras) {
    await Promise.all(
      compradores.map((u) =>
        criarNotificacao({
          usuarioId: u.id,
          titulo: 'Compra próxima do prazo de chegada',
          mensagem: `${compra.produto} - Previsão: ${compra.previsaoChegada?.toLocaleDateString('pt-BR')} - Cliente: ${compra.nomeCliente}`,
          tipo: 'COMPRA_PRAZO',
          compraId: compra.id,
        })
      )
    )
  }
}
