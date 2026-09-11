import { Request, Response } from 'express'
import prisma from '../config/database'
import { AuthRequest } from '../middleware/auth'

export async function listar(req: Request, res: Response) {
  const { status } = req.query
  const expedicoes = await prisma.expedicao.findMany({
    where: status ? { status: String(status) } : undefined,
    orderBy: { dataPrevisao: 'asc' },
  })
  return res.json(expedicoes)
}

export async function criar(req: Request, res: Response) {
  const exp = await prisma.expedicao.create({ data: req.body })
  return res.status(201).json(exp)
}

// Espelha o status da expedição no Pedido, para as duas telas nunca ficarem
// desalinhadas (mesmo princípio da Ordem de Pedido → Pedido).
const FASE_POR_STATUS_EXPEDICAO: Record<string, string> = {
  EM_ROTA: 'EM_ROTA',
  ENTREGUE: 'ENTREGUE',
}
const STATUS_PEDIDO_POR_STATUS_EXPEDICAO: Record<string, string> = {
  EM_ROTA: 'EXPEDIDO',
  ENTREGUE: 'ENTREGUE',
}

export async function atualizar(req: AuthRequest, res: Response) {
  const { id } = req.params
  const exp = await prisma.expedicao.update({ where: { id }, data: req.body })

  const novaFase = FASE_POR_STATUS_EXPEDICAO[exp.status]
  if (exp.pedidoId && novaFase) {
    await prisma.pedido.update({
      where: { id: exp.pedidoId },
      data: {
        faseEntrega: novaFase,
        faseEntregaPor: req.usuario?.nome || 'Expedição',
        faseEntregaEm: new Date(),
        status: STATUS_PEDIDO_POR_STATUS_EXPEDICAO[exp.status] as any,
        ...(exp.status === 'ENTREGUE' ? { entregueEm: new Date() } : {}),
      },
    })
  }

  return res.json(exp)
}

export async function sugerirRota(req: Request, res: Response) {
  const { estado, data } = req.query
  const pedidos = await prisma.expedicao.findMany({
    where: {
      status: 'AGUARDANDO',
      estado: estado ? String(estado) : undefined,
      dataPrevisao: data ? { lte: new Date(String(data)) } : undefined,
    },
    orderBy: [{ estado: 'asc' }, { cidadeCliente: 'asc' }],
  })
  return res.json(pedidos)
}
