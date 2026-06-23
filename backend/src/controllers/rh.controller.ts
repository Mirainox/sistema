import { Request, Response } from 'express'
import prisma from '../config/database'
import { AuthRequest } from '../middleware/auth'

export async function listarEpis(req: Request, res: Response) {
  const { funcionarioId } = req.query
  const where: any = {}
  if (funcionarioId) where.funcionarioId = String(funcionarioId)

  const epis = await prisma.epiEntrega.findMany({
    where,
    include: {
      funcionario: { select: { nome: true, setor: true } },
      entregadoPor: { select: { nome: true } },
    },
    orderBy: { dataEntrega: 'desc' },
  })
  return res.json(epis)
}

export async function registrarEntregaEpi(req: AuthRequest, res: Response) {
  const { funcionarioId, tipoEpi, quantidade, dataEntrega, setor } = req.body

  const entrega = await prisma.epiEntrega.create({
    data: {
      funcionarioId,
      tipoEpi,
      quantidade: Number(quantidade),
      dataEntrega: new Date(dataEntrega),
      setor,
      entregadoPorId: req.usuario!.id,
    },
    include: { funcionario: { select: { nome: true } } },
  })

  return res.status(201).json(entrega)
}

export async function confirmarRecebimentoEpi(req: Request, res: Response) {
  const { id } = req.params
  const epi = await prisma.epiEntrega.update({
    where: { id },
    data: { confirmacaoRecebimento: true },
  })
  return res.json(epi)
}

export async function historicoEpi(req: Request, res: Response) {
  const { funcionarioId } = req.params
  const historico = await prisma.epiEntrega.findMany({
    where: { funcionarioId },
    include: { entregadoPor: { select: { nome: true } } },
    orderBy: { dataEntrega: 'desc' },
  })
  return res.json(historico)
}
