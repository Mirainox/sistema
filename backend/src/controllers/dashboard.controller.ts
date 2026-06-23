import { Request, Response } from 'express'
import prisma from '../config/database'
import { AuthRequest } from '../middleware/auth'

export async function resumo(req: AuthRequest, res: Response) {
  const [
    totalPedidos,
    pedidosEmProducao,
    pedidosAguardandoFinanceiro,
    totalOS,
    comprasPendentes,
    manutencaoAberta,
    expedicaoPendente,
    notificacoesNaoLidas,
  ] = await Promise.all([
    prisma.pedido.count(),
    prisma.pedido.count({ where: { status: 'EM_PRODUCAO' } }),
    prisma.pedido.count({ where: { status: 'AGUARDANDO_FINANCEIRO' } }),
    prisma.oS.count({ where: { status: { notIn: ['CONCLUIDA', 'EXPEDIDA'] } } }),
    prisma.compra.count({ where: { pedidoRealizado: false, status: { notIn: ['CANCELADO'] } } }),
    prisma.manutencao.count({ where: { status: { notIn: ['CONCLUIDO', 'CANCELADO'] } } }),
    prisma.expedicao.count({ where: { status: 'AGUARDANDO' } }),
    prisma.notificacao.count({ where: { usuarioId: req.usuario!.id, lida: false } }),
  ])

  const ultimosPedidos = await prisma.pedido.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { cliente: true },
  })

  const comprasUrgentes = await prisma.compra.findMany({
    where: { urgencia: 'URGENTE', pedidoRealizado: false },
    take: 5,
    orderBy: { createdAt: 'desc' },
  })

  const osPorStatus = await prisma.oS.groupBy({
    by: ['status'],
    _count: true,
  })

  return res.json({
    totais: {
      totalPedidos,
      pedidosEmProducao,
      pedidosAguardandoFinanceiro,
      totalOS,
      comprasPendentes,
      manutencaoAberta,
      expedicaoPendente,
      notificacoesNaoLidas,
    },
    ultimosPedidos,
    comprasUrgentes,
    osPorStatus,
  })
}
