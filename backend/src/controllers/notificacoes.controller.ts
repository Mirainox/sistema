import { Request, Response } from 'express'
import prisma from '../config/database'
import { AuthRequest } from '../middleware/auth'

export async function listar(req: AuthRequest, res: Response) {
  const notificacoes = await prisma.notificacao.findMany({
    where: { usuarioId: req.usuario!.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return res.json(notificacoes)
}

export async function marcarLida(req: AuthRequest, res: Response) {
  const { id } = req.params
  await prisma.notificacao.update({
    where: { id, usuarioId: req.usuario!.id },
    data: { lida: true },
  })
  return res.json({ mensagem: 'Notificação marcada como lida' })
}

export async function marcarTodasLidas(req: AuthRequest, res: Response) {
  await prisma.notificacao.updateMany({
    where: { usuarioId: req.usuario!.id, lida: false },
    data: { lida: true },
  })
  return res.json({ mensagem: 'Todas as notificações marcadas como lidas' })
}

export async function naoLidas(req: AuthRequest, res: Response) {
  const count = await prisma.notificacao.count({
    where: { usuarioId: req.usuario!.id, lida: false },
  })
  return res.json({ count })
}
